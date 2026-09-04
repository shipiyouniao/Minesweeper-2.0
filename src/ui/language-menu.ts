import type { Language } from '../types/localization.js'
import type { InteractionCue } from '../types/audio.js'
import { parseLanguage } from '../i18n.js'

/** Owns the language flyout's focus, dismissal, and listener lifecycle. */
export class LanguageMenu {
  private readonly root: HTMLElement
  private readonly trigger: HTMLButtonElement
  private readonly panel: HTMLElement
  private readonly options: readonly HTMLButtonElement[]
  private readonly onSelect: (language: Language) => void
  private readonly onFeedback: (cue: InteractionCue) => void
  private readonly listeners = new AbortController()

  /** Bind the small menu independently of board shortcuts and application commands. */
  constructor(
    root: HTMLElement,
    onSelect: (language: Language) => void,
    onFeedback: (cue: InteractionCue) => void,
  ) {
    const trigger = root.querySelector<HTMLButtonElement>('.language-trigger')
    const panel = root.querySelector<HTMLElement>('[role="menu"]')
    if (!trigger || !panel) throw new Error('Language menu markup is incomplete')

    this.root = root
    this.trigger = trigger
    this.panel = panel
    this.options = [...panel.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')]
    this.onSelect = onSelect
    this.onFeedback = onFeedback

    const options = { signal: this.listeners.signal }
    trigger.addEventListener('click', this.toggle, options)
    panel.addEventListener('click', this.select, options)
    root.addEventListener('keydown', this.handleKey, options)
    root.addEventListener('focusout', this.handleFocusOut, options)
    document.addEventListener('pointerdown', this.handleOutside, options)
  }

  /** Hide the menu without stealing focus from an outside click or newly opened dialog. */
  close(feedback = false): void {
    if (feedback && !this.panel.hidden) this.onFeedback('dismiss')

    this.panel.hidden = true
    this.trigger.setAttribute('aria-expanded', 'false')
  }

  /** Restore a stable focus target after translated markup replaces the previous trigger. */
  focus(): void {
    this.trigger.focus()
  }

  /** Remove document listeners before replacing the shell or tearing down the application. */
  dispose(): void {
    this.listeners.abort()
  }

  /** Open at the selected language so keyboard and touch users receive the same context. */
  private open(): void {
    this.onFeedback('tap')
    this.panel.hidden = false
    this.trigger.setAttribute('aria-expanded', 'true')
    this.focusOption(
      this.options.findIndex((option) => option.getAttribute('aria-checked') === 'true'),
      false,
    )
  }

  /** Keep exactly one option in the tab order while arrow keys move within the menu. */
  private focusOption(index: number, feedback = true): void {
    const next = this.options[(index + this.options.length) % this.options.length]

    for (const option of this.options) {
      option.tabIndex = option === next ? 0 : -1
    }

    next?.focus()
    if (next && feedback) this.onFeedback('navigate')
  }

  /** Toggle on native button activation, including Enter and Space. */
  private readonly toggle = (): void => {
    if (this.panel.hidden) this.open()
    else this.close(true)
  }

  /** Decode only supported locale values before replacing any application markup. */
  private readonly select = (event: MouseEvent): void => {
    const option =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('[data-language]')
        : null
    const language = parseLanguage(option?.dataset['language'] ?? null)

    if (language) {
      this.close()
      this.onSelect(language)
    }
  }

  /** Support the standard menu keys without allowing them to reach board shortcuts. */
  private readonly handleKey = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') {
      // Continue native tab navigation from the trigger after removing the menu's tab stop.
      if (!this.panel.hidden) {
        this.close()
        this.focus()
      }

      this.onFeedback('navigate')
      return
    }

    if (event.key === 'Escape' && !this.panel.hidden) {
      event.preventDefault()
      event.stopPropagation()
      this.close(true)
      this.focus()
      return
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

    event.preventDefault()
    event.stopPropagation()

    if (this.panel.hidden) {
      this.open()
      return
    }

    const index = this.options.findIndex((option) => option === document.activeElement)
    let next = index + (event.key === 'ArrowDown' ? 1 : -1)

    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = this.options.length - 1

    this.focusOption(next)
  }

  /** Let Tab leave naturally, then dismiss once focus has left the whole flyout. */
  private readonly handleFocusOut = (event: FocusEvent): void => {
    if (!(event.relatedTarget instanceof Node) || !this.root.contains(event.relatedTarget)) {
      this.close()
    }
  }

  /** Dismiss on an outside pointer action without interfering with its original target. */
  private readonly handleOutside = (event: PointerEvent): void => {
    if (event.target instanceof Node && !this.root.contains(event.target)) this.close(true)
  }
}
