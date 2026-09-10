import { campaignStage, parseCampaignStage } from '../game/campaign-catalog.js'
import { JsonObjectReader } from './json-reader.js'
import type { CampaignSave, CampaignStageId, CampaignStageProgress } from '../types/campaign.js'
import { SIGNAL_SCENES } from '../game/signal-story.js'
import { OBSERVATORY_SCENES } from '../game/observatory-story.js'
import { WATERWAY_SCENES } from '../game/waterway-story.js'
import type { CampaignDecoders } from '../types/campaign.js'

/** Construct a stage record from validated intent history and finite content identities. */
function decodeStage(
  reader: JsonObjectReader,
  id: CampaignStageId,
  decoders: CampaignDecoders,
): CampaignStageProgress {
  const candidate = decoders.journal(reader.child('journal'))
  const journal = candidate?.departure.campaign === campaignStage(id).revision ? candidate : null
  const scenes = (
    id === 'old-waterway'
      ? WATERWAY_SCENES
      : id === 'ridge-observatory'
        ? OBSERVATORY_SCENES
        : SIGNAL_SCENES
  ).filter((scene) => reader.array('scenes')?.includes(scene))
  return {
    id,
    journal,
    records: decoders.records(reader.array('records')) ?? [],
    cleared: reader.value('cleared') === true,
    lesson:
      journal || reader.value('journal') === null
        ? Math.max(0, Math.min(4, Math.trunc(reader.number('lesson') ?? 0)))
        : 0,
    scenes: [...new Set(scenes)],
    recordSaved: reader.value('recordSaved') === true,
  }
}

/** Migrate the old single slot once; subsequent writes contain only the stage catalog format. */
export function decodeCampaign(
  reader: JsonObjectReader | null,
  decoders: CampaignDecoders,
): CampaignSave | undefined {
  if (!reader) return undefined
  if (reader.value('schemaVersion') === undefined)
    return { schemaVersion: 1, stages: [decodeStage(reader, 'tower-galleries', decoders)] }
  if (reader.number('schemaVersion') !== 1) return undefined
  const stages: CampaignStageProgress[] = []
  for (const value of reader.array('stages') ?? []) {
    const entry = JsonObjectReader.from(value)
    const id = parseCampaignStage(entry?.string('id') ?? null)
    if (entry && id && !stages.some((stage) => stage.id === id))
      stages.push(decodeStage(entry, id, decoders))
  }
  return { schemaVersion: 1, stages }
}

/** Surface retired or malformed attempts without treating unvisited or settled slots as failures. */
export function campaignWasRecovered(
  reader: JsonObjectReader | null,
  campaign: CampaignSave | undefined,
): boolean {
  if (!reader) return false
  const legacy = reader.value('schemaVersion') === undefined
  const entries = legacy
    ? [reader]
    : (reader.array('stages') ?? []).map((value) => JsonObjectReader.from(value))
  return entries.some((entry) => {
    if (!entry || entry.value('journal') === null || entry.value('journal') === undefined)
      return false
    const id = legacy ? 'tower-galleries' : parseCampaignStage(entry.string('id'))
    return id !== null && !campaign?.stages.find((stage) => stage.id === id)?.journal
  })
}
