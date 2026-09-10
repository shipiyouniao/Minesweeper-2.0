import type { DungeonLayout } from './dungeon-generation.js'
/** A branch is identified by its physical junction, so components remain layout-independent. */
export interface PowerFeed {
  readonly junction: number
  readonly branch: 0 | 1
}

/** Once its clue is isolated, a junction can be switched freely on later visits. */
export interface PowerJunction {
  readonly index: number
  readonly input: PowerFeed | null
  readonly selected: 0 | 1 | null
}

/** Closing a powered door changes occupancy, never the mine or clue underneath it. */
export interface PowerDoor {
  readonly index: number
  readonly input: PowerFeed
}

/** A reading requires both a powered instrument and a solved local Minesweeper clue. */
export interface PowerReceiver {
  readonly index: number
  readonly input: PowerFeed
  readonly recorded: boolean
}

export interface FloorPower {
  /** Both tasks use the same physical routing rules, with distinct instruments and feedback. */
  readonly purpose: 'observation' | 'drainage'
  readonly junctions: readonly PowerJunction[]
  readonly doors: readonly PowerDoor[]
  readonly receivers: readonly PowerReceiver[]
}

/** Authored terrain and routing are data; the loader owns clue construction. */
export interface AuthoredPowerFloor {
  readonly rows: readonly string[]
  readonly power: FloorPower
}

export type PowerReadiness = 'covered' | 'clue' | 'unpowered' | 'recorded' | 'ready'

/** A constructed power room supplies fixed game cells and its reversible network. */
export interface PowerDungeonLayout extends DungeonLayout {
  readonly power: FloorPower
}
