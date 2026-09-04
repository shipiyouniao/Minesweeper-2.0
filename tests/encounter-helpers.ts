import { defeatBastion } from './bastion-helpers.js'
import { defeatBrood } from './brood-helpers.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** Dispatch a mixed-roster playthrough to the actual boss's independent public-state strategy. */
export function defeatEncounter(initial: Expedition): ExpeditionAction[] {
  return initial.encounter?.kind === 'brood' ? defeatBrood(initial) : defeatBastion(initial)
}
