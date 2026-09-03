import { isRecord, PRESETS, restore, snapshot, type Difficulty, type Game } from './game/engine.js'

/** Minimal storage boundary shared by the browser adapter and in-memory tests. */
export interface StorageLike {
  /** Read a raw value, or return null when its key is absent. */
  getItem(key: string): string | null

  /** Store a raw value; quota or privacy restrictions may throw. */
  setItem(key: string, value: string): void

  /** Remove a raw value without affecting other saved difficulties. */
  removeItem(key: string): void
}

/** A completed game, identified independently of its editable player name. */
export interface Score {
  readonly id: string
  readonly name: string
  readonly milliseconds: number
  readonly date: string
}

/** Persisted progress intentionally excludes browser timer and dialog state. */
export interface SavedSession {
  readonly game: Game
  readonly elapsed: number
}

/** Persistence operations used by application services, independent of localStorage. */
export interface GameRepository {
  /** Whether storage operations have remained available during this run. */
  readonly available: boolean

  /** Read an untrusted preference for validation by its owning feature. */
  preference(key: string): unknown

  /** Store a normalized preference. */
  setPreference(key: string, value: string): void

  /** Restore validated progress for one difficulty. */
  load(mode: Difficulty): SavedSession | null

  /** Save an unfinished game, or remove a completed game's progress. */
  save(mode: Difficulty, game: Game, elapsed: number): void

  /** Return the fastest ten valid records in ascending time order. */
  scores(mode: Difficulty): Score[]

  /** Insert or rename a result without duplicating its identity. */
  record(mode: Difficulty, score: Score): void
}

const PREFIX = 'minesweeper.v3.'
const MAX_RECORDS = 10

/** Normalize current difficulty names and the original edition's URL aliases. */
export function difficultyOf(value: unknown): Difficulty {
  if (value === 'medium' || value === 'hard') {
    return 'medium'
  }

  if (value === 'expert' || value === 'extra') {
    return 'expert'
  }

  return value === 'custom' ? 'custom' : 'easy'
}

/** Validate untrusted leaderboard data before it reaches sorting or rendering. */
function isScore(value: unknown): value is Score {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    value['name'].length <= 32 &&
    typeof value['milliseconds'] === 'number' &&
    Number.isFinite(value['milliseconds']) &&
    value['milliseconds'] >= 0 &&
    typeof value['date'] === 'string' &&
    Number.isFinite(Date.parse(value['date']))
  )
}

/** Produce a sorted, bounded copy without changing the caller's collection. */
function rankScores(scores: readonly Score[]): Score[] {
  return [...scores]
    .sort((left, right) => left.milliseconds - right.milliseconds)
    .slice(0, MAX_RECORDS)
}

/** Translate one valid legacy record into the current numeric-time representation. */
function legacyScore(value: unknown, index: number): Score | null {
  if (!isRecord(value) || typeof value['time'] !== 'string' || typeof value['ID'] !== 'string') {
    return null
  }

  const match = /^(\d{1,5})h(\d{1,2})min(\d{1,2})s$/.exec(value['time'])

  if (!match) {
    return null
  }

  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])

  return {
    id: `legacy-${index}`,
    name: value['ID'],
    milliseconds: seconds * 1000,
    date: new Date(0).toISOString(),
  }
}

/**
 * Adapts string storage to validated game data.
 * Storage failures are contained here so they cannot interrupt gameplay.
 */
export class Repository implements GameRepository {
  available = true
  private readonly storage: StorageLike

  /** Accept an adapter rather than accessing browser globals inside the repository. */
  constructor(storage: StorageLike) {
    this.storage = storage
  }

  /** Read a preference without assuming that saved data still has the expected type. */
  preference(key: string): unknown {
    return this.read('preference.' + key)
  }

  /** Save a normalized preference in the current storage namespace. */
  setPreference(key: string, value: string): void {
    this.write('preference.' + key, value)
  }

  /** Validate the envelope, regenerate the board, and enforce preset dimensions. */
  load(mode: Difficulty): SavedSession | null {
    const saved = this.read('game.' + mode)

    if (
      !isRecord(saved) ||
      saved['version'] !== 1 ||
      typeof saved['elapsed'] !== 'number' ||
      !Number.isFinite(saved['elapsed']) ||
      saved['elapsed'] < 0
    ) {
      return null
    }

    const game = restore(saved['game'])

    if (!game) {
      return null
    }

    // A corrupted save must not smuggle custom dimensions into a ranked preset.
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

    return { game, elapsed: game.phase === 'ready' ? 0 : saved['elapsed'] }
  }

  /** Remove finished progress while leaving other difficulties and records untouched. */
  save(mode: Difficulty, game: Game, elapsed: number): void {
    const finished = game.phase === 'won' || game.phase === 'lost'
    const saved = finished ? null : { version: 1, game: snapshot(game), elapsed }

    this.write('game.' + mode, saved)
  }

  /** Filter invalid records before returning a sorted copy for the UI. */
  scores(mode: Difficulty): Score[] {
    const raw = this.read('scores.' + mode)

    return Array.isArray(raw) ? rankScores(raw.filter(isScore)) : []
  }

  /** Upsert by id so nickname edits cannot create duplicate leaderboard entries. */
  record(mode: Difficulty, score: Score): void {
    const scores = this.scores(mode).filter((item) => item.id !== score.id)
    const name = score.name.trim().slice(0, 32) || 'Player'

    scores.push({ ...score, name })
    this.write('scores.' + mode, rankScores(scores))
  }

  /** Preserve the original edition's leaderboard when it exists on this origin. */
  migrateLegacy(): void {
    try {
      const text = this.storage.getItem('MinesweeperRank')

      if (!text || text.length > 100_000) {
        return
      }

      const old: unknown = JSON.parse(text)

      if (!isRecord(old)) {
        return
      }

      const mapping = { easy: 'easyRank', medium: 'hardRank', expert: 'extraRank' } as const

      for (const mode of ['easy', 'medium', 'expert'] as const) {
        // Never overwrite records created by the new edition, including on reload.
        if (this.read('scores.' + mode) !== null) {
          continue
        }

        const list: unknown = old[mapping[mode]]

        if (!Array.isArray(list)) {
          continue
        }

        for (const [index, item] of list.slice(0, MAX_RECORDS).entries()) {
          const score = legacyScore(item, index)

          if (score) {
            this.record(mode, score)
          }
        }
      }
    } catch {
      // Malformed legacy data is ignored; the original key is kept for recovery.
    }
  }

  /** Bound and parse a stored JSON value; failures become an unavailable save. */
  private read(key: string): unknown {
    try {
      const raw = this.storage.getItem(PREFIX + key)

      return raw && raw.length < 500_000 ? (JSON.parse(raw) as unknown) : null
    } catch {
      this.available = false
      return null
    }
  }

  /** Contain quota/security failures at the storage boundary. */
  private write(key: string, value: unknown): void {
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
