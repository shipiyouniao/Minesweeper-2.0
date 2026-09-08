import { act } from './engine.js'
import { generateSurvey } from './survey-generation.js'
import { deduceSurveyLine, surveyIndices } from './survey-logic.js'
import type { Cell, PresetBoards, RankedDifficulty } from '../types/game.js'
import type {
  Survey,
  SurveyAction,
  SurveyAxis,
  SurveyKnowledge,
  SurveyLine,
} from '../types/survey.js'

export const SURVEY_ACTION_LIMIT = 20_000

/** Dense mine runs create overlap deductions; board area grows without shrinking clue typography. */
export const SURVEY_PRESETS: PresetBoards = {
  easy: { width: 8, height: 8, mines: 30 },
  medium: { width: 12, height: 10, mines: 56 },
  expert: { width: 16, height: 14, mines: 108 },
}

/** Generate clues before play so the very first excavation can be a logical choice. */
export function createSurvey(seed: number, difficulty: RankedDifficulty = 'easy'): Survey {
  const config = SURVEY_PRESETS[difficulty]
  const layout = generateSurvey(config, seed >>> 0)
  return {
    difficulty,
    game: {
      config,
      seed: seed >>> 0,
      phase: 'playing',
      firstClick: null,
      exploded: null,
      safeMarks: [],
      cells: Array.from({ length: config.width * config.height }, (_, index) => ({
        mine: layout.mines.has(index),
        // Survey has no adjacency clue, including in the shared cell renderer and ARIA labels.
        adjacent: 0,
        visibility: layout.opening.includes(index) ? 'revealed' : 'hidden',
      })),
    },
    moves: 0,
    rows: layout.rows,
    columns: layout.columns,
  }
}

/** Player safe notes remain hypotheses; only excavations and flags constrain line reasoning. */
export function surveyKnowledge(cell: Cell): SurveyKnowledge {
  return cell.visibility === 'revealed'
    ? 'safe'
    : cell.visibility === 'flagged'
      ? 'mine'
      : 'unresolved'
}

/** Open unfinished squares in a fully flagged line, plus explicitly noted safe squares on either axis. */
export function surveyChordTargets(state: Survey, index: number): readonly number[] {
  const targets = new Set<number>()
  for (const axis of ['row', 'column'] as const) {
    const line =
      axis === 'row' ? Math.floor(index / state.game.config.width) : index % state.game.config.width
    for (const at of surveyLineTargets(state, axis, line)) targets.add(at)
  }
  return [...targets].sort((a, b) => a - b)
}

/** Restrict a header's quick-open to its own line, using the existing public flag and note rules. */
export function surveyLineTargets(
  state: Survey,
  axis: SurveyAxis,
  line: number,
): readonly number[] {
  const reading = surveyLine(state, axis, line)
  if (reading.total === null) return []
  const filled = !reading.conflict && reading.total === reading.flags
  return surveyIndices(state.game.config, axis, line).filter(
    (index) =>
      state.game.cells[index]?.visibility === 'hidden' &&
      (filled || state.game.safeMarks.includes(index)),
  )
}

/** Keep annotation semantics shared, but never invoke Classic's neighborhood reveal or flood fill. */
export function actSurvey(state: Survey, action: SurveyAction): Survey {
  const before = state.game
  const source =
    action.type === 'chord-line' && action.axis === 'row'
      ? action.index * before.config.width
      : action.index
  const cell = before.cells[source]
  if (!Number.isInteger(action.index) || !cell || before.phase !== 'playing') return state
  if (action.type === 'flag' || action.type === 'mark-safe') {
    const game = act(before, action)
    return game === before ? state : { ...state, game, moves: state.moves + 1 }
  }
  const targets =
    action.type === 'chord-line'
      ? surveyLineTargets(state, action.axis, action.index)
      : action.type === 'chord' || cell.visibility === 'revealed'
        ? surveyChordTargets(state, action.index)
        : cell.visibility === 'hidden'
          ? [action.index]
          : []
  if (!targets.length) return state

  const cells = [...before.cells]
  let exploded: number | null = null
  for (const index of targets) {
    cells[index] = { ...cells[index]!, visibility: 'revealed' }
    if (cells[index]!.mine) {
      exploded = index
      break
    }
  }
  const won =
    exploded === null && cells.every((entry) => entry.mine || entry.visibility === 'revealed')
  return {
    ...state,
    moves: state.moves + 1,
    game: {
      ...before,
      cells: won
        ? cells.map((entry) => (entry.mine ? { ...entry, visibility: 'flagged' } : entry))
        : cells,
      safeMarks: before.safeMarks.filter((index) => cells[index]?.visibility === 'hidden'),
      firstClick: before.firstClick ?? source,
      phase: exploded !== null ? 'lost' : won ? 'won' : 'playing',
      exploded,
    },
  }
}

/** Validate flags against ordered public runs, not merely a coincidentally matching count. */
export function surveyLine(state: Survey, axis: 'row' | 'column', line: number): SurveyLine {
  const runs = (axis === 'row' ? state.rows : state.columns)[line]
  if (!Number.isInteger(line) || !runs)
    return { runs: [], total: null, flags: 0, covered: 0, conflict: false, complete: false }
  const cells = surveyIndices(state.game.config, axis, line).map(
    (index) => state.game.cells[index]!,
  )
  const knowledge = cells.map(surveyKnowledge)
  const contradiction = deduceSurveyLine(runs, knowledge).contradiction
  return {
    runs,
    total: runs.reduce((sum, run) => sum + run, 0),
    flags: cells.filter((cell) => cell.visibility === 'flagged').length,
    covered: cells.filter((cell) => cell.visibility !== 'revealed').length,
    conflict: contradiction,
    complete: !contradiction && !knowledge.includes('unresolved'),
  }
}
