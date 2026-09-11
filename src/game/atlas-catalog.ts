import type { AtlasPlace, AtlasRegion } from '../types/atlas.js'

/** Later chapter regions use the same placement contract as the first chapter's woodland. */
export const WOODLAND_REGION: AtlasRegion = { id: 'woodland', x: 4, y: 23, width: 44, height: 67 }

/** Geographic positions belong to content; presentation selects detail without changing discovery. */
export const ATLAS_PLACES: readonly AtlasPlace[] = [
  { scene: 'awakening', x: 17, y: 73, district: 'woodland', picture: 'tree' },
  { scene: 'trail', x: 38, y: 48, district: 'woodland', picture: 'treasure' },
  { scene: 'approach', x: 61, y: 66, district: 'woodland', picture: 'lantern' },
  { scene: 'camp', x: 65, y: 30, district: 'camp', picture: 'workshop' },
  { scene: 'north-road', x: 81, y: 47, district: 'camp', picture: 'lantern' },
  { scene: 'quarry-yard', x: 90, y: 64, district: 'quarry', picture: 'lantern' },
  { scene: 'quarry-passage', x: 75, y: 81, district: 'quarry', picture: 'lantern' },
  { scene: 'quarry-machine', x: 53, y: 87, district: 'quarry', picture: 'lantern' },
  { scene: 'tower-landing', x: 88, y: 14, district: 'camp', picture: 'lantern' },
  { scene: 'northwest-bridge', x: 42, y: 23, district: 'west', picture: 'lantern' },
  { scene: 'blockade-pass', x: 21, y: 18, district: 'west', picture: 'lantern' },
]
