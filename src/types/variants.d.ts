import type { VariantDifficulty } from './variant-difficulty.js'
import type { TacticalEncounter } from './tactical.js'
import type { Vitality } from './vitality.js'
import type { Game } from './game.js'
import type {
  CombatEquipment,
  CombatPurchase,
  CombatRelic,
  CombatTraining,
} from './combat-build.js'
import type { RelicPack, ExpansionRelic } from './relic-packs.js'

/** Rulesets are independent of classic difficulty and have separate save slots. */
export type Ruleset = 'classic' | 'expedition' | 'twin'

/** The board receiving a twin-board action. */
export type BoardSide = 'a' | 'b'

/** Career choices exchange information tools for limited protection. */
export type Profession =
  'explorer' | 'surveyor' | 'engineer' | 'archaeologist' | 'alchemist' | 'sentinel'

/** Camp equipment consumes a three-point departure budget. */
export type Equipment = 'probe' | 'scanner' | 'guard' | CombatEquipment

/** Relics persist only within the current expedition. */
export type Relic =
  'lantern' | 'lens' | 'aegis' | 'purse' | 'compass' | 'salvage' | ExpansionRelic | CombatRelic

/** Progression purchases unlock options rather than unlimited stat increases. */
export type Upgrade =
  | 'surveyor'
  | 'engineer'
  | 'archaeologist'
  | 'alchemist'
  | 'sentinel'
  | 'workshop'
  | 'archive'
  | RelicPack
  | CombatPurchase

/** Persistent camp progress, updated atomically with run settlement. */
export interface Camp {
  readonly supplies: number
  readonly upgrades: readonly Upgrade[]
  readonly completed: number
}

/** A replayable departure captures the camp options available when it began. */
export interface Departure {
  readonly training: readonly CombatTraining[]
  readonly battleRelics: boolean
  readonly packs: readonly RelicPack[]
  readonly difficulty: VariantDifficulty
  readonly seed: number
  readonly profession: Profession
  readonly equipment: readonly Equipment[]
  readonly archive: boolean
}

/** A complete floor state; reachability is derived from revealed safe cells. */
export interface Expedition extends Vitality {
  readonly encounter: TacticalEncounter | null
  /** Rebuilt from accepted skill intents; reset only on entering another floor. */
  readonly skillUsed: boolean
  readonly departure: Departure
  readonly floor: number
  readonly game: Game
  readonly entrance: number
  readonly exit: number
  readonly walls: readonly number[]
  readonly player: number
  /** Distinct squares physically visited in this room; starting square does not count as travel. */
  readonly travelled: readonly number[]
  /** Preserve ordinary-room travel on entering a boss arena without mixing coordinate spaces. */
  readonly priorTravel: number
  readonly treasures: readonly number[]
  readonly collected: readonly number[]
  readonly relics: readonly Relic[]
  /** Claimed effects cannot pay out again by walking, flagging or repeating a discovery. */
  readonly floorTriggers: readonly Relic[]
  readonly runTriggers: readonly Relic[]
  readonly offers: readonly Relic[]
  readonly scannedRows: readonly number[]
  readonly confirmedMines: readonly number[]
  /** Confirmed hazards actually triggered, including hits absorbed by shields. */
  readonly triggeredMines: readonly number[]
  readonly surveyedCells: readonly number[]
  readonly probeReport: ProbeReport | null
  readonly probes: number
  readonly scans: number
  readonly loot: number
  readonly steps: number
  readonly phase: 'exploring' | 'boss' | 'reward' | 'won' | 'lost' | 'retreated'
}

/** Explicit run intents; all effects can be replayed without browser state. */
export type ExpeditionAction =
  | {
      readonly type: 'reveal' | 'flag' | 'mark-safe' | 'chord' | 'move' | 'probe' | 'interact'
      readonly index: number
    }
  | { readonly type: 'sweep'; readonly row: number }
  | { readonly type: 'relic'; readonly relic: Relic }
  | { readonly type: 'retreat' | 'descend' | 'skill' | 'attack' | 'brace' | 'end-turn' | 'shift' }

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
  readonly type: 'reveal' | 'flag' | 'mark-safe' | 'chord'
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
  readonly rulesRevision: number
  /** Extraction value only; never used to reconstruct an active run's resources. */
  readonly returnSupplies: number
  readonly departure: Departure
  readonly actions: readonly ExpeditionAction[]
}

/** One atomic value prevents refresh from awarding a settled run twice. */
export interface ExpeditionSave {
  readonly difficulty?: VariantDifficulty
  readonly version: 4
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

/** Storage normalization reports recovery separately from durable gameplay state. */
export interface ExpeditionLoad {
  readonly save: ExpeditionSave
  readonly migrated: boolean
  readonly recovered: boolean
  readonly returnedSupplies: number | null
}
