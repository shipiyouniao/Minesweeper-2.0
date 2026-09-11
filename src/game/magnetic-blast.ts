import { neighbors, pruneSafeMarks } from './engine.js'
import type { MagneticExpedition } from '../types/magnetic.js'

/** Destroy mines and terrain in one blast; ordinary player mine hits keep their existing rules. */
export function blastMagnetic(run: MagneticExpedition, anchor: number): MagneticExpedition {
  const area = new Set([anchor, ...neighbors(run.game.config, anchor)])
  const detonated = run.game.cells.flatMap((cell, index) =>
    area.has(index) && cell.mine ? [index] : [],
  )
  const cleared = run.game.cells.map((cell, index) =>
    area.has(index) ? { ...cell, mine: false, visibility: 'revealed' as const } : cell,
  )
  const cells = cleared.map((cell, index) => ({
    ...cell,
    adjacent: neighbors(run.game.config, index).filter((other) => cleared[other]?.mine).length,
  }))

  return {
    ...run,
    game: pruneSafeMarks({
      ...run.game,
      config: { ...run.game.config, mines: run.game.config.mines - detonated.length },
      cells,
    }),
    walls: run.walls.filter((index) => !area.has(index) || index === run.encounter.boss),
    confirmedMines: run.confirmedMines.filter((index) => !area.has(index)),
    triggeredMines: run.triggeredMines.filter((index) => !area.has(index)),
    surveyedCells: [...new Set([...run.surveyedCells, ...area])],
    probeReport: null,
    encounter: {
      ...run.encounter,
      // Keep already earned discovery progress without retaining red mine markers on safe floor.
      priorDiscoveries:
        run.encounter.priorDiscoveries +
        run.confirmedMines.filter((index) => area.has(index)).length,
      craters: [...new Set([...run.encounter.craters, ...detonated])],
    },
  }
}
