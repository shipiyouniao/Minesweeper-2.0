import { act, neighbors, randomIndex } from './engine.js'
import type { Config, Game } from '../types/game.js'

/** Shuffle a copy using the same unbiased seeded stream as classic placement. */
export function shuffled<T>(values: readonly T[], seed: number): T[] {
  const result = [...values]
  const next = randomIndex(seed)

  for (let index = result.length - 1; index > 0; index--) {
    const other = next(index + 1)
    const left = result[index]
    const right = result[other]

    if (left !== undefined && right !== undefined) {
      result[index] = right
      result[other] = left
    }
  }

  return result
}

/** Build immutable clues from an already selected exact mine set. */
export function placedBoard(
  config: Config,
  mines: ReadonlySet<number>,
  seed: number,
  opening: number,
): Game {
  const game: Game = {
    config,
    seed,
    firstClick: opening,
    exploded: null,
    safeMarks: [],
    phase: 'playing',
    cells: Array.from({ length: config.width * config.height }, (_, index) => ({
      mine: mines.has(index),
      adjacent: neighbors(config, index).filter((neighbor) => mines.has(neighbor)).length,
      visibility: 'hidden',
    })),
  }

  return act(game, { type: 'reveal', index: opening })
}

/** Orthogonal neighbors define a route; diagonal contact cannot cross a wall. */
export function adjacentSteps(game: Game, index: number): number[] {
  return neighbors(game.config, index).filter(
    (other) =>
      Math.abs((other % game.config.width) - (index % game.config.width)) +
        Math.abs(Math.floor(other / game.config.width) - Math.floor(index / game.config.width)) ===
      1,
  )
}
