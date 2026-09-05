import type { Game } from '../types/game.js'
import type { BoardSecondaryAction } from '../types/ui.js'

/** Resolve right-click/hold from visible information; the domain still protects confirmed cells. */
export function secondaryBoardAction(game: Game, index: number): BoardSecondaryAction | null {
  const cell = game.cells[index]
  if (!cell) return null
  if (cell.visibility === 'revealed') return 'chord'
  return cell.visibility === 'flagged' || game.safeMarks.includes(index) ? 'mark-safe' : 'flag'
}
