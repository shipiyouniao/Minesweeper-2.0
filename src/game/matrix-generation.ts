import { adjacentSteps, placedBoard, shuffled } from './variant-board.js'
import { deduceSurvey, surveyIndices, surveyRuns } from './survey-logic.js'
import type { Config, Game } from '../types/game.js'
import type { MatrixLayout, MatrixPrism } from '../types/matrix.js'
import type { SurveyKnowledge } from '../types/survey.js'

/** Reserve a perimeter and central cross, wall off isolated pockets, then publish enough facts
 * for line intersections to solve the entire field without guessing. */
export function generateMatrix(config: Config, seed: number): MatrixLayout {
  const { width, height } = config
  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)
  const boss = cy * width + cx
  const entrance = boss + width + 1
  const indices = Array.from({ length: width * height }, (_, index) => index)
  const routes = indices.filter((index) => {
    const x = index % width
    const y = Math.floor(index / width)
    return (
      x === 0 ||
      y === 0 ||
      x === width - 1 ||
      y === height - 1 ||
      x === cx ||
      y === cy ||
      (Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1)
    )
  })
  const stations: readonly MatrixPrism[] = [
    { index: boss - 2 * width, axis: 'row', line: cy - 2 },
    { index: boss + 2 * width, axis: 'row', line: cy + 2 },
    { index: boss - 2, axis: 'column', line: cx - 2 },
    { index: boss + 2, axis: 'column', line: cx + 2 },
  ]
  const prisms = shuffled(stations, seed ^ 0x71a9).slice(0, 3)
  const order = shuffled(
    indices.filter((index) => !routes.includes(index)),
    seed,
  )
  // Every circuit must cross a real mine run; fill the remaining quota from the same shuffle.
  const required = new Set(
    prisms.map((prism) =>
      order.find((index) =>
        prism.axis === 'row'
          ? Math.floor(index / width) === prism.line
          : index % width === prism.line,
      )!,
    ),
  )
  const mines = new Set([
    ...required,
    ...order.filter((index) => !required.has(index)).slice(0, config.mines - required.size),
  ])
  const board = placedBoard(config, mines, seed, entrance)
  const reached = new Set([entrance])
  const queue = [entrance]
  for (const index of queue)
    for (const other of adjacentSteps(board, index))
      if (other !== boss && !mines.has(other) && !reached.has(other)) {
        reached.add(other)
        queue.push(other)
      }
  const walls = indices.filter((index) => !mines.has(index) && !reached.has(index))
  const rows = Array.from({ length: height }, (_, line) =>
    surveyRuns(surveyIndices(config, 'row', line).map((index) => mines.has(index))),
  )
  const columns = Array.from({ length: width }, (_, line) =>
    surveyRuns(surveyIndices(config, 'column', line).map((index) => mines.has(index))),
  )
  const opening: number[] = []
  let facts: readonly SurveyKnowledge[] = indices.map((index) =>
    routes.includes(index) || walls.includes(index) ? 'safe' : 'unresolved',
  )
  // Each safe anchor strictly reduces unresolved cells; generation always terminates.
  while (true) {
    const result = deduceSurvey(config, rows, columns, facts)
    const anchor = order.find((index) => !mines.has(index) && result.cells[index] === 'unresolved')
    if (anchor === undefined) break
    opening.push(anchor)
    facts = result.cells.map((cell, index) => (index === anchor ? 'safe' : cell))
  }
  const game: Game = {
    ...board,
    phase: 'playing',
    cells: board.cells.map((cell, index) => ({
      ...cell,
      visibility:
        Math.abs((index % width) - cx) <= 1 && Math.abs(Math.floor(index / width) - cy) <= 1
          ? 'revealed'
          : 'hidden',
    })),
  }
  return { game, mines, rows, columns, opening, walls, entrance, boss, prisms, routes }
}
