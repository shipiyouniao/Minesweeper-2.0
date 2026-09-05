import { inspectArea, probeArea } from './dungeon-discovery.js'
import { healExpedition, hasCombatBuild } from './combat-build.js'
import type { Expedition, ExpeditionAction, Relic } from '../types/variants.js'

/** Each charge belongs to a floor or run, and old journals never activate new effects. */
export function available(run: Expedition, relic: Relic, wholeRun = false): boolean {
  return (
    run.departure.rules === 'relics-v1' &&
    run.relics.includes(relic) &&
    !(wholeRun ? run.runTriggers : run.floorTriggers).includes(relic)
  )
}

/** Claim before applying an effect so chained discoveries cannot activate it twice. */
export function claim(run: Expedition, relic: Relic, wholeRun = false): Expedition {
  return wholeRun
    ? { ...run, runTriggers: [...run.runTriggers, relic] }
    : { ...run, floorTriggers: [...run.floorTriggers, relic] }
}

/** Resolve survival reactions; a concrete mine index additionally enables shield reconnaissance. */
export function applyDamageRelics(
  before: Expedition,
  damaged: Expedition,
  index: number | null,
): Expedition {
  let result = damaged
  if (result.health === 0 && available(result, 'second-wind', true)) {
    result = {
      ...claim(result, 'second-wind', true),
      health: hasCombatBuild(result.departure) ? 5 : 1,
    }
  }
  if (result.health === 0) return result

  if (index !== null && before.shields > damaged.shields && available(result, 'reactive-shell')) {
    result = inspectArea(claim(result, 'reactive-shell'), probeArea(result.game.config, index))
  }
  // A revival is its own reaction, not another surviving damage event for the ribbon.
  if (
    damaged.health > 0 &&
    damaged.health < before.health &&
    available(result, 'rescue-ribbon', true)
  ) {
    result = { ...claim(result, 'rescue-ribbon', true), shields: Math.min(2, result.shields + 1) }
  }
  return result
}

/** Physical chest collection pays bounded benefits before a later hazard on the same route. */
export function applyTreasureRelics(before: Expedition, collected: Expedition): Expedition {
  if (collected.collected.length <= before.collected.length) return collected
  let result = collected
  if (available(result, 'field-dressing')) {
    result = { ...claim(result, 'field-dressing'), health: healExpedition(result, 1).health }
  }
  if (available(result, 'supply-cache')) {
    result = { ...claim(result, 'supply-cache'), scans: Math.min(4, result.scans + 1) }
  }
  if (result.collected.length >= 3 && available(result, 'cache-guard')) {
    result = { ...claim(result, 'cache-guard'), shields: Math.min(2, result.shields + 1) }
  }
  if (available(result, 'landmark-lens')) {
    const chest = result.collected.find((index) => !before.collected.includes(index))
    if (chest !== undefined)
      result = inspectArea(claim(result, 'landmark-lens'), probeArea(result.game.config, chest))
  }
  return result
}

/** Reward new confirmed information only; flags, repeated scans and floor entry never pay. */
export function applyDiscoveryRelics(
  before: Expedition,
  after: Expedition,
  action: ExpeditionAction,
): Expedition {
  if (
    after === before ||
    after.floor !== before.floor ||
    Boolean(after.encounter) !== Boolean(before.encounter) ||
    (after.phase !== 'exploring' && after.phase !== 'boss')
  )
    return after
  const discoveries = after.confirmedMines.length - before.confirmedMines.length
  if (discoveries <= 0) return after
  let result = after
  const floorDiscoveries = result.confirmedMines.length + (result.encounter?.priorDiscoveries ?? 0)
  if (floorDiscoveries >= 3 && available(result, 'field-notes')) {
    result = { ...claim(result, 'field-notes'), probes: Math.min(4, result.probes + 1) }
  }
  if (action.type === 'probe' && discoveries >= 2 && available(result, 'rangefinder')) {
    result = { ...claim(result, 'rangefinder'), scans: Math.min(4, result.scans + 1) }
  }
  return result
}
