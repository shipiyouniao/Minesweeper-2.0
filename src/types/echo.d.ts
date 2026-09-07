import type { TacticalState } from './tactical.js'
import type { Expedition } from './variants.js'

/** A regional observation preserves mine facts; resonance belongs to one announced phase. */
export interface ExpeditionReading {
  readonly realm: 'dawn' | 'dusk' | null
  readonly center: number
  readonly mines: number
  readonly phase: number | null
  readonly resonance: boolean | null
}

/** Owned charges survive floors; the encounter loan is isolated from the permanent tool. */
export interface ExpeditionSonar {
  readonly charges: number
  readonly progress: number
  readonly loan: number
  readonly loanProgress: number
  readonly readings: readonly ExpeditionReading[]
}

/** Three indistinguishable bodies share health; published observations identify the active one. */
export interface EchoEncounter extends TacticalState {
  readonly kind: 'echo'
  readonly bodies: readonly number[]
  readonly phase: number
  readonly exposedUntil: number
  readonly phaseDamage: number
  readonly relocations: number
  readonly pulsesUsed: number
  readonly sonicHits: number
}

/** Narrow the encounter for its independent rules module. */
export interface EchoExpedition extends Expedition {
  readonly encounter: EchoEncounter
}
