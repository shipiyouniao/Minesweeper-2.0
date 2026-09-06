import { act, createGame, neighbors, PRESETS } from './engine.js'
import type { Config, RankedDifficulty } from '../types/game.js'
import type { Sonar, SonarAction, SonarComparison, SonarReading } from '../types/sonar.js'

export const SONAR_CHARGES = 3
export const SONAR_ACTION_LIMIT = 20_000

/** Reuse shuffled classic placement while keeping Sonar's progress and scoring independent. */
export function createSonar(seed: number, difficulty: RankedDifficulty = 'easy'): Sonar {
  return { difficulty, game: createGame(PRESETS[difficulty], seed), readings: [], moves: 0 }
}

/** Return a clipped 3×3 square in row order, including its center. */
export function sonarRegion(config: Config, center: number): readonly number[] {
  if (!Number.isInteger(center) || center < 0 || center >= config.width * config.height) return []
  return [center, ...neighbors(config, center)].sort((left, right) => left - right)
}

/** Accept a new reading only after generation; rejected and repeated scans spend nothing. */
export function actSonar(state: Sonar, action: SonarAction): Sonar {
  if (state.game.phase === 'won' || state.game.phase === 'lost') return state

  if (action.type === 'scan') {
    if (
      state.game.phase !== 'playing' ||
      state.readings.length >= SONAR_CHARGES ||
      state.readings.some((reading) => reading.center === action.index)
    )
      return state

    const region = sonarRegion(state.game.config, action.index)
    if (!region.length) return state

    // Flags and safe notes are hypotheses: neither changes the measured physical total.
    const mines = region.filter((index) => state.game.cells[index]?.mine).length
    return { ...state, readings: [...state.readings, { center: action.index, mines }] }
  }

  const game = act(state.game, action)
  return game === state.game ? state : { ...state, game, moves: state.moves + 1 }
}

/** Derive only set geometry and subtraction of already published totals. */
export function compareSonar(
  config: Config,
  left: SonarReading,
  right: SonarReading,
): SonarComparison {
  const a = sonarRegion(config, left.center)
  const b = sonarRegion(config, right.center)
  const aSet = new Set(a)
  const bSet = new Set(b)
  return {
    common: a.filter((index) => bSet.has(index)),
    leftOnly: a.filter((index) => !bSet.has(index)),
    rightOnly: b.filter((index) => !aSet.has(index)),
    difference: left.mines - right.mines,
  }
}
