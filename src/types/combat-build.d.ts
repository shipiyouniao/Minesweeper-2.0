import type { Game } from './game.js'

/** Generated objectives lie on connected, fully deducible terrain. */
export interface BattleLayout {
  readonly game: Game
  readonly walls: readonly number[]
  readonly entrance: number
  readonly boss: number
  readonly objectives: readonly number[]
}

/** Optional combat equipment shares the expedition's bounded departure budget. */
export type CombatEquipment =
  'steel-blade' | 'plated-vest' | 'field-boots' | 'medical-kit' | 'focus-lens' | 'clearing-hook'

/** Each training can be purchased once. There is no repeatable level ladder. */
export type CombatTraining = 'vitality-training' | 'weapon-training'

/** Permanent licenses unlock optional three-point loadouts and an in-run relic pool. */
export type CombatPurchase = CombatEquipment | CombatTraining | 'battle-manual'

/** These relics last for one expedition and provide the main direct combat growth. */
export type CombatRelic = 'tempered-edge' | 'layered-armor' | 'tactics-hourglass'

/** Displayed totals are derived from a departure and current relics, never stored as authority. */
export interface CombatStats {
  readonly attack: number
  readonly defense: number
  readonly actions: number
}

/** A clue constraint contains only covered coordinates and their remaining mine count. */
export interface MineConstraint {
  readonly cells: readonly number[]
  readonly mines: number
}

/** One logical pass returns justified annotations without reading covered mine bits. */
export interface MineDeduction {
  readonly safe: readonly number[]
  readonly mines: readonly number[]
}

/** Regional controls retain a lasting effect and can reopen the guardian's attack window. */
export interface BattleMechanism {
  readonly index: number
  readonly active: boolean
  readonly effect: 'weaken' | 'extend'
}
