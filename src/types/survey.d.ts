import type { Action, Game, RankedDifficulty } from './game.js'

/** A fixed-layout puzzle whose public row and column totals supplement adjacent clues. */
export interface Survey {
  readonly difficulty: RankedDifficulty
  readonly game: Game
  readonly moves: number
  /** Empty until the first reveal chooses the safe opening and generates the layout. */
  readonly rows: readonly number[]
  readonly columns: readonly number[]
}

/** A line's public evidence; equal flag and mine counts never certify individual flags. */
export interface SurveyLine {
  readonly total: number | null
  readonly flags: number
  readonly covered: number
}

/** Records belong only to Survey and rank by accepted board operations. */
export interface SurveyRecord {
  readonly id: string
  readonly date: string
  readonly difficulty: RankedDifficulty
  readonly moves: number
}

/** One atomic write persists the accepted journal and its exactly-once result. */
export interface SurveySave {
  readonly version: 1
  readonly difficulty: RankedDifficulty
  readonly seed: number
  readonly actions: readonly Action[]
  readonly settled: boolean
  readonly records: readonly SurveyRecord[]
}
