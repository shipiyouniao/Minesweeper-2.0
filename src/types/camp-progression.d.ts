import type { Upgrade } from './variants.js'

/** Purchase pacing distinguishes early variety, a middle milestone and a late saving goal. */
export type CampStage = 'early' | 'middle' | 'late'

/** Funding state for the next unowned facility in price order, derived from existing camp data. */
export interface CampFunding {
  readonly upgrade: Upgrade
  readonly stage: CampStage
  readonly price: number
  readonly saved: number
  readonly remaining: number
  readonly percent: number
  readonly minimumRuns: number
}
