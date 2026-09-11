import type { StoryProgress } from '../types/story.js'

/** The guide supplies the map before the camp's northern road becomes available. */
export function canEnterNorthRoad(progress: StoryProgress): boolean {
  return !!progress.mapOwned && progress.completed.includes('meet-guide')
}

/** The quarry branch opens when its repair task has been accepted. */
export function canEnterQuarry(progress: StoryProgress): boolean {
  return !!progress.accepted?.includes('repair-lift')
}

/** Riding the lift waits for both its physical repair and the completed repair conversation. */
export function canUseStoryLift(progress: StoryProgress): boolean {
  return !!(
    progress.facts?.includes('spindle-secured') &&
    progress.facts.includes('lift-restored') &&
    progress.dialogue?.completed.includes('lift-repaired')
  )
}

/** The return haul track opens only after the winch is operated and the spindle collected. */
export function canUseHaulTrack(collected: boolean, operated: readonly number[]): boolean {
  return collected && operated.length > 0
}
