import { actSonar, createSonar, SONAR_ACTION_LIMIT } from '../game/sonar.js'
import { rankSonarRecords, SonarRepository } from '../persistence/sonar-repository.js'
import type { RankedDifficulty } from '../types/game.js'
import type { SessionRuntime } from '../types/session.js'
import type { Sonar, SonarAction, SonarRecord, SonarSave } from '../types/sonar.js'

/** Own replay and result settlement while all puzzle transitions remain pure. */
export class SonarSession {
  private readonly repository: SonarRepository
  private readonly runtime: SessionRuntime
  private current: Sonar
  private saved: SonarSave

  /** Restore accepted actions and regenerate readings rather than trusting serialized totals. */
  constructor(repository: SonarRepository, runtime: SessionRuntime) {
    this.repository = repository
    this.runtime = runtime
    const saved = repository.load()
    this.saved = saved ?? {
      version: 2,
      difficulty: 'easy',
      seed: runtime.randomSeed(),
      actions: [],
      records: repository.records,
      settled: false,
    }
    this.current = createSonar(this.saved.seed, this.saved.difficulty)
    let valid = true
    for (const action of this.saved.actions) {
      const next = actSonar(this.current, action)
      if (next === this.current) {
        valid = false
        break
      }
      this.current = next
    }
    const terminal = this.current.game.phase === 'won' || this.current.game.phase === 'lost'
    if (!valid || terminal !== this.saved.settled) {
      repository.recovered = true
      this.restart(this.saved.difficulty)
    }
    // Save an untouched seed too: switching modes before the first reveal must retain the puzzle.
    this.persist()
  }

  /** Expose an immutable puzzle to presentation. */
  get state(): Sonar {
    return this.current
  }

  /** Expose Sonar wins only, already ranked independently within each preset. */
  get records(): readonly SonarRecord[] {
    return this.saved.records
  }

  /** Keep replay recovery bounded while leaving restart available. */
  get atMoveLimit(): boolean {
    return this.saved.actions.length >= SONAR_ACTION_LIMIT
  }

  /** Append only accepted commands; a terminal transition records a win exactly once. */
  dispatch(action: SonarAction): boolean {
    if (this.atMoveLimit) return false
    const next = actSonar(this.current, action)
    if (next === this.current) return false
    this.current = next
    const terminal = next.game.phase === 'won' || next.game.phase === 'lost'
    const records =
      next.game.phase === 'won'
        ? rankSonarRecords([
            ...this.saved.records,
            {
              id: this.runtime.createId(),
              date: this.runtime.date(),
              difficulty: next.difficulty,
              moves: next.moves,
              scans: next.readings.length,
            },
          ])
        : this.saved.records
    this.saved = {
      ...this.saved,
      actions: [...this.saved.actions, action],
      records,
      settled: terminal,
    }
    this.persist()
    return true
  }

  /** Replace an active puzzle only after the controller confirms the player's request. */
  restart(difficulty: RankedDifficulty = this.current.difficulty): void {
    this.current = createSonar(this.runtime.randomSeed(), difficulty)
    this.saved = {
      ...this.saved,
      difficulty,
      seed: this.current.game.seed,
      actions: [],
      settled: false,
    }
    this.persist()
  }

  /** Checkpoint the coherent envelope when the application backgrounds or unmounts. */
  persist(): void {
    this.repository.save(this.saved)
  }
}
