import { neighbors } from './engine.js'
import { inspectArea } from './dungeon-discovery.js'
import { applyDamageRelics } from './relic-effects.js'
import {
  combatStats,
  damageExpedition,
  incomingCombatDamage,
  battleThreat,
} from './combat-build.js'
import { applyCombatRelics, strikeDamage } from './combat-relics.js'
import { bastionIntent } from './tactical-intents.js'
import { advanceBrood, broodIntent, clearBrood } from './brood-turns.js'
import { tacticalPlan } from './tactical-planning.js'
import type { Expedition, ExpeditionAction } from '../types/variants.js'
import type { ExploreTransition } from '../types/tactical.js'

/** Resolve scaled injuries with existing bounded revival and shield reactions. */
function injure(run: Expedition, damage: number): Expedition {
  const next = applyDamageRelics(run, { ...run, ...damageExpedition(run, damage) }, null)
  return { ...next, phase: next.health === 0 ? 'lost' : 'boss' }
}

/** A regional objective accepts only the actual flags; incorrect guesses cost health and AP. */
function correctFlags(run: Expedition, index: number): boolean {
  return neighbors(run.game.config, index).every((other) => {
    const cell = run.game.cells[other]!
    return cell.mine === (cell.visibility === 'flagged')
  })
}

/** Disable a regional defense, destroy a nest, or prime the exposed core while adjacent. */
function interact(run: Expedition, index: number): Expedition {
  const encounter = run.encounter
  if (!encounter) return run
  if (encounter.kind === 'bastion') {
    if (index === encounter.boss)
      return {
        ...run,
        encounter: { ...encounter, exposedUntil: encounter.turn + 3, event: 'window-opened' },
      }
    if (!correctFlags(run, index))
      return { ...injure(run, 5), encounter: { ...encounter, event: 'misfire' } }
    const mechanisms = encounter.mechanisms.map((entry) =>
      entry.index === index ? { ...entry, active: false } : entry,
    )
    const next = inspectArea(run, neighbors(run.game.config, index))
    return {
      ...next,
      encounter: {
        ...encounter,
        mechanisms,
        pylons: encounter.pylons.map((entry) =>
          entry.index === index ? { ...entry, active: false } : entry,
        ),
        exposedUntil:
          encounter.turn +
          (mechanisms.some((entry) => entry.effect === 'extend' && !entry.active) ? 3 : 1),
        event: 'disabled',
      },
    }
  }
  if (!encounter.nests.includes(index)) return clearBrood(run, index)
  if (!correctFlags(run, index))
    return { ...injure(run, 5), encounter: { ...encounter, event: 'misfire' } }
  const next = inspectArea(run, neighbors(run.game.config, index))
  return {
    ...next,
    encounter: broodIntent({
      ...encounter,
      nests: encounter.nests.filter((nest) => nest !== index),
      destroyedNests: [...encounter.destroyedNests, index],
      health: Math.max(1, encounter.health - 3),
      event: 'nest-destroyed',
    }),
  }
}

/** Resolve frozen attacks, then announce the next turn without reacting to mouse movement. */
function endTurn(run: Expedition): Expedition {
  const encounter = run.encounter
  if (!encounter) return run
  const damage = incomingCombatDamage(run, battleThreat(encounter, run.player))
  const next = damage > 0 ? injure(run, damage) : run
  const advanced: Expedition = {
    ...next,
    steps: run.steps + 1,
    encounter: { ...encounter, event: damage > 0 ? 'hit' : 'evaded' },
  }
  if (next.phase === 'lost') return advanced
  if (encounter.kind === 'brood') return advanceBrood(advanced)
  const weakened = encounter.mechanisms.some((entry) => entry.effect === 'weaken' && !entry.active)
  const result: Expedition = {
    ...advanced,
    encounter: {
      ...encounter,
      turn: encounter.turn + 1,
      braced: false,
      turnTriggers: [],
      intent: {
        ...bastionIntent(
          run.game.config,
          run.walls,
          encounter.boss,
          run.player,
          encounter.turn + 1,
        ),
        damage: weakened ? 3 : 5,
      },
      event: damage > 0 ? 'hit' : 'evaded',
    },
  }
  return { ...result, encounter: { ...result.encounter!, points: combatStats(result).actions } }
}

/** Apply the revised encounter through the same typed journal intents and exploration transitions. */
export function actBattle(
  run: Expedition,
  action: ExpeditionAction,
  explore: ExploreTransition,
): Expedition {
  const encounter = run.encounter
  const plan = tacticalPlan(run, action)
  if (!encounter || !plan.allowed) return run
  if (action.type === 'end-turn') return applyCombatRelics(run, endTurn(run), action)
  if (action.type === 'retreat') return { ...run, phase: 'retreated' }
  let next: Expedition
  if (action.type === 'brace')
    next = { ...run, encounter: { ...encounter, braced: true, event: 'braced' } }
  else if (action.type === 'interact') next = interact(run, action.index)
  else if (action.type === 'attack') {
    const armor = encounter.kind === 'brood' ? encounter.nests.length * 3 : 0
    const health = Math.max(0, encounter.health - Math.max(1, strikeDamage(run) - armor))
    next = {
      ...run,
      encounter: {
        ...encounter,
        health,
        lastDamage: encounter.health - health,
        event: health === 0 ? 'defeated' : 'struck',
      },
    }
  } else {
    const exploring: Expedition = { ...run, phase: 'exploring' }
    const result = explore(exploring, action)
    if (result === exploring) return run
    next = {
      ...result,
      phase: result.phase === 'lost' ? 'lost' : 'boss',
      encounter: { ...encounter, event: 'acted' },
    }
  }
  const objective =
    next.encounter?.event === 'disabled' || next.encounter?.event === 'nest-destroyed'
  const focus =
    objective &&
    run.departure.equipment.includes('focus-lens') &&
    !encounter.turnTriggers.includes('focus-lens')
  const cleared =
    next.encounter?.event === 'web-cut' ||
    next.encounter?.event === 'egg-crushed' ||
    next.encounter?.event === 'hatchling-cleared'
  const hook =
    action.type === 'interact' &&
    cleared &&
    run.departure.equipment.includes('clearing-hook') &&
    !encounter.turnTriggers.includes('clearing-hook')
  return applyCombatRelics(
    run,
    {
      ...next,
      steps: run.steps + 1,
      game: next.game.phase === 'won' ? { ...next.game, phase: 'playing' } : next.game,
      encounter: {
        ...next.encounter!,
        points: Math.min(5, encounter.points - plan.cost + Number(focus) + Number(hook)),
        turnTriggers: [
          ...encounter.turnTriggers,
          ...(focus ? ['focus-lens' as const] : []),
          ...(hook ? ['clearing-hook' as const] : []),
        ],
      },
    },
    action,
  )
}
