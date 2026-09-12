import { ExpeditionSession } from './expedition-session.js'
import {
  recollectionAvailable,
  recollectionUnlocks,
  snapshotRecollection,
  validRecollection,
} from '../game/recollection.js'
import { EMPTY_CAMP } from '../game/expedition.js'
import type { RecollectionFloor, RecollectionSelection } from '../types/recollection.js'
import type { EncounterKind } from '../types/tactical.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import type { SessionRuntime } from '../types/session.js'
import type { ExpeditionSave } from '../types/variants.js'
import { VariantRepository } from '../persistence/variant-repository.js'

/** Own camp pool editing and unlock checks; the expedition still owns combat and settlement. */
export class RecollectionSession {
  readonly expedition: ExpeditionSession
  private selection: RecollectionSelection
  private readonly repository: VariantRepository

  /** Resume the last pool choices without changing an active departure. */
  constructor(repository: VariantRepository, runtime: SessionRuntime) {
    this.repository = repository
    this.expedition = new ExpeditionSession(repository, runtime)
    const save = this.save
    const unlocked = recollectionUnlocks(save)
    this.selection =
      save.recollection && validRecollection(save.recollection, unlocked)
        ? snapshotRecollection(save.recollection)
        : unlocked
  }

  /** Always read shared progression again before presenting or authorizing a departure. */
  get save(): ExpeditionSave {
    return (
      this.repository.expedition() ?? { version: 4, camp: EMPTY_CAMP, journal: null, records: [] }
    )
  }

  /** Storage failures remain visible even though in-memory play can continue. */
  get storageAvailable(): boolean {
    return this.repository.available
  }

  /** Facility access is earned through the western camp, independently of a paused run. */
  get available(): boolean {
    return recollectionAvailable(this.save)
  }

  /** The UI may show a temporarily empty pool, but it cannot launch one. */
  get selected(): RecollectionSelection {
    return this.selection
  }

  /** Newly defeated bosses appear on the next visit without changing prior run snapshots. */
  get unlocked(): RecollectionSelection {
    return recollectionUnlocks(this.save)
  }

  /** Difficulty affects the existing room sizes, encounter schedule and reward table. */
  selectDifficulty(difficulty: VariantDifficulty): boolean {
    if (!this.available || this.expedition.run) return false
    this.expedition.selectDifficulty(difficulty)
    return true
  }

  /** Toggle only an earned ordinary-floor family while no expedition is in progress. */
  toggleFloor(kind: RecollectionFloor): boolean {
    if (!this.available || this.expedition.run || !this.unlocked.floors.includes(kind)) return false
    const floors = this.selection.floors.includes(kind)
      ? this.selection.floors.filter((entry) => entry !== kind)
      : [...this.selection.floors, kind]
    this.selection = { ...this.selection, floors }
    this.persistSelection()
    return true
  }

  /** Boss checkboxes never award knowledge or remove the player's historical victories. */
  toggleBoss(kind: EncounterKind): boolean {
    if (!this.available || this.expedition.run || !this.unlocked.bosses.includes(kind)) return false
    const bosses = this.selection.bosses.includes(kind)
      ? this.selection.bosses.filter((entry) => entry !== kind)
      : [...this.selection.bosses, kind]
    this.selection = { floors: this.selection.floors, bosses, remainingBosses: bosses }
    this.persistSelection()
    return true
  }

  /** Keep valid preparation choices when the facility closes without starting a run. */
  private persistSelection(): void {
    if (validRecollection(this.selection, this.unlocked))
      this.repository.saveExpedition({
        ...this.save,
        recollection: snapshotRecollection(this.selection),
      })
  }

  /** Snapshot valid choices together with the shared profession, equipment and replay journal. */
  start(): boolean {
    if (!this.available || !validRecollection(this.selection, this.unlocked)) return false
    const loadout = this.expedition.loadout
    return this.expedition.start(
      loadout.profession,
      loadout.equipment,
      this.expedition.difficulty,
      this.selection,
    )
  }
}
