/** Preset names are also the persistence keys; custom boards remain unranked. */
export type Difficulty = 'easy' | 'medium' | 'expert' | 'custom'

/** Difficulties eligible for local ranked records. */
export type RankedDifficulty = 'easy' | 'medium' | 'expert'

/** Progression from an untouched board to a terminal result. */
export type Phase = 'ready' | 'playing' | 'won' | 'lost'

/** Player-visible state, independent of whether a cell contains a mine. */
export type Visibility = 'hidden' | 'revealed' | 'flagged'

/** Immutable dimensions and the exact number of mines to place. */
export interface Config {
  readonly width: number
  readonly height: number
  readonly mines: number
}

/** Logical cell data; covered clues are never sent to the rendered DOM. */
export interface Cell {
  readonly mine: boolean
  readonly adjacent: number
  readonly visibility: Visibility
}

/** A complete value representing one point in a game's history. */
export interface Game {
  readonly config: Config
  readonly seed: number
  readonly firstClick: number | null
  readonly phase: Phase
  readonly cells: readonly Cell[]
  readonly exploded: number | null
}

/** Player intent contains no browser event, clock, or storage dependency. */
export type Action =
  | { readonly type: 'reveal'; readonly index: number }
  | { readonly type: 'flag'; readonly index: number }
  | { readonly type: 'chord'; readonly index: number }

/** Only the seed, opening move, and player-visible state need to be persisted. */
export interface GameSnapshot {
  readonly config: Config
  readonly seed: number
  readonly firstClick: number | null
  readonly visible: readonly Visibility[]
}

/** Explicit preset catalog shared by rules and difficulty controls. */
export interface PresetBoards {
  readonly easy: Config
  readonly medium: Config
  readonly expert: Config
}

/** Counters derived from a complete immutable game state. */
export interface GameStats {
  readonly flags: number
  readonly revealed: number
  readonly remaining: number
}
