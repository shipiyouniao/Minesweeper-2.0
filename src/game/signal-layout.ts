import { placedBoard } from './variant-board.js'
import type { DungeonLayout } from '../types/dungeon-generation.js'
import type { FloorCircuits } from '../types/floor-circuits.js'

/** Authored maps: # masonry, R/G and P/J relay-gate pairs, O/H optional pair, B record. */
export const SIGNAL_FLOORS: readonly (readonly string[])[] = [
  [
    '....#....',
    '.S..#..*.',
    '...*#....',
    '..R.#.*..',
    '.*..G....',
    '....#...*',
    '..*.#....',
    '....#..E.',
    '*...#.*..',
  ],
  [
    '..#*.....',
    '.B#.O..S.',
    '..H..R...',
    '*.#...*..',
    '####G####',
    '.........',
    '*....*...',
    '.E.....*.',
    '...*.....',
  ],
  [
    '....#..S.',
    '....#....',
    '.*..#*...',
    '..P.#.R..',
    '*...G..*.',
    '#J###....',
    '....#.*..',
    '.E..#....',
    '....#...*',
  ],
]

/** Circuit definitions are ordinary floor components and do not depend on campaign UI. */
export function signalLayout(floor: number): DungeonLayout & { readonly circuits: FloorCircuits } {
  const rows = SIGNAL_FLOORS[floor - 1]
  if (!rows) throw new RangeError('Unknown signal floor')

  const symbols = [...rows.join('')]
  const mines = new Set(symbols.flatMap((symbol, index) => (symbol === '*' ? [index] : [])))
  const entrance = symbols.indexOf('S')
  const game = placedBoard({ width: 9, height: 9, mines: mines.size }, mines, 0, entrance)
  const relays = [
    { index: symbols.indexOf('R'), gate: symbols.indexOf('G'), optional: false, active: true },
  ]
  if (symbols.includes('O'))
    relays.push({
      index: symbols.indexOf('O'),
      gate: symbols.indexOf('H'),
      optional: true,
      active: true,
    })

  if (symbols.includes('P'))
    relays.push({
      index: symbols.indexOf('P'),
      gate: symbols.indexOf('J'),
      optional: false,
      active: true,
    })

  return {
    game: {
      ...game,
      phase: 'playing',
      cells: game.cells.map((cell) => ({ ...cell, visibility: 'hidden' })),
    },
    entrance,
    exit: symbols.indexOf('E'),
    walls: symbols.flatMap((symbol, index) =>
      ['#', 'G', 'H', 'J'].includes(symbol) ? [index] : [],
    ),
    treasures: [],
    circuits: { relays, record: floor === 2 ? symbols.indexOf('B') : null, recordTaken: false },
  }
}
