import type { AtlasPlace, AtlasRoute } from '../types/atlas.js'

/** Geographic positions belong to content; presentation selects detail without changing discovery. */
export const ATLAS_PLACES: readonly AtlasPlace[] = [
  { scene: 'awakening', x: 14, y: 78, district: 'woodland', picture: 'tree' },
  { scene: 'trail', x: 32, y: 70, district: 'woodland', picture: 'treasure' },
  { scene: 'approach', x: 43, y: 49, district: 'woodland', picture: 'lantern' },
  { scene: 'camp', x: 56, y: 45, district: 'camp', picture: 'workshop' },
  { scene: 'north-road', x: 74, y: 45, district: 'camp', picture: 'lantern' },
  { scene: 'quarry-yard', x: 89, y: 65, district: 'quarry', picture: 'lantern' },
  { scene: 'quarry-passage', x: 72, y: 82, district: 'quarry', picture: 'lantern' },
  { scene: 'quarry-machine', x: 54, y: 85, district: 'quarry', picture: 'lantern' },
  { scene: 'tower-landing', x: 83, y: 19, district: 'camp', picture: 'lantern' },
  { scene: 'northwest-bridge', x: 50, y: 23, district: 'west', picture: 'lantern' },
  { scene: 'reed-camp', x: 9, y: 14, district: 'west', picture: 'workshop' },
  { scene: 'blockade-pass', x: 25, y: 20, district: 'west', picture: 'lantern' },
]

/** The world chart follows real scene connections; bends keep shortcuts distinct from through roads. */
export const ATLAS_ROUTES: readonly AtlasRoute[] = [
  { from: 'blockade-pass', to: 'reed-camp', via: [{ x: 17, y: 12 }], access: 'northwest' },
  { from: 'awakening', to: 'trail', via: [{ x: 22, y: 79 }] },
  { from: 'trail', to: 'approach', via: [{ x: 39, y: 62 }] },
  { from: 'approach', to: 'camp', via: [] },
  { from: 'camp', to: 'north-road', via: [{ x: 65, y: 42 }], access: 'guide' },
  { from: 'north-road', to: 'quarry-yard', via: [{ x: 84, y: 51 }], access: 'quarry' },
  { from: 'quarry-yard', to: 'quarry-passage', via: [{ x: 86, y: 78 }] },
  { from: 'quarry-passage', to: 'quarry-machine', via: [] },
  {
    from: 'quarry-machine',
    to: 'north-road',
    via: [
      { x: 60, y: 66 },
      { x: 68, y: 59 },
    ],
    access: 'haul',
    oneWay: true,
  },
  { from: 'north-road', to: 'tower-landing', via: [{ x: 77, y: 29 }], access: 'lift' },
  { from: 'north-road', to: 'northwest-bridge', via: [{ x: 66, y: 26 }], access: 'northwest' },
  { from: 'northwest-bridge', to: 'blockade-pass', via: [{ x: 37, y: 17 }], access: 'northwest' },
  {
    from: 'blockade-pass',
    to: 'camp',
    via: [
      { x: 28, y: 36 },
      { x: 47, y: 36 },
    ],
    access: 'northwest',
  },
]
