import type { StoryProgress, StorySaveData } from '../types/story.js'
import { JsonObjectReader, parseJson } from './json-reader.js'

/** Refuse destructive downgrades and incomplete versioned envelopes before any write. */
export function storyEnvelopeStatus(text: string | null): 'supported' | 'unsupported' | 'invalid' {
  if (text === null) return 'supported'
  const envelope = JsonObjectReader.from(parseJson(text))
  if (!envelope) return 'invalid'
  const story = envelope.child('story')
  if (!story || story.value('schemaVersion') === undefined) return 'supported'
  if (story.number('schemaVersion') !== 2) return 'unsupported'
  return story.child('travel') &&
    story.child('quests') &&
    story.child('inventory') &&
    story.child('dialogue')
    ? 'supported'
    : 'invalid'
}

/** Store one authoritative travel history, keeping narrative and rewards in separate sections. */
export function encodeStory(progress: StoryProgress): StorySaveData {
  return {
    schemaVersion: 2,
    travel: {
      campReached: progress.arrived,
      campPosition: progress.campPosition,
      activeJournal: progress.journal,
      archivedJournal: progress.route ?? null,
      origin: progress.routeLegacy ? 'surveyed-legacy' : 'prologue',
    },
    quests: {
      facts: progress.facts ?? [],
      accepted: progress.accepted ?? [],
      pinned: progress.pinned ?? [],
      completed: progress.completed,
      claimed: progress.claimed,
    },
    inventory: { mapOwned: progress.mapOwned ?? false },
    dialogue: progress.dialogue ?? { completed: [], active: null },
  }
}
