import type { Game } from '../types/game.js'
import type { Expedition } from '../types/variants.js'
import type { MirrorRoom, MirrorSide } from '../types/mirror.js'

/** Return the opposite realm without mixing realm identity with DOM board slots. */
export function oppositeMirror(side: MirrorSide): MirrorSide {
  return side === 'dawn' ? 'dusk' : 'dawn'
}

/** Snapshot room-local state only; switching never restores spent resources or triggers. */
export function mirrorRoom(run: Expedition): MirrorRoom {
  return {
    game: run.game,
    walls: run.walls,
    player: run.player,
    travelled: run.travelled,
    confirmedMines: run.confirmedMines,
    triggeredMines: run.triggeredMines,
    surveyedCells: run.surveyedCells,
    scannedRows: run.scannedRows,
    probeReport: run.probeReport,
  }
}

/** Count unique discoveries in both realms so switching cannot manufacture a relic reward. */
export function roomDiscoveries(run: Expedition): number {
  return (
    run.confirmedMines.length +
    (run.encounter?.kind === 'mirror' ? run.encounter.other.confirmedMines.length : 0)
  )
}

/** Count both parked routes, excluding each realm's initial square. */
export function roomTravel(run: Expedition): number {
  return (
    Math.max(0, run.travelled.length - 1) +
    (run.encounter?.kind === 'mirror' ? Math.max(0, run.encounter.other.travelled.length - 1) : 0)
  )
}

/** A confirmed mine proves its counterpart safe; ordinary flags never grant information. */
export function shareMirrorKnowledge(run: Expedition): Expedition {
  const encounter = run.encounter
  if (encounter?.kind !== 'mirror') return run
  const other = encounter.other
  const activeSafe = other.confirmedMines.filter(
    (index) => !run.walls.includes(index) && !run.surveyedCells.includes(index),
  )
  const otherSafe = run.confirmedMines.filter(
    (index) => !other.walls.includes(index) && !other.surveyedCells.includes(index),
  )
  if (!activeSafe.length && !otherSafe.length) return run

  return {
    ...run,
    surveyedCells: [...run.surveyedCells, ...activeSafe],
    game: clearSafeFlags(run.game, activeSafe),
    encounter: {
      ...encounter,
      other: {
        ...other,
        surveyedCells: [...other.surveyedCells, ...otherSafe],
        game: clearSafeFlags(other.game, otherSafe),
      },
    },
  }
}

/** Correct contradicted ordinary flags without revealing a covered safe cell's clue. */
function clearSafeFlags(game: Game, safe: readonly number[]): Game {
  return {
    ...game,
    safeMarks: game.safeMarks.filter((index) => !safe.includes(index)),
    cells: game.cells.map((cell, index) =>
      safe.includes(index) && cell.visibility === 'flagged'
        ? { ...cell, visibility: 'hidden' }
        : cell,
    ),
  }
}
