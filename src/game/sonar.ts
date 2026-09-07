import { act, createGame, neighbors, PRESETS } from './engine.js'
import type { Config, Game, RankedDifficulty } from '../types/game.js'
import type { Sonar, SonarAction, SonarComparison, SonarReading } from '../types/sonar.js'

export const SONAR_CHARGES = 3
export const SONAR_ACTION_LIMIT = 20_000

/** Reuse shuffled classic placement while keeping Sonar's progress and scoring independent. */
export function createSonar(seed: number, difficulty: RankedDifficulty = 'easy'): Sonar {
  return {
    difficulty,
    game: createGame(PRESETS[difficulty], seed),
    readings: [],
    moves: 0,
    excavations: 0,
  }
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
      sonarCharges(state) <= 0 ||
      state.readings.some((reading) => reading.center === action.index)
    )
      return state

    const region = sonarRegion(state.game.config, action.index)
    if (!region.length) return state

    // Flags and safe notes are hypotheses: neither changes the measured physical total.
    const mines = region.filter((index) => state.game.cells[index]?.mine).length
    const cells = state.game.cells.map((cell, index) =>
      index === action.index
        ? { ...cell, visibility: cell.mine ? ('flagged' as const) : ('revealed' as const) }
        : cell,
    )
    const won = cells.every((cell) => cell.mine || cell.visibility === 'revealed')
    const game: Game = {
      ...state.game,
      cells: won
        ? cells.map((cell) => (cell.mine ? { ...cell, visibility: 'flagged' } : cell))
        : cells,
      safeMarks: state.game.safeMarks.filter((index) => index !== action.index),
      phase: won ? 'won' : 'playing',
    }
    return { ...state, game, readings: [...state.readings, { center: action.index, mines }] }
  }

  if (
    state.game.cells[action.index]?.mine &&
    state.readings.some((reading) => reading.center === action.index)
  )
    return state

  if (
    (action.type === 'chord' || action.type === 'reveal') &&
    state.game.cells[action.index]?.visibility === 'revealed' &&
    sonarObscured(state, action.index)
  )
    return state
  const game = act(state.game, action)
  return game === state.game
    ? state
    : {
        ...state,
        game,
        moves: state.moves + 1,
        excavations:
          state.excavations +
          Number(
            (action.type === 'reveal' || action.type === 'chord') &&
              game.phase !== 'lost' &&
              game.cells.some(
                (cell, index) =>
                  cell.visibility === 'revealed' &&
                  state.game.cells[index]?.visibility !== 'revealed',
              ),
          ),
      }
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

/** Credits come only from new successful excavation actions, never flags or repeated clicks. */
export function sonarCharges(state: Sonar): number {
  return SONAR_CHARGES + Math.floor(state.excavations / 4) - state.readings.length
}
/** Mask layout depends only on public position and seed; scans permanently clarify their entire region. */
export function sonarObscured(state: Sonar, index: number): boolean {
  const cell = state.game.cells[index]
  return (
    state.game.phase === 'playing' &&
    cell?.visibility === 'revealed' &&
    cell.adjacent > 0 &&
    ((Math.imul(index + 1, 2654435761) ^ state.game.seed) >>> 0) % 4 !== 0 &&
    !state.readings.some((reading) =>
      sonarRegion(state.game.config, reading.center).includes(index),
    )
  )
}
