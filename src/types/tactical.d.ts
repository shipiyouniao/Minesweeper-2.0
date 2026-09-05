import type { Expedition, ExpeditionAction, Relic } from './variants.js'
import type { Config } from './game.js'
import type { BattleMechanism, CombatEquipment } from './combat-build.js'
import type { MirrorEncounter } from './mirror.js'

/** Released encounter families have independent rules and artwork. */
export type EncounterKind = 'bastion' | 'brood' | 'mirror'

/** A public control protects one armor section until its surrounding flags are calibrated. */
export interface ShieldPylon {
  readonly index: number
  readonly active: boolean
}

/** Sources commit their footprints before a turn; interception can remove a defeated source. */
export interface TacticalIntent {
  readonly kind: 'row' | 'column' | 'cross' | 'swarm'
  readonly targets: readonly number[]
  readonly damage: number
}

/** Encounter-local state is derived from the journal, never accepted as a serialized snapshot. */
export interface TacticalState {
  /** Preserve prior-room discoveries for once-per-floor thresholds without reusing cell indices. */
  readonly priorDiscoveries: number
  readonly boss: number
  readonly health: number
  readonly maxHealth: number
  readonly lastDamage: number
  readonly turn: number
  readonly points: number
  readonly braced: boolean
  /** Reset only at explicit end-turn; previews never spend a relic's use. */
  readonly turnTriggers: readonly (Relic | CombatEquipment)[]
  readonly intent: TacticalIntent
  readonly event:
    | 'entered'
    | 'acted'
    | 'braced'
    | 'disabled'
    | 'misfire'
    | 'struck'
    | 'hit'
    | 'evaded'
    | 'defeated'
    | 'web-cut'
    | 'egg-crushed'
    | 'hatchling-cleared'
    | 'nest-destroyed'
    | 'window-opened'
    | 'shifted'
    | 'twin-fallen'
}

/** Armor controls belong to the guardian's encounter variant. */
export interface BastionEncounter extends TacticalState {
  readonly kind: 'bastion'
  readonly pylons: readonly ShieldPylon[]
  /** Regional controls open bounded core windows. */
  readonly mechanisms: readonly BattleMechanism[]
  readonly exposedUntil: number
}

/** Eggs hatch only after their visible number of explicit end-turn actions. */
export interface BroodEgg {
  readonly index: number
  readonly turns: number
}

/** A hatchling commits its destination and attack footprint before the player acts. */
export interface BroodOrder {
  readonly from: number
  readonly to: number
  readonly targets: readonly number[]
}

/** Webs and creatures occupy safe terrain without changing its mines or clues. */
export interface BroodEncounter extends TacticalState {
  readonly kind: 'brood'
  readonly webs: readonly number[]
  readonly eggs: readonly BroodEgg[]
  readonly hatchlings: readonly number[]
  readonly nests: readonly number[]
  readonly orders: readonly BroodOrder[]
  readonly queenTargets: readonly number[]
  /** Destroyed nests stay on the board as inert landmarks and never produce replacements. */
  readonly destroyedNests: readonly number[]
}

/** A finite encounter union keeps each boss's state and rules explicit. */
export type TacticalEncounter = BastionEncounter | BroodEncounter | MirrorEncounter

/** Difficulty changes arena scale and boss endurance without changing action costs. */
export interface EncounterTier {
  readonly config: Config
  readonly health: number
  readonly floors: readonly number[]
}

/** A public action preview uses known paths, visible flags, resources and action points only. */
export type TacticalReason =
  | 'ready'
  | 'points'
  | 'path'
  | 'armor'
  | 'adjacent'
  | 'flags'
  | 'inactive'
  | 'used'
  | 'window'
  | 'nests'
  | 'mirror-seal'
  | 'reflection'

/** A known route and its cost, before committing any animation or game state. */
export interface TacticalPlan {
  readonly path: readonly number[]
  readonly cost: number
  readonly allowed: boolean
  readonly reason: TacticalReason
}

/** Reuse exploration transitions without importing the expedition orchestrator into combat rules. */
export type ExploreTransition = (run: Expedition, action: ExpeditionAction) => Expedition
