import { neighbors } from './engine.js'
import type { Config } from '../types/game.js'
import type { Expedition } from '../types/variants.js'

/** Clip the targeted 3×3 square to the board without wrapping across edges. */
export function probeArea(config: Config, index: number): number[] {
  if (!Number.isInteger(index) || index < 0 || index >= config.width * config.height) return []
  return [index, ...neighbors(config, index)]
}

/** Record area truth without moving the player, revealing clues, or changing mine positions. */
export function probeDungeon(run: Expedition, index: number): Expedition {
  const area = probeArea(run.game.config, index)
  const fresh = area.some(
    (other) =>
      !run.walls.includes(other) &&
      !run.probedCells.includes(other) &&
      !run.confirmedMines.includes(other) &&
      run.game.cells[other]?.visibility !== 'revealed',
  )
  if (run.probes === 0 || !fresh) return run

  const mines = area.filter((other) => run.game.cells[other]?.mine)
  const confirmedMines = [...new Set([...run.confirmedMines, ...mines])]
  const probedCells = [
    ...new Set([...run.probedCells, ...area.filter((other) => !run.walls.includes(other))]),
  ]
  const cells = run.game.cells.map((cell, other) => {
    if (!area.includes(other)) return cell
    if (cell.mine) return { ...cell, visibility: 'flagged' as const }
    // A probe disproves an ordinary false flag; safe tiles still need normal exploration.
    return cell.visibility === 'flagged' ? { ...cell, visibility: 'hidden' as const } : cell
  })

  return {
    ...run,
    game: { ...run.game, cells },
    confirmedMines,
    probedCells,
    probeReport: { center: index, mines: mines.length },
    probes: run.probes - 1,
    steps: run.steps + 1,
  }
}
