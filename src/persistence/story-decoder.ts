import type { JsonValue } from '../types/json.js'
import { STORY_REVISION } from '../game/story-content.js'
import type { StoryAction, StoryProgress, StoryTask } from '../types/story.js'
import { JsonObjectReader } from './json-reader.js'

/** Accept durable task identities without trusting serialized reward amounts. */
function task(value: JsonValue): StoryTask | null {
  return value === 'reach-camp' || value === 'lost-satchel' || value === 'meet-guide' ? value : null
}

/** Decode bounded scene intents; impossible moves are rejected during replay. */
function action(value: JsonValue): StoryAction | null {
  const reader = JsonObjectReader.from(value)
  const type = reader?.string('type')
  if (type === 'continue' || type === 'retry') return { type }
  const index = reader?.number('index') ?? -1
  if (
    (type === 'visit' || type === 'flag' || type === 'inspect') &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < 63
  )
    return { type, index }
  return null
}

/** Recover objectives independently of current content; keep no retired game engines. */
export function decodeStory(value: JsonValue | undefined): StoryProgress | undefined {
  const reader = JsonObjectReader.from(value)
  if (!reader) return undefined
  const completed = [
    ...new Set(
      (reader.array('completed') ?? []).flatMap((v) => {
        const id = task(v)
        return id ? [id] : []
      }),
    ),
  ]
  const claimed = [
    ...new Set(
      (reader.array('claimed') ?? []).flatMap((v) => {
        const id = task(v)
        return id ? [id] : []
      }),
    ),
  ]
  for (const id of claimed) if (!completed.includes(id)) completed.push(id)
  const raw = reader.child('journal')
  const revision = raw?.number('revision') ?? -1
  const validRevision = Number.isInteger(revision) && revision >= 0 && revision <= 1_000_000
  const values = raw?.array('actions')
  const actions = values && values.length <= 3000 ? values.map(action) : null
  const position = reader.number('campPosition') ?? 31
  return {
    arrived: reader.value('arrived') === true || completed.includes('reach-camp'),
    completed,
    claimed,
    campPosition: Number.isInteger(position) && position >= 0 && position < 63 ? position : 31,
    journal:
      raw && validRevision && actions && actions.every((a): a is StoryAction => a !== null)
        ? { revision, actions }
        : raw && validRevision && revision !== STORY_REVISION
          ? { revision, actions: [] }
          : null,
  }
}
