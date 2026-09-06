import type { TacticalState } from './tactical.js'
import type { Expedition } from './variants.js'

/** A spell keeps its advertised cells and absolute end-turn deadline until redirected. */
export interface ClockSpell {
  readonly id: number
  readonly shape: 'cross' | 'line'
  readonly targets: readonly number[]
  readonly resolvesOn: number
  readonly redirected: boolean
}

export interface ClockEncounter extends TacticalState {
  readonly kind: 'clock'
  readonly hourglasses: readonly { readonly index: number; readonly used: boolean }[]
  readonly spells: readonly ClockSpell[]
  readonly nextSpell: number
  readonly echo: { readonly index: number; readonly damage: number }
  readonly recoveryUntil: number
  readonly resolution: {
    readonly turn: number
    readonly cells: readonly number[]
    readonly echoIndex: number
    readonly echoDamage: number
    readonly reflectedDamage: number
  } | null
}

export interface ClockExpedition extends Expedition {
  readonly encounter: ClockEncounter
}
