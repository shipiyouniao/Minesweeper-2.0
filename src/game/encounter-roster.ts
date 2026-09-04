import { enterBastion } from './bastion-arena.js'
import { encounterTier } from './encounter-tiers.js'
import { enterBrood } from './brood-arena.js'
import type { Departure, Expedition } from '../types/variants.js'

/** Versioned rosters preserve old guardian-only and exploration-only journals. */
export function hasEncounters(departure: Departure): boolean {
  return (
    departure.rules === 'relics-v1' &&
    departure.professions === 'skills-v1' &&
    (departure.encounters === 'bastion-v1' || departure.encounters === 'brood-v1')
  )
}

/** Reuse the agreed checkpoint schedule without changing floor rewards or ordinary layouts. */
export function isEncounterFloor(run: Expedition): boolean {
  return (
    hasEncounters(run.departure) &&
    encounterTier(run.departure.difficulty).floors.includes(run.floor)
  )
}

/** Alternate the new roster from a seeded first boss; old departures always retain the guardian. */
export function enterEncounter(run: Expedition): Expedition {
  const checkpoint = encounterTier(run.departure.difficulty).floors.indexOf(run.floor)
  return run.departure.encounters === 'brood-v1' && ((run.departure.seed + checkpoint) & 1) === 1
    ? enterBrood(run)
    : enterBastion(run)
}
