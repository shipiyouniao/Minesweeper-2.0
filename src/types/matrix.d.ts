import type { Game } from './game.js'
import type { SurveyAxis, SurveyLayout } from './survey.js'
import type { TacticalState } from './tactical.js'
import type { Expedition } from './variants.js'

/** A fixed optical station controls its perpendicular incoming beam. */
export interface MatrixPrism {
  readonly index: number
  readonly axis: SurveyAxis
  readonly line: number
}

/** Published nonogram clues and connected terrain are immutable throughout the fight. */
export interface MatrixLayout extends SurveyLayout {
  readonly game: Game
  readonly walls: readonly number[]
  readonly entrance: number
  readonly boss: number
  readonly prisms: readonly MatrixPrism[]
  readonly routes: readonly number[]
}

/** Three separate shield circuits require three line deductions and melee damage bands. */
export interface MatrixEncounter extends TacticalState {
  readonly kind: 'matrix'
  readonly rows: readonly (readonly number[])[]
  readonly columns: readonly (readonly number[])[]
  readonly prisms: readonly MatrixPrism[]
  readonly phase: number
  readonly armed: boolean
  readonly exposedUntil: number
  readonly reflections: number
  readonly beam: readonly number[]
  readonly returnBeam: readonly number[]
  readonly pressure: readonly number[]
}

/** A narrowed expedition keeps matrix transitions free of repeated union casts. */
export interface MatrixExpedition extends Expedition {
  readonly encounter: MatrixEncounter
}
