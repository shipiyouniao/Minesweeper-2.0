import { neighbors } from './engine.js'
import { revealDungeon } from './dungeon-reveal.js'
import type { Config } from '../types/game.js'
import type { Expedition } from '../types/variants.js'

/** Clip the targeted 3×3 square to the board without wrapping across edges. */
export function probeArea(config: Config, index: number): number[] {
  if (!Number.isInteger(index) || index < 0 || index >= config.width * config.height) return []
  return [index, ...neighbors(config, index)]
}

/** Spend one probe on a clipped square and retain its concise result. */
export function probeDungeon(run: Expedition, index: number): Expedition {
  if (run.probes === 0) return run
  const area = probeArea(run.game.config, index)
  const discovered = inspectArea(run, area)
  if (discovered === run) return run

  return {
    ...discovered,
    probeReport: {
      center: index,
      mines: area.filter((other) => run.game.cells[other]?.mine).length,
    },
    probes: run.probes - 1,
    steps: run.steps + 1,
  }
}

/** Confirm an entire row with one scanner charge, sharing discoveries with probes and shields. */
export function scanDungeon(run: Expedition, row: number): Expedition {
  if (!Number.isInteger(row) || row < 0 || row >= run.game.config.height || run.scans === 0)
    return run
  const area = Array.from(
    { length: run.game.config.width },
    (_, column) => row * run.game.config.width + column,
  )
  const discovered = inspectArea(run, area)
  if (discovered === run) return run

  return {
    ...discovered,
    scannedRows: [...new Set([...run.scannedRows, row])],
    scans: run.scans - 1,
    steps: run.steps + 1,
  }
}

/** Scout the exit neighborhood each floor without spending tools, moving, or collecting loot. */
export function scoutExit(run: Expedition): Expedition {
  const area = probeArea(run.game.config, run.exit)
  const discovered = inspectArea(run, area)
  let game = discovered.game
  for (const index of area) {
    if (!game.cells[index]?.mine && !run.walls.includes(index))
      game = revealDungeon({ ...discovered, game }, index)
  }
  return { ...discovered, game }
}

/** Record shared area knowledge without moving, revealing clues, or changing mine positions. */
export function inspectArea(run: Expedition, area: readonly number[]): Expedition {
  const fresh = area.some(
    (other) =>
      !run.walls.includes(other) &&
      !run.surveyedCells.includes(other) &&
      !run.confirmedMines.includes(other) &&
      run.game.cells[other]?.visibility !== 'revealed',
  )
  if (!fresh) return run

  const mines = area.filter((other) => run.game.cells[other]?.mine)
  const confirmedMines = [...new Set([...run.confirmedMines, ...mines])]
  const surveyedCells = [
    ...new Set([...run.surveyedCells, ...area.filter((other) => !run.walls.includes(other))]),
  ]
  const cells = run.game.cells.map((cell, other) => {
    if (!area.includes(other)) return cell
    if (cell.mine) return { ...cell, visibility: 'flagged' as const }
    // Either tool disproves an ordinary false flag; safe tiles still need normal exploration.
    return cell.visibility === 'flagged' ? { ...cell, visibility: 'hidden' as const } : cell
  })

  return {
    ...run,
    game: { ...run.game, cells },
    confirmedMines,
    surveyedCells,
  }
}
