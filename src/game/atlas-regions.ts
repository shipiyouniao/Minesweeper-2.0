import type { AtlasRegion, AtlasRegionId } from '../types/atlas.js'
import type { StoryScene } from '../types/story.js'

/** Only authored regions are named; the remaining world is unsurveyed space, not fake content. */
export const ATLAS_REGIONS: readonly AtlasRegion[] = [
  { id: 'woodland', x: 66, y: 72, width: 18, height: 22, entrance: 'camp' },
  { id: 'reedbank', x: 48, y: 57, width: 18, height: 24, entrance: 'reed-camp' },
]

/** Chapter Two begins beyond the northwest pass; all earlier scenes belong to the woodlands. */
export function atlasRegionForScene(scene: StoryScene['id']): AtlasRegionId {
  return scene === 'reed-camp' ? 'reedbank' : 'woodland'
}
