import { surveyDifficulty } from '../persistence/survey-repository.js'
import type {
  SurveyCommand,
  SurveyHeader,
  SurveyHeaderHold,
  SurveyHold,
  SurveyInputActions,
} from '../types/survey-ui.js'
import { BoardRightClick } from './board-right-click.js'
import { parseNavigation } from './input-parser.js'

/** Decode only controls belonging to the Survey shell. */
function surveyCommand(value: string | undefined): SurveyCommand | null {
  switch (value) {
    case 'cycle-mode':
    case 'pause':
    case 'new':
    case 'help':
    case 'records':
    case 'close':
    case 'confirm':
    case 'sound':
    case 'zoom':
      return { type: value }
    default:
      return null
  }
}

/** Own real gestures independently from pure rules, keeping a hold anchored to its original cell. */
export class SurveyInput {
  private readonly actions: SurveyInputActions
  private readonly root: HTMLElement
  private readonly listeners = new AbortController()
  private readonly rightClick: BoardRightClick
  private hold: SurveyHold | null = null
  private headerHold: SurveyHeaderHold | null = null
  private timer: number | undefined
  private suppressUntil = 0

  /** Bind delegated controls once and release every listener on mode disposal. */
  constructor(root: HTMLElement, actions: SurveyInputActions) {
    this.root = root
    this.actions = actions
    this.rightClick = new BoardRightClick(root, (cell) => {
      actions.unlock()
      if (!actions.blocked) actions.secondary(Number(cell.dataset['cell']))
    })

    const options = { signal: this.listeners.signal }

    root.addEventListener('click', this.click, options)
    root.addEventListener('keydown', this.key, options)
    root.addEventListener('focusin', this.focus, options)
    root.addEventListener('pointerover', this.over, options)
    root.addEventListener('pointerleave', () => actions.preview(null), options)
    root.addEventListener('pointerdown', this.down, options)
    root.addEventListener('contextmenu', this.contextMenu, options)
    root.addEventListener('scroll', this.cancelGesture, { ...options, capture: true })
    window.addEventListener('pointermove', this.move, options)
    window.addEventListener('pointerup', this.up, options)
    window.addEventListener('pointercancel', this.cancelGesture, options)
    window.addEventListener('pagehide', this.suspend, options)
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) this.suspend()
      },
      options,
    )
  }

  /** Cancel holds without preventing a native scroll; suppress their delayed synthetic click. */
  readonly cancelGesture = (): void => {
    clearTimeout(this.timer)
    this.timer = undefined
    this.headerHold = null
    if (this.hold) {
      this.hold.cancelled = true
      this.suppressUntil = performance.now() + 700
    }

    this.rightClick.cancel()
  }

  /** Remove page-level listeners and any pending hold before a new shell is mounted. */
  dispose(): void {
    this.cancelGesture()
    this.hold = null
    this.rightClick.dispose()
    this.listeners.abort()
  }

  /** Route known buttons; touch cell activations are handled exactly once on pointer release. */
  private readonly click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return

    const button = event.target.closest<HTMLButtonElement>('button')
    if (!button) return

    this.actions.unlock()

    const header = this.header(button)
    if (header) {
      // One click opens the line; ignore the second click of a double-click and synthetic touch clicks.
      if (event.detail <= 1 && !this.actions.blocked && performance.now() >= this.suppressUntil)
        this.actions.openLine(header.axis, header.line)
      return
    }

    const cell = button.dataset['cell']
    if (cell !== undefined) {
      if (!this.actions.blocked && performance.now() >= this.suppressUntil)
        this.actions.play(Number(cell))
      return
    }

    const difficulty = surveyDifficulty(button.dataset['surveyDifficulty'] ?? null)
    const record = surveyDifficulty(button.dataset['surveyRecord'] ?? null)
    if (difficulty) this.actions.command({ type: 'difficulty', value: difficulty })
    else if (record) this.actions.command({ type: 'record-difficulty', value: record })
    else {
      const command = surveyCommand(button.dataset['control'])
      if (command) this.actions.command(command)
    }
  }

  /** Preserve board shortcuts without intercepting forms, dialogs or modified browser shortcuts. */
  private readonly key = (event: KeyboardEvent): void => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.isComposing ||
      (event.target instanceof Element &&
        event.target.closest(
          '.language-picker, dialog, input, textarea, select, [contenteditable="true"]',
        ))
    )
      return

    if (event.key === 'Tab') this.actions.feedback('navigate')

    const key = event.key.toLowerCase()
    if (key === 'p' || key === 'n') {
      event.preventDefault()
      this.actions.command({ type: key === 'p' ? 'pause' : 'new' })

      return
    }

    if (this.actions.blocked) return

    const header = this.header(event.target)
    if (header && (key === 'enter' || key === ' ' || key === 'c')) {
      event.preventDefault()
      if (!event.repeat) this.actions.openLine(header.axis, header.line)

      return
    }

    const cell = this.cell(event.target)
    if (!cell) return

    const index = Number(cell.dataset['cell'])
    const navigation = parseNavigation(key)
    if (navigation) {
      event.preventDefault()
      this.actions.navigate(index, navigation)
    } else if (key === 'enter' || key === ' ') {
      event.preventDefault()
      this.actions.play(index)
    } else if (key === 'f' || key === 's' || key === 'c') {
      event.preventDefault()
      this.actions.direct(index, key === 'f' ? 'flag' : key === 's' ? 'mark-safe' : 'chord')
    }
  }

  /** Board focus is a public target, independent of whether its cell hides a mine. */
  private readonly focus = (event: FocusEvent): void => {
    const cell = this.cell(event.target)
    if (cell) this.actions.focus(Number(cell.dataset['cell']))

    const header = this.header(event.target)
    if (header) this.actions.previewLine(header.axis, header.line)
  }

  /** Pointer hover highlights public row and column headers without taking a game action. */
  private readonly over = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return

    const header = this.header(event.target)
    if (header) {
      this.actions.previewLine(header.axis, header.line)
      return
    }

    const cell = this.cell(event.target)

    this.actions.preview(cell ? Number(cell.dataset['cell']) : null)
  }

  /** Touch movement remains native; only a stationary hold is eligible for secondary marking. */
  private readonly down = (event: PointerEvent): void => {
    this.actions.unlock()
    this.cancelGesture()
    this.hold = null
    this.suppressUntil = 0
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      event.pointerType === 'mouse' ||
      this.actions.blocked
    )
      return

    const header = this.header(event.target)
    if (header) {
      this.suppressUntil = performance.now() + 700
      this.headerHold = {
        ...header,
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        started: performance.now(),
      }
      this.actions.previewLine(header.axis, header.line)

      return
    }

    const cell = this.cell(event.target)
    if (!cell) return

    const hold: SurveyHold = {
      pointer: event.pointerId,
      index: Number(cell.dataset['cell']),
      x: event.clientX,
      y: event.clientY,
      cancelled: false,
      acted: false,
    }

    this.hold = hold
    this.actions.focus(hold.index)
    this.timer = window.setTimeout(() => {
      if (this.hold !== hold || hold.cancelled || this.actions.blocked) return

      hold.acted = true
      this.suppressUntil = performance.now() + 700
      this.actions.secondary(hold.index)
    }, 450)
  }

  /** A moved finger cancels even if it later returns to the original square. */
  private readonly move = (event: PointerEvent): void => {
    if (
      this.headerHold?.pointer === event.pointerId &&
      Math.hypot(event.clientX - this.headerHold.x, event.clientY - this.headerHold.y) > 10
    )
      this.cancelGesture()
    if (
      this.hold?.pointer === event.pointerId &&
      Math.hypot(event.clientX - this.hold.x, event.clientY - this.hold.y) > 10
    )
      this.cancelGesture()
  }

  /** A tap activates its original square exactly once; scrolling never excavates a cell. */
  private readonly up = (event: PointerEvent): void => {
    if (this.headerHold?.pointer === event.pointerId) {
      this.finishHeaderTap(event)
      return
    }

    const hold = this.hold
    if (!hold || hold.pointer !== event.pointerId) return

    clearTimeout(this.timer)
    this.hold = null
    this.suppressUntil = performance.now() + 700
    if (
      !hold.cancelled &&
      !hold.acted &&
      !this.actions.blocked &&
      Math.hypot(event.clientX - hold.x, event.clientY - hold.y) <= 10
    )
      this.actions.play(hold.index)
  }

  /** Open the touched clue on one short, stationary tap and suppress the browser's duplicate click. */
  private finishHeaderTap(event: PointerEvent): void {
    const hold = this.headerHold

    this.headerHold = null

    const now = performance.now()

    this.suppressUntil = now + 700
    if (
      !hold ||
      this.actions.blocked ||
      now - hold.started > 400 ||
      Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > 10
    )
      return

    this.actions.openLine(hold.axis, hold.line)
  }

  /** Reject duplicate native menus from touch holds; keyboard context menus remain usable. */
  private readonly contextMenu = (event: MouseEvent): void => {
    const cell = this.cell(event.target)
    if (!cell) return

    event.preventDefault()
    if (!this.hold && performance.now() >= this.suppressUntil && !this.actions.blocked)
      this.actions.secondary(Number(cell.dataset['cell']))
  }

  /** Cancel every pending gesture before saving and showing the privacy cover. */
  private readonly suspend = (): void => {
    this.cancelGesture()
    this.actions.suspend()
  }

  /** Resolve nested icon targets only inside this mounted board. */
  private cell(target: EventTarget | null): HTMLElement | null {
    const cell = target instanceof Element ? target.closest<HTMLElement>('[data-cell]') : null
    return cell && this.root.contains(cell) ? cell : null
  }

  /** Decode only mounted clue buttons; row and column remain a concrete union at the input boundary. */
  private header(target: EventTarget | null): SurveyHeader | null {
    const element =
      target instanceof Element
        ? target.closest<HTMLElement>('.survey-line[data-axis][data-line]')
        : null
    if (!element || !this.root.contains(element)) return null

    const axis = element.dataset['axis']
    const line = Number(element.dataset['line'])

    return (axis === 'row' || axis === 'column') && Number.isInteger(line) && line >= 0
      ? { axis, line }
      : null
  }
}
