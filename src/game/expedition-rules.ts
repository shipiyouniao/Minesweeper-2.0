import type { Departure } from '../types/variants.js'

/** Share health support across gameplay and help without changing historical journals. */
export function hasExpeditionHealth(departure: Departure): boolean {
  return departure.rules === 'health-v1' || departure.rules === 'relics-v1'
}
