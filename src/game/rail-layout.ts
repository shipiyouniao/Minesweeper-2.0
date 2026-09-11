import { placedBoard } from './variant-board.js'
import { RAIL_FLOORS } from './rail-content.js'
import type { AuthoredRailFloor, RailDungeonLayout } from '../types/floor-rail.js'

/** Materialize one literal puzzle. Public rails never replace the ordinary mine/clue layer. */
export function authoredRailLayout(content: AuthoredRailFloor): RailDungeonLayout {
  const symbols = [...content.rows.join('')]
  const mines = new Set(symbols.flatMap((symbol, index) => (symbol === '*' ? [index] : [])))
  const entrance = symbols.indexOf('S')
  const game = placedBoard(
    { width: content.rows[0]!.length, height: content.rows.length, mines: mines.size },
    mines,
    0,
    entrance,
  )

  return {
    entrance,
    exit: symbols.indexOf('E'),
    treasures: [],
    rail: content.rail,
    walls: [
      ...symbols.flatMap((symbol, index) => (symbol === '#' ? [index] : [])),
      ...content.rail.doors.map((door) => door.index),
    ],
    game: {
      ...game,
      phase: 'playing',
      cells: game.cells.map((cell) => ({ ...cell, visibility: 'hidden' })),
    },
  }
}

/** The optional branch owns three authored floors and no random encounter schedule. */
export function railLayout(floor: number): RailDungeonLayout {
  const content = RAIL_FLOORS[floor - 1]
  if (!content) throw new RangeError('Invalid rescue floor')

  return authoredRailLayout(content)
}
