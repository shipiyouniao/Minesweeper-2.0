import type { DungeonLayout } from './dungeon-generation.js'

/** Tracks are public geometry; a rail can still conceal an ordinary mine. */
export interface RailTrack {
  readonly index: number
  readonly neighbors: readonly number[]
}

/** A turnout joins its stem to one selected branch. Returning carts can always leave a branch. */
export interface RailTurnout {
  readonly index: number
  readonly stem: number
  readonly branches: readonly [number, number]
  readonly selected: 0 | 1
}

/** Loading and unloading happen only after the required stop has been reached. */
export interface RailStation {
  readonly index: number
  readonly kind: 'brake' | 'passenger' | 'home'
  readonly requires: number | null
  readonly visited: boolean
}

/** The cart is separate from the walking player; journals store commands, not cart snapshots. */
export interface FloorRail {
  readonly tracks: readonly RailTrack[]
  readonly turnouts: readonly RailTurnout[]
  readonly stations: readonly RailStation[]
  readonly doors: readonly { readonly index: number; readonly station: number }[]
  readonly drive: number
  readonly reverse: number
  readonly cart: number
  readonly previous: number | null
  /** Accepted motion is transient presentation data, rebuilt during replay. */
  readonly travel: readonly number[]
}

export interface AuthoredRailFloor {
  readonly rows: readonly string[]
  readonly rail: FloorRail
}

export interface RailDungeonLayout extends DungeonLayout {
  readonly rail: FloorRail
}

export type RailSceneId = 'rail-entry' | 'rail-brakes' | 'rail-rescue' | 'rail-home' | 'rail-camp'

/** A forecast reads visibility before hazard truth, and never travels beyond public information. */
export interface RailMotion {
  readonly path: readonly number[]
  readonly previous: number | null
  readonly stop: 'covered' | 'blocked' | 'turnout' | 'station' | 'buffer'
}
