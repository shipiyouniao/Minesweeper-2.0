import type { MatrixExpedition, MatrixRegion } from '../types/matrix.js'
import type { SurveyKnowledge } from '../types/survey.js'

/** Publish only the active observation clues. */
export function activeRegion(run: MatrixExpedition): MatrixRegion {
  return run.encounter.regions[run.encounter.phase - 1]!
}

/** Count physically collected crystals in this phase. */
export function matrixCharge(run: MatrixExpedition): number {
  return activeRegion(run).indices.filter((index) => run.encounter.collected.includes(index)).length
}

/** Stop burst damage at the next band without an expiring output window. */
export function matrixHealthFloor(run: MatrixExpedition): number {
  return run.encounter.phase === 1 ? Math.ceil(run.encounter.maxHealth / 2) : 0
}

/** Use the run solver's occupancy vocabulary for crystals, never concealed mine identities. */
export function crystalKnowledge(run: MatrixExpedition, index: number): SurveyKnowledge {
  if (run.encounter.collected.includes(index)) return 'mine'

  if (
    run.encounter.empty.includes(index) ||
    run.walls.includes(index) ||
    run.confirmedMines.includes(index)
  )
    return 'safe'

  return run.encounter.notes.includes(index) ? 'mine' : 'unresolved'
}
