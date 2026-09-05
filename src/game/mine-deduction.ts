import { neighbors } from './engine.js'
import type { Game } from '../types/game.js'
import type { MineConstraint, MineDeduction } from '../types/combat-build.js'

/** Read revealed clues and public flags only; covered mine bits never enter deduction. */
export function deduceMines(game: Game, walls: readonly number[]): MineDeduction {
  const constraints: MineConstraint[] = []
  for (let index = 0; index < game.cells.length; index++) {
    const cell = game.cells[index]
    if (!cell || cell.visibility !== 'revealed' || walls.includes(index)) continue
    const ring = neighbors(game.config, index).filter((other) => !walls.includes(other))
    const hidden = ring.filter((other) => game.cells[other]?.visibility === 'hidden')
    const flagged = ring.filter((other) => game.cells[other]?.visibility === 'flagged').length
    if (hidden.length) constraints.push({ cells: hidden, mines: cell.adjacent - flagged })
  }
  const safe = new Set<number>()
  const mines = new Set<number>()
  for (const constraint of constraints) collect(constraint, safe, mines)

  // Subtract nested clue sets, e.g. {a,b}=1 and {a,b,c}=1 proves c safe.
  for (const small of constraints) {
    for (const large of constraints) {
      if (
        small.cells.length >= large.cells.length ||
        !small.cells.every((index) => large.cells.includes(index))
      )
        continue
      collect(
        {
          cells: large.cells.filter((index) => !small.cells.includes(index)),
          mines: large.mines - small.mines,
        },
        safe,
        mines,
      )
    }
  }
  return { safe: [...safe], mines: [...mines] }
}

/** Accept only all-safe or all-mine consequences of a valid finite constraint. */
function collect(constraint: MineConstraint, safe: Set<number>, mines: Set<number>): void {
  if (constraint.mines === 0) for (const index of constraint.cells) safe.add(index)
  else if (constraint.mines === constraint.cells.length)
    for (const index of constraint.cells) mines.add(index)
}
