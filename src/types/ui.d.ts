import type { Config, Difficulty, RankedDifficulty } from './game.js'
import type { Language } from './localization.js'

/** Commands accepted by toolbar and dialog controls. */
export type UiCommand =
  | 'help'
  | 'records'
  | 'close'
  | 'pause'
  | 'flag-mode'
  | 'reveal-mode'
  | 'restart-confirmed'
  | 'new'
  | 'toggle-sound'

/** Only these keys can request a board-focus movement. */
export type NavigationKey = 'arrowleft' | 'arrowright' | 'arrowup' | 'arrowdown' | 'home' | 'end'

/** Form fields become domain values before reaching the application controller. */
export type FormSubmission =
  | { readonly kind: 'custom'; readonly config: Config }
  | { readonly kind: 'name'; readonly name: string }

/** Public content for a single cell, with no covered clues or mine positions. */
export interface CellContent {
  readonly html: string
  readonly label: string
}

/** Pointer coordinates used while recognizing a long press. */
export interface TouchPoint {
  readonly x: number
  readonly y: number
}

/** A help item is explicit content, rather than a computed translation-key type. */
export interface HelpStep {
  readonly title: string
  readonly note: string
}

/** Browser events are decoded into these typed application operations. */
export interface InputActions {
  readonly dialogOpen: boolean

  /** Activate audio within the pointer gesture before a delayed touch action. */
  prepareAudio(): void

  /** Apply a cell action using the selected input mode when omitted. */
  play(index: number, flag?: boolean): void

  /** Handle an allowed toolbar or dialog command. */
  command(action: UiCommand): void

  /** Choose a known difficulty or open custom configuration. */
  selectDifficulty(value: Difficulty): void

  /** Choose a ranked difficulty's records. */
  selectRecords(value: RankedDifficulty): void

  /** Change to a supported translation. */
  selectLanguage(value: Language): void

  /** Consume typed form values after the input adapter extracts them. */
  submit(submission: FormSubmission): void

  /** Maintain the board's roving tab stop. */
  rememberFocus(index: number): void

  /** Move focus with a recognized navigation key. */
  navigate(index: number, key: NavigationKey): boolean

  /** Pause and save when the page leaves the foreground. */
  suspend(): void
}
