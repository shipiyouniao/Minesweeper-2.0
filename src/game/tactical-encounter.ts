import { neighbors } from './engine.js'
import { actBattle } from './battle-turns.js'
import { hasCombatBuild } from './combat-build.js'
import { inspectArea } from './dungeon-discovery.js'
import { damageVitality } from './vitality.js'
import { applyDamageRelics } from './relic-effects.js'
import { bastionIntent } from './tactical-intents.js'
import { tacticalPlan } from './tactical-planning.js'
import { applyCombatRelics, strikeDamage } from './combat-relics.js'
import { advanceBrood, clearBrood } from './brood-turns.js'
import type { Expedition, ExpeditionAction } from '../types/variants.js'
import type { ExploreTransition } from '../types/tactical.js'

/** Share injury and revival rules without activating mine-specific information effects. */
function injure(run: Expedition, amount: number): Expedition {
  const damaged = applyDamageRelics(run, { ...run, ...damageVitality(run, amount) }, null)
  return { ...damaged, phase: damaged.health > 0 ? 'boss' : 'lost' }
}

/** Resolve the announced footprint only when the player explicitly gives up the current turn. */
function endTurn(run: Expedition): Expedition {
  const encounter = run.encounter
  if (!encounter) return run
  const hit = encounter.intent.targets.includes(run.player)
  const damage = Math.max(0, (hit ? encounter.intent.damage : 0) - Number(encounter.braced))
  const next = damage > 0 ? injure(run, damage) : run

  if (encounter.kind === 'brood') {
    const resolved: Expedition = {
      ...next,
      steps: run.steps + 1,
      encounter: { ...encounter, event: damage > 0 ? 'hit' : 'evaded' },
    }
    return advanceBrood(resolved)
  }

  return {
    ...next,
    steps: run.steps + 1,
    encounter: {
      ...encounter,
      turn: encounter.turn + 1,
      points: 3,
      braced: false,
      turnTriggers: [],
      intent: bastionIntent(
        run.game.config,
        run.walls,
        encounter.boss,
        run.player,
        encounter.turn + 1,
      ),
      event: damage > 0 ? 'hit' : 'evaded',
    },
  }
}

/** Commit a calibration: a wrong guess consumes its action and deals feedback damage. */
function calibrate(run: Expedition, index: number): Expedition {
  const encounter = run.encounter
  if (!encounter || encounter.kind !== 'bastion') return run
  const ring = neighbors(run.game.config, index)
  const correct = ring.every((other) => {
    const cell = run.game.cells[other]
    return cell && cell.mine === (cell.visibility === 'flagged')
  })
  if (!correct) return { ...injure(run, 1), encounter: { ...encounter, event: 'misfire' } }

  return {
    ...inspectArea(run, ring),
    encounter: {
      ...encounter,
      pylons: encounter.pylons.map((pylon) =>
        pylon.index === index ? { ...pylon, active: false } : pylon,
      ),
      event: 'disabled',
    },
  }
}

/** Apply one legal combat intent, charging only accepted actions and preserving exploration semantics. */
export function actTacticalEncounter(
  run: Expedition,
  action: ExpeditionAction,
  explore: ExploreTransition,
): Expedition {
  if (hasCombatBuild(run.departure)) return actBattle(run, action, explore)
  const encounter = run.encounter
  const plan = tacticalPlan(run, action)
  if (!encounter || !plan.allowed) return run
  if (action.type === 'end-turn') return applyCombatRelics(run, endTurn(run), action)
  if (action.type === 'retreat') return { ...run, phase: 'retreated' }
  let next: Expedition

  switch (action.type) {
    case 'brace':
      next = { ...run, encounter: { ...encounter, braced: true, event: 'braced' } }
      break
    case 'attack': {
      const health = Math.max(0, encounter.health - strikeDamage(run))
      next = {
        ...run,
        encounter: {
          ...encounter,
          health,
          lastDamage: encounter.health - health,
          event: health === 0 ? 'defeated' : 'struck',
        },
      }
      break
    }
    case 'interact':
      next =
        encounter.kind === 'brood' ? clearBrood(run, action.index) : calibrate(run, action.index)
      break
    default: {
      // Reuse tool, skill and mine rules. The boss cell remains an impassable wall.
      const exploring: Expedition = { ...run, phase: 'exploring' }
      const result = explore(exploring, action)
      if (result === exploring) return run
      next = {
        ...result,
        phase: result.phase === 'lost' ? 'lost' : 'boss',
        encounter: { ...encounter, event: 'acted' },
      }
    }
  }

  return applyCombatRelics(
    run,
    {
      ...next,
      steps: run.steps + 1,
      // Revealing all safe cells does not defeat the guardian or disable further flagging.
      game: next.game.phase === 'won' ? { ...next.game, phase: 'playing' } : next.game,
      encounter: { ...(next.encounter ?? encounter), points: encounter.points - plan.cost },
    },
    action,
  )
}
