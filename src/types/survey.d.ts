import type { Action, Game, RankedDifficulty } from './game.js'

/** A whole-line action must retain its axis so replay cannot open a crossing line by accident. */
export type SurveyAxis = 'row' | 'column'
export type SurveyAction =
  Action | { readonly type: 'chord-line'; readonly axis: SurveyAxis; readonly index: number }

/** A mine nonogram: ordered runs replace the classic eight-neighbor clues entirely. */
export interface Survey {
  readonly difficulty: RankedDifficulty
  readonly game: Game
  readonly moves: number
  readonly rows: readonly (readonly number[])[]
  readonly columns: readonly (readonly number[])[]
}

/** A line's public evidence; equal flag and mine counts never certify individual flags. */
export interface SurveyLine {
  readonly runs: readonly number[]
  readonly total: number | null
  readonly flags: number
  readonly covered: number
  readonly conflict: boolean
  readonly complete: boolean
}

/** Public facts or hypotheses; concealed mine identities never enter the deduction solver. */
export type SurveyKnowledge = 'unresolved' | 'safe' | 'mine'

/** Intersection of every placement allowed by ordered run clues. */
export interface SurveyDeduction {
  readonly cells: readonly SurveyKnowledge[]
  readonly contradiction: boolean
  readonly rounds: number
}

/** Generation publishes clues and a small set of safe starting squares. */
export interface SurveyLayout {
  readonly mines: ReadonlySet<number>
  readonly rows: readonly (readonly number[])[]
  readonly columns: readonly (readonly number[])[]
  readonly opening: readonly number[]
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
  readonly version: 2
  readonly difficulty: RankedDifficulty
  readonly seed: number
  readonly actions: readonly SurveyAction[]
  readonly settled: boolean
  readonly records: readonly SurveyRecord[]
}
