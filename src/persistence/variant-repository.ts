import type { ExpeditionSave, TwinSave, VariantSave } from '../types/variants.js'
import type { StorageLike } from '../types/storage.js'
import { loadExpeditionSave, decodeTwinSave } from './variant-decoders.js'
import { encodeStory, storyEnvelopeStatus } from './story-encoder.js'

/** Owns mode-specific storage, containing browser quota/privacy failures at one boundary. */
export class VariantRepository {
  readonly campaignMode: boolean
  private readonly storage: StorageLike
  private expeditionCache: ExpeditionSave | null = null
  available = true
  recovered = false
  migrated = false
  returnedSupplies: number | null = null
  storyReadOnly = false

  /** Accept the same storage port used by classic mode and test adapters. */
  constructor(storage: StorageLike, campaignMode = false) {
    this.campaignMode = campaignMode
    this.storage = storage
  }

  /** Load the camp and expedition envelope without accessing any classic slot. */
  expedition(): ExpeditionSave | null {
    if (!this.available && this.expeditionCache) return this.expeditionCache
    let text = this.read('expedition')
    const status = storyEnvelopeStatus(text)
    let restored = false
    if (status === 'unsupported') {
      this.storyReadOnly = true
      this.available = false
    }
    if (status === 'invalid') {
      const backup = this.read('expedition.backup')
      if (backup && storyEnvelopeStatus(backup) === 'supported' && loadExpeditionSave(backup)) {
        text = backup
        restored = true
      } else {
        this.storyReadOnly = true
        this.available = false
      }
    }
    if (!this.available && this.expeditionCache) return this.expeditionCache
    const loaded = loadExpeditionSave(text)
    this.migrated = loaded?.migrated ?? false
    this.returnedSupplies = loaded?.returnedSupplies ?? null
    this.recovered = restored || (loaded?.recovered ?? text !== null)
    this.expeditionCache = loaded?.save ?? null
    return this.campaignMode && this.expeditionCache
      ? {
          ...this.expeditionCache,
          journal: this.expeditionCache.campaign?.journal ?? null,
          records: this.expeditionCache.campaign?.records ?? [],
          difficulty: 'relaxed',
        }
      : this.expeditionCache
  }

  /** Project only the campaign attempt while retaining one atomic shared camp envelope. */
  forCampaign(): VariantRepository {
    return new VariantRepository(this.storage, true)
  }

  /** Load the paired-board envelope using its own schema decoder. */
  twin(): TwinSave | null {
    const text = this.read('twin')
    const save = decodeTwinSave(text)
    if (text !== null && !save) this.recovered = true
    return save
  }

  /** Commit camp and expedition settlement through their typed namespace. */
  saveExpedition(value: ExpeditionSave): void {
    if (this.campaignMode) {
      const shared = new VariantRepository(this.storage)
      const latest = shared.expedition() ?? value
      shared.saveExpedition({
        ...latest,
        camp: value.camp,
        ...(value.story ? { story: value.story } : {}),
        ...(value.loadout ? { loadout: value.loadout } : {}),
        campaign: {
          journal: value.journal,
          records: value.records,
          cleared: value.campaign?.cleared ?? false,
          lesson: value.campaign?.lesson ?? 0,
        },
      })
      this.expeditionCache = {
        ...value,
        campaign: {
          journal: value.journal,
          records: value.records,
          cleared: value.campaign?.cleared ?? false,
          lesson: value.campaign?.lesson ?? 0,
        },
      }
      this.available = shared.available
      return
    }
    // Keep the active tab usable after a quota/privacy error, including its camp transition.
    this.expeditionCache = value
    this.write('expedition', value)
  }

  /** Commit paired progress and results through their own typed namespace. */
  saveTwin(value: TwinSave): void {
    this.write('twin', value)
  }

  /** Replace one complete envelope so a refresh cannot split currency and settlement. */
  private write(mode: 'expedition' | 'twin', value: VariantSave): void {
    try {
      if (mode === 'expedition') {
        const previous = this.storage.getItem('minesweeper.variants.v1.expedition')
        if (this.storyReadOnly || storyEnvelopeStatus(previous) === 'unsupported') {
          this.storyReadOnly = true
          this.available = false
          return
        }
        if (
          previous &&
          storyEnvelopeStatus(previous) === 'supported' &&
          loadExpeditionSave(previous)
        ) {
          this.storage.setItem('minesweeper.variants.v1.expedition.backup', previous)
          if (
            !previous.includes('"schemaVersion"') &&
            !this.storage.getItem('minesweeper.variants.v1.expedition.story-v1-backup')
          )
            this.storage.setItem('minesweeper.variants.v1.expedition.story-v1-backup', previous)
        }
      }
      const encoded =
        'camp' in value && value.story ? { ...value, story: encodeStory(value.story) } : value
      this.storage.setItem(`minesweeper.variants.v1.${mode}`, JSON.stringify(encoded))
    } catch {
      this.available = false
    }
  }

  /** Read only the requested mode, marking unavailable storage for the UI. */
  private read(mode: 'expedition' | 'twin' | 'expedition.backup'): string | null {
    try {
      return this.storage.getItem(`minesweeper.variants.v1.${mode}`)
    } catch {
      this.available = false
      return null
    }
  }
}
