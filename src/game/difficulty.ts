import type { Difficulty, RankedDifficulty } from '../types/game.js'

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'expert', 'custom']
export const RANKED_DIFFICULTIES: readonly RankedDifficulty[] = ['easy', 'medium', 'expert']

/** Accept supported names and legacy URL aliases at the input boundary. */
export function parseDifficulty(value: string | null): Difficulty | null {
  switch (value) {
    case 'easy':
      return 'easy'
    case 'medium':
    case 'hard':
      return 'medium'
    case 'expert':
    case 'extra':
      return 'expert'
    case 'custom':
      return 'custom'
    default:
      return null
  }
}

/** Resolve a URL or saved preference with the default beginner fallback. */
export function difficultyOf(value: string | null): Difficulty {
  return parseDifficulty(value) ?? 'easy'
}
