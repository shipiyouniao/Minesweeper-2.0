import type { InputActions, TouchPoint } from '../types/ui.js'
import { parseDifficulty } from '../game/difficulty.js'
import { parseLanguage } from '../i18n.js'
import { parseCommand, parseNavigation, parseSubmission } from './input-parser.js'

/**
 * Translates browser events into application commands.
 * Listener and gesture lifetimes belong here and are released together on dispose.
 */
export class InputController {
  private readonly actions: InputActions
  private readonly listeners = new AbortController()
  private longPress: number | undefined
  private touchStart: TouchPoint | null = null
  private lastTouchFlag = -Infinity

  /** Attach delegated listeners once, so replacing the board cannot duplicate them. */
  constructor(root: HTMLElement, actions: InputActions) {
    this.actions = actions
    const options = { signal: this.listeners.signal }

    root.addEventListener('click', this.handleClick, options)
    root.addEventListener('contextmenu', this.handleContextMenu, options)
    root.addEventListener('change', this.handleChange, options)
    root.addEventListener('submit', this.handleSubmit, options)
    root.addEventListener('focusin', this.handleFocus, options)
    root.addEventListener('keydown', this.handleKey, options)
    root.addEventListener('pointerdown', this.handlePointerDown, options)
    root.addEventListener('pointermove', this.handlePointerMove, options)
    root.addEventListener('pointerup', this.cancelGesture, options)
    root.addEventListener('pointercancel', this.cancelGesture, options)
    root.addEventListener('scroll', this.cancelGesture, { ...options, capture: true })
    document.addEventListener('visibilitychange', this.handleVisibility, options)
    window.addEventListener('pagehide', this.handlePageHide, options)
  }

  /** Cancel delayed flags before scrolling, changing boards, or disposing the app. */
  readonly cancelGesture = (): void => {
    clearTimeout(this.longPress)
    this.longPress = undefined
    this.touchStart = null
  }

  /** Release every listener and pending gesture, including document/window listeners. */
  dispose(): void {
    this.cancelGesture()
    this.listeners.abort()
  }

  /** Route delegated button clicks by their semantic data attribute. */
  private readonly handleClick = (event: MouseEvent): void => {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null

    if (!target) {
      return
    }

    const { cell, mode, recordMode, action } = target.dataset

    if (cell !== undefined) {
      if (!this.suppressTouchClick()) {
        this.actions.play(Number(cell))
      }
    } else if (mode) {
      const difficulty = parseDifficulty(mode)

      if (difficulty) {
        this.actions.selectDifficulty(difficulty)
      }
    } else if (recordMode) {
      const difficulty = parseDifficulty(recordMode)

      if (difficulty && difficulty !== 'custom') {
        this.actions.selectRecords(difficulty)
      }
    } else if (action) {
      const command = parseCommand(action)

      if (command) {
        this.actions.command(command)
      }
    }
  }

  /** Replace the board context menu with a flag action. */
  private readonly handleContextMenu = (event: MouseEvent): void => {
    const cell = this.cellTarget(event.target)

    if (!cell) {
      return
    }

    event.preventDefault()

    if (!this.suppressTouchClick()) {
      this.actions.play(Number(cell.dataset['cell']), true)
    }
  }

  /** Read language selection without rebuilding or mutating business state here. */
  private readonly handleChange = (event: Event): void => {
    if (event.target instanceof HTMLSelectElement && event.target.id === 'language') {
      const language = parseLanguage(event.target.value)

      if (language) {
        this.actions.selectLanguage(language)
      }
    }
  }

  /** Convert a form submission into values before the controller may replace its DOM. */
  private readonly handleSubmit = (event: SubmitEvent): void => {
    if (event.target instanceof HTMLFormElement) {
      event.preventDefault()
      const submission = parseSubmission(event.target.id, new FormData(event.target))

      if (submission) {
        this.actions.submit(submission)
      }
    }
  }

  /** Track cell focus so Tab returns to the player's last board position. */
  private readonly handleFocus = (event: FocusEvent): void => {
    const cell = this.cellTarget(event.target)

    if (cell) {
      this.actions.rememberFocus(Number(cell.dataset['cell']))
    }
  }

  /** Handle shortcuts outside form controls and keep movement inside board bounds. */
  private readonly handleKey = (event: KeyboardEvent): void => {
    if (
      this.actions.dialogOpen ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return
    }

    const key = event.key.toLowerCase()

    if (key === 'p' || key === 'n') {
      event.preventDefault()
      this.actions.command(key === 'p' ? 'pause' : 'new')
      return
    }

    const cell = this.cellTarget(event.target)

    if (!cell) {
      return
    }

    const index = Number(cell.dataset['cell'])

    if (key === 'f' || key === ' ' || key === 'enter') {
      event.preventDefault()
      this.actions.play(index, key === 'f')
    } else {
      const navigation = parseNavigation(key)

      if (navigation && this.actions.navigate(index, navigation)) {
        event.preventDefault()
      }
    }
  }

  /** Begin a touch/pen hold; scrolling or release cancels it before the deadline. */
  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') {
      return
    }

    const cell = this.cellTarget(event.target)

    if (!cell) {
      return
    }

    this.cancelGesture()
    this.touchStart = { x: event.clientX, y: event.clientY }

    // A hold produces a flag, then suppresses the browser's synthetic click/menu.
    this.longPress = window.setTimeout(() => {
      this.lastTouchFlag = performance.now()
      this.actions.play(Number(cell.dataset['cell']), true)
      this.touchStart = null
      this.longPress = undefined
    }, 450)
  }

  /** Distinguish deliberate long presses from dragging a wide board to scroll. */
  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (
      this.touchStart &&
      Math.hypot(event.clientX - this.touchStart.x, event.clientY - this.touchStart.y) > 10
    ) {
      this.cancelGesture()
    }
  }

  /** Visibility loss must also cancel a pending gesture and any dialog-owned resume. */
  private readonly handleVisibility = (): void => {
    if (document.hidden) {
      this.handlePageHide()
    }
  }

  /** Save and pause before navigation, including pages retained in the back/forward cache. */
  private readonly handlePageHide = (): void => {
    this.cancelGesture()
    this.actions.suspend()
  }

  /** Find a cell through nested icon elements without relying on the direct target. */
  private cellTarget(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element ? target.closest<HTMLElement>('[data-cell]') : null
  }

  /** Ignore the duplicate click/context menu browsers emit after a touch flag. */
  private suppressTouchClick(): boolean {
    return performance.now() - this.lastTouchFlag < 700
  }
}
