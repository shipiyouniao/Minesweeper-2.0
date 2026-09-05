import { defeatBastion } from './bastion-helpers.js'
import { defeatBrood } from './brood-helpers.js'
import { defeatBattle } from './battle-helpers.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** Dispatch a mixed-roster playthrough to the actual boss's independent public-state strategy. */
export function defeatEncounter(initial: Expedition): ExpeditionAction[] {
  if (initial.departure.encounters === 'tactics-v2') return defeatBattle(initial)
  return initial.encounter?.kind === 'brood' ? defeatBrood(initial) : defeatBastion(initial)
}
