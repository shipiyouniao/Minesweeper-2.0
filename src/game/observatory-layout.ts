import { placedBoard } from './variant-board.js'
import type { DungeonLayout } from '../types/dungeon-generation.js'
import type { FloorPower } from '../types/floor-power.js'
import type { ObservatoryFloor } from '../types/observatory.js'

/** The safe southern turn on the existing north road becomes a physical stage entrance. */
export const OBSERVATORY_GATE = 86

/** Distinct authored networks: split supply, cascaded selectors, then two separate bearings. */
export const OBSERVATORY_FLOORS: readonly ObservatoryFloor[] = [
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
  const symbols = [...content.rows.join('')]
  const mines = new Set(symbols.flatMap((symbol, index) => (symbol === '*' ? [index] : [])))
  const entrance = symbols.indexOf('S')
  const game = placedBoard(
    {
      width: content.rows[0]!.length,
      height: content.rows.length,
      mines: mines.size,
    },
    mines,
    0,
    entrance,
  )
  return {
    entrance,
    exit: symbols.indexOf('E'),
    treasures: [],
    walls: [
      ...symbols.flatMap((symbol, index) => (symbol === '#' ? [index] : [])),
      ...content.power.doors.map((entry) => entry.index),
    ],
    power: content.power,
    game: {
      ...game,
      phase: 'playing',
      cells: game.cells.map((cell) => ({ ...cell, visibility: 'hidden' })),
    },
  }
}
