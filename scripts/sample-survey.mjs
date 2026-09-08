import { createSurvey, actSurvey } from '../.native/tests/src/game/survey.js'
import { solveSurvey } from '../.native/tests/tests/survey-helpers.js'
for (const difficulty of ['easy', 'medium', 'expert']) {
  let localWins = 0,
    surveyWins = 0,
    improved = 0,
    opened = 0
  for (let seed = 0; seed < 200; seed++) {
    const initial = actSurvey(createSurvey(seed, difficulty), { type: 'reveal', index: 0 })
    opened += initial.game.cells.filter((c) => c.visibility === 'revealed').length
    const local = solveSurvey(initial, false),
      survey = solveSurvey(initial, true)
    localWins += Number(local.game.phase === 'won')
    surveyWins += Number(survey.game.phase === 'won')
    improved += Number(
      survey.game.cells.filter((c) => c.visibility === 'revealed').length >
        local.game.cells.filter((c) => c.visibility === 'revealed').length,
    )
  }
  console.log(
    JSON.stringify({
      difficulty,
      seeds: 200,
      localWins,
      surveyWins,
      improved,
      averageOpening: opened / 200,
    }),
  )
}
