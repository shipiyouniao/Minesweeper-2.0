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
  readonly junctions: readonly PowerJunction[]
  readonly doors: readonly PowerDoor[]
  readonly receivers: readonly PowerReceiver[]
}

export type PowerReadiness = 'covered' | 'clue' | 'unpowered' | 'recorded' | 'ready'
