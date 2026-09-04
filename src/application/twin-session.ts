import { actTwin, createTwin } from '../game/twin.js'
import { MAX_ACTIONS } from '../persistence/variant-decoders.js'
import type { Twin, TwinAction, TwinSave, VariantRecord } from '../types/variants.js'
import type { SessionRuntime } from '../types/session.js'
import { VariantRepository } from '../persistence/variant-repository.js'

/** Owns paired-board replay and exactly-once result recording. */
export class TwinSession {
  private readonly repository: VariantRepository
  private readonly runtime: SessionRuntime
  private save: TwinSave
  private current: Twin

  /** Restore both layouts from one seed and reject impossible or post-terminal histories. */
  constructor(repository: VariantRepository, runtime: SessionRuntime) {
    this.repository = repository
    this.runtime = runtime
    const saved = repository.twin()
    this.save = saved ?? {
      version: 1,
      seed: runtime.randomSeed(),
      actions: [],
      records: [],
      settled: false,
    }
    this.current = createTwin(this.save.seed)
    let valid = true

    for (const action of this.save.actions) {
      const next = actTwin(this.current, action)
      if (next === this.current) {
        valid = false
        break
      }
      this.current = next
    }

    const terminal = this.current.phase === 'won' || this.current.phase === 'lost'
    if (!valid || terminal !== this.save.settled) {
      repository.recovered = true
      this.current = createTwin(runtime.randomSeed())
      this.save = { ...this.save, seed: this.current.seed, actions: [], settled: false }
    }
  }

  /** Expose both immutable boards as one coherent state. */
  get state(): Twin {
    return this.current
  }

  /** Keep recent outcomes in the twin namespace. */
  get records(): readonly VariantRecord[] {
    return this.save.records
  }

  /** Expose the bounded replay budget so the UI can explain why a new pair is needed. */
  get atMoveLimit(): boolean {
    return this.save.actions.length >= MAX_ACTIONS
  }

  /** Replayable moves update both the progress envelope and any new terminal result. */
  dispatch(action: TwinAction): boolean {
    if (this.save.actions.length >= MAX_ACTIONS) return false
    const next = actTwin(this.current, action)
    if (next === this.current) return false
    this.current = next
    this.save = { ...this.save, actions: [...this.save.actions, action] }

    if ((next.phase === 'won' || next.phase === 'lost') && !this.save.settled) {
      const record: VariantRecord = {
        date: this.runtime.date(),
        outcome: next.phase,
        steps: next.moves,
        depth: 0,
        earned: 0,
      }
      this.save = {
        ...this.save,
        settled: true,
        records: [record, ...this.save.records].slice(0, 10),
      }
    }

    this.persist()
    return true
  }

  /** Start a fresh pair after the view has confirmed replacement of an unfinished game. */
  restart(): void {
    this.current = createTwin(this.runtime.randomSeed())
    this.save = { ...this.save, seed: this.current.seed, actions: [], settled: false }
    this.persist()
  }

  /** Save a complete paired-board envelope without touching expedition progress. */
  persist(): void {
    this.repository.saveTwin(this.save)
  }
}
