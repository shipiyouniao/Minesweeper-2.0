import { actSurvey, createSurvey, SURVEY_ACTION_LIMIT } from '../game/survey.js'
import { rankSurveyRecords, SurveyRepository } from '../persistence/survey-repository.js'
import type { Action, RankedDifficulty } from '../types/game.js'
import type { SessionRuntime } from '../types/session.js'
import type { Survey, SurveyRecord, SurveySave } from '../types/survey.js'

/** Own replay and result settlement while all puzzle transitions remain pure. */
export class SurveySession {
  private readonly repository: SurveyRepository
  private readonly runtime: SessionRuntime
  private current: Survey
  private saved: SurveySave

  /** Restore accepted actions and regenerate run clues rather than trusting serialized observations. */
  constructor(repository: SurveyRepository, runtime: SessionRuntime) {
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
    this.current = createSurvey(this.saved.seed, this.saved.difficulty)
    let valid = true
    for (const action of this.saved.actions) {
      const next = actSurvey(this.current, action)
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
  get state(): Survey {
    return this.current
  }

  /** Expose Survey wins only, already ranked independently within each preset. */
  get records(): readonly SurveyRecord[] {
    return this.saved.records
  }

  /** Keep replay recovery bounded while leaving restart available. */
  get atMoveLimit(): boolean {
    return this.saved.actions.length >= SURVEY_ACTION_LIMIT
  }

  /** Append only accepted commands; a terminal transition records a win exactly once. */
  dispatch(action: Action): boolean {
    if (this.atMoveLimit) return false
    const next = actSurvey(this.current, action)
    if (next === this.current) return false
    this.current = next
    const terminal = next.game.phase === 'won' || next.game.phase === 'lost'
    const records =
      next.game.phase === 'won'
        ? rankSurveyRecords([
            ...this.saved.records,
            {
              id: this.runtime.createId(),
              date: this.runtime.date(),
              difficulty: next.difficulty,
              moves: next.moves,
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
    this.current = createSurvey(this.runtime.randomSeed(), difficulty)
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
