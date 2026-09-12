import { shuffled } from './variant-board.js'
import { campaignProgress } from './campaign-catalog.js'
import { milestoneProgress } from './milestones.js'
import type { ExpeditionSave } from '../types/variants.js'
import type { EncounterKind } from '../types/tactical.js'
import type {
  RecollectionDraw,
  RecollectionFloor,
  RecollectionSelection,
} from '../types/recollection.js'

export const RECOLLECTION_FLOORS: readonly RecollectionFloor[] = ['ordinary', 'relay', 'routing']
export const RECOLLECTION_BOSSES: readonly EncounterKind[] = [
  'bastion',
  'brood',
  'mirror',
  'magnetic',
  'clock',
  'echo',
  'matrix',
  'tide',
]

/** Existing boss victories remain eligible when a veteran reaches the western camp. */
export function recollectionUnlocks(save: ExpeditionSave): RecollectionSelection {
  const defeated = milestoneProgress(save.camp).bossKinds
  return {
    floors: RECOLLECTION_FLOORS.filter(
      (kind) =>
        kind === 'ordinary' ||
        campaignProgress(save.campaign, kind === 'relay' ? 'tower-relay' : 'ridge-observatory')
          .cleared,
    ),
    bosses: RECOLLECTION_BOSSES.filter(
      (kind) =>
        defeated.includes(kind) ||
        (kind === 'bastion' && !!save.story?.facts?.includes('chapter-one-cleared')),
    ),
  }
}

/** The lantern opens through a physical camp interaction; a query parameter cannot unlock it. */
export function recollectionAvailable(save: ExpeditionSave): boolean {
  return !!save.story?.facts?.includes('recollection-awakened')
}

/** Validate both pools as finite, nonempty sets of content actually experienced by this party. */
export function validRecollection(
  selection: RecollectionSelection,
  unlocked: RecollectionSelection,
): boolean {
  return (
    (selection.remainingBosses === undefined ||
      (new Set(selection.remainingBosses).size === selection.remainingBosses.length &&
        selection.remainingBosses.every((kind) => selection.bosses.includes(kind)))) &&
    (selection.lastBoss === undefined || selection.bosses.includes(selection.lastBoss)) &&
    selection.floors.length > 0 &&
    selection.bosses.length > 0 &&
    new Set(selection.floors).size === selection.floors.length &&
    new Set(selection.bosses).size === selection.bosses.length &&
    selection.floors.every((kind) => unlocked.floors.includes(kind)) &&
    selection.bosses.every((kind) => unlocked.bosses.includes(kind))
  )
}

/** Catalog ordering makes the same seed stable regardless of the order boxes were checked. */
export function snapshotRecollection(selection: RecollectionSelection): RecollectionSelection {
  return {
    ...(selection.remainingBosses
      ? {
          remainingBosses: RECOLLECTION_BOSSES.filter((kind) =>
            selection.remainingBosses!.includes(kind),
          ),
        }
      : {}),
    ...(selection.lastBoss ? { lastBoss: selection.lastBoss } : {}),
    floors: RECOLLECTION_FLOORS.filter((kind) => selection.floors.includes(kind)),
    bosses: RECOLLECTION_BOSSES.filter((kind) => selection.bosses.includes(kind)),
  }
}

/** Replay draws from a departure snapshot; exhaustion refills without repeating the last boss. */
export function recollectionDraw(
  selection: RecollectionSelection,
  seed: number,
  ordinal: number,
): RecollectionDraw {
  let remaining = [...(selection.remainingBosses ?? selection.bosses)]
  let last = selection.lastBoss
  for (let step = 0; step <= ordinal; step++) {
    if (!remaining.length) remaining = [...selection.bosses]
    const candidates = remaining.length > 1 ? remaining.filter((kind) => kind !== last) : remaining
    const boss = shuffled(candidates, seed ^ 0xb055 ^ Math.imul(step + 1, 0x9e3779b1))[0]
    if (!boss) throw new Error('A recollection needs a selected boss')
    remaining = remaining.filter((kind) => kind !== boss)
    last = boss
  }
  if (!last) throw new Error('A recollection needs a nonnegative draw ordinal')
  return { boss: last, remainingBosses: remaining }
}
