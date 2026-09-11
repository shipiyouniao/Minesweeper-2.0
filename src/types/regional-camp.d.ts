import type { CampSite, StoryScene } from './story.js'

/** Physical camps share one economy; only their location and residents differ. */
export type RegionalCampId = 'camp' | 'reed-camp'

/** Each region owns its walkable scene, service positions and returning companions. */
export interface RegionalCamp {
  readonly id: RegionalCampId
  readonly scene: StoryScene
  readonly sites: readonly CampSite[]
  readonly nia: number
  readonly toma: number | null
}
