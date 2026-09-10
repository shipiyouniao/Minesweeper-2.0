import { neighbors } from './engine.js'
import type { ClueBoard } from '../types/clue-isolation.js'

/** A visible clue is isolated only after its safe neighbors are open and flags match its number. */
export function clueIsolated(board: ClueBoard, index: number): boolean {
  const cell = board.game.cells[index]
  if (cell?.visibility !== 'revealed') return false
  const ring = neighbors(board.game.config, index).filter((at) => !board.walls.includes(at))
  return (
    ring.filter((at) => board.game.cells[at]?.visibility === 'flagged').length === cell.adjacent &&
    ring.every((at) => board.game.cells[at]?.visibility !== 'hidden')
  )
}
