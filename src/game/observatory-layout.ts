import { authoredPowerLayout } from './authored-power-layout.js'
import type { DungeonLayout } from '../types/dungeon-generation.js'
import type { AuthoredPowerFloor, FloorPower } from '../types/floor-power.js'

/** The safe southern turn on the existing north road becomes a physical stage entrance. */
export const OBSERVATORY_GATE = 86

/** Distinct authored networks: split supply, cascaded selectors, then two separate bearings. */
export const OBSERVATORY_FLOORS: readonly AuthoredPowerFloor[] = [
  {
    rows: [
      '###########',
      '#*.*#.....#',
      '#.O.#.*E..#',
      '#...#....*#',
      '##A###B####',
      '#....J....#',
      '#..*.*..*.#',
      '#S........#',
      '###########',
    ],
    power: {
      purpose: 'observation',
      junctions: [{ index: 60, input: null, selected: null }],
      doors: [
        { index: 46, input: { junction: 60, branch: 0 } },
        { index: 50, input: { junction: 60, branch: 1 } },
      ],
      receivers: [{ index: 24, input: { junction: 60, branch: 0 }, recorded: false }],
    },
  },
  {
    rows: [
      '###########',
      '#..*#....*#',
      '#.O.#..E..#',
      '#...#.*...#',
      '##C#####D##',
      '#..*K.....#',
      '#*......*.#',
      '#.........#',
      '#####A#####',
      '#....J....#',
      '#.*...*..S#',
      '#.........#',
      '###########',
    ],
    power: {
      purpose: 'observation',
      junctions: [
        { index: 104, input: null, selected: null },
        { index: 59, input: { junction: 104, branch: 0 }, selected: null },
      ],
      doors: [
        { index: 93, input: { junction: 104, branch: 0 } },
        { index: 46, input: { junction: 59, branch: 0 } },
        { index: 52, input: { junction: 59, branch: 1 } },
      ],
      receivers: [{ index: 24, input: { junction: 59, branch: 0 }, recorded: false }],
    },
  },
  {
    rows: [
      '#############',
      '#....#......#',
      '#.O..#..*...#',
      '#*...#..P...#',
      '###A###B#####',
      '#*....J.....#',
      '#.......*...#',
      '#.S...K.....#',
      '######C######',
      '#.*.......*.#',
      '#.....E.....#',
      '#############',
    ],
    power: {
      purpose: 'observation',
      junctions: [
        { index: 71, input: null, selected: null },
        { index: 97, input: { junction: 71, branch: 1 }, selected: null },
      ],
      doors: [
        { index: 55, input: { junction: 71, branch: 0 } },
        { index: 59, input: { junction: 97, branch: 0 } },
        { index: 110, input: { junction: 97, branch: 1 } },
      ],
      receivers: [
        { index: 28, input: { junction: 71, branch: 0 }, recorded: false },
        { index: 47, input: { junction: 97, branch: 0 }, recorded: false },
      ],
    },
  },
]

/** Rebuild hidden hazards and routing from authored data; saves contain only player intents. */
export function observatoryLayout(floor: number): DungeonLayout & { readonly power: FloorPower } {
  const content = OBSERVATORY_FLOORS[floor - 1]
  if (!content) throw new RangeError('Unknown observatory floor')

  return authoredPowerLayout(content)
}
