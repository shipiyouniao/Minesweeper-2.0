import type { RailSceneId } from './floor-rail.js'
import type { ExpeditionJournal, VariantRecord } from './variants.js'
import type { SignalSceneId } from './signal-story.js'
import type { ObservatorySceneId } from './observatory.js'
import type { FinaleSceneId } from './chapter-finale.js'
import type { WaterwaySceneId } from './waterway.js'
import type { StoryFact, StorySceneId, StoryTask } from './story.js'
import type { JsonObjectReader } from '../persistence/json-reader.js'
import type { JsonValue } from './json.js'

/** Stable selection keys are separate from replay-sensitive content revisions. */
export type CampaignStageId =
  | 'tower-galleries'
  | 'tower-relay'
  | 'ridge-observatory'
  | 'old-waterway'
  | 'tower-control'
  | 'quarry-rescue'
  | 'northwest-bastion'
export type CampaignRevision =
  | 'tower-road-v4'
  | 'tower-relay-v1'
  | 'ridge-observatory-v1'
  | 'old-waterway-v1'
  | 'tower-control-v1'
  | 'quarry-rescue-v1'
  | 'northwest-bastion-v1'
export type CampaignSceneId =
  RailSceneId | SignalSceneId | ObservatorySceneId | WaterwaySceneId | FinaleSceneId

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
  readonly scenes: readonly CampaignSceneId[]
  readonly recordSaved: boolean
}

/** A single shared envelope contains independent stage slots. */
export interface CampaignSave {
  readonly schemaVersion: 1
  readonly stages: readonly CampaignStageProgress[]
}

/** Content and prerequisites belong to the catalog, not router conditionals. */
export interface CampaignStage {
  /** A stage belongs to a physical world location; null index shares the scene's existing entry flow. */
  readonly entrance: {
    readonly scene: StorySceneId
    readonly index: number | null
    readonly fact: StoryFact | null
  }
  /** Largest authored room bounds the journal before exact per-floor replay validation. */
  readonly bounds: { readonly width: number; readonly height: number }
  readonly id: CampaignStageId
  readonly revision: CampaignRevision
  readonly prerequisite: CampaignStageId | null
  readonly entryTask: StoryTask
  readonly floors: number
  readonly outcome?: StoryFact
  readonly reward: number
  readonly lesson: boolean
}
