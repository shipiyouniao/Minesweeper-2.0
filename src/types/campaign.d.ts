import type { ExpeditionJournal, VariantRecord } from './variants.js'
import type { SignalSceneId } from './signal-story.js'
import type { JsonObjectReader } from '../persistence/json-reader.js'
import type { JsonValue } from './json.js'

/** Stable selection keys are separate from replay-sensitive content revisions. */
export type CampaignStageId = 'tower-galleries' | 'tower-relay'
export type CampaignRevision = 'tower-road-v4' | 'tower-relay-v1'

/** The stage decoder reuses validated expedition formats without circular module dependencies. */
export interface CampaignDecoders {
  readonly journal: (reader: JsonObjectReader | null) => ExpeditionJournal | null
  readonly records: (values: readonly JsonValue[] | null) => readonly VariantRecord[] | null
}

/** Each authored stage owns its attempts, tutorial and first-clear settlement. */
export interface CampaignStageProgress {
  readonly id: CampaignStageId
  readonly journal: ExpeditionJournal | null
  readonly records: readonly VariantRecord[]
  readonly cleared: boolean
  readonly lesson: number
  readonly scenes: readonly SignalSceneId[]
  readonly recordSaved: boolean
}

/** A single shared envelope contains independent stage slots. */
export interface CampaignSave {
  readonly schemaVersion: 1
  readonly stages: readonly CampaignStageProgress[]
}

/** Content and prerequisites belong to the catalog, not router conditionals. */
export interface CampaignStage {
  readonly id: CampaignStageId
  readonly revision: CampaignRevision
  readonly prerequisite: CampaignStageId | null
  readonly floors: number
  readonly reward: number
  readonly lesson: boolean
}
