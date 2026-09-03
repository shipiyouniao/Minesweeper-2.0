import type { Difficulty, Game, GameSnapshot } from './game.js'
import type { Language } from './localization.js'

/** String-storage operations implemented by the browser and in-memory tests. */
export interface StorageLike {
  /** Read a raw value or null for a missing key. */
  getItem(key: string): string | null

  /** Write one raw value; the repository contains quota and security errors. */
  setItem(key: string, value: string): void

  /** Remove one key without affecting other applications or difficulties. */
  removeItem(key: string): void
}

/** A completed game with a stable identity independent of its editable name. */
export interface Score {
  readonly id: string
  readonly name: string
  readonly milliseconds: number
  readonly date: string
}

/** Validated progress returned to the application. */
export interface SavedSession {
  readonly game: Game
  readonly elapsed: number
}

/** Versioned on-disk session format; runtime clock and dialog state are excluded. */
export interface StoredSession {
  readonly version: 1
  readonly game: GameSnapshot
  readonly elapsed: number
}

/** A missing locale/difficulty lets startup fall back to browser/default settings. */
export interface Preferences {
  readonly language: Language | null
  readonly difficulty: Difficulty | null
  readonly name: string
}

/** Each setting's key determines its allowed value at the call site. */
export type Preference =
  | { readonly key: 'language'; readonly value: Language }
  | { readonly key: 'difficulty'; readonly value: Difficulty }
  | { readonly key: 'name'; readonly value: string }

/** The complete set of values written by this repository. */
export type StoredValue = string | StoredSession | readonly Score[] | null

/** Legacy records after decoding into today's numeric-time model. */
export interface LegacyScores {
  readonly easy: readonly Score[]
  readonly medium: readonly Score[]
  readonly expert: readonly Score[]
}

/** Persistence contract consumed by application services. */
export interface GameRepository {
  readonly available: boolean

  /** Return normalized settings; no JSON values escape into application code. */
  preferences(): Preferences

  /** Save a setting whose value matches its discriminant. */
  setPreference(preference: Preference): void

  /** Restore validated progress for one difficulty. */
  load(mode: Difficulty): SavedSession | null

  /** Save unfinished progress or clear the completed game's slot. */
  save(mode: Difficulty, game: Game, elapsed: number): void

  /** Return the fastest ten valid results in ascending time order. */
  scores(mode: Difficulty): Score[]

  /** Insert or rename a result without duplicating its identity. */
  record(mode: Difficulty, score: Score): void
}
