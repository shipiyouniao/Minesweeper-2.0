import { BoardRightClick } from './board-right-click.js'
import { parseVariantDifficulty } from '../game/variant-difficulty.js'
import {
  parseEquipment,
  parseProfession,
  parseRelic,
  parseUpgrade,
} from '../persistence/variant-decoders.js'
import type {
  VariantCellHold,
  VariantCellTarget,
  VariantCommand,
  VariantInputActions,
} from '../types/variant-ui.js'
import { parseNavigation } from './input-parser.js'
import { DungeonToolController } from './dungeon-tool-controller.js'
import type { DungeonTool } from '../types/dungeon-ui.js'

/** Convert button data into a finite command and its validated catalog payload. */
export function parseVariantCommand(value: string): VariantCommand | null {
  const parts = value.split(':')
  if (parts.length > 2) return null
  const [type, id] = parts
  switch (type) {
    case 'descend':
    case 'rewards':
    case 'result':
    case 'zoom':
    case 'start':
    case 'camp':
    case 'probe':
    case 'scan':
    case 'skill':
    case 'attack':
    case 'brace':
    case 'end-turn':
    case 'shift':
    case 'help':
    case 'records':
    case 'retreat':
    case 'restart':
    case 'flag-mode':
    case 'reveal-mode':
    case 'safe-mode':
    case 'chord-mode':
    case 'sound':
    case 'pause':
    case 'confirm':
    case 'cancel':
      return id === undefined ? { type } : null
    case 'difficulty': {
      const parsed = parseVariantDifficulty(id ?? null)
      return parsed ? { type, value: parsed } : null
    }
    case 'profession': {
      const parsed = parseProfession(id ?? null)
      return parsed ? { type, value: parsed } : null
    }
    case 'equipment': {
      const parsed = parseEquipment(id ?? null)
      return parsed ? { type, value: parsed } : null
    }
    case 'upgrade': {
      const parsed = parseUpgrade(id ?? null)
      return parsed ? { type, value: parsed } : null
    }
    case 'relic': {
      const parsed = parseRelic(id ?? null)
      return parsed ? { type, value: parsed } : null
    }
    default:
      return null
  }
}

/** Decode a cell index and board side without coercing absent attributes into zero. */
function cellTarget(target: EventTarget | null): VariantCellTarget | null {
  const cell = target instanceof Element ? target.closest<HTMLElement>('[data-cell]') : null
  const grid = cell?.closest<HTMLElement>('[data-side]')
  const side = grid?.dataset['side']
  const text = cell?.dataset['cell']
  if ((side !== 'a' && side !== 'b') || text === undefined || !/^\d+$/.test(text)) return null
  const index = Number(text)
  return index >= 0 && index < Number(grid?.dataset['cells']) ? { side, index } : null
}

/** Owns special-mode input, touch holds and explicit inventory targeting. */
export class VariantInput {
  private readonly tools: DungeonToolController
  private readonly actions: VariantInputActions
  private readonly listeners = new AbortController()
  private readonly rightClick: BoardRightClick
  private hold: VariantCellHold | null = null
  private holdTimer: number | undefined
  private suppressUntil = 0
  private touchUntil = 0

  /** Delegate input once so view updates cannot accumulate event handlers. */
  constructor(root: HTMLElement, actions: VariantInputActions) {
    this.actions = actions
    this.rightClick = new BoardRightClick(root, (element) => {
      const cell = cellTarget(element)
      if (cell) {
        this.actions.unlock()
        this.actions.play(cell.side, cell.index, true)
      }
    })
    this.tools = new DungeonToolController(root, actions)
    const options = { signal: this.listeners.signal }
    root.addEventListener('click', this.click, options)
    root.addEventListener('contextmenu', this.context, options)
    root.addEventListener('focusin', this.focus, options)
    root.addEventListener('keydown', this.key, options)
    root.addEventListener('pointerdown', this.pointerDown, options)
    root.addEventListener('pointermove', this.hover, options)
    root.addEventListener('pointerleave', () => actions.previewRoute(null), options)
    document.addEventListener('visibilitychange', this.visibility, options)
    window.addEventListener('pagehide', this.suspend, options)
    // Releases can target a replacement cell after a flag redraws the board.
    window.addEventListener('pointermove', this.pointerMove, options)
    window.addEventListener('pointerup', this.pointerUp, options)
    window.addEventListener('pointercancel', this.pointerCancel, options)
    window.addEventListener('scroll', this.cancelHold, { ...options, capture: true, passive: true })
  }

  /** Release root, document and page lifecycle listeners together. */
  dispose(): void {
    this.rightClick.dispose()
    this.endHold()
    this.tools.dispose()
    this.listeners.abort()
  }

  /** Route native button clicks and touch taps through decoded application intents. */
  private readonly click = (event: MouseEvent): void => {
    if (
      this.tools.suppressClick ||
      this.hold?.cancelled ||
      performance.now() < this.suppressUntil
    ) {
      event.preventDefault()
      return
    }
    const cell = cellTarget(event.target)
    if (cell) {
      if (cell.side === 'a' && this.tools.activate(cell.index)) return
      this.actions.play(cell.side, cell.index)
      return
    }
    const target =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-control]') : null
    const command = parseVariantCommand(target?.dataset['control'] ?? '')
    if (command) this.actions.command(command)
    else if (event.target instanceof Element && event.target.closest('summary, a'))
      this.actions.feedback('tap')
  }

  /** Replace the board context menu with a flag action. */
  private readonly context = (event: MouseEvent): void => {
    const cell = cellTarget(event.target)
    if (!cell) return
    event.preventDefault()
    if (this.hold) {
      this.flagHold()
      return
    }
    if (performance.now() < this.suppressUntil) return
    this.actions.play(cell.side, cell.index, true)
  }

  /** Update each grid's roving tab stop without emitting render-induced sounds. */
  private readonly focus = (event: FocusEvent): void => {
    const cell = cellTarget(event.target)
    if (cell) {
      this.actions.focus(cell.side, cell.index)
      // Touch focus must not shrink the above-board route hint and move the tapped row.
      if (this.hold || performance.now() < this.touchUntil) return
      if (cell.side === 'a') this.tools.preview(cell.index)
      this.actions.previewRoute(cell.side === 'a' ? cell.index : null)
    }
  }

  /** Let mouse users inspect the same route and cost shown by keyboard focus. */
  private readonly hover = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || this.hold || performance.now() < this.touchUntil) return
    const cell = cellTarget(event.target)
    this.actions.previewRoute(cell?.side === 'a' ? cell.index : null)
  }

  /** Keep native Enter/Space activation while adding arrows, F and Tab feedback. */
  private readonly key = (event: KeyboardEvent): void => {
    this.endHold()
    this.touchUntil = 0
    this.suppressUntil = 0
    if (event.key === 'Escape') {
      this.tools.cancel()
      this.actions.feedback('dismiss')
    }
    this.actions.unlock()
    if (
      event.key === 'Tab' &&
      !(event.target instanceof Element && event.target.closest('.language-picker'))
    )
      this.actions.feedback('navigate')
    const cell = cellTarget(event.target)
    if (
      !cell ||
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return
    const key = event.key.toLowerCase()
    const navigation = parseNavigation(key)

    if (navigation) {
      event.preventDefault()
      this.actions.navigate(cell.side, cell.index, navigation)
    } else if (key === 's' || key === 'c') {
      event.preventDefault()
      if (key === 's') this.actions.annotate(cell.side, cell.index)
      else this.actions.chord(cell.side, cell.index)
    } else if (key === 'f') {
      event.preventDefault()
      this.actions.play(cell.side, cell.index, true)
    }
  }

  /** Arm an explicitly chosen inventory tool without applying it to a hidden focus position. */
  selectTool(tool: DungeonTool): void {
    this.tools.select(tool)
  }

  /** Cancel stale gestures before replacing a floor or changing page state. */
  cancelTools(): void {
    this.rightClick.cancel()
    this.endHold()
    this.tools.cancel()
  }

  /** Start a stationary touch/pen hold while retaining normal browser panning. */
  private readonly pointerDown = (event: PointerEvent): void => {
    this.actions.unlock()
    if (!event.isPrimary) {
      this.cancelHold()
      return
    }
    this.endHold()
    this.suppressUntil = 0
    this.touchUntil = event.pointerType === 'mouse' ? 0 : performance.now() + 700
    const target = cellTarget(event.target)
    if (!target || event.pointerType === 'mouse' || event.button !== 0) return
    this.hold = {
      pointerId: event.pointerId,
      target,
      originX: event.clientX,
      originY: event.clientY,
      cancelled: false,
    }
    if (!this.tools.armed) this.holdTimer = window.setTimeout(this.flagHold, 450)
  }

  /** Flag the captured cell once, before any native menu or synthetic click can run. */
  private readonly flagHold = (): void => {
    const hold = this.hold
    if (!hold || hold.cancelled || this.tools.armed) return
    this.cancelHold()
    this.suppressUntil = performance.now() + 700
    this.actions.play(hold.target.side, hold.target.index, true)
  }

  /** Movement beyond touch slop belongs to scrolling, not a flag action. */
  private readonly pointerMove = (event: PointerEvent): void => {
    const hold = this.hold
    if (
      hold?.pointerId === event.pointerId &&
      Math.hypot(event.clientX - hold.originX, event.clientY - hold.originY) > 10
    )
      this.cancelHold()
  }

  /** Suppress a completed hold's release click while ordinary taps remain native clicks. */
  private readonly pointerUp = (event: PointerEvent): void => {
    if (this.hold?.pointerId === event.pointerId) this.endHold()
  }

  /** Browser-owned scrolling or pinch gestures must not leave a pending flag timer. */
  private readonly pointerCancel = (event: PointerEvent): void => {
    if (this.hold?.pointerId !== event.pointerId) return
    this.cancelHold()
    this.endHold()
  }

  /** Cancel the action but retain its identity until release to absorb a later native menu. */
  private readonly cancelHold = (): void => {
    clearTimeout(this.holdTimer)
    this.holdTimer = undefined
    if (this.hold) this.hold.cancelled = true
  }

  /** Release gesture state on pointer end, lifecycle changes or keyboard input. */
  private endHold(): void {
    clearTimeout(this.holdTimer)
    this.holdTimer = undefined
    if (this.hold) {
      this.touchUntil = performance.now() + 700
      if (this.hold.cancelled) this.suppressUntil = this.touchUntil
    }
    this.hold = null
  }

  /** Cover and checkpoint only when the document actually becomes hidden. */
  private readonly visibility = (): void => {
    if (document.hidden) this.suspend()
  }

  /** Checkpoint on page navigation and back-forward cache entry. */
  private readonly suspend = (): void => {
    this.endHold()
    this.actions.suspend()
  }
}
