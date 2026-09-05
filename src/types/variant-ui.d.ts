import type { VariantDifficulty } from './variant-difficulty.js'
import type { BoardSide, Equipment, Profession, Relic, Upgrade } from './variants.js'
import type { NavigationKey } from './ui.js'
import type { InteractionCue } from './audio.js'
import type { DungeonTool } from './dungeon-ui.js'
import type { CampCommand } from './camp-navigation.js'

/** Commands decoded from finite button attributes at the UI boundary. */
export type VariantCommand =
  | CampCommand
  | {
      readonly type:
        | 'start'
        | 'descend'
        | 'rewards'
        | 'result'
        | 'zoom'
        | 'camp'
        | 'probe'
        | 'scan'
        | 'skill'
        | 'attack'
        | 'brace'
        | 'end-turn'
        | 'shift'
        | 'help'
        | 'records'
        | 'retreat'
        | 'restart'
        | 'flag-mode'
        | 'reveal-mode'
        | 'safe-mode'
        | 'chord-mode'
        | 'sound'
        | 'pause'
        | 'confirm'
        | 'cancel'
    }
  | { readonly type: 'difficulty'; readonly value: VariantDifficulty }
  | { readonly type: 'profession'; readonly value: Profession }
  | { readonly type: 'equipment'; readonly value: Equipment }
  | { readonly type: 'upgrade'; readonly value: Upgrade }
  | { readonly type: 'relic'; readonly value: Relic }

/** Browser input consumes this application port without knowing a session implementation. */
export interface VariantInputActions {
  /** Preview a public combat route without spending an action. */
  previewRoute(index: number | null): void
  /** Preview a visible area or row target during drag or tool selection. */
  previewTool(tool: DungeonTool | null, index: number | null): void
  /** Consume a tool only after dropping or explicitly activating a cell. */
  useTool(tool: DungeonTool, index: number): void
  /** Decode-independent application command routing. */
  command(command: VariantCommand): void
  /** Apply a reveal or explicit flag action on one board. */
  play(side: BoardSide, index: number, flag?: boolean): void
  /** Cycle player marks or quick-open using right-click and touch-hold. */
  secondary(side: BoardSide, index: number): void
  /** Toggle a player note on an interactive board. */
  annotate(side: BoardSide, index: number): void
  /** Open a number's neighbors through the active ruleset. */
  chord(side: BoardSide, index: number): void
  /** Remember focus and highlight the same public coordinate on the other board. */
  focus(side: BoardSide, index: number): void
  /** Apply an already decoded directional key. */
  navigate(side: BoardSide, index: number, key: NavigationKey): void
  /** Request gesture-safe audio activation. */
  unlock(): void
  /** Emit a UI-only sound through the common mute-aware adapter. */
  feedback(cue: InteractionCue): void
  /** Save and cover the board when the page leaves the foreground. */
  suspend(): void
}

/** A decoded cell target contains no arbitrary DOM attribute keys. */
export interface VariantCellTarget {
  readonly side: BoardSide
  readonly index: number
}

/** A touch hold keeps its original cell even if the browser later retargets an event. */
export interface VariantCellHold {
  readonly pointerId: number
  readonly target: VariantCellTarget
  readonly originX: number
  readonly originY: number
  cancelled: boolean
}

/** Localized labels shared by the two special-mode screens. */
export interface VariantMessages {
  readonly difficulty: string
  readonly legacyDifficulty: string
  readonly nextFloor: string
  readonly zoom: string
  readonly fit: string
  readonly zoomHint: string
  readonly modes: string
  readonly classic: string
  readonly expedition: string
  readonly twin: string
  readonly camp: string
  readonly supplies: string
  readonly departures: string
  readonly start: string
  readonly profession: string
  readonly equipment: string
  readonly facilities: string
  readonly owned: string
  readonly locked: string
  readonly floor: string
  readonly loot: string
  readonly probes: string
  readonly scans: string
  readonly health: string
  readonly shields: string
  readonly probe: string
  readonly scan: string
  readonly wall: string
  readonly player: string
  readonly migrated: string
  readonly retreat: string
  readonly retreatNote: string
  readonly reward: string
  readonly chooseRelic: string
  readonly floorCleared: string
  readonly viewResult: string
  readonly exit: string
  readonly entrance: string
  readonly treasure: string
  readonly collected: string
  readonly frontier: string
  readonly relics: string
  readonly noRelics: string
  readonly relicUsedFloor: string
  readonly relicUsedRun: string
  readonly relicUsedTurn: string
  readonly earned: string
  readonly rewardRate: string
  readonly rewardBase: string
  readonly rewardBonus: string
  readonly won: string
  readonly lost: string
  readonly retreated: string
  readonly steps: string
  readonly records: string
  readonly noRecords: string
  readonly expeditionHelp: string
  readonly twinHelp: string
  readonly campHelp: string
  readonly ready: string
  readonly exploring: string
  readonly exitReady: string
  readonly partner: string
  readonly safePartner: string
  readonly recovered: string
  readonly journalLimit: string
  readonly toolHint: string
  readonly probeHint: string
  readonly scanHint: string
  readonly controls: string
  readonly rowMines: string
  readonly confirmedMine: string
  readonly triggeredMine: string
  readonly confirmedSafe: string
  readonly probeResult: string
}

/** Every catalog entry has a name and a concrete gameplay explanation. */
export interface VariantDescription {
  readonly name: string
  readonly note: string
}

/** Presentation phases that can own an expedition modal without changing the journal. */
export type ExpeditionDialogPhase = 'reward' | 'won' | 'lost' | 'retreated'
