import type { Expedition } from './variants.js'
import type { TacticalState } from './tactical.js'

/** A numbered grounding station can be calibrated once and used for repeated lures. */
export interface MagneticAnchor {
  readonly index: number
  readonly calibrated: boolean
}

/** Field direction is fixed for the whole turn; explicit lures replace it with a fixed route. */
export type MagneticForecast =
  | {
      readonly kind: 'field'
      readonly axis: 'horizontal' | 'vertical'
      readonly polarity: 'pull' | 'push'
    }
  | { readonly kind: 'charge'; readonly anchor: number; readonly path: readonly number[] }
  | { readonly kind: 'recovery' }

/** A public projection cannot tell whether a covered landing cell actually contains a mine. */
export interface MagneticProjection {
  readonly path: readonly number[]
  readonly direction: 'left' | 'right' | 'up' | 'down' | 'none'
  readonly anchored: boolean
  readonly collision: boolean
  readonly landing: 'known' | 'uncertain' | 'mine'
}

/** Completed physical paths drive presentation once; journal replay never stores DOM effects. */
export interface MagneticResolution {
  readonly turn: number
  readonly playerPath: readonly number[]
  readonly bossPath: readonly number[]
  readonly impact: number | null
  readonly outcome: 'shifted' | 'grounded' | 'collision' | 'overloaded' | 'recovered'
}

/** This encounter owns its field, reusable anchors and temporary armor-break window. */
export interface MagneticEncounter extends TacticalState {
  readonly kind: 'magnetic'
  readonly anchors: readonly MagneticAnchor[]
  readonly forecast: MagneticForecast
  readonly exposedUntil: number
  readonly resolution: MagneticResolution | null
}

/** Narrowing at the orchestrator boundary keeps magnetic rules free of assertions. */
export interface MagneticExpedition extends Expedition {
  readonly encounter: MagneticEncounter
}
