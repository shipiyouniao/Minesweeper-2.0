import { neighbors } from './engine.js'
import type { Cell, Game } from '../types/game.js'

/** Open the public arena lanes and propagate every revealed zero through its safe neighbors. */
export function openArena(
  placed: Game,
  walls: readonly number[],
  ringCells: ReadonlySet<number>,
): Game {
  const cells: Cell[] = placed.cells.map((cell) => ({ ...cell, visibility: 'hidden' }))
  const queue = cells.flatMap((_, index) =>
    !ringCells.has(index) && !walls.includes(index) ? [index] : [],
  )
  const visited = new Set<number>()
  for (const index of queue) {
    const cell = cells[index]
    if (!cell || cell.mine || walls.includes(index) || visited.has(index)) continue
    visited.add(index)
    cells[index] = { ...cell, visibility: 'revealed' }
    // Rings are excluded only from direct reveal seeds, not from ordinary blank expansion.
    // Safe ring cells may open; mines always remain covered until a player earns information.
    if (cell.adjacent === 0) queue.push(...neighbors(placed.config, index))
  }
  return { ...placed, cells, phase: 'playing' }
}
