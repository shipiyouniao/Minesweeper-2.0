import type {
  CampaignRevision,
  CampaignSave,
  CampaignStage,
  CampaignStageId,
  CampaignStageProgress,
} from '../types/campaign.js'

export const CAMPAIGN_STAGES: readonly CampaignStage[] = [
  {
    id: 'tower-galleries',
    bounds: { width: 9, height: 9 },
    revision: 'tower-road-v4',
    prerequisite: null,
    floors: 3,
    reward: 50,
    lesson: true,
  },
  {
    id: 'tower-relay',
    bounds: { width: 9, height: 9 },
    revision: 'tower-relay-v1',
    prerequisite: 'tower-galleries',
    floors: 3,
    reward: 80,
    lesson: false,
  },
  {
    id: 'ridge-observatory',
    bounds: { width: 13, height: 13 },
    revision: 'ridge-observatory-v1',
    prerequisite: 'tower-relay',
    floors: 3,
    reward: 100,
    lesson: false,
  },
]

/** Reject arbitrary route keys before selecting a save slot. */
export function parseCampaignStage(value: string | null): CampaignStageId | null {
  return value === 'tower-galleries' || value === 'tower-relay' || value === 'ridge-observatory'
    ? value
    : null
}

/** Resolve finite content identities in either routing or replay context. */
export function campaignStage(id: CampaignStageId | CampaignRevision): CampaignStage {
  const stage = CAMPAIGN_STAGES.find((entry) => entry.id === id || entry.revision === id)
  if (!stage) throw new RangeError('Unknown campaign stage')
  return stage
}

/** Unvisited stages have no journal or rewards; callers never share mutable defaults. */
export function campaignProgress(
  save: CampaignSave | undefined,
  id: CampaignStageId,
): CampaignStageProgress {
  return (
    save?.stages.find((entry) => entry.id === id) ?? {
      id,
      journal: null,
      records: [],
      cleared: false,
      lesson: campaignStage(id).lesson ? 0 : 4,
      scenes: [],
      recordSaved: false,
    }
  )
}

/** Replace one stage while retaining every other stage's independent history. */
export function updateCampaign(
  save: CampaignSave | undefined,
  progress: CampaignStageProgress,
): CampaignSave {
  return {
    schemaVersion: 1,
    stages: [...(save?.stages ?? []).filter((entry) => entry.id !== progress.id), progress],
  }
}
