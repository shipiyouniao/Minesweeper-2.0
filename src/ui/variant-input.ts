import { parseVariantDifficulty } from '../game/variant-difficulty.js'
import {
  parseEquipment,
  parseProfession,
  parseRelic,
  parseUpgrade,
} from '../persistence/variant-decoders.js'
import type { VariantCellTarget, VariantCommand, VariantInputActions } from '../types/variant-ui.js'
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
    case 'zoom':
    case 'start':
    case 'camp':
    case 'probe':
    case 'scan':
    case 'skill':
    case 'attack':
    case 'brace':
    case 'end-turn':
    case 'help':
    case 'records':
    case 'retreat':
    case 'restart':
    case 'flag-mode':
    case 'reveal-mode':
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

/** Owns special-mode browser listeners; touch uses the explicit reveal/flag toggle. */
export class VariantInput {
  private readonly tools: DungeonToolController
  private readonly actions: VariantInputActions
  private readonly listeners = new AbortController()

  /** Delegate input once so view updates cannot accumulate event handlers. */
  constructor(root: HTMLElement, actions: VariantInputActions) {
    this.actions = actions
    this.tools = new DungeonToolController(root, actions)
    const options = { signal: this.listeners.signal }
    root.addEventListener('click', this.click, options)
    root.addEventListener('contextmenu', this.context, options)
    root.addEventListener('focusin', this.focus, options)
    root.addEventListener('keydown', this.key, options)
    root.addEventListener('pointerdown', this.unlock, options)
    root.addEventListener('pointermove', this.hover, options)
    root.addEventListener('pointerleave', () => actions.previewRoute(null), options)
    document.addEventListener('visibilitychange', this.visibility, options)
    window.addEventListener('pagehide', this.suspend, options)
  }

  /** Release root, document and page lifecycle listeners together. */
  dispose(): void {
    this.tools.dispose()
    this.listeners.abort()
  }

  /** Route native button clicks and touch taps through decoded application intents. */
  private readonly click = (event: MouseEvent): void => {
    if (this.tools.suppressClick) return
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
    this.actions.play(cell.side, cell.index, true)
  }

  /** Update each grid's roving tab stop without emitting render-induced sounds. */
  private readonly focus = (event: FocusEvent): void => {
    const cell = cellTarget(event.target)
    if (cell) {
      this.actions.focus(cell.side, cell.index)
      if (cell.side === 'a') this.tools.preview(cell.index)
      this.actions.previewRoute(cell.side === 'a' ? cell.index : null)
    }
  }

  /** Let mouse users inspect the same route and cost shown by keyboard focus. */
  private readonly hover = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return
    const cell = cellTarget(event.target)
    this.actions.previewRoute(cell?.side === 'a' ? cell.index : null)
  }

  /** Keep native Enter/Space activation while adding arrows, F and Tab feedback. */
  private readonly key = (event: KeyboardEvent): void => {
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
    if (!cell || event.altKey || event.ctrlKey || event.metaKey) return
    const key = event.key.toLowerCase()
    const navigation = parseNavigation(key)

    if (navigation) {
      event.preventDefault()
      this.actions.navigate(cell.side, cell.index, navigation)
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
    this.tools.cancel()
  }

  /** Warm audio inside a pointer gesture, before any later action needs it. */
  private readonly unlock = (): void => {
    this.actions.unlock()
  }

  /** Cover and checkpoint only when the document actually becomes hidden. */
  private readonly visibility = (): void => {
    if (document.hidden) this.actions.suspend()
  }

  /** Checkpoint on page navigation and back-forward cache entry. */
  private readonly suspend = (): void => {
    this.actions.suspend()
  }
}
