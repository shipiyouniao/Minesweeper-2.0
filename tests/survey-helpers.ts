import { actSurvey, surveyKnowledge } from '../src/game/survey.js'
import { deduceSurvey } from '../src/game/survey-logic.js'
import type { Survey } from '../src/types/survey.js'

/** Play only consequences of published runs and open cells; this helper cannot inspect mine bits. */
export function solveSurvey(start: Survey): Survey {
  const deduction = deduceSurvey(
    start.game.config,
    start.rows,
    start.columns,
    start.game.cells.map(surveyKnowledge),
  )
  let state = start
  for (const [index, value] of deduction.cells.entries()) {
    if (state.game.cells[index]?.visibility !== 'hidden') continue
    if (value === 'mine') state = actSurvey(state, { type: 'flag', index })
    if (value === 'safe') state = actSurvey(state, { type: 'reveal', index })
  }
  return state
}
