import type { RegionalCamp, RegionalCampId } from '../types/regional-camp.js'
import type { StoryProgress, StoryScene, CampSite } from '../types/story.js'

export const RECOLLECTION_LANTERN_CELL = 49
export const REED_CAMP_GATE = 102

/** Established paths remain safe when a shop or a neighboring region is revisited. */
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

/** The western camp has an open bank and a pier, rather than a second copy of the forest. */
export const REED_CAMP: RegionalCamp = {
  id: 'reed-camp',
  scene: {
    id: 'reed-camp',
    rows: [
      '#############',
      '#ooooooooooo#',
      '#ooooooo#####',
      '#ooooooooooo#',
      '#ooooooooooo#',
      '#ooooooooooo#',
      '#ooooooo#####',
      '#ooooSoooooE#',
      '#############',
    ],
    water: [35, 36, 37, 38, 87, 88, 89, 90],
    bridge: [48, 49, 50],
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: null,
  },
  sites: [
    { index: 15, destination: 'shop', sprite: 'treasure' },
    { index: 19, destination: 'equipment', sprite: 'workshop' },
    { index: 41, destination: 'professions', sprite: 'player' },
    { index: 45, destination: 'achievements', sprite: 'archive' },
    { index: 69, destination: 'missions', sprite: 'survey-notes' },
    { index: RECOLLECTION_LANTERN_CELL, destination: 'recollection', sprite: 'archive' },
  ],
  nia: 71,
  toma: null,
}

const FOREST_CAMP: RegionalCamp = {
  id: 'camp',
  scene: CAMP_SCENE,
  sites: CAMP_SITES,
  nia: 33,
  toma: 29,
}

/** Save decoding and world portals accept only explicitly authored safe camps. */
export function isRegionalCamp(id: string): id is RegionalCampId {
  return id === 'camp' || id === 'reed-camp'
}

/** One catalog supplies the board, physical facilities and atlas landmarks. */
export function regionalCamp(id: RegionalCampId = 'camp'): RegionalCamp {
  return id === 'reed-camp' ? REED_CAMP : FOREST_CAMP
}

/** Resident obstacles are shared by rendering and pathfinding, never guessed by the view. */
export function campResidents(progress: StoryProgress, hasNia: boolean): readonly number[] {
  const camp = regionalCamp(progress.campId)
  if (camp.id === 'reed-camp') return [camp.nia]

  return [
    51,
    ...(hasNia ? [camp.nia] : []),
    ...(progress.facts?.includes('toma-rescued') && camp.toma !== null ? [camp.toma] : []),
  ]
}
