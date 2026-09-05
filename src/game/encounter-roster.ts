import { encounterTier } from './encounter-tiers.js'
import { enterBattle } from './battle-arena.js'
import type { Expedition } from '../types/variants.js'

/** Place boss rooms at the selected difficulty's authored checkpoints. */
export function isEncounterFloor(run: Expedition): boolean {
  return encounterTier(run.departure.difficulty).floors.includes(run.floor)
}

/** Alternate the released roster from a seeded first boss. */
export function enterEncounter(run: Expedition): Expedition {
  const checkpoint = encounterTier(run.departure.difficulty).floors.indexOf(run.floor)
  return enterBattle(run, ((run.departure.seed + checkpoint) & 1) === 1 ? 'brood' : 'bastion')
}
