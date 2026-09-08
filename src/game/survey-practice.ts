import { surveyIndices, surveyRuns } from './survey-logic.js'
import type { Survey } from '../types/survey.js'

/** A tiny symmetric field teaches run overlap, separators and crossing deductions without guessing. */
export function surveyPractice(): Survey {
  const config = { width: 5, height: 5, mines: 14 }
  const mines = new Set([1, 2, 3, 6, 8, 10, 11, 13, 14, 16, 18, 21, 22, 23])
  return {
    difficulty: 'easy',
    moves: 0,
    game: {
      config,
      seed: 7,
      firstClick: null,
      phase: 'playing',
      exploded: null,
      safeMarks: [],
      cells: Array.from({ length: 25 }, (_, index) => ({
        mine: mines.has(index),
        adjacent: 0,
        visibility: 'hidden',
      })),
    },
    rows: Array.from({ length: 5 }, (_, row) =>
      surveyRuns(surveyIndices(config, 'row', row).map((index) => mines.has(index))),
    ),
    columns: Array.from({ length: 5 }, (_, column) =>
      surveyRuns(surveyIndices(config, 'column', column).map((index) => mines.has(index))),
    ),
  }
}
