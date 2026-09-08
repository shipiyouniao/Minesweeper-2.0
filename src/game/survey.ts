import { act, createGame } from './engine.js'
import type { Action, PresetBoards, RankedDifficulty } from '../types/game.js'
import type { Survey, SurveyLine } from '../types/survey.js'

export const SURVEY_ACTION_LIMIT = 20_000

/** Compact rectangles keep both axes legible while density grows with the extra information. */
export const SURVEY_PRESETS: PresetBoards = {
  easy: { width: 8, height: 8, mines: 10 },
  medium: { width: 12, height: 10, mines: 24 },
  expert: { width: 18, height: 14, mines: 60 },
}

/** Defer all mine totals until the first reveal has fixed the safe opening. */
export function createSurvey(seed: number, difficulty: RankedDifficulty = 'easy'): Survey {
  return {
    difficulty,
    game: createGame(SURVEY_PRESETS[difficulty], seed),
    moves: 0,
    rows: [],
    columns: [],
  }
}

/** Publish exact totals once, then share those immutable observations for every later move. */
export function actSurvey(state: Survey, action: Action): Survey {
  const game = act(state.game, action)
  if (game === state.game) return state

  // The common engine accepts a fully opened chord. It adds no Survey operation or journal entry.
  if (
    game.phase === state.game.phase &&
    game.safeMarks === state.game.safeMarks &&
    game.cells.every((cell, index) => cell.visibility === state.game.cells[index]?.visibility)
  )
    return state

  if (state.game.firstClick !== null || game.firstClick === null)
    return { ...state, game, moves: state.moves + 1 }

  const rows = Array<number>(game.config.height).fill(0)
  const columns = Array<number>(game.config.width).fill(0)
  for (const [index, cell] of game.cells.entries()) {
    if (!cell.mine) continue
    const row = Math.floor(index / game.config.width)
    const column = index % game.config.width
    rows[row] = rows[row]! + 1
    columns[column] = columns[column]! + 1
  }

  return { ...state, game, rows, columns, moves: state.moves + 1 }
}

/** Combine published totals with annotations, without reading concealed cell identities. */
export function surveyLine(state: Survey, axis: 'row' | 'column', line: number): SurveyLine {
  const { width, height } = state.game.config
  const count = axis === 'row' ? height : width
  if (!Number.isInteger(line) || line < 0 || line >= count)
    return { total: null, flags: 0, covered: 0 }

  let flags = 0
  let covered = 0
  const length = axis === 'row' ? width : height
  for (let offset = 0; offset < length; offset++) {
    const index = axis === 'row' ? line * width + offset : offset * width + line
    const visibility = state.game.cells[index]!.visibility
    flags += Number(visibility === 'flagged')
    covered += Number(visibility !== 'revealed')
  }

  return {
    total: (axis === 'row' ? state.rows : state.columns)[line] ?? null,
    flags,
    covered,
  }
}
