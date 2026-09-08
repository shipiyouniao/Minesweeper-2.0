import type { RankedDifficulty } from './game.js'
import type { InteractionCue } from './audio.js'
import type { NavigationKey } from './ui.js'
import type { SurveyAxis } from './survey.js'

/** Survey owns its finite controls without adding unrelated commands to Classic or Expedition. */
export type SurveyCommand =
  | {
      readonly type:
        'cycle-mode' | 'pause' | 'new' | 'help' | 'records' | 'close' | 'confirm' | 'sound' | 'zoom'
    }
  | { readonly type: 'difficulty' | 'record-difficulty'; readonly value: RankedDifficulty }

/** Explicit input port shared by native pointer, keyboard and touch adapters. */
export interface SurveyInputActions {
  readonly blocked: boolean
  /** Route a decoded instrument, dialog or difficulty command. */
  command(command: SurveyCommand): void
  /** Confirm the selected primary board operation. */
  play(index: number): void
  /** Cycle marks or quick-open through a stationary secondary gesture. */
  secondary(index: number): void
  /** Execute an explicit keyboard annotation or quick-open command. */
  direct(index: number, type: 'flag' | 'mark-safe' | 'chord'): void
  /** Quick-open exactly one public row or column from its header. */
  openLine(axis: SurveyAxis, line: number): void
  /** Remember the current public board coordinate. */
  focus(index: number): void
  /** Move keyboard focus using shared board geometry. */
  navigate(index: number, key: NavigationKey): void
  /** Highlight only the public row and column of a pointer target. */
  preview(index: number | null): void
  /** Highlight the single line named by a focused or hovered clue. */
  previewLine(axis: SurveyAxis, line: number): void
  /** Checkpoint and cover information when backgrounded. */
  suspend(): void
  /** Prepare audio during the original browser gesture. */
  unlock(): void
  /** Emit a public UI cue through the common sound preference. */
  feedback(cue: InteractionCue): void
}

/** Retain the original touch square until release, cancellation or a single accepted hold. */
export interface SurveyHold {
  readonly pointer: number
  readonly index: number
  readonly x: number
  readonly y: number
  cancelled: boolean
  acted: boolean
}

/** A decoded clue header always identifies one supported axis and a finite line index. */
export interface SurveyHeader {
  readonly axis: SurveyAxis
  readonly line: number
}

/** Keep touch taps attached to their original clue, while letting native scrolling cancel them. */
export interface SurveyHeaderHold extends SurveyHeader {
  readonly pointer: number
  readonly x: number
  readonly y: number
  readonly started: number
}
