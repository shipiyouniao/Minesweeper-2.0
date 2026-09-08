import { createSurvey, surveyKnowledge } from '../.native/tests/src/game/survey.js'
import { deduceSurvey } from '../.native/tests/src/game/survey-logic.js'

for (const difficulty of ['easy', 'medium', 'expert']) {
  let solved = 0,
    opening = 0,
    maximumOpening = 0,
    rounds = 0
  const times = []
  for (let seed = 0; seed < 200; seed++) {
    const start = performance.now()
    const state = createSurvey(seed, difficulty)
    times.push(performance.now() - start)
    const count = state.game.cells.filter((cell) => cell.visibility === 'revealed').length
    opening += count
    maximumOpening = Math.max(maximumOpening, count)
    const result = deduceSurvey(
      state.game.config,
      state.rows,
      state.columns,
      state.game.cells.map(surveyKnowledge),
    )
    solved += Number(!result.contradiction && !result.cells.includes('unresolved'))
    rounds += result.rounds
  }
  times.sort((a, b) => a - b)
  console.log(
    JSON.stringify({
      difficulty,
      seeds: 200,
      solved,
      averageOpening: opening / 200,
      maximumOpening,
      averageRounds: rounds / 200,
      medianGenerationMs: Number(times[100].toFixed(2)),
      p95GenerationMs: Number(times[189].toFixed(2)),
    }),
  )
}
