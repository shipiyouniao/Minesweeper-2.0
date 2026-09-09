import { EXPEDITION_RULES_REVISION } from './expedition-format.js'
import { STORY_REVISION } from '../game/story-content.js'
import { decodeStoryWorld } from './story-world-decoder.js'
import type { LegacyStorySaveData, StoryProgress, StorySaveData } from '../types/story.js'
import { JsonObjectReader, parseJson } from './json-reader.js'

/** Refuse destructive downgrades and incomplete versioned envelopes before any write. */
export function storyEnvelopeStatus(text: string | null): 'supported' | 'unsupported' | 'invalid' {
  if (text === null) return 'supported'
  const envelope = JsonObjectReader.from(parseJson(text))
  if (!envelope) return 'invalid'
  const campaign = envelope.child('campaign')?.child('journal')
  if (
    campaign &&
    (!['tower-road-v1', 'tower-road-v2', 'tower-road-v3', 'tower-road-v4'].includes(
      campaign.child('departure')?.string('campaign') ?? '',
    ) ||
      (campaign.number('rulesRevision') ?? 0) > EXPEDITION_RULES_REVISION)
  )
    return 'unsupported'
  const story = envelope.child('story')
  if (!story || story.value('schemaVersion') === undefined) return 'supported'
  if (story.number('schemaVersion') !== 2 && story.number('schemaVersion') !== 3)
    return 'unsupported'
  if (
    story.number('schemaVersion') === 3 &&
    (story.child('travel')?.child('world')?.number('revision') ?? -1) > STORY_REVISION
  )
    return 'unsupported'
  if (
    story.number('schemaVersion') === 3 &&
    !decodeStoryWorld(story.child('travel')?.value('world'))
  )
    return 'invalid'
  return story.child('travel') &&
    story.child('quests') &&
    story.child('inventory') &&
    story.child('dialogue')
    ? 'supported'
    : 'invalid'
}

/** Store one authoritative travel history, keeping narrative and rewards in separate sections. */
export function encodeStory(progress: StoryProgress): StorySaveData {
  const legacy: LegacyStorySaveData = {
    schemaVersion: 2,
    travel: {
      campReached: progress.arrived,
      campPosition: progress.campPosition,
      activeJournal: progress.journal,
      archivedJournal: progress.route ?? null,
      origin: progress.routeLegacy ? 'surveyed-legacy' : 'prologue',
    },
    quests: {
      ...(progress.campaignActivity ? { campaignActivity: progress.campaignActivity } : {}),
      facts: progress.facts ?? [],
      accepted: progress.accepted ?? [],
      pinned: progress.pinned ?? [],
      completed: progress.completed,
      claimed: progress.claimed,
    },
    inventory: { mapOwned: progress.mapOwned ?? false },
    dialogue: progress.dialogue ?? { completed: [], active: null },
  }
  return progress.world
    ? {
        schemaVersion: 3,
        travel: {
          campReached: progress.arrived,
          campPosition: progress.campPosition,
          world: progress.world,
        },
        quests: legacy.quests,
        inventory: legacy.inventory,
        dialogue: legacy.dialogue,
      }
    : legacy
}
