import type { Config } from '../types/game.js'
import type { Departure, VariantRecord } from '../types/variants.js'
import type { VariantDifficulty, VariantTier } from '../types/variant-difficulty.js'

/** Freeze these values for difficulty-v1 journals; balance changes need a new rules revision. */
export const VARIANT_TIERS: readonly VariantTier[] = [
  {
    id: 'relaxed',
    twin: { width: 9, height: 9, mines: 10 },
    size: 9,
    floors: 3,
    firstDensity: 0.15,
    lastDensity: 0.19,
  },
  {
    id: 'standard',
    twin: { width: 12, height: 12, mines: 22 },
    size: 11,
    floors: 5,
    firstDensity: 0.18,
    lastDensity: 0.24,
  },
  {
    id: 'advanced',
    twin: { width: 16, height: 16, mines: 44 },
    size: 13,
    floors: 7,
    firstDensity: 0.2,
    lastDensity: 0.26,
  },
  {
    id: 'expert',
    twin: { width: 20, height: 20, mines: 76 },
    size: 15,
    floors: 9,
    firstDensity: 0.22,
    lastDensity: 0.28,
  },
  {
    id: 'abyss',
    twin: { width: 24, height: 24, mines: 120 },
    size: 17,
    floors: 12,
    firstDensity: 0.24,
    lastDensity: 0.3,
  },
]

/** Decode the finite tier names without accepting classic presets or arbitrary catalog keys. */
export function parseVariantDifficulty(value: string | null): VariantDifficulty | null {
  switch (value) {
    case 'relaxed':
    case 'standard':
    case 'advanced':
    case 'expert':
    case 'abyss':
      return value
    default:
      return null
  }
}

/** Look up a typed choice; every member of the union must have a catalog entry. */
export function variantTier(difficulty: VariantDifficulty): VariantTier {
  const tier = VARIANT_TIERS.find((entry) => entry.id === difficulty)
  if (!tier) throw new Error('Missing variant difficulty')

  return tier
}

/** Retain the historical paired board for journals written before difficulty selection. */
export function twinConfig(difficulty?: VariantDifficulty): Config {
  return difficulty ? variantTier(difficulty).twin : { width: 9, height: 9, mines: 12 }
}

/** Old expedition rules always keep five floors, even if a caller supplies a tier. */
export function expeditionFloors(departure: Departure): number {
  return (departure.rules === 'difficulty-v1' || departure.rules === 'health-v1') &&
    departure.difficulty
    ? variantTier(departure.difficulty).floors
    : 5
}

/** Interpolate mine density across the selected run while preserving old exact layouts. */
export function expeditionConfig(departure: Departure, floor: number): Config {
  if (
    (departure.rules !== 'difficulty-v1' && departure.rules !== 'health-v1') ||
    !departure.difficulty
  )
    return { width: 9, height: 9, mines: 13 + floor * 2 }

  const tier = variantTier(departure.difficulty)
  const progress = (floor - 1) / (tier.floors - 1)
  const density = tier.firstDensity + (tier.lastDensity - tier.firstDensity) * progress

  return { width: tier.size, height: tier.size, mines: Math.round(tier.size * tier.size * density) }
}

/** Retain ten results per tier, including a separate historical bucket, in newest-first order. */
export function addVariantRecord(
  records: readonly VariantRecord[],
  record: VariantRecord,
): VariantRecord[] {
  const counts = new Map<VariantDifficulty | undefined, number>()

  return [record, ...records].filter((entry) => {
    const count = (counts.get(entry.difficulty) ?? 0) + 1
    counts.set(entry.difficulty, count)
    return count <= 10
  })
}
