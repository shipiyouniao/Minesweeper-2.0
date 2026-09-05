import type { Departure, Expedition } from '../types/variants.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import type { ExpeditionReward } from '../types/expedition-rewards.js'

export const TREASURE_SUPPLIES = 6
export const PURSE_SUPPLIES = 9
export const EXIT_SUPPLIES = 12
export const VICTORY_SUPPLIES = 30

/** Reward harder and longer expeditions independently of their extra treasure opportunities. */
export function difficultyRewardPercent(difficulty: VariantDifficulty): number {
  switch (difficulty) {
    case 'relaxed':
      return 200
    case 'standard':
      return 250
    case 'advanced':
      return 300
    case 'expert':
      return 350
    case 'abyss':
      return 450
  }
}

/** Apply the selected difficulty to both normal settlement and update extraction. */
export function expeditionRewardPercent(departure: Departure): number {
  return difficultyRewardPercent(departure.difficulty)
}

/** Bank whole supplies once, after applying the recorded difficulty rate. */
export function scaleSupplies(base: number, percent: number): number {
  return Math.floor((base * percent) / 100)
}

/** Apply defeat retention before the bonus; unfinished runs never have a settlement. */
export function expeditionReward(run: Expedition): ExpeditionReward {
  let base = 0

  if (run.phase === 'won') base = run.loot + VICTORY_SUPPLIES
  else if (run.phase === 'retreated') base = run.loot
  else if (run.phase === 'lost')
    base = Math.floor(run.loot * (run.relics.includes('salvage') ? 0.75 : 0.5))

  const percent = expeditionRewardPercent(run.departure)
  const total = scaleSupplies(base, percent)

  return { base, bonus: total - base, total, percent }
}
