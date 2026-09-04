import { available, claim } from './relic-effects.js'
import type { Expedition, ExpeditionAction } from '../types/variants.js'

/** Count unique physical travel, including a reveal's approach, without rewarding backtracking. */
export function recordTravel(run: Expedition, path: readonly number[]): Expedition {
  const travelled = [...new Set([...run.travelled, ...path])]
  const result = { ...run, travelled }
  const distance = run.priorTravel + travelled.length - 1

  return distance >= 12 && available(result, 'trail-thread')
    ? { ...claim(result, 'trail-thread'), scans: Math.min(4, result.scans + 1) }
    : result
}

/** React to an accepted, resource-consuming intent; chained refunds never count as new uses. */
export function applyToolRelics(
  before: Expedition,
  after: Expedition,
  action: ExpeditionAction,
): Expedition {
  if (
    after === before ||
    after.floor !== before.floor ||
    (after.phase !== 'exploring' && after.phase !== 'boss')
  )
    return after
  let result = after
  const discoveries = after.confirmedMines.length - before.confirmedMines.length

  if (
    action.type === 'probe' &&
    after.probes < before.probes &&
    discoveries === 0 &&
    available(result, 'probe-recycler')
  ) {
    result = { ...claim(result, 'probe-recycler'), probes: Math.min(4, result.probes + 1) }
  }
  if (action.type === 'sweep' && after.scans < before.scans) {
    if (discoveries >= 2 && available(result, 'spare-coil'))
      result = { ...claim(result, 'spare-coil'), probes: Math.min(4, result.probes + 1) }
    // Test the pre-use inventory so another relic's refund cannot suppress the emergency trigger.
    if (before.probes === 0 && available(result, 'emergency-gears'))
      result = { ...claim(result, 'emergency-gears'), probes: Math.min(4, result.probes + 2) }
  }
  if (
    action.type === 'skill' &&
    !before.skillUsed &&
    after.skillUsed &&
    available(result, 'skill-capacitor')
  ) {
    result = { ...claim(result, 'skill-capacitor'), scans: Math.min(4, result.scans + 1) }
  }
  return result
}
