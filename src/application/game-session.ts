import type { Action, Config, Difficulty, Game } from '../types/game.js'
import type { GameRepository, Score } from '../types/storage.js'
import type { SessionRuntime, SessionState } from '../types/session.js'
import { act, createGame, PRESETS, validConfig } from '../game/engine.js'
import { GameClock } from './game-clock.js'

const DEFAULT_CUSTOM: Config = { width: 12, height: 12, mines: 20 }

/**
 * Coordinates one active game, its clock, and persistence.
 * Rules remain pure in the engine; this object owns their ordered side effects.
 */
export class GameSession {
  private readonly repository: GameRepository
  private readonly runtime: SessionRuntime
  private readonly clock: GameClock
  private game: Game
  private mode: Difficulty
  private paused: boolean
  private currentScore: Score | null = null
  private dialogOpen = false
  private resumeAfterDialog = false

  /** Restore the chosen difficulty, leaving an unfinished game paused. */
  constructor(repository: GameRepository, runtime: SessionRuntime, mode: Difficulty) {
    this.repository = repository
    this.runtime = runtime
    this.clock = new GameClock(runtime.now)
    this.mode = mode

    const saved = repository.load(mode)
    this.game = saved?.game ?? this.fresh(this.configFor(mode))
    this.clock.reset(saved?.elapsed ?? 0)
    this.paused = this.game.phase === 'playing'
  }

  /** Expose a snapshot of session metadata without exposing mutable ownership. */
  get state(): SessionState {
    return {
      game: this.game,
      mode: this.mode,
      elapsed: this.clock.elapsed,
      paused: this.paused,
      currentScore: this.currentScore,
    }
  }

  /** Let periodic autosave distinguish active play from a stopped session. */
  get running(): boolean {
    return this.clock.running
  }

  /** Apply an allowed action, then time, record, and persist its outcome once. */
  play(action: Action): boolean {
    if (this.paused || this.dialogOpen) {
      return false
    }

    const previous = this.game
    const next = act(previous, action)

    if (next === previous) {
      return false
    }

    this.game = next

    // Placing a flag before the first reveal must not start the timer.
    if (previous.phase === 'ready' && next.firstClick !== null) {
      this.clock.resume()
    }

    if (next.phase === 'won' || next.phase === 'lost') {
      this.clock.pause()

      if (next.phase === 'won' && this.mode !== 'custom') {
        this.recordWin()
      }
    }

    this.persist()
    return true
  }

  /** Save the old difficulty and restore or create the selected board. */
  changeDifficulty(mode: Difficulty, custom?: Config): void {
    // Reject invalid input before changing ownership or touching saved progress.
    if (custom && (mode !== 'custom' || !validConfig(custom))) {
      throw new RangeError('Custom dimensions require a valid custom difficulty')
    }

    this.persist()

    // Load after saving so reselecting the same difficulty cannot restore stale progress.
    const saved = custom ? null : this.repository.load(mode)
    const next = saved?.game ?? this.fresh(custom ?? this.configFor(mode))

    this.mode = mode
    this.install(next, saved?.elapsed ?? 0)
    this.repository.setPreference({ key: 'difficulty', value: mode })
  }

  /** Replace the current board with a new seed while retaining its dimensions. */
  restart(): void {
    this.install(this.fresh(this.game.config), 0)
    this.persist()
  }

  /** Toggle a user pause only during active gameplay outside a dialog. */
  togglePause(): void {
    if (this.game.phase !== 'playing' || this.dialogOpen) {
      return
    }

    this.paused = !this.paused

    if (this.paused) {
      this.clock.pause()
      this.persist()
    } else {
      this.clock.resume()
    }
  }

  /** Pause for a dialog while remembering whether that dialog owns the pause. */
  openDialog(): void {
    if (this.dialogOpen) {
      return
    }

    this.dialogOpen = true
    this.resumeAfterDialog = this.game.phase === 'playing' && !this.paused

    if (this.resumeAfterDialog) {
      this.clock.pause()
      this.paused = true
      this.persist()
    }
  }

  /** Resume only a pause introduced by this dialog, never a user/background pause. */
  closeDialog(): void {
    this.dialogOpen = false

    if (this.resumeAfterDialog && this.game.phase === 'playing') {
      this.paused = false
      this.clock.resume()
    }

    this.resumeAfterDialog = false
  }

  /** Pause on visibility loss or teardown, cancelling any automatic dialog resume. */
  suspend(): void {
    this.resumeAfterDialog = false
    this.clock.pause()

    if (this.game.phase === 'playing') {
      this.paused = true
    }

    this.persist()
  }

  /** Persist only serializable game state and elapsed time, never timer handles. */
  persist(): void {
    this.repository.save(this.mode, this.game, this.clock.elapsed)
  }

  /** Update a completed result in place and remember the preferred player name. */
  renameRecord(value: string): void {
    if (!this.currentScore || this.mode === 'custom') {
      return
    }

    const name = value.trim().slice(0, 32) || 'Player'
    this.currentScore = { ...this.currentScore, name }

    this.repository.record(this.mode, this.currentScore)
    this.repository.setPreference({ key: 'name', value: name })
  }

  /** Resolve a preset or the initial custom-practice dimensions. */
  private configFor(mode: Difficulty): Config {
    return mode === 'custom' ? DEFAULT_CUSTOM : PRESETS[mode]
  }

  /** Introduce randomness at the session boundary, keeping creation deterministic. */
  private fresh(config: Config): Game {
    return createGame(config, this.runtime.randomSeed())
  }

  /** Replace all state belonging to the previous board as one lifecycle operation. */
  private install(game: Game, elapsed: number): void {
    this.game = game
    this.clock.reset(elapsed)
    this.paused = game.phase === 'playing'
    this.currentScore = null
    this.dialogOpen = false
    this.resumeAfterDialog = false
  }

  /** Capture a preset win once; the engine rejects later actions on a finished game. */
  private recordWin(): void {
    const nickname = this.repository.preferences().name

    this.currentScore = {
      id: this.runtime.createId(),
      name: nickname,
      milliseconds: this.clock.elapsed,
      date: this.runtime.date(),
    }

    this.repository.record(this.mode, this.currentScore)
  }
}
