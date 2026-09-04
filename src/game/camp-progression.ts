import { VARIANT_TIERS } from './variant-difficulty.js'
import type { Camp, Upgrade } from '../types/variants.js'
import type { CampFunding, CampStage } from '../types/camp-progression.js'
import type { VariantTier } from '../types/variant-difficulty.js'
import {
  TREASURE_SUPPLIES,
  PURSE_SUPPLIES,
  EXIT_SUPPLIES,
  VICTORY_SUPPLIES,
  difficultyRewardPercent,
  scaleSupplies,
} from './expedition-rewards.js'

export const UPGRADES: readonly Upgrade[] = [
  'surveyor',
  'engineer',
  'survey-notes',
  'guardian-crests',
  'archaeologist',
  'survival-charms',
  'alchemist',
  'prospector-seals',
  'workshop',
  'sentinel',
  'archive',
]

/** Offer early role variety, then a loadout milestone and a long-term relic-pool goal. */
export function upgradeCost(upgrade: Upgrade): number {
  switch (upgrade) {
    case 'surveyor':
      return 40
    case 'engineer':
      return 60
    case 'survey-notes':
      return 100
    case 'guardian-crests':
      return 250
    case 'survival-charms':
      return 500
    case 'prospector-seals':
      return 900
    case 'workshop':
      return 1200
    case 'archive':
      return 7500
    case 'archaeologist':
      return 450
    case 'alchemist':
      return 900
    case 'sentinel':
      return 1800
  }
}

/** Name a facility's progression stage without imposing a mandatory purchase order. */
function upgradeStage(upgrade: Upgrade): CampStage {
  switch (upgrade) {
    case 'surveyor':
    case 'engineer':
    case 'survey-notes':
      return 'early'
    case 'guardian-crests':
    case 'survival-charms':
    case 'prospector-seals':
    case 'workshop':
      return 'middle'
    case 'archaeologist':
    case 'alchemist':
      return 'middle'
    case 'sentinel':
    case 'archive':
      return 'late'
  }
}

/** Bound legitimate earnings: three chests per floor and the earliest possible purse choice. */
export function maximumExpeditionSupplies(floors: number): number {
  // The first floor cannot benefit from a relic awarded only after reaching its exit.
  const firstFloor = 3 * TREASURE_SUPPLIES + EXIT_SUPPLIES
  const laterFloor = 3 * PURSE_SUPPLIES + EXIT_SUPPLIES

  return firstFloor + (floors - 1) * laterFloor + VICTORY_SUPPLIES
}

/** Use the longest released tier for an honest lower bound, never an average-earnings promise. */
export function maximumRunSupplies(): number {
  return Math.max(...VARIANT_TIERS.map(maximumDifficultySupplies))
}

/** Combine the base loot ceiling with the current departure's difficulty rate. */
export function maximumDifficultySupplies(tier: VariantTier): number {
  return scaleSupplies(maximumExpeditionSupplies(tier.floors), difficultyRewardPercent(tier.id))
}

/** Show the next unowned facility without writing new counters or changing migrated currency. */
export function campFunding(camp: Camp): CampFunding | null {
  const upgrade = UPGRADES.find((item) => !camp.upgrades.includes(item))
  if (!upgrade) return null

  const price = upgradeCost(upgrade)
  const saved = Math.min(price, camp.supplies)
  const remaining = price - saved

  return {
    upgrade,
    stage: upgradeStage(upgrade),
    price,
    saved,
    remaining,
    percent: Math.floor((saved / price) * 100),
    minimumRuns: Math.ceil(remaining / maximumRunSupplies()),
  }
}
