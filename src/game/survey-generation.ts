import { shuffled } from './variant-board.js'
import { deduceSurvey, surveyIndices, surveyRuns } from './survey-logic.js'
import type { Config } from '../types/game.js'
import type { SurveyKnowledge, SurveyLayout } from '../types/survey.js'

/** Sample exact-density layouts, selecting a field that needs the fewest safe starting facts. */
export function generateSurvey(config: Config, seed: number): SurveyLayout {
  const indices = Array.from({ length: config.width * config.height }, (_, index) => index)
  let best: SurveyLayout | null = null
  for (let attempt = 0; attempt < 8; attempt++) {
    const order = shuffled(indices, (seed + Math.imul(attempt, 0x9e3779b9)) >>> 0)
    const mines = new Set(order.slice(0, config.mines))
    const rows = Array.from({ length: config.height }, (_, line) =>
      surveyRuns(surveyIndices(config, 'row', line).map((index) => mines.has(index))),
    )
    const columns = Array.from({ length: config.width }, (_, line) =>
      surveyRuns(surveyIndices(config, 'column', line).map((index) => mines.has(index))),
    )
    const opening: number[] = []
    let facts: readonly SurveyKnowledge[] = indices.map(() => 'unresolved')

    // Publish a safe anchor only when line reasoning stalls. Each addition reduces unresolved
    // cells, so even an unusually ambiguous shuffle terminates without a random retry loop.
    while (true) {
      const result = deduceSurvey(config, rows, columns, facts)
      const next = order.find((index) => !mines.has(index) && result.cells[index] === 'unresolved')
      if (next === undefined) break
      opening.push(next)
      facts = result.cells.map((cell, index) => (index === next ? 'safe' : cell))
      if (best && opening.length >= best.opening.length) break
    }
    if (!best || opening.length < best.opening.length) best = { mines, rows, columns, opening }
    if (!best.opening.length) break
  }
  return best!
}
