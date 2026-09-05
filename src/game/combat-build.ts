import { damageVitality, healVitality } from './vitality.js'
import type { Camp, Departure, Expedition } from '../types/variants.js'
import type { Vitality } from '../types/vitality.js'
import type { TacticalEncounter } from '../types/tactical.js'
import type {
  CombatEquipment,
  CombatPurchase,
  CombatStats,
  CombatTraining,
} from '../types/combat-build.js'

export const COMBAT_EQUIPMENT: readonly CombatEquipment[] = [
  'medical-kit',
  'steel-blade',
  'plated-vest',
  'focus-lens',
  'clearing-hook',
  'field-boots',
]
export const COMBAT_TRAINING: readonly CombatTraining[] = ['vitality-training', 'weapon-training']
export const COMBAT_PURCHASES: readonly CombatPurchase[] = [
  ...COMBAT_EQUIPMENT,
  'battle-manual',
  ...COMBAT_TRAINING,
]

/** Decode concrete equipment identifiers at storage and input boundaries. */
export function parseCombatEquipment(value: string | null): CombatEquipment | null {
  switch (value) {
    case 'steel-blade':
    case 'plated-vest':
    case 'field-boots':
    case 'medical-kit':
    case 'focus-lens':
    case 'clearing-hook':
      return value
    default:
      return null
  }
}

/** Keep training identifiers finite rather than accepting arbitrary numeric levels. */
export function parseCombatTraining(value: string | null): CombatTraining | null {
  return value === 'vitality-training' || value === 'weapon-training' ? value : null
}

/** Return a supported license, never a caller-supplied catalog key. */
export function parseCombatPurchase(value: string | null): CombatPurchase | null {
  return value === 'battle-manual'
    ? value
    : (parseCombatEquipment(value) ?? parseCombatTraining(value))
}

/** Permanent training stays finite, with direct in-run relics stronger than each upgrade. */
export function combatPurchaseCost(item: CombatPurchase): number {
  switch (item) {
    case 'medical-kit':
      return 400
    case 'focus-lens':
      return 800
    case 'steel-blade':
      return 1000
    case 'plated-vest':
      return 1200
    case 'clearing-hook':
      return 1500
    case 'field-boots':
      return 1800
    case 'battle-manual':
      return 2200
    case 'vitality-training':
      return 1800
    case 'weapon-training':
      return 3000
  }
}

/** Snapshot only owned training, in a stable order independent of purchase history. */
export function ownedCombatTraining(camp: Camp): CombatTraining[] {
  return COMBAT_TRAINING.filter((training) => camp.upgrades.includes(training))
}

/** New health uses a five-point damage scale, allowing small non-dominant stat increments. */
export function startingHealth(departure: Departure): number {
  return (
    10 +
    Number(departure.training.includes('vitality-training')) +
    2 * Number(departure.equipment.includes('medical-kit'))
  )
}

/** Derive effective stats from the current build; action bonuses never exceed five. */
export function combatStats(run: Expedition): CombatStats {
  const equipment = run.departure.equipment
  return {
    attack:
      5 +
      Number(run.departure.training.includes('weapon-training')) +
      2 * Number(equipment.includes('steel-blade')) +
      3 * Number(run.relics.includes('tempered-edge')),
    defense:
      Number(equipment.includes('plated-vest')) + Number(run.relics.includes('layered-armor')),
    actions: Math.min(
      5,
      3 +
        Number(run.relics.includes('tactics-hourglass')) +
        Number(equipment.includes('field-boots') && (run.encounter?.turn ?? 1) % 2 === 0),
    ),
  }
}

/** Each shield charge absorbs five damage and remains visible beside the health bar. */
export function damageExpedition(run: Expedition, amount: number): Vitality {
  return damageVitality(run, amount)
}

/** Convert one recovery unit into five health, up to the explorer's maximum. */
export function healExpedition(run: Expedition, units: number): Vitality {
  return healVitality(run, units * 5)
}

/** Armor mitigates enemy attacks, while every unbraced hit retains at least one damage. */
export function incomingCombatDamage(run: Expedition, raw: number): number {
  if (raw === 0) return 0
  return Math.max(1, raw - combatStats(run).defense - (run.encounter?.braced ? 3 : 0))
}

/** Add only the frozen attack sources covering this square; interception removes its source. */
export function battleThreat(encounter: TacticalEncounter, index: number): number {
  if (encounter.kind !== 'brood')
    return encounter.intent.targets.includes(index) ? encounter.intent.damage : 0
  return (
    (encounter.queenTargets.includes(index) ? 5 : 0) +
    encounter.orders.filter(
      (order) => encounter.hatchlings.includes(order.from) && order.targets.includes(index),
    ).length *
      3
  )
}
