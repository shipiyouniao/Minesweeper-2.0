import { STORY_SCENES, STORY_REVISION } from './story-content.js'
import { buildStoryBoard, createStoryRun } from './story.js'
import type {
  StoryRun,
  StorySceneCheckpoint,
  StorySceneId,
  StorySceneMemory,
  StoryWorldCheckpoint,
} from '../types/story.js'

export const STORY_SCENE_IDS: readonly StorySceneId[] = [
  'awakening',
  'trail',
  'approach',
  'north-road',
  'quarry-yard',
  'quarry-passage',
  'quarry-machine',
  'tower-landing',
  'northwest-bridge',
  'blockade-pass',
]

/** Encode one bounded scene delta rather than each step taken through that scene. */
function sceneCheckpoint(run: StorySceneMemory): StorySceneCheckpoint {
  const initial = createStoryRun(run.floor)
  return {
    id: STORY_SCENE_IDS[run.floor]!,
    operated: run.operated,
    player: run.player,
    health: run.health,
    revealed: run.board.game.cells.flatMap((cell, index) =>
      cell.visibility === 'revealed' && initial.board.game.cells[index]!.visibility !== 'revealed'
        ? [index]
        : [],
    ),
    flagged: run.board.game.cells.flatMap((cell, index) =>
      cell.visibility === 'flagged' ? [index] : [],
    ),
    triggered: run.triggered,
    inspected: run.inspected,
    practicedFlag: run.practicedFlag,
    practicedReveal: run.practicedReveal,
    collected: run.collected,
    rescuedSupplies: run.rescuedSupplies,
    phase: run.phase,
  }
}

/** Camp arrival keeps the route's scene deltas while clearing the active location. */
export function checkpointStory(run: StoryRun): StoryWorldCheckpoint {
  return {
    revision: STORY_REVISION,
    active: run.phase === 'arrived' ? null : STORY_SCENE_IDS[run.floor]!,
    hasVisited: run.visited !== undefined,
    scenes: [...(run.visited ?? []), run].map(sceneCheckpoint),
  }
}

/** Restore only known authored terrain; serialized data cannot replace mines or clue values. */
function restoreScene(saved: StorySceneCheckpoint): StorySceneMemory {
  const floor = STORY_SCENES.findIndex((scene) => scene.id === saved.id)
  const initial = createStoryRun(floor)
  const board = buildStoryBoard(initial.board.scene, saved.operated)
  return {
    ...initial,
    operated: saved.operated,
    player: saved.player,
    health: saved.health,
    triggered: saved.triggered,
    inspected: saved.inspected,
    practicedFlag: saved.practicedFlag,
    practicedReveal: saved.practicedReveal,
    collected: saved.collected,
    rescuedSupplies: saved.rescuedSupplies,
    phase: saved.phase,
    board: {
      ...board,
      game: {
        ...board.game,
        cells: board.game.cells.map((cell, index) => ({
          ...cell,
          visibility: saved.flagged.includes(index)
            ? 'flagged'
            : saved.revealed.includes(index)
              ? 'revealed'
              : cell.visibility,
        })),
      },
    },
  }
}

/** Restore a current location or explicitly reopen a known route from camp. */
export function restoreStoryWorld(world: StoryWorldCheckpoint, id = world.active): StoryRun | null {
  if (world.revision !== STORY_REVISION || id === null) return null
  const scene = world.scenes.find((entry) => entry.id === id)
  if (!scene) return null
  return {
    ...restoreScene(scene),
    ...(world.hasVisited || world.scenes.length > 1
      ? { visited: world.scenes.filter((entry) => entry.id !== id).map(restoreScene) }
      : {}),
  }
}

/** Carry known scene memories into a newly discovered overworld route. */
export function storyWorldScenes(world: StoryWorldCheckpoint): readonly StorySceneMemory[] {
  return world.revision === STORY_REVISION ? world.scenes.map(restoreScene) : []
}
