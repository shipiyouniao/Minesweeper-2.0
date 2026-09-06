import type { InteractionCue } from '../types/audio.js'

/** Own the title flyout's focus and dismissal while the application owns selection and persistence. */
export class TitleMenu {
  private readonly root: HTMLElement
  private readonly feedback: (cue: InteractionCue) => void
  private readonly trigger: HTMLButtonElement
  private readonly panel: HTMLElement
  private readonly options: readonly HTMLButtonElement[]
  private readonly listeners = new AbortController()

  /** Bind one rendered picker; its owner disposes it before replacing any of this markup. */
  constructor(root: HTMLElement, feedback: (cue: InteractionCue) => void) {
    const trigger = root.querySelector<HTMLButtonElement>('.title-trigger')
    const panel = root.querySelector<HTMLElement>('.title-options')
    if (!trigger || !panel) throw new Error('Title picker markup is incomplete')

    this.root = root
    this.feedback = feedback
    this.trigger = trigger
    this.panel = panel
    this.options = [...panel.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')]
    const options = { signal: this.listeners.signal }
    trigger.addEventListener('click', this.toggle, options)
    panel.addEventListener('click', this.select, options)
    root.addEventListener('keydown', this.key, options)
    root.addEventListener('focusout', this.focusOut, options)
    document.addEventListener('pointerdown', this.outside, options)
    window.addEventListener('resize', this.close, options)
  }

  /** Remove document listeners along with this rendered picker. */
  dispose(): void {
    this.listeners.abort()
  }

  /** Dismiss without committing the focused option or stealing an outside action's focus. */
  private readonly close = (): void => {
    this.panel.hidden = true
    this.trigger.setAttribute('aria-expanded', 'false')
  }

  /** Open a bounded overlay and start at the equipped title, leaving the page layout unchanged. */
  private open(): void {
    this.panel.hidden = false
    this.trigger.setAttribute('aria-expanded', 'true')
    const bounds = this.trigger.getBoundingClientRect()
    const dock = document.querySelector('.action-dock')?.getBoundingClientRect().top ?? innerHeight
    const below = Math.min(innerHeight, dock) - bounds.bottom - 12
    const above = bounds.top - 12
    const upward = below < 160 && above > below
    this.panel.classList.toggle('opens-up', upward)
    this.panel.style.maxHeight = `${Math.min(280, Math.max(80, upward ? above : below))}px`
    this.focusOption(
      Math.max(
        0,
        this.options.findIndex((option) => option.getAttribute('aria-checked') === 'true'),
      ),
    )
  }

  /** Scroll only the option list when moving its keyboard focus. */
  private focusOption(index: number): void {
    const option = this.options[Math.max(0, Math.min(this.options.length - 1, index))]
    if (!option) return

    for (const item of this.options) item.tabIndex = item === option ? 0 : -1
    option.focus({ preventScroll: true })
    const top = option.offsetTop
    if (top < this.panel.scrollTop) this.panel.scrollTop = top
    else if (top + option.offsetHeight > this.panel.scrollTop + this.panel.clientHeight)
      this.panel.scrollTop = top + option.offsetHeight - this.panel.clientHeight
  }

  /** Native trigger activation works equally with a mouse, touch, Enter or Space. */
  private readonly toggle = (): void => {
    this.feedback(this.panel.hidden ? 'tap' : 'dismiss')
    if (this.panel.hidden) this.open()
    else this.close()
  }

  /** Close before the existing delegated title command updates the camp and replaces this view. */
  private readonly select = (event: MouseEvent): void => {
    if (!(event.target instanceof Element) || !event.target.closest('[role="menuitemradio"]'))
      return

    this.close()
    this.trigger.focus({ preventScroll: true })
  }

  /** Navigate without selecting; Enter/Space commit through the focused option's native click. */
  private readonly key = (event: KeyboardEvent): void => {
    event.stopPropagation()
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (!this.panel.hidden) {
        if (event.key === 'Escape') event.preventDefault()
        this.close()
        this.trigger.focus({ preventScroll: true })
      }
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

    event.preventDefault()
    const wasClosed = this.panel.hidden
    if (wasClosed) this.open()
    const index = this.options.findIndex((option) => option === document.activeElement)
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? this.options.length - 1
          : index + (wasClosed ? 0 : event.key === 'ArrowDown' ? 1 : -1)
    this.focusOption(next)
    this.feedback('navigate')
  }

  /** Dismiss when normal Tab navigation or another control takes focus. */
  private readonly focusOut = (event: FocusEvent): void => {
    if (!(event.relatedTarget instanceof Node) || !this.root.contains(event.relatedTarget))
      this.close()
  }

  /** Let the outside pointer action proceed after dismissing the overlay. */
  private readonly outside = (event: PointerEvent): void => {
    if (event.target instanceof Node && !this.root.contains(event.target)) this.close()
  }
}
