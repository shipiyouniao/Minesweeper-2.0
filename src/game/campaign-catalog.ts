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
    entrance: { scene: 'tower-landing', index: null, fact: null },
    bounds: { width: 9, height: 9 },
    revision: 'tower-road-v4',
    prerequisite: null,
    floors: 3,
    reward: 50,
    entryTask: 'reach-tower',
    lesson: true,
  },
  {
    id: 'tower-relay',
    entrance: { scene: 'tower-landing', index: null, fact: null },
    bounds: { width: 9, height: 9 },
    revision: 'tower-relay-v1',
    prerequisite: 'tower-galleries',
    floors: 3,
    reward: 80,
    entryTask: 'reach-tower',
    lesson: false,
  },
  {
    id: 'ridge-observatory',
    entrance: { scene: 'north-road', index: 86, fact: 'ridge-route' },
    bounds: { width: 13, height: 13 },
    revision: 'ridge-observatory-v1',
    prerequisite: 'tower-relay',
    floors: 3,
    outcome: 'ridge-surveyed',
    reward: 100,
    entryTask: 'reach-tower',
    lesson: false,
  },
  {
    id: 'old-waterway',
    entrance: { scene: 'north-road', index: 81, fact: 'ridge-surveyed' },
    bounds: { width: 19, height: 17 },
    revision: 'old-waterway-v1',
    prerequisite: 'ridge-observatory',
    floors: 3,
    outcome: 'beacon-recovered',
    reward: 140,
    entryTask: 'reach-tower',
    lesson: false,
  },
  {
    id: 'tower-control',
    entrance: { scene: 'tower-landing', index: 34, fact: 'beacon-recovered' },
    bounds: { width: 19, height: 19 },
    revision: 'tower-control-v1',
    prerequisite: 'old-waterway',
    floors: 3,
    outcome: 'west-line-restored',
    reward: 180,
    entryTask: 'reach-tower',
    lesson: false,
  },
  {
    id: 'northwest-bastion',
    boss: 'bastion',
    entrance: { scene: 'blockade-pass', index: 16, fact: 'west-shortcut' },
    bounds: { width: 19, height: 17 },
    revision: 'northwest-bastion-v1',
    prerequisite: 'tower-control',
    floors: 3,
    outcome: 'chapter-one-cleared',
    reward: 240,
    entryTask: 'reach-tower',
    lesson: false,
  },
  {
    id: 'quarry-rescue',
    entrance: { scene: 'quarry-yard', index: 25, fact: 'lift-discovered' },
    bounds: { width: 17, height: 17 },
    revision: 'quarry-rescue-v1',
    prerequisite: 'tower-galleries',
    floors: 3,
    outcome: 'toma-rescued',
    reward: 120,
    entryTask: 'survey-road',
    lesson: false,
  },
]

/** Reject arbitrary route keys before selecting a save slot. */
export function parseCampaignStage(value: string | null): CampaignStageId | null {
  return value === 'quarry-rescue' ||
    value === 'tower-galleries' ||
    value === 'tower-relay' ||
    value === 'ridge-observatory' ||
    value === 'old-waterway' ||
    value === 'tower-control' ||
    value === 'northwest-bastion'
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
