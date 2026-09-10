import { CAMP_SCENE, PROLOGUE_SCENES, STORY_SCENES } from './story-content.js'
import type { StoryProgress, StoryRun, StoryScene } from '../types/story.js'

/** Camp has a map node but is not a numbered exploration run. */
export const STORY_ATLAS_SCENES: readonly StoryScene[] = [
  ...PROLOGUE_SCENES,
  CAMP_SCENE,
  ...STORY_SCENES.slice(PROLOGUE_SCENES.length),
]

/** Convert a named physical location to its atlas node without assuming campaign floor numbers. */
export function storyAtlasIndex(id: StoryScene['id']): number {
  return STORY_ATLAS_SCENES.findIndex((scene) => scene.id === id)
}

/** Map links and their renderer use one discovery rule, including separately gated new regions. */
export function storyAtlasUnlocked(
  progress: StoryProgress,
  run: StoryRun | null,
  index: number,
): boolean {
  if (!Number.isInteger(index) || index < 0) return false
  const scene = STORY_ATLAS_SCENES[index]
  if (!scene) return false
  if (scene.id === 'northwest-bridge') return !!progress.facts?.includes('west-line-restored')
  if (scene.id === 'blockade-pass') return !!progress.facts?.includes('west-shortcut')
  const explored = Math.max(
    progress.completed.includes('survey-road')
      ? storyAtlasIndex('tower-landing')
      : progress.facts?.includes('lift-discovered')
        ? storyAtlasIndex('quarry-yard')
        : progress.arrived
          ? storyAtlasIndex('camp')
          : 0,
    storyAtlasIndex(run?.board.scene.id ?? 'camp'),
    ...(progress.world?.scenes ?? []).map((entry) => storyAtlasIndex(entry.id)),
  )
  return index <= explored
}
