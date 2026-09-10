/** A relay seals a physical gate until its neighboring hazards have been isolated. */
export interface FloorRelay {
  readonly index: number
  readonly gate: number
  readonly optional: boolean
  readonly active: boolean
}

/** Replay-owned mechanism state can be used by authored or generated floors. */
export interface FloorCircuits {
  readonly relays: readonly FloorRelay[]
  readonly record: number | null
  readonly recordTaken: boolean
}
