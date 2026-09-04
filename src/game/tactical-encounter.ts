import { neighbors } from './engine.js'
import { inspectArea } from './dungeon-discovery.js'
import { damageVitality } from './vitality.js'
import { applyDamageRelics } from './relic-effects.js'
import { bastionIntent } from './tactical-intents.js'
import { tacticalPlan } from './tactical-planning.js'
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

  return {
    ...next,
    steps: run.steps + 1,
    encounter: {
      ...encounter,
      turn: encounter.turn + 1,
      points: 3,
      braced: false,
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
  if (!encounter) return run
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
  const encounter = run.encounter
  const plan = tacticalPlan(run, action)
  if (!encounter || !plan.allowed) return run
  if (action.type === 'end-turn') return endTurn(run)
  if (action.type === 'retreat') return { ...run, phase: 'retreated' }
  let next: Expedition

  switch (action.type) {
    case 'brace':
      next = { ...run, encounter: { ...encounter, braced: true, event: 'braced' } }
      break
    case 'attack': {
      const health = Math.max(0, encounter.health - 2)
      next = {
        ...run,
        encounter: { ...encounter, health, event: health === 0 ? 'defeated' : 'struck' },
      }
      break
    }
    case 'interact':
      next = calibrate(run, action.index)
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

  return {
    ...next,
    steps: run.steps + 1,
    // Revealing all safe cells does not defeat the guardian or disable further flagging.
    game: next.game.phase === 'won' ? { ...next.game, phase: 'playing' } : next.game,
    encounter: { ...(next.encounter ?? encounter), points: encounter.points - plan.cost },
  }
}
