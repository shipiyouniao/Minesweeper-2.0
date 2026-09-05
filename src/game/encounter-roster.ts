import { encounterTier } from './encounter-tiers.js'
import { enterBattle } from './battle-arena.js'
import { enterMirror } from './mirror-battle.js'
import { enterMagnetic } from './magnetic-battle.js'
import type { Expedition } from '../types/variants.js'

/** Place boss rooms at the selected difficulty's authored checkpoints. */
export function isEncounterFloor(run: Expedition): boolean {
  return encounterTier(run.departure.difficulty).floors.includes(run.floor)
}

/** Rotate four distinct encounters from a seeded first boss without immediate repeats. */
export function enterEncounter(run: Expedition): Expedition {
  const checkpoint = encounterTier(run.departure.difficulty).floors.indexOf(run.floor)
  const slot = (run.departure.seed + checkpoint) % 4
  if (slot === 3) return enterMagnetic(run)
  return slot === 2 ? enterMirror(run) : enterBattle(run, slot === 1 ? 'brood' : 'bastion')
}
