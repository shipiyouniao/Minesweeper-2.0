import { decodeStoryWorld } from './story-world-decoder.js'
import { STORY_FACTS, STORY_TASKS, STORY_CAMPAIGN_METRICS } from '../game/story-quests.js'
import type { JsonValue } from '../types/json.js'
import { STORY_REVISION } from '../game/story-content.js'
import { STORY_DIALOGUE_IDS } from '../game/story-events.js'
import type {
  StoryAction,
  StoryDialogueId,
  StoryProgress,
  StoryTask,
  StoryCampaignMetric,
} from '../types/story.js'
import { JsonObjectReader } from './json-reader.js'

/** Accept durable task identities without trusting serialized reward amounts. */
function task(value: JsonValue): StoryTask | null {
  return STORY_TASKS.find((entry) => entry.id === value)?.id ?? null
}

/** Decode bounded scene intents; impossible moves are rejected during replay. */
function action(value: JsonValue): StoryAction | null {
  const reader = JsonObjectReader.from(value)
  const type = reader?.string('type')
  if (type === 'continue' || type === 'retry' || type === 'return') return { type }

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
  let reader = JsonObjectReader.from(value)
  if (!reader) return undefined

  const source = reader
  const world =
    reader.number('schemaVersion') === 3 || reader.number('schemaVersion') === 4
      ? decodeStoryWorld(reader.child('travel')?.value('world'))
      : null
  if ((reader.number('schemaVersion') === 3 || reader.number('schemaVersion') === 4) && !world)
    return undefined

  if (
    reader.number('schemaVersion') === 2 ||
    reader.number('schemaVersion') === 3 ||
    reader.number('schemaVersion') === 4
  ) {
    const travel = reader.child('travel')
    const quests = reader.child('quests')
    if (!travel || !quests || !reader.child('inventory') || !reader.child('dialogue'))
      return undefined

    reader = JsonObjectReader.from({
      campaignActivity: quests.value('campaignActivity') ?? null,
      facts: quests.value('facts') ?? [],
      arrived: travel.value('campReached') ?? false,
      campPosition: travel.value('campPosition') ?? 31,
      journal: travel.value('activeJournal') ?? null,
      route: travel.value('archivedJournal') ?? null,
      routeLegacy: travel.string('origin') === 'surveyed-legacy',
      accepted: quests.value('accepted') ?? [],
      pinned: quests.value('pinned') ?? [],
      completed: quests.value('completed') ?? [],
      claimed: quests.value('claimed') ?? [],
      mapOwned: source.child('inventory')?.value('mapOwned') ?? false,
    })!
  } else if (reader.value('schemaVersion') !== undefined) return undefined

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
  const accepted = [
    ...new Set([
      ...(reader.array('accepted') ?? []).flatMap((v) => {
        const id = task(v)
        return id ? [id] : []
      }),
      ...completed,
      ...(reader.value('accepted') === undefined &&
      (actions?.length || reader.value('arrived') === true)
        ? ['reach-camp' as const]
        : []),
    ]),
  ]
  const pinned = reader.array('pinned')
  const route = reader.child('route')
  const routeValues = route?.array('actions')
  const routeActions = routeValues && routeValues.length <= 3000 ? routeValues.map(action) : null
  const dialogue = source.child('dialogue')
  const seen: StoryDialogueId[] = dialogue
    ? STORY_DIALOGUE_IDS.filter((id) => dialogue.array('completed')?.includes(id))
    : []
  if (!dialogue) {
    if (accepted.includes('reach-camp')) seen.push('wake')

    if (accepted.includes('lost-satchel')) seen.push('trail')

    if (completed.includes('lost-satchel')) seen.push('satchel')

    if (reader.value('arrived') === true || completed.includes('reach-camp'))
      seen.push('wake', 'flag', 'open', 'travel', 'trail', 'approach', 'arrival')

    if (
      reader.value('mapOwned') === true ||
      (reader.value('mapOwned') === undefined && completed.includes('meet-guide'))
    )
      seen.push('guide')
  }

  const pending = dialogue?.child('active')
  const pendingId = STORY_DIALOGUE_IDS.find((id) => id === pending?.string('id'))
  const beat = pending?.number('beat') ?? -1
  const activity = reader.child('campaignActivity')
  const campaignActivity: Partial<Record<StoryCampaignMetric, number>> = {}
  for (const metric of STORY_CAMPAIGN_METRICS) {
    const amount = activity?.number(metric)
    if (amount !== undefined && amount !== null && Number.isSafeInteger(amount) && amount >= 0)
      campaignActivity[metric] = Math.min(1e9, amount)
  }

  return {
    ...(activity ? { campaignActivity } : {}),
    ...(world ? { world } : {}),
    facts: [
      ...new Set([
        ...STORY_FACTS.filter((id) => reader.array('facts')?.includes(id)),
        ...(completed.includes('reach-camp') ? ['camp-reached' as const] : []),
        ...(completed.includes('lost-satchel')
          ? ['satchel-secured' as const, 'satchel-delivered' as const]
          : []),
        ...(completed.includes('meet-guide') ? ['guide-met' as const] : []),
      ]),
    ],
    dialogue: {
      completed: [...new Set(seen)],
      active:
        pendingId && !seen.includes(pendingId) && Number.isInteger(beat) && beat >= 0 && beat <= 2
          ? { id: pendingId, beat }
          : null,
    },
    ...(route?.number('revision') === STORY_REVISION &&
    routeActions?.every((a): a is StoryAction => a !== null)
      ? { route: { revision: STORY_REVISION, actions: routeActions } }
      : {}),
    ...(reader.value('routeLegacy') === true ? { routeLegacy: true } : {}),
    accepted,
    pinned: pinned
      ? [
          ...new Set(
            pinned.flatMap((v) => {
              const id = task(v)
              return id && accepted.includes(id) && !completed.includes(id) ? [id] : []
            }),
          ),
        ]
      : accepted.filter((id) => !completed.includes(id)),
    mapOwned:
      reader.value('mapOwned') === true ||
      (reader.value('mapOwned') === undefined && completed.includes('meet-guide')),
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
