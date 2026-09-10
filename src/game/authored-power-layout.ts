import { placedBoard } from './variant-board.js'
import type { AuthoredPowerFloor, PowerDungeonLayout } from '../types/floor-power.js'

/** Build fixed terrain and truthful clues; only safe doors change occupancy during play. */
export function authoredPowerLayout(content: AuthoredPowerFloor): PowerDungeonLayout {
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
