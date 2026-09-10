import type { CampSite, StoryScene } from '../types/story.js'

export const STORY_REVISION = 2

/** Symbols author real terrain: # wall, * knot, o open, . covered, S start, E exit, T satchel. */
export const PROLOGUE_SCENES: readonly StoryScene[] = [
  {
    id: 'awakening',
    rows: [
      '#########',
      '###oo####',
      '#Soo*...#',
      '#ooo..oE#',
      '##ooo..##',
      '###ooo###',
      '#########',
    ],
    clue: 12,
    safeClue: 21,
    teachingMine: 22,
    teachingSafe: 31,
  },
  {
    id: 'trail',
    rows: [
      '#########',
      '#oo*oooo#',
      '#So.....#',
      '#oo...*o#',
      '#*o...To#',
      '#ooooooE#',
      '#########',
    ],
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: 31,
  },
  {
    id: 'approach',
    rows: [
      '#########',
      '#ooo*ooo#',
      '#oo...oE#',
      '#So.*.oo#',
      '#oo...oo#',
      '#ooo*ooo#',
      '#########',
    ],
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: null,
  },
]

/** Established camp paths contain no hazards and never reset when a facility is revisited. */
export const CAMP_SCENE: StoryScene = {
  id: 'camp',
  rows: ['#########', '#ooooooo#', '#ooooooo#', '#oooSooo#', '#ooooooo#', '#oooEooo#', '#########'],
  clue: null,
  safeClue: null,
  teachingMine: null,
  teachingSafe: null,
}

export const CAMP_SITES: readonly CampSite[] = [
  { index: 11, destination: 'shop', sprite: 'treasure' },
  { index: 15, destination: 'equipment', sprite: 'workshop' },
  { index: 28, destination: 'professions', sprite: 'player' },
  { index: 34, destination: 'achievements', sprite: 'archive' },
  { index: 47, destination: 'missions', sprite: 'survey-notes' },
  { index: 51, destination: 'guide', sprite: 'guardian-crests' },
  { index: 13, destination: 'road', sprite: 'exit' },
]

/** Persistent overworld approach; the lift is a destination, not a prepared dungeon departure. */
export const NORTH_ROAD_SCENE: StoryScene = {
  id: 'north-road',
  rows: [
    '###########',
    '#oo*oooooo#',
    '#oooo...oo#',
    '#oo..*..oE#',
    '#Soo....oo#',
    '#oo...*ooo#',
    '#o*....ooo#',
    '#ooooooooo#',
    '###########',
  ],
  clue: null,
  safeClue: null,
  teachingMine: null,
  teachingSafe: null,
}

/** Authored outer quarry spaces and the restored lift landing retain their exploration. */
export const QUARRY_SCENES: readonly StoryScene[] = [
  {
    id: 'quarry-yard',
    mechanisms: [{ kind: 'brake', index: 22, gate: 31 }],
    rows: [
      '#########',
      '#Sooo*oo#',
      '#oo.oooo#',
      '####o####',
      '#....oo.#',
      '#.*.oooE#',
      '#########',
    ],
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: null,
  },
  {
    id: 'quarry-passage',
    rows: [
      '#########',
      '#Soo....#',
      '#ooo.*..#',
      '###o#####',
      '#...oo..#',
      '#.*.oooE#',
      '#########',
    ],
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: null,
  },
  {
    id: 'quarry-machine',
    mechanisms: [{ kind: 'winch', index: 13, gate: 30 }],
    rows: [
      '#########',
      '#Soooooo#',
      '#oo.*...#',
      '###o#####',
      '#o*..oT.#',
      '#ooooooo#',
      '####E####',
    ],
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: null,
  },
]
export const TOWER_LANDING_SCENE: StoryScene = {
  id: 'tower-landing',
  rows: ['#########', '#oo..*..#', '#ooo....#', '#SoooooE#', '#ooo....#', '#o*.....#', '#########'],
  clue: null,
  safeClue: null,
  teachingMine: null,
  teachingSafe: null,
}
export const STORY_SCENES: readonly StoryScene[] = [
  ...PROLOGUE_SCENES,
  NORTH_ROAD_SCENE,
  ...QUARRY_SCENES,
  TOWER_LANDING_SCENE,
]

/** Additional north-road doorway; its coordinate is shared by movement and atlas rendering. */
export const QUARRY_GATE = 75
