import { neighbors, pruneSafeMarks } from './engine.js'
import type { Game } from '../types/game.js'
import type { Expedition } from '../types/variants.js'

/** Reveal blank regions without ever revealing wall terrain or changing mine clues. */
export function revealDungeon(run: Expedition, index: number): Game {
  const cells = [...run.game.cells]
  const queue = [index]

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const target = queue[cursor]
    if (target === undefined || run.walls.includes(target)) continue
    const cell = cells[target]
    if (!cell || cell.visibility !== 'hidden') continue
    cells[target] = { ...cell, visibility: 'revealed' }
    if (cell.mine) return pruneSafeMarks({ ...run.game, cells, phase: 'lost', exploded: target })
    if (cell.adjacent === 0) queue.push(...neighbors(run.game.config, target))
  }

  return pruneSafeMarks({ ...run.game, cells, phase: 'playing' })
}
