import type { Game } from './game.js'
import type { TacticalState } from './tactical.js'
import type { Expedition } from './variants.js'

/** A local crystal puzzle; hidden identities are used only by generation and accepted extraction. */
export interface MatrixRegion {
  readonly indices: readonly number[]
  readonly crystals: readonly number[]
  readonly rows: readonly (readonly number[])[]
  readonly columns: readonly (readonly number[])[]
}

/** Validated ordinary terrain and two independently solvable crystal regions. */
export interface MatrixLayout {
  readonly game: Game
  readonly walls: readonly number[]
  readonly entrance: number
  readonly boss: number
  readonly regions: readonly [MatrixRegion, MatrixRegion]
}

/** Two permanent shield breaks replace repeated timed prism circuits. */
export interface MatrixEncounter extends TacticalState {
  readonly kind: 'matrix'
  readonly regions: readonly [MatrixRegion, MatrixRegion]
  readonly phase: 1 | 2
  readonly exposed: boolean
  readonly collected: readonly number[]
  readonly empty: readonly number[]
  readonly notes: readonly number[]
  readonly lastAttuned: number | null
}

/** Narrow once at the boundary of a pure Matrix rule. */
export interface MatrixExpedition extends Expedition {
  readonly encounter: MatrixEncounter
}
