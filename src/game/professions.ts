import type { Departure, Profession } from '../types/variants.js'
import type { ProfessionResources } from '../types/profession.js'

export const PROFESSIONS: readonly Profession[] = [
  'explorer',
  'surveyor',
  'engineer',
  'archaeologist',
  'alchemist',
  'sentinel',
]

/** Read a closed roster; every profession has exactly one declared starting allocation. */
export function professionResources(profession: Profession): ProfessionResources {
  switch (profession) {
    case 'explorer':
      return { probes: 2, scans: 1, shields: 0 }
    case 'surveyor':
      return { probes: 1, scans: 2, shields: 0 }
    case 'engineer':
      return { probes: 1, scans: 1, shields: 1 }
    case 'archaeologist':
      return { probes: 1, scans: 0, shields: 0 }
    case 'alchemist':
      return { probes: 0, scans: 0, shields: 2 }
    case 'sentinel':
      return { probes: 1, scans: 0, shields: 1 }
  }
}

/** Extra relic choice belongs to the Archaeologist's career, not the entire pool. */
export function professionOfferCount(departure: Departure): number {
  return departure.profession === 'archaeologist' ? 4 : 3
}
