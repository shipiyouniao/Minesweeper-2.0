import type { Config, Difficulty, RankedDifficulty } from './game.js'
import type { Language } from './localization.js'
import type { InteractionCue } from './audio.js'

/** Commands accepted by toolbar and dialog controls. */
export type UiCommand =
  | 'help'
  | 'records'
  | 'close'
  | 'pause'
  | 'flag-mode'
  | 'reveal-mode'
  | 'safe-mode'
  | 'chord-mode'
  | 'restart-confirmed'
  | 'new'
  | 'toggle-sound'

/** Only these keys can request a board-focus movement. */
export type NavigationKey = 'arrowleft' | 'arrowright' | 'arrowup' | 'arrowdown' | 'home' | 'end'

/** Distinguish a handled board-edge key from an actual move or missing target. */
export type NavigationResult = 'moved' | 'edge' | 'unavailable'

/** A selected tool describes the next cell activation, without overlapping boolean modes. */
export type BoardInputMode = 'reveal' | 'flag' | 'mark-safe' | 'chord'

/** Right-click and touch-hold share these public cell operations. */
export type BoardSecondaryAction = 'flag' | 'mark-safe' | 'chord'

/** A right press retains its starting square until release or cancellation. */
export interface BoardRightPress {
  readonly pointerId: number
  readonly cell: HTMLElement
  readonly x: number
  readonly y: number
  cancelled: boolean
}

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

  /** Emit intentional UI feedback without coupling input adapters to browser audio. */
  feedback(cue: InteractionCue): void

  /** Apply a cell action using the selected input mode when omitted. */
  play(index: number, flag?: boolean): void

  /** Cycle covered-cell notes or quick-open a revealed number with a pointer gesture. */
  secondary(index: number): void

  /** Toggle a hypothesis without revealing or walking to its square. */
  annotate(index: number): void

  /** Request flag-count-based opening of a revealed number's neighbors. */
  chord(index: number): void

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
