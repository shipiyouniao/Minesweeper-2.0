import type { VariantDifficulty } from './variant-difficulty.js'
import type { Vitality } from './vitality.js'
import type { Game } from './game.js'
import type { RelicPack, ExpansionRelic } from './relic-packs.js'

/** Rulesets are independent of classic difficulty and have separate save slots. */
export type Ruleset = 'classic' | 'expedition' | 'twin'

/** The board receiving a twin-board action. */
export type BoardSide = 'a' | 'b'

/** Career choices exchange information tools for limited protection. */
export type Profession = 'explorer' | 'surveyor' | 'engineer'

/** Camp equipment consumes a three-point departure budget. */
export type Equipment = 'probe' | 'scanner' | 'guard'

/** Relics persist only within the current expedition. */
export type Relic = 'lantern' | 'lens' | 'aegis' | 'purse' | 'compass' | 'salvage' | ExpansionRelic

/** Progression purchases unlock options rather than unlimited stat increases. */
export type Upgrade = 'surveyor' | 'engineer' | 'workshop' | 'archive' | RelicPack

/** Persistent camp progress, updated atomically with run settlement. */
export interface Camp {
  readonly supplies: number
  readonly upgrades: readonly Upgrade[]
  readonly completed: number
}

/** A replayable departure captures the camp options available when it began. */
export interface Departure {
  /** Missing reward revision preserves historical settlement amounts. */
  readonly rewards?: 'difficulty-v1'
  /** Persist generation and relic rules; omitted direct inputs retain the 9 × 9 scouting layout. */
  readonly rules?: 'original' | 'scouting' | 'difficulty-v1' | 'health-v1' | 'relics-v1'
  /** Only relics-v1 snapshots contain purchased packs; older reward pools remain unchanged. */
  readonly packs?: readonly RelicPack[]
  /** Difficulty and health journals require this field; historical departures omit it. */
  readonly difficulty?: VariantDifficulty
  readonly seed: number
  readonly profession: Profession
  readonly equipment: readonly Equipment[]
  readonly archive: boolean
}

/** A complete floor state; reachability is derived from revealed safe cells. */
export interface Expedition extends Vitality {
  readonly departure: Departure
  readonly floor: number
  readonly game: Game
  readonly entrance: number
  readonly exit: number
  readonly walls: readonly number[]
  readonly player: number
  readonly treasures: readonly number[]
  readonly collected: readonly number[]
  readonly relics: readonly Relic[]
  /** Claimed effects cannot pay out again by walking, flagging or repeating a discovery. */
  readonly floorTriggers: readonly Relic[]
  readonly runTriggers: readonly Relic[]
  readonly offers: readonly Relic[]
  readonly scannedRows: readonly number[]
  readonly confirmedMines: readonly number[]
  readonly surveyedCells: readonly number[]
  readonly probeReport: ProbeReport | null
  readonly probes: number
  readonly scans: number
  readonly loot: number
  readonly steps: number
  readonly phase: 'exploring' | 'reward' | 'won' | 'lost' | 'retreated'
}

/** Explicit run intents; all effects can be replayed without browser state. */
export type ExpeditionAction =
  | { readonly type: 'reveal' | 'flag' | 'move' | 'probe'; readonly index: number }
  | { readonly type: 'sweep'; readonly row: number }
  /** Historical count-only intent retained for existing journals; the UI emits sweep. */
  | { readonly type: 'scan'; readonly row: number }
  | { readonly type: 'relic'; readonly relic: Relic }
  | { readonly type: 'retreat' | 'descend' }

/** Both layouts are generated together, excluding overlapping mines. */
export interface Twin {
  readonly difficulty?: VariantDifficulty
  readonly seed: number
  readonly firstClick: number | null
  readonly a: Game
  readonly b: Game
  readonly moves: number
  readonly phase: 'ready' | 'playing' | 'won' | 'lost'
}

/** A twin board intent can never refer to an arbitrary board name. */
export interface TwinAction {
  readonly side: BoardSide
  readonly type: 'reveal' | 'flag'
  readonly index: number
}

/** Results use moves/depth instead of mixing unlike modes into classic time records. */
export interface VariantRecord {
  readonly difficulty?: VariantDifficulty
  readonly date: string
  readonly outcome: 'won' | 'lost' | 'retreated'
  readonly steps: number
  readonly depth: number
  readonly earned: number
}

/** Replay envelopes never trust serialized mines, clues, charges, or rewards. */
export interface ExpeditionJournal {
  readonly departure: Departure
  readonly actions: readonly ExpeditionAction[]
}

/** One atomic value prevents refresh from awarding a settled run twice. */
export interface ExpeditionSave {
  readonly difficulty?: VariantDifficulty
  readonly version: 3
  readonly camp: Camp
  readonly journal: ExpeditionJournal | null
  readonly records: readonly VariantRecord[]
}

/** The last area probe reports its center and total mines, including earlier confirmations. */
export interface ProbeReport {
  readonly center: number
  readonly mines: number
}

/** Twin games have their own schema, seed, action history and records. */
export interface TwinSave {
  readonly rules?: 'difficulty-v1'
  readonly difficulty?: VariantDifficulty
  readonly version: 1
  readonly seed: number
  readonly actions: readonly TwinAction[]
  readonly records: readonly VariantRecord[]
  readonly settled: boolean
}

/** Only these typed envelopes may cross the special-mode storage boundary. */
export type VariantSave = ExpeditionSave | TwinSave

/** Lifecycle owned by the top-level ruleset router. */
export interface MountedGame {
  /** Persist current progress and release browser resources. */
  dispose(): void
}
