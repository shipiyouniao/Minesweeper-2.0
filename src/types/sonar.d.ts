import type { Action, Game, RankedDifficulty } from './game.js'

/** A paid observation discloses a region total, never the identities of its cells. */
export interface SonarReading {
  readonly center: number
  readonly mines: number
}

/** One immutable puzzle, with a fixed layout after the first safe opening. */
export interface Sonar {
  readonly difficulty: RankedDifficulty
  readonly game: Game
  readonly readings: readonly SonarReading[]
  readonly moves: number
  readonly excavations: number
}

/** Scanning is an information action; ordinary board commands keep their existing meanings. */
export type SonarAction = Action | { readonly type: 'scan'; readonly index: number }

/** Comparing two readings cancels their common region without consulting covered cells. */
export interface SonarComparison {
  readonly common: readonly number[]
  readonly leftOnly: readonly number[]
  readonly rightOnly: readonly number[]
  readonly difference: number
}

/** Local wins rank by board operations, then by scans; classic time records are separate. */
export interface SonarRecord {
  readonly id: string
  readonly date: string
  readonly difficulty: RankedDifficulty
  readonly moves: number
  readonly scans: number
}

/** Progress and exactly-once settlement share a single versioned storage write. */
export interface SonarSave {
  readonly version: 2
  readonly difficulty: RankedDifficulty
  readonly seed: number
  readonly actions: readonly SonarAction[]
  readonly settled: boolean
  readonly records: readonly SonarRecord[]
}
