import { healVitality } from './vitality.js'
import type { Departure, Expedition, ExpeditionAction } from '../types/variants.js'
import type { CombatStats } from '../types/combat-build.js'
import type { TitleId } from '../types/titles.js'

export const TITLES: readonly TitleId[] = [
  'bastion-flawless',
  'mirror-flawless',
  'clock-no-glass',
  'magnetic-demolition',
  'brood-nest-spared',
  'web-untouched',
  'field-unscathed',
  'veteran',
  'relic-curator',
  'boss-slayer',
  'four-legends',
  'abyss-clear',
  'long-road',
  'world-walker',
  'treasure-vault',
  'treasure-legend',
  'skill-master',
  'skill-legend',
  'depth-pioneer',
  'depth-legend',
  'relic-museum',
  'abyss-veteran',
]

/** Decode only achievement titles; mission identifiers cannot equip an ability. */
export function parseTitle(value: string | null | undefined): TitleId | null {
  return TITLES.find((id) => id === value) ?? null
}

/** Late-route endurance trades immediate protection for two bounded health increases. */
export function titleHealth(departure: Departure, floor = 1): number {
  if (departure.title === 'veteran') return 1
  if (departure.title === 'depth-legend') return Number(floor >= 4) + Number(floor >= 7)
  return 0
}

/** A single frozen title contributes only its currently satisfied combat condition. */
export function titleCombatStats(run: Expedition): CombatStats {
  const boss = run.encounter
  const title = run.departure.title
  let attack = 0
  let defense = 0
  let actions = 0

  if (title === 'boss-slayer' && boss && boss.health * 2 <= boss.maxHealth) attack = 1
  if (title === 'abyss-clear' && run.health * 2 <= run.maxHealth) attack = 1
  if (
    title === 'magnetic-demolition' &&
    boss?.kind === 'magnetic' &&
    boss.exposedUntil >= boss.turn
  )
    attack = 2
  if (title === 'brood-nest-spared' && boss?.kind === 'brood' && boss.nests.length > 0) attack = 2
  if (title === 'bastion-flawless' && boss?.braced) defense = 1
  if (title === 'web-untouched' && boss?.kind === 'brood') defense = 1
  if (title === 'abyss-veteran' && run.health * 3 <= run.maxHealth) defense = 1
  // Arena constructors ask for the first turn's budget before installing the encounter.
  if (title === 'world-walker' && (boss?.turn ?? 1) === 1) actions = 1
  if (title === 'clock-no-glass' && boss && boss.turn % 3 === 0) actions = 1

  return { attack, defense, actions }
}

/** Choice breadth is phase-specific; the player still takes exactly one relic. */
export function titleOfferBonus(run: Expedition): number {
  if (run.departure.title === 'relic-curator' && run.relics.length < 3) return 1
  if (run.departure.title === 'relic-museum' && run.relics.length >= 3) return 1
  return 0
}

/** Award entry protection once, when exploration is replaced by a new boss room. */
export function applyTitleEntry(run: Expedition): Expedition {
  if (run.departure.title === 'mirror-flawless')
    return { ...run, shields: Math.min(2, run.shields + 1) }
  if (run.departure.title === 'four-legends') return { ...run, ...healVitality(run, 2) }
  return run
}

/** Count physical chests across rooms, before an approach can resolve a hazardous square. */
export function applyTitleTreasure(before: Expedition, after: Expedition): Expedition {
  const fresh = after.collected.filter((index) => !before.collected.includes(index)).length
  if (fresh === 0) return after
  const previous = before.titleProgress.chests
  const total = Math.min(3, previous + fresh)
  let result: Expedition = {
    ...after,
    titleProgress: { chests: total, floorChest: true },
  }
  const title = after.departure.title

  if (title === 'long-road' && !before.titleProgress.floorChest)
    result = { ...result, ...healVitality(result, 1) }
  if (title === 'treasure-vault')
    result = {
      ...result,
      probes: Math.min(4, result.probes + Math.min(2, total) - Math.min(2, previous)),
    }
  if (title === 'treasure-legend' && previous < 3 && total === 3)
    result = { ...result, scans: Math.min(4, result.scans + 1) }

  return result
}

/** React only to a completed skill, never anchor placement, rejected input or a lethal action. */
export function applyTitleSkill(
  before: Expedition,
  after: Expedition,
  action: ExpeditionAction,
): Expedition {
  if (
    action.type !== 'skill' ||
    before === after ||
    before.skillUsed ||
    !after.skillUsed ||
    before.floor !== after.floor ||
    after.health === 0 ||
    (after.phase !== 'exploring' && after.phase !== 'boss')
  )
    return after

  if (after.departure.title === 'skill-master') return { ...after, ...healVitality(after, 1) }
  if (after.departure.title === 'skill-legend' && after.encounter)
    return {
      ...after,
      encounter: { ...after.encounter, points: Math.min(5, after.encounter.points + 1) },
    }
  return after
}
