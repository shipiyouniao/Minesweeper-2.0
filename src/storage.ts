import { PRESETS, restore, snapshot } from './game/engine.js'
import { RANKED_DIFFICULTIES, parseDifficulty } from './game/difficulty.js'
import { parseLanguage } from './i18n.js'
import { decodeLegacyScores, decodeScores, decodeSession } from './persistence/decoders.js'
import { decodeString } from './persistence/json-reader.js'
import type { Difficulty, Game } from './types/game.js'
import type {
  GameRepository,
  Preference,
  Preferences,
  SavedSession,
  Score,
  StorageLike,
  StoredSession,
  StoredValue,
} from './types/storage.js'

const PREFIX = 'minesweeper.v3.'
const MAX_RECORDS = 10

/** Produce a sorted, bounded copy without changing the caller's collection. */
function rankScores(scores: readonly Score[]): Score[] {
  return [...scores]
    .sort((left, right) => left.milliseconds - right.milliseconds)
    .slice(0, MAX_RECORDS)
}

/** Owns persistence effects; boundary decoders supply complete typed models. */
export class Repository implements GameRepository {
  available = true
  private readonly storage: StorageLike

  /** Accept a storage adapter rather than touching browser globals. */
  constructor(storage: StorageLike) {
    this.storage = storage
  }

  /** Return a fixed preferences model with normalized choices and a usable player name. */
  preferences(): Preferences {
    const name = decodeString(this.read('preference.name'))

    return {
      language: parseLanguage(decodeString(this.read('preference.language'))),
      difficulty: parseDifficulty(decodeString(this.read('preference.difficulty'))),
      name: name?.trim().slice(0, 32) || 'Player',
    }
  }

  /** The discriminated union prevents assigning a difficulty value to a language key. */
  setPreference(preference: Preference): void {
    this.write('preference.' + preference.key, preference.value)
  }

  /** Restore decoded progress and enforce the selected preset's dimensions. */
  load(mode: Difficulty): SavedSession | null {
    const saved = decodeSession(this.read('game.' + mode))

    if (!saved) {
      return null
    }

    const game = restore(saved.game)

    if (!game) {
      return null
    }

    // Ranked saves must have the exact dimensions of their selected preset.
    if (mode !== 'custom') {
      const preset = PRESETS[mode]

      if (
        game.config.width !== preset.width ||
        game.config.height !== preset.height ||
        game.config.mines !== preset.mines
      ) {
        return null
      }
    }

    return { game, elapsed: game.phase === 'ready' ? 0 : saved.elapsed }
  }

  /** Clear completed progress while preserving records and other difficulty slots. */
  save(mode: Difficulty, game: Game, elapsed: number): void {
    const finished = game.phase === 'won' || game.phase === 'lost'
    const saved: StoredSession | null = finished
      ? null
      : { version: 1, game: snapshot(game), elapsed }

    this.write('game.' + mode, saved)
  }

  /** Return only decoded records, sorted numerically and bounded to the top ten. */
  scores(mode: Difficulty): Score[] {
    return rankScores(decodeScores(this.read('scores.' + mode)))
  }

  /** Upsert by identity so editing a name cannot create a second result. */
  record(mode: Difficulty, score: Score): void {
    const scores = this.scores(mode).filter((item) => item.id !== score.id)
    const name = score.name.trim().slice(0, 32) || 'Player'

    scores.push({ ...score, name })
    this.write('scores.' + mode, rankScores(scores))
  }

  /** Import decoded legacy records once while preserving the original recovery key. */
  migrateLegacy(): void {
    const scores = decodeLegacyScores(this.readRaw('MinesweeperRank', 100_000))

    if (!scores) {
      return
    }

    for (const mode of RANKED_DIFFICULTIES) {
      if (this.read('scores.' + mode) !== null) {
        continue
      }

      for (const score of scores[mode]) {
        this.record(mode, score)
      }
    }
  }

  /** Read current-edition text without leaking parsed JSON into business APIs. */
  private read(key: string): string | null {
    return this.readRaw(PREFIX + key, 500_000)
  }

  /** Bound stored input size and contain storage access errors. */
  private readRaw(key: string, maximumLength: number): string | null {
    try {
      const text = this.storage.getItem(key)
      return text !== null && text.length < maximumLength ? text : null
    } catch {
      this.available = false
      return null
    }
  }

  /** Serialize only the repository's declared value union and contain write errors. */
  private write(key: string, value: StoredValue): void {
    try {
      if (value === null) {
        this.storage.removeItem(PREFIX + key)
      } else {
        this.storage.setItem(PREFIX + key, JSON.stringify(value))
      }
    } catch {
      this.available = false
    }
  }
}
