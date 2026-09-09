import type { CampSite, StoryScene } from '../types/story.js'

export const STORY_REVISION = 1

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
