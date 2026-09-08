import { actSurvey, surveyLine } from '../src/game/survey.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import type { Survey } from '../src/types/survey.js'

/** A deliberately limited public-information player for reproducible preset sampling. */
export function solveSurvey(start: Survey, useLines: boolean): Survey {
  let state = start
  while (state.game.phase === 'playing') {
    const before = state
    const deduction = deduceMines(state.game, [])
    const safe = new Set(deduction.safe)
    const mines = new Set(deduction.mines)

    // Use only all-safe/all-mine line consequences; never inspect a covered mine or clue.
    if (useLines) {
      for (const axis of ['row', 'column'] as const) {
        const { width, height } = state.game.config
        const count = axis === 'row' ? height : width
        for (let line = 0; line < count; line++) {
          const reading = surveyLine(state, axis, line)
          if (reading.total === null) continue
          const targets = state.game.cells.flatMap((cell, index) =>
            cell.visibility === 'hidden' &&
            (axis === 'row' ? Math.floor(index / width) : index % width) === line
              ? [index]
              : [],
          )
          const remaining = reading.total - reading.flags
          if (remaining === 0) for (const index of targets) safe.add(index)
          if (remaining === targets.length) for (const index of targets) mines.add(index)
        }
      }
    }

    for (const index of mines) state = actSurvey(state, { type: 'flag', index })
    for (const index of safe) state = actSurvey(state, { type: 'reveal', index })
    if (state === before) break
  }
  return state
}
