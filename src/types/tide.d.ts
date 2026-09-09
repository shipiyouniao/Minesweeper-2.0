import type { Expedition } from './variants.js'
import type { TacticalState } from './tactical.js'

/** Tile identity survives permutation; coordinates and neighbor counts do not. */
export interface TideEncounter extends TacticalState {
  readonly kind: 'tide'
  readonly core: number
  readonly anchors: readonly number[]
  readonly phase: 1 | 2
  readonly exposed: boolean
  readonly cycle: number
  /** Source coordinate to destination coordinate of the most recent tide. */
  readonly permutation: readonly number[]
  readonly countercurrent: boolean
}

/** Rules narrow the encounter once at their public boundary. */
export interface TideExpedition extends Expedition {
  readonly encounter: TideEncounter
}
