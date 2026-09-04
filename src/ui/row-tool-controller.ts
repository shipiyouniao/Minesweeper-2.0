import type { RowTool, ToolDrag } from '../types/dungeon-ui.js'
import type { VariantInputActions } from '../types/variant-ui.js'

/** Decode only inventory controls that support explicit row targeting. */
function toolOf(element: Element | null): RowTool | null {
  const value = element?.closest<HTMLElement>('[data-tool]')?.dataset['tool']
  return value === 'probe' || value === 'scan' ? value : null
}

/** Own drag gestures and tap-to-target state for mouse, touch and keyboard alike. */
export class RowToolController {
  private readonly actions: VariantInputActions
  private readonly root: HTMLElement
  private readonly listeners = new AbortController()
  private selected: RowTool | null = null
  private drag: ToolDrag | null = null
  private suppressUntil = 0

  /** Delegate pointer events and keep gesture resources within one mounted mode. */
  constructor(root: HTMLElement, actions: VariantInputActions) {
    this.root = root
    this.actions = actions
    const options = { signal: this.listeners.signal }
    root.addEventListener('pointerdown', this.down, options)
    root.addEventListener('pointermove', this.move, options)
    root.addEventListener('pointerup', this.up, options)
    root.addEventListener('pointercancel', this.cancel, options)
  }

  /** Select an inventory item, or cancel it when activated a second time. */
  select(tool: RowTool): void {
    this.selected = this.selected === tool ? null : tool
    this.actions.previewTool(this.selected, null)
  }

  /** Prevent a drag's synthetic click from also revealing a tile or selecting the tool. */
  get suppressClick(): boolean {
    return performance.now() < this.suppressUntil
  }

  /** Consume a tap or native keyboard activation as an explicit row target. */
  activate(row: number): boolean {
    if (!this.selected) return false
    const tool = this.selected
    this.cancel()
    this.actions.useTool(tool, row)
    return true
  }

  /** Preview the hovered or keyboard-focused row while a tool is armed. */
  preview(row: number): void {
    if (this.selected) this.actions.previewTool(this.selected, row)
  }

  /** Clear selection on Escape, pause, language changes, floor changes or teardown. */
  readonly cancel = (): void => {
    this.drag = null
    this.selected = null
    this.actions.previewTool(null, null)
  }

  /** Release every listener before the owning app replaces its DOM. */
  dispose(): void {
    this.cancel()
    this.listeners.abort()
  }

  /** Start a candidate drag only from an enabled square tool button. */
  private readonly down = (event: PointerEvent): void => {
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('[data-tool]')
        : null
    const tool = toolOf(target)
    if (!target || target.disabled || !tool || event.button !== 0) return
    this.actions.unlock()
    this.drag = {
      pointerId: event.pointerId,
      tool,
      originX: event.clientX,
      originY: event.clientY,
      moved: false,
    }
    target.setPointerCapture(event.pointerId)
  }

  /** Highlight the entire row under the pointer without consuming a charge. */
  private readonly move = (event: PointerEvent): void => {
    const row = this.rowAt(event.clientX, event.clientY)
    if (!this.drag) {
      if (this.selected) this.actions.previewTool(this.selected, row)
      return
    }
    if (event.pointerId !== this.drag.pointerId) return
    if (Math.hypot(event.clientX - this.drag.originX, event.clientY - this.drag.originY) > 6)
      this.drag.moved = true
    if (this.drag.moved) this.actions.previewTool(this.drag.tool, row)
  }

  /** Apply one drop, rejecting off-board targets without spending a tool. */
  private readonly up = (event: PointerEvent): void => {
    const drag = this.drag
    if (!drag || drag.pointerId !== event.pointerId) return
    this.drag = null
    if (!drag.moved) return
    this.suppressUntil = performance.now() + 350
    const row = this.rowAt(event.clientX, event.clientY)
    this.selected = null
    this.actions.previewTool(null, null)
    if (row !== null) this.actions.useTool(drag.tool, row)
    else this.actions.feedback('blocked')
  }

  /** Hit-test only the expedition board owned by this input controller. */
  private rowAt(x: number, y: number): number | null {
    const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell]')
    if (
      !element ||
      !this.root.contains(element) ||
      element.closest<HTMLElement>('[data-side]')?.dataset['side'] !== 'a'
    )
      return null
    const index = Number(element.dataset['cell'])
    return Number.isInteger(index) && index >= 0 && index < 81 ? Math.floor(index / 9) : null
  }
}
