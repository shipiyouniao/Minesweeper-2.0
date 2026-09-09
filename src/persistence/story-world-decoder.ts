import { STORY_SCENE_IDS, restoreStoryWorld } from '../game/story-checkpoint.js'
import { STORY_REVISION } from '../game/story-content.js'
import { createStoryRun, storyLessonComplete } from '../game/story.js'
import type { JsonValue } from '../types/json.js'
import type { StorySceneCheckpoint, StoryWorldCheckpoint } from '../types/story.js'
import { JsonObjectReader } from './json-reader.js'

/** Reject duplicate or invalid indices rather than silently changing the player's knowledge. */
function indices(value: JsonValue | undefined, size: number): readonly number[] | null {
  if (!Array.isArray(value) || value.length > size) return null
  const result: number[] = []
  for (const index of value) {
    if (
      typeof index !== 'number' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= size ||
      result.includes(index)
    )
      return null
    result.push(index)
  }
  return result
}

/** Validate deltas against the current content without accepting serialized hidden truth. */
function scene(value: JsonValue): StorySceneCheckpoint | null {
  const reader = JsonObjectReader.from(value)
  const id = STORY_SCENE_IDS.find((entry) => entry === reader?.string('id'))
  if (!reader || !id) return null
  const initial = createStoryRun(STORY_SCENE_IDS.indexOf(id))
  const size = initial.board.game.cells.length
  const revealed = indices(reader.value('revealed'), size)
  const flagged = indices(reader.value('flagged'), size)
  const triggered = indices(reader.value('triggered'), size)
  const player = reader.number('player') ?? -1
  const health = reader.number('health') ?? -1
  const phase = reader.string('phase')
  if (
    !revealed ||
    !flagged ||
    !triggered ||
    !Number.isInteger(player) ||
    player < 0 ||
    player >= size ||
    !Number.isInteger(health) ||
    health < 0 ||
    health > 3 ||
    (phase !== 'exploring' && phase !== 'arrived' && phase !== 'fallen') ||
    (phase === 'fallen') !== (health === 0)
  )
    return null
  for (const key of [
    'inspected',
    'practicedFlag',
    'practicedReveal',
    'collected',
    'rescuedSupplies',
  ])
    if (typeof reader.value(key) !== 'boolean') return null
  const cells = initial.board.game.cells
  if (
    revealed.some(
      (index) =>
        initial.board.walls.includes(index) ||
        cells[index]!.mine ||
        cells[index]!.visibility === 'revealed',
    ) ||
    flagged.some(
      (index) =>
        initial.board.walls.includes(index) ||
        cells[index]!.visibility === 'revealed' ||
        revealed.includes(index),
    ) ||
    triggered.some((index) => !cells[index]!.mine || !flagged.includes(index)) ||
    initial.board.walls.includes(player) ||
    cells[player]!.mine ||
    flagged.includes(player) ||
    (cells[player]!.visibility !== 'revealed' && !revealed.includes(player)) ||
    (reader.value('collected') === true &&
      (initial.board.treasure === null ||
        (!revealed.includes(initial.board.treasure) &&
          cells[initial.board.treasure]!.visibility !== 'revealed')))
  )
    return null
  const checkpoint: StorySceneCheckpoint = {
    id,
    player,
    health,
    phase,
    revealed,
    flagged,
    triggered,
    inspected: reader.value('inspected') === true,
    practicedFlag: reader.value('practicedFlag') === true,
    practicedReveal: reader.value('practicedReveal') === true,
    collected: reader.value('collected') === true,
    rescuedSupplies: reader.value('rescuedSupplies') === true,
  }
  if (
    phase === 'arrived' &&
    !(id === 'approach' && player === initial.board.exit) &&
    !(id === 'north-road' && player === initial.board.entrance)
  )
    return null
  const run = restoreStoryWorld({
    revision: STORY_REVISION,
    active: id,
    hasVisited: false,
    scenes: [checkpoint],
  })!
  if (phase === 'arrived' && !storyLessonComplete(run)) return null
  return checkpoint
}

/** Incompatible content keeps only an activity marker for retirement, never an old engine. */
export function decodeStoryWorld(value: JsonValue | undefined): StoryWorldCheckpoint | null {
  const reader = JsonObjectReader.from(value)
  const revision = reader?.number('revision') ?? -1
  const active = reader?.value('active')
  const id = STORY_SCENE_IDS.find((entry) => entry === active)
  if (
    !reader ||
    !Number.isInteger(revision) ||
    revision < 0 ||
    revision > 1_000_000 ||
    (active !== null && !id)
  )
    return null
  if (revision !== STORY_REVISION)
    return { revision, active: id ?? null, hasVisited: false, scenes: [] }
  const values = reader.array('scenes')
  if (
    !values ||
    values.length > STORY_SCENE_IDS.length ||
    typeof reader.value('hasVisited') !== 'boolean'
  )
    return null
  const scenes: StorySceneCheckpoint[] = []
  for (const value of values) {
    const checkpoint = scene(value)
    if (!checkpoint || scenes.some((entry) => entry.id === checkpoint.id)) return null
    scenes.push(checkpoint)
  }
  if (
    id &&
    (!scenes.some((entry) => entry.id === id) ||
      scenes.find((entry) => entry.id === id)!.phase === 'arrived')
  )
    return null
  return { revision, active: id ?? null, hasVisited: reader.value('hasVisited') === true, scenes }
}
