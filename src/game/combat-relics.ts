import { available, claim } from './relic-effects.js'
import { walkingPath } from './dungeon-path.js'
import type { Expedition, ExpeditionAction } from '../types/variants.js'

/** The first multi-step walk each turn saves one point; a single step still costs one. */
export function walkingPointCost(run: Expedition, distance: number): number {
  const boots =
    run.relics.includes('marching-boots') &&
    run.departure.rules === 'relics-v1' &&
    !run.encounter?.turnTriggers.includes('marching-boots')
  return Math.max(1, distance - Number(boots && distance >= 2))
}

/** The opening strike gains a bounded bonus; it never bypasses an active shield pylon. */
export function strikeDamage(run: Expedition): number {
  return available(run, 'duelist-edge') ? 4 : 2
}

/** Apply combat rewards after charging an accepted action, before floor victory is settled. */
export function applyCombatRelics(
  before: Expedition,
  after: Expedition,
  action: ExpeditionAction,
): Expedition {
  if (!before.encounter || !after.encounter || after === before || after.phase !== 'boss')
    return after
  let result = after

  if (action.type === 'move') {
    // Only claim a discount when a multi-step route actually used it.
    const distance = (walkingPath(before, after.player)?.length ?? 1) - 1
    if (walkingPointCost(before, distance) < distance)
      result = {
        ...result,
        encounter: {
          ...after.encounter,
          turnTriggers: [...after.encounter.turnTriggers, 'marching-boots'],
        },
      }
  }
  if (action.type === 'attack' && available(result, 'duelist-edge'))
    result = claim(result, 'duelist-edge')
  if (
    action.type === 'interact' &&
    after.encounter.kind === 'bastion' &&
    before.encounter.kind === 'bastion' &&
    after.encounter.pylons.filter((pylon) => pylon.active).length <
      before.encounter.pylons.filter((pylon) => pylon.active).length &&
    available(result, 'breach-sigil')
  ) {
    result = claim(result, 'breach-sigil')
    result = {
      ...result,
      encounter: { ...after.encounter, points: Math.min(4, after.encounter.points + 1) },
    }
  }
  if (action.type !== 'end-turn') return result

  if (
    !before.encounter.intent.targets.includes(before.player) &&
    available(result, 'shelter-cloak')
  )
    result = { ...claim(result, 'shelter-cloak'), shields: Math.min(2, result.shields + 1) }
  if (before.encounter.points >= 1 && available(result, 'reserve-watch')) {
    result = claim(result, 'reserve-watch')
    result = { ...result, encounter: { ...after.encounter, points: 4 } }
  }
  if (before.encounter.turn === 3 && available(result, 'second-hand'))
    result = {
      ...claim(result, 'second-hand'),
      probes: Math.min(4, result.probes + 1),
      scans: Math.min(4, result.scans + 1),
    }
  return result
}
