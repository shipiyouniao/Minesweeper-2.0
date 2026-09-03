import type { Difficulty, Game } from './game.js'
import type { Score } from './storage.js'

/** Supplies monotonic milliseconds; tests can advance time without waiting. */
export type MonotonicNow = () => number

/** The nondeterministic services required by a session, supplied at its boundary. */
export interface SessionRuntime {
  readonly now: MonotonicNow

  /** Generate a fresh board seed without putting randomness in the game rules. */
  randomSeed(): number

  /** Identify a result so saving a new nickname updates the same record. */
  createId(): string

  /** Supply a calendar timestamp for the leaderboard, separately from game time. */
  date(): string
}

/** Read-only application state consumed by the view. */
export interface SessionState {
  readonly game: Game
  readonly mode: Difficulty
  readonly elapsed: number
  readonly paused: boolean
  readonly currentScore: Score | null
}
