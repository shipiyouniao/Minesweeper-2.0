import type { StoryScene, StoryProgress } from '../types/story.js'
import type { WorldPortal } from '../types/world-route.js'

export const WEST_ROAD_GATE = 12
export const WEST_CAMP_GATE = 19
export const PASS_SHORTCUT = 92
export const BASTION_GATE = 16

/** The old bridge is an actual persistent scene west of the tower road, with a single river crossing. */
export const NORTHWEST_SCENES: readonly StoryScene[] = [
  {
    id: 'northwest-bridge',
    rows: [
      '#############',
      '#Eoo..#.....#',
      '#oo*..#..*..#',
      '#ooooo#ooooo#',
      '#..ooo#ooo..#',
      '#ooooooooooo#',
      '#..ooo#ooo..#',
      '#..*..#o.*..#',
      '#ooooo#ooooo#',
      '#ooooo#ooooS#',
      '#############',
    ],
    water: [19, 32, 45, 58, 84, 97, 110, 123],
    bridge: [70, 71, 72],
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: null,
  },
  {
    id: 'blockade-pass',
    rows: [
      '#############',
      '#ooEoooo....#',
      '#ooo..oo.*..#',
      '#o*..ooo....#',
      '#oooooo####o#',
      '#..*ooooooo.#',
      '#......o*ooo#',
      '#ooooooooooS#',
      '#############',
    ],
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: null,
  },
]

/** The shortcut unlocks by crossing the bridge, never by clicking the atlas. */
export const NORTHWEST_PORTALS: readonly WorldPortal[] = [
  {
    scene: 'north-road',
    index: WEST_ROAD_GATE,
    destination: 'northwest-bridge',
    arrival: 128,
    requires: 'west-line-restored',
  },
  {
    scene: 'northwest-bridge',
    index: 128,
    destination: 'north-road',
    arrival: WEST_ROAD_GATE,
    requires: 'west-line-restored',
  },
  {
    scene: 'northwest-bridge',
    index: 14,
    destination: 'blockade-pass',
    arrival: 102,
    requires: 'west-line-restored',
    outcome: 'west-shortcut',
  },
  {
    scene: 'blockade-pass',
    index: 102,
    destination: 'northwest-bridge',
    arrival: 14,
    requires: 'west-line-restored',
  },
  {
    scene: 'blockade-pass',
    index: PASS_SHORTCUT,
    destination: 'camp',
    arrival: WEST_CAMP_GATE,
    requires: 'west-shortcut',
  },
  {
    scene: 'camp',
    index: WEST_CAMP_GATE,
    destination: 'blockade-pass',
    arrival: PASS_SHORTCUT,
    requires: 'west-shortcut',
  },
]

/** Rendering and movement share the same unlock condition and never consult covered mine truth. */
export function northwestPortals(
  scene: StoryScene['id'],
  progress: StoryProgress,
): readonly WorldPortal[] {
  return NORTHWEST_PORTALS.filter(
    (portal) => portal.scene === scene && progress.facts?.includes(portal.requires),
  )
}
