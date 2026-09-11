import { northwestPortals } from './northwest-world.js'
import { storyAtlasIndex, storyAtlasUnlocked } from './story-atlas.js'
import {
  canEnterNorthRoad,
  canEnterQuarry,
  canUseHaulTrack,
  canUseStoryLift,
} from './story-world-access.js'
import type { AtlasRoute, AtlasRouteState } from '../types/atlas.js'
import type { StoryProgress, StoryRun } from '../types/story.js'

/** Route ink reflects the same gates as physical travel, without revealing an undiscovered place. */
export function atlasRouteState(
  route: AtlasRoute,
  progress: StoryProgress,
  run: StoryRun | null,
): AtlasRouteState {
  if (
    ![route.from, route.to].every((scene) =>
      storyAtlasUnlocked(progress, run, storyAtlasIndex(scene)),
    )
  )
    return 'uncharted'

  let open: boolean
  switch (route.access) {
    case 'guide':
      open = canEnterNorthRoad(progress)
      break
    case 'quarry':
      open = canEnterQuarry(progress)
      break
    case 'lift':
      open = canUseStoryLift(progress)
      break
    case 'haul': {
      const machine =
        run?.board.scene.id === 'quarry-machine'
          ? run
          : progress.world?.scenes.find((scene) => scene.id === 'quarry-machine')
      open = !!machine && canUseHaulTrack(machine.collected, machine.operated)
      break
    }
    case 'northwest':
      open = northwestPortals(route.from, progress).some(
        (portal) => portal.destination === route.to,
      )
      break
    default:
      open = true
  }

  return open ? 'open' : 'closed'
}
