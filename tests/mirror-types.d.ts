import type { MineDeduction } from '../src/types/combat-build.js'
import type { MirrorSide } from '../src/types/mirror.js'

/** Public deductions used by the acceptance player; no covered mine bits are read. */
export interface MirrorTestKnowledge {
  readonly dawn: MineDeduction
  readonly dusk: MineDeduction
}

/** A public waypoint keeps turn search directed at one realm's unfinished objective. */
export interface MirrorTestGoal {
  readonly side: MirrorSide
  readonly index: number
}
