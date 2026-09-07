import type { RankedDifficulty } from './game.js'
import type { InteractionCue } from './audio.js'
import type { HelpStep, NavigationKey } from './ui.js'

/** Sonar owns its finite controls without adding unrelated commands to Classic or Expedition. */
export type SonarCommand =
  | {
      readonly type:
        | 'scan'
        | 'cycle-mode'
        | 'pause'
        | 'new'
        | 'help'
        | 'records'
        | 'close'
        | 'confirm'
        | 'sound'
        | 'zoom'
    }
  | { readonly type: 'difficulty' | 'record-difficulty'; readonly value: RankedDifficulty }
  | { readonly type: 'reading'; readonly value: number }

/** Explicit input port shared by native pointer, keyboard and touch adapters. */
export interface SonarInputActions {
  readonly blocked: boolean
  readonly targeting: boolean
  /** Route a decoded instrument, dialog or difficulty command. */
  command(command: SonarCommand): void
  /** Confirm the selected primary board operation. */
  play(index: number): void
  /** Cycle marks or quick-open through a stationary secondary gesture. */
  secondary(index: number): void
  /** Execute an explicit keyboard annotation or quick-open command. */
  direct(index: number, type: 'flag' | 'mark-safe' | 'chord'): void
  /** Remember the current public board coordinate. */
  focus(index: number): void
  /** Move keyboard focus using shared board geometry. */
  navigate(index: number, key: NavigationKey): void
  /** Show only a geometric target before confirmation. */
  preview(index: number | null): void
  /** Clear the armed instrument and its preview together. */
  cancelTarget(): void
  /** Checkpoint and cover information when backgrounded. */
  suspend(): void
  /** Prepare audio during the original browser gesture. */
  unlock(): void
  /** Emit a public UI cue through the common sound preference. */
  feedback(cue: InteractionCue): void
}

/** Retain the original touch square until release, cancellation or a single accepted hold. */
export interface SonarHold {
  readonly pointer: number
  readonly index: number
  readonly x: number
  readonly y: number
  cancelled: boolean
  acted: boolean
}

/** All mode-specific copy is complete in each supported language. */
export interface SonarMessages {
  readonly title: string
  readonly intro: string
  readonly revealHint: string
  readonly scan: string
  readonly charges: string
  readonly history: string
  readonly empty: string
  readonly opening: string
  readonly aim: string
  readonly duplicate: string
  readonly exhausted: string
  readonly comparison: string
  readonly compareHint: string
  readonly exclusive: string
  readonly shared: string
  readonly difference: string
  readonly moves: string
  readonly scans: string
  readonly reading: string
  readonly mines: string
  readonly help: string
  readonly rankHint: string
  readonly noRecords: string
  readonly recovered: string
  readonly limit: string
  readonly zoom: string
  readonly fit: string
  readonly win: string
  readonly loss: string
  readonly target: string
  readonly helpSteps: readonly HelpStep[]
}

/** Pointer capture tracks an instrument drag separately from board touch holds. */
export interface SonarDrag {
  readonly pointer: number
  readonly x: number
  readonly y: number
  moved: boolean
}
