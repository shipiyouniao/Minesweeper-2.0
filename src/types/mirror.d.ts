import type { Game } from './game.js'
import type { Expedition, ProbeReport } from './variants.js'
import type { TacticalIntent, TacticalState, ShieldPylon } from './tactical.js'

/** Realm identity survives swapping the interactive board and its comparison view. */
export type MirrorSide = 'dawn' | 'dusk'

/** Only room-local exploration is parked; health, tools and build triggers have one owner. */
export interface MirrorRoom {
  readonly game: Game
  readonly walls: readonly number[]
  readonly player: number
  readonly travelled: readonly number[]
  readonly confirmedMines: readonly number[]
  readonly triggeredMines: readonly number[]
  readonly surveyedCells: readonly number[]
  readonly scannedRows: readonly number[]
  readonly probeReport: ProbeReport | null
}

/** Each twin owns a seal protecting its partner and an independently visible health pool. */
export interface MirrorTwin {
  readonly health: number
  readonly maxHealth: number
  readonly seal: ShieldPylon
}

/** The current room lives on Expedition; exactly one inactive room is retained here. */
export interface MirrorEncounter extends TacticalState {
  readonly kind: 'mirror'
  readonly active: MirrorSide
  readonly other: MirrorRoom
  readonly dawn: MirrorTwin
  readonly dusk: MirrorTwin
  readonly otherIntent: TacticalIntent
  readonly lastStruck: MirrorSide | null
}

/** Both connected layouts share an entrance and boss coordinate but never a mine. */
export interface MirrorLayout {
  readonly dawn: MirrorRoom
  readonly dusk: MirrorRoom
  readonly entrance: number
  readonly boss: number
  readonly dawnSeal: number
  readonly duskSeal: number
}

/** Generation and acceptance tests inspect the same public two-board deduction result. */
export interface MirrorSolution {
  readonly dawn: Game
  readonly dusk: Game
}

/** A narrowed combat snapshot lets mirror rules work without assertions or optional state. */
export interface MirrorExpedition extends Expedition {
  readonly encounter: MirrorEncounter
}
