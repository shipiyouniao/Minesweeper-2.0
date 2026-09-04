import type { Expedition, ExpeditionAction, Relic } from './variants.js'
import type { Config } from './game.js'

/** A public control protects one armor section until its surrounding flags are calibrated. */
export interface ShieldPylon {
  readonly index: number
  readonly active: boolean
}

/** The committed danger footprint stays unchanged throughout the player's turn. */
export interface TacticalIntent {
  readonly kind: 'row' | 'column' | 'cross'
  readonly targets: readonly number[]
  readonly damage: number
}

/** Encounter-local state is derived from the journal, never accepted as a serialized snapshot. */
export interface TacticalEncounter {
  /** Preserve prior-room discoveries for once-per-floor thresholds without reusing cell indices. */
  readonly priorDiscoveries: number
  readonly kind: 'bastion'
  readonly boss: number
  readonly pylons: readonly ShieldPylon[]
  readonly health: number
  readonly maxHealth: number
  readonly lastDamage: number
  readonly turn: number
  readonly points: number
  readonly braced: boolean
  /** Reset only at explicit end-turn; previews never spend a relic's use. */
  readonly turnTriggers: readonly Relic[]
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
}

/** Difficulty changes arena scale and boss endurance without changing action costs. */
export interface BastionTier {
  readonly config: Config
  readonly health: number
  readonly floors: readonly number[]
}

/** A public action preview uses known paths, visible flags, resources and action points only. */
export type TacticalReason =
  'ready' | 'points' | 'path' | 'armor' | 'adjacent' | 'flags' | 'inactive' | 'used'

/** A known route and its cost, before committing any animation or game state. */
export interface TacticalPlan {
  readonly path: readonly number[]
  readonly cost: number
  readonly allowed: boolean
  readonly reason: TacticalReason
}

/** Reuse exploration transitions without importing the expedition orchestrator into combat rules. */
export type ExploreTransition = (run: Expedition, action: ExpeditionAction) => Expedition
