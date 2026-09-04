import { addVariantRecord } from '../game/variant-difficulty.js'
import { ownedRelicPacks } from '../game/relic-packs.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import {
  actExpedition,
  allowedDeparture,
  buyUpgrade,
  createExpedition,
  EMPTY_CAMP,
  expeditionEarnings,
} from '../game/expedition.js'
import { MAX_ACTIONS } from '../persistence/variant-decoders.js'
import type {
  Camp,
  Departure,
  Equipment,
  Expedition,
  ExpeditionAction,
  ExpeditionSave,
  Profession,
  Upgrade,
  VariantRecord,
} from '../types/variants.js'
import type { SessionRuntime } from '../types/session.js'
import { VariantRepository } from '../persistence/variant-repository.js'

/** Owns a replayable expedition and atomically settles its permanent camp progress. */
export class ExpeditionSession {
  private readonly repository: VariantRepository
  private readonly runtime: SessionRuntime
  private save: ExpeditionSave
  private current: Expedition | null = null

  /** Restore validated intents, recomputing hidden layout and all earned resources. */
  constructor(repository: VariantRepository, runtime: SessionRuntime) {
    this.repository = repository
    this.runtime = runtime
    this.save = repository.expedition() ?? {
      version: 3,
      camp: EMPTY_CAMP,
      journal: null,
      records: [],
    }
    const journal = this.save.journal
    if (!journal) return

    if (
      allowedDeparture(this.save.camp, journal.departure.profession, journal.departure.equipment) &&
      journal.departure.archive === this.save.camp.upgrades.includes('archive') &&
      (journal.departure.packs ?? []).every((pack) => this.save.camp.upgrades.includes(pack))
    ) {
      let run = createExpedition(journal.departure)
      let valid = true
      for (const action of journal.actions) {
        const next = actExpedition(run, action)
        if (next === run) {
          valid = false
          break
        }
        run = next
      }
      if (valid && (run.phase === 'exploring' || run.phase === 'boss' || run.phase === 'reward'))
        this.current = run
    }

    if (!this.current) {
      repository.recovered = true
      this.save = { ...this.save, journal: null }
    }
  }

  /** Read the immutable run snapshot; null means the camp screen. */
  get run(): Expedition | null {
    return this.current
  }

  /** Read permanent progress separately from temporary run resources. */
  get camp(): Camp {
    return this.save.camp
  }

  /** Return up to ten outcomes per difficulty, separate from other rulesets. */
  get records(): readonly VariantRecord[] {
    return this.save.records
  }

  /** Restore the last departure choice without changing an active run's rules. */
  get difficulty(): VariantDifficulty {
    return this.current?.departure.difficulty ?? this.save.difficulty ?? 'standard'
  }

  /** Persist a camp choice only when no expedition is active. */
  selectDifficulty(difficulty: VariantDifficulty): void {
    if (this.current) return

    this.save = { ...this.save, difficulty }
    this.persist()
  }

  /** Reserve the final journal slot for extraction when the recovery budget is exhausted. */
  get atMoveLimit(): boolean {
    return (this.save.journal?.actions.length ?? 0) >= MAX_ACTIONS - 1
  }

  /** Begin only from camp, with a verified career and affordable equipment allocation. */
  start(
    profession: Profession,
    equipment: readonly Equipment[],
    difficulty: VariantDifficulty = this.difficulty,
  ): boolean {
    if (this.current || !allowedDeparture(this.camp, profession, equipment)) return false
    const departure: Departure = {
      rules: 'relics-v1',
      professions: 'skills-v1',
      encounters: 'brood-v1',
      rewards: 'difficulty-v1',
      packs: ownedRelicPacks(this.camp),
      difficulty,
      seed: this.runtime.randomSeed(),
      profession,
      equipment: [...equipment],
      archive: this.camp.upgrades.includes('archive'),
    }
    this.current = createExpedition(departure)
    this.save = { ...this.save, difficulty, journal: { departure, actions: [] } }
    this.persist()
    return true
  }

  /** Apply a legal intent and settle terminal outcomes in the same persistence write. */
  dispatch(action: ExpeditionAction): boolean {
    const run = this.current
    const journal = this.save.journal
    if (
      !run ||
      !journal ||
      (journal.actions.length >= MAX_ACTIONS - 1 && action.type !== 'retreat')
    )
      return false
    const next = actExpedition(run, action)
    if (next === run) return false
    this.current = next
    this.save = { ...this.save, journal: { ...journal, actions: [...journal.actions, action] } }

    if (next.phase === 'lost' || next.phase === 'won' || next.phase === 'retreated') {
      const earned = expeditionEarnings(next)
      const record: VariantRecord = {
        ...(next.departure.difficulty ? { difficulty: next.departure.difficulty } : {}),
        date: this.runtime.date(),
        outcome: next.phase,
        steps: next.steps,
        depth: next.floor,
        earned,
      }
      this.save = {
        version: 3,
        difficulty: this.difficulty,
        journal: null,
        camp: {
          ...this.camp,
          supplies: this.camp.supplies + earned,
          completed: this.camp.completed + Number(next.phase === 'won'),
        },
        records: addVariantRecord(this.save.records, record),
      }
    }

    this.persist()
    return true
  }

  /** Return from the terminal result to camp without awarding anything a second time. */
  returnToCamp(): boolean {
    if (!this.current || this.save.journal) return false
    this.current = null
    return true
  }

  /** Permanent purchases are permitted only at camp, never halfway through replay. */
  purchase(upgrade: Upgrade): boolean {
    if (this.current) return false
    const camp = buyUpgrade(this.camp, upgrade)
    if (camp === this.camp) return false
    this.save = { ...this.save, camp }
    this.persist()
    return true
  }

  /** Checkpoint the already coherent envelope; storage errors remain observable in the adapter. */
  persist(): void {
    this.repository.saveExpedition(this.save)
  }
}
