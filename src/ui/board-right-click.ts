import type { BoardRightPress } from '../types/ui.js'

/** Own board right-clicks early, rejecting drags while leaving touch and outside input alone. */
export class BoardRightClick {
  private readonly root: HTMLElement
  private readonly flag: (cell: HTMLElement) => void
  private readonly listeners = new AbortController()
  private press: BoardRightPress | null = null
  private suppressUntil = 0

  /** Capture page-visible mouse events before delegated game and bubbling extension listeners. */
  constructor(root: HTMLElement, flag: (cell: HTMLElement) => void) {
    this.root = root
    this.flag = flag
    const options = { signal: this.listeners.signal, capture: true }
    root.addEventListener('pointerdown', this.down, options)
    root.addEventListener('mousedown', this.mouse, options)
    root.addEventListener('contextmenu', this.context, options)
    window.addEventListener('pointermove', this.move, options)
    window.addEventListener('pointerup', this.up, options)
    window.addEventListener('pointercancel', this.cancel, options)
    window.addEventListener('mousemove', this.mouse, options)
    window.addEventListener('mouseup', this.mouse, options)
    window.addEventListener('blur', this.cancel, options)
  }

  /** Teardown also discards a pressed square from a replaced board. */
  dispose(): void {
    this.cancel()
    this.listeners.abort()
  }

  /** Suppress a late native menu after cancellation, without manufacturing a flag. */
  readonly cancel = (): void => {
    if (this.press) this.suppressUntil = performance.now() + 700
    this.press = null
  }

  /** Begin only mouse right presses inside a game cell. */
  private readonly down = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || event.button !== 2) return
    const cell =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cell]') : null
    if (!cell || !this.root.contains(cell)) return
    this.block(event)
    this.press = {
      pointerId: event.pointerId,
      cell,
      x: event.clientX,
      y: event.clientY,
      cancelled: false,
    }
  }

  /** Crossing the movement threshold cancels the entire press, even when dragged back. */
  private readonly move = (event: PointerEvent): void => {
    const press = this.press
    if (!press || event.pointerId !== press.pointerId) return
    if ((event.buttons & 2) === 0) {
      this.cancel()
      return
    }
    this.block(event)
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) press.cancelled = true
  }

  /** Flag the original square once on release; a drag or detached square does nothing. */
  private readonly up = (event: PointerEvent): void => {
    const press = this.press
    if (!press || event.pointerId !== press.pointerId) return
    this.block(event)
    this.cancel()
    const bounds = press.cell.getBoundingClientRect()
    if (
      !press.cancelled &&
      this.root.contains(press.cell) &&
      Math.hypot(event.clientX - press.x, event.clientY - press.y) <= 8 &&
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom
    )
      this.flag(press.cell)
  }

  /** Consume compatibility mouse events only for a right gesture owned by this board. */
  private readonly mouse = (event: MouseEvent): void => {
    const inside =
      event.target instanceof Element &&
      this.root.contains(event.target) &&
      event.target.closest('[data-cell]') !== null
    if (this.press || (inside && event.button === 2 && performance.now() < this.suppressUntil))
      this.block(event)
  }

  /** Touch holds and keyboard menus remain with the input adapter; right menus never double-flag. */
  private readonly context = (event: MouseEvent): void => {
    const cell = event.target instanceof Element ? event.target.closest('[data-cell]') : null
    if (this.press || (cell && performance.now() < this.suppressUntil)) this.block(event)
  }

  /** Stop cancelable page defaults and subsequent page listeners, not browser-owned gesture engines. */
  private block(event: Event): void {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
}
