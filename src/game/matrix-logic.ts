import { deduceSurveyLine, surveyIndices } from './survey-logic.js'
import type { MatrixExpedition, MatrixPrism } from '../types/matrix.js'
import type { SurveyAxis, SurveyKnowledge, SurveyLine } from '../types/survey.js'

/** Read facts and hypotheses without consulting hidden mine identities or adjacency values. */
export function matrixKnowledge(run: MatrixExpedition, index: number): SurveyKnowledge {
  if (run.confirmedMines.includes(index) || run.game.exploded === index) return 'mine'
  if (
    run.walls.includes(index) ||
    run.surveyedCells.includes(index) ||
    run.game.cells[index]?.visibility === 'revealed'
  )
    return 'safe'
  return run.game.cells[index]?.visibility === 'flagged' ? 'mine' : 'unresolved'
}

/** A completed circuit needs every square accounted for, not merely a matching flag total. */
export function matrixLine(run: MatrixExpedition, axis: SurveyAxis, line: number): SurveyLine {
  const runs = (axis === 'row' ? run.encounter.rows : run.encounter.columns)[line] ?? []
  const indices = surveyIndices(run.game.config, axis, line)
  const facts = indices.map((index) => matrixKnowledge(run, index))
  const conflict = deduceSurveyLine(runs, facts).contradiction
  return {
    runs,
    total: runs.reduce((sum, size) => sum + size, 0),
    flags: facts.filter((fact) => fact === 'mine').length,
    covered: facts.filter((fact) => fact === 'unresolved').length,
    conflict,
    complete: !conflict && facts.every((fact) => fact !== 'unresolved'),
  }
}

/** Resolve the active station from the current health band. */
export function activePrism(run: MatrixExpedition): MatrixPrism {
  return run.encounter.prisms[run.encounter.phase - 1]!
}

/** Stop damage at the next shield circuit so burst builds still play every phase. */
export function matrixHealthFloor(run: MatrixExpedition): number {
  return Math.ceil((run.encounter.maxHealth * (3 - run.encounter.phase)) / 3)
}

/** Quick opening uses line agreements; wrong flags remain risky, and trusted safe cells help. */
export function matrixLineTargets(run: MatrixExpedition, axis: SurveyAxis, line: number): number[] {
  const reading = matrixLine(run, axis, line)
  if (reading.conflict) return []
  const indices = surveyIndices(run.game.config, axis, line)
  const facts = indices.map((index) => matrixKnowledge(run, index))
  const deduction = deduceSurveyLine(reading.runs, facts)
  return indices.filter(
    (index, offset) =>
      !run.walls.includes(index) &&
      run.game.cells[index]?.visibility === 'hidden' &&
      (deduction.cells[offset] === 'safe' || run.game.safeMarks.includes(index)),
  )
}
