import type { VariantDifficulty } from '../types/variant-difficulty.js'
import type { EncounterTier } from '../types/tactical.js'

/** Keep encounter schedules explicit and free of fixed ordinary-dungeon dimensions. */
export function encounterTier(difficulty: VariantDifficulty = 'standard'): EncounterTier {
  switch (difficulty) {
    case 'relaxed':
      return { config: { width: 11, height: 9, mines: 4 }, health: 4, floors: [3] }
    case 'standard':
      return { config: { width: 11, height: 9, mines: 4 }, health: 4, floors: [3, 5] }
    case 'advanced':
      return { config: { width: 13, height: 11, mines: 4 }, health: 6, floors: [3, 7] }
    case 'expert':
      return { config: { width: 13, height: 11, mines: 4 }, health: 6, floors: [3, 6, 9] }
    case 'abyss':
      return { config: { width: 15, height: 13, mines: 4 }, health: 8, floors: [4, 8, 12] }
  }
}
