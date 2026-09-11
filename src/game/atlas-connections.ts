import { CAMP_SITES, QUARRY_GATE } from './story-content.js'
import { northwestPortals } from './northwest-world.js'
import { storyAtlasIndex } from './story-atlas.js'
import type { StoryProgress, StoryScene } from '../types/story.js'

/** Resolve named map exits without deriving geography from an array's insertion order. */
export function atlasDestination(
  scene: StoryScene,
  index: number,
  progress: StoryProgress,
): number | null {
  const portal = northwestPortals(scene.id, progress).find((entry) => entry.index === index)
  if (portal) return storyAtlasIndex(portal.destination)

  const terrain = scene.rows.join('')[index]
  const entrance = terrain === 'S'
  const exit = terrain === 'E'
  let destination: StoryScene['id'] | null = null
  switch (scene.id) {
    case 'awakening':
      if (exit) destination = 'trail'
      break
    case 'trail':
      destination = exit ? 'approach' : entrance ? 'awakening' : null
      break
    case 'approach':
      destination = exit ? 'camp' : entrance ? 'trail' : null
      break
    case 'camp':
      destination = CAMP_SITES.some((site) => site.index === index && site.destination === 'road')
        ? 'north-road'
        : exit
          ? 'approach'
          : null
      break
    case 'north-road':
      destination =
        index === QUARRY_GATE ? 'quarry-yard' : exit ? 'tower-landing' : entrance ? 'camp' : null
      break
    case 'quarry-yard':
      destination = entrance ? 'north-road' : exit ? 'quarry-passage' : null
      break
    case 'quarry-passage':
      destination = entrance ? 'quarry-yard' : exit ? 'quarry-machine' : null
      break
    case 'quarry-machine':
      destination = entrance ? 'quarry-passage' : exit ? 'north-road' : null
      break
    case 'tower-landing':
      if (entrance) destination = 'north-road'
      break
  }

  return destination === null ? null : storyAtlasIndex(destination)
}
