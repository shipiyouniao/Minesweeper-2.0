import type { BoardInputMode } from '../types/ui.js'
import type { NavigationKey, NavigationResult } from '../types/ui.js'
import type { InteractionCue } from '../types/audio.js'
import type { SessionState } from '../types/session.js'
import type { Language } from '../types/localization.js'
import type { Score } from '../types/storage.js'
import { stats } from '../game/engine.js'
import { translations } from '../i18n.js'
import { icon } from '../icons.js'
import { BoardView } from './board-view.js'
import { LanguageMenu } from './language-menu.js'
import { formatTime, statusText } from './presentation.js'
import { appTemplate } from './templates.js'

/** Owns application DOM updates and modal presentation, without changing game state. */
export class AppView {
  private readonly root: HTMLElement
  private readonly onDialogClose: () => void
  private board: BoardView | null = null
  private menu: LanguageMenu | null = null
  private readonly onLanguageChange: (language: Language) => void
  private readonly onFeedback: (cue: InteractionCue) => void
  private readonly resizing = new ResizeObserver(() => this.updateOverflowHint())

  /** Receive the mount point and notify the controller when a native dialog closes. */
  constructor(
    root: HTMLElement,
    onDialogClose: () => void,
    onLanguageChange: (language: Language) => void,
    onFeedback: (cue: InteractionCue) => void,
  ) {
    this.root = root
    this.onDialogClose = onDialogClose
    this.onLanguageChange = onLanguageChange
    this.onFeedback = onFeedback
  }

  /** Expose the browser's actual dialog state for keyboard input routing. */
  get dialogOpen(): boolean {
    return this.element<HTMLDialogElement>('#dialog').open
  }

  /** Rebuild the shell on a new board or language change, optionally resetting focus. */
  mount(
    state: SessionState,
    language: Language,
    inputMode: BoardInputMode,
    resetFocus: boolean,
  ): void {
    const messages = translations[language]
    const focusIndex = resetFocus ? 0 : (this.board?.focusIndex ?? 0)

    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
    document.title = `${messages.title} · Minesweeper 2.0`
    this.menu?.dispose()
    this.resizing.disconnect()
    this.root.innerHTML = appTemplate(state, language, inputMode)
    this.element('.layout').classList.toggle('wide-board', state.game.config.width > 20)
    this.menu = new LanguageMenu(
      this.element('.language-picker'),
      this.onLanguageChange,
      this.onFeedback,
    )
    this.board = new BoardView(this.element('#board'), state.game.config, focusIndex)
    this.resizing.observe(this.element('.board-viewport'))
    this.resizing.observe(this.element('#board'))
    this.updateOverflowHint()

    this.element<HTMLDialogElement>('#dialog').addEventListener('close', this.onDialogClose)
    this.element<HTMLDialogElement>('#dialog').addEventListener('cancel', this.handleDialogCancel)
  }

  /** Update the board and controls from one consistent application snapshot. */
  render(
    state: SessionState,
    language: Language,
    inputMode: BoardInputMode,
    best: Score | undefined,
    storageAvailable: boolean,
  ): void {
    const { game, paused } = state
    const messages = translations[language]
    const counts = stats(game)

    this.board?.render(game, paused, messages)
    this.element('#pause-cover').hidden = !paused
    this.element('.board-viewport').classList.toggle('obscured', paused)
    this.element('#status').textContent = statusText(game, paused, messages)
    this.element('#status-dot').dataset['phase'] = game.phase

    this.element('#progress').textContent =
      `${counts.revealed} / ${game.cells.length - game.config.mines}`
    this.element('#progress').title = messages.progress
    this.element('#mine-count').textContent = String(game.config.mines - counts.flags).padStart(
      3,
      '0',
    )
    this.element('#best').textContent = best ? formatTime(best.milliseconds) : '—'

    const pauseButton = this.element<HTMLButtonElement>('#pause-button')
    pauseButton.disabled = game.phase !== 'playing'
    pauseButton.innerHTML = icon(paused ? 'play' : 'pause')
    pauseButton.setAttribute('aria-label', paused ? messages.resume : messages.pause)

    this.element('[data-action="reveal-mode"]').setAttribute(
      'aria-pressed',
      String(inputMode === 'reveal'),
    )
    this.element('[data-action="flag-mode"]').setAttribute(
      'aria-pressed',
      String(inputMode === 'flag'),
    )
    this.element('[data-action="safe-mode"]').setAttribute(
      'aria-pressed',
      String(inputMode === 'mark-safe'),
    )
    this.element('[data-action="chord-mode"]').setAttribute(
      'aria-pressed',
      String(inputMode === 'chord'),
    )
    this.renderTime(state.elapsed, storageAvailable)
  }

  /** Refresh the small clock region without re-rendering every board cell. */
  renderTime(elapsed: number, storageAvailable: boolean): void {
    this.element('#timer').textContent = formatTime(elapsed)
    this.element('#storage-note').hidden = storageAvailable
  }

  /** Keep the toggle's stable accessible name separate from its localized status. */
  renderSound(enabled: boolean, language: Language): void {
    const button = this.element<HTMLButtonElement>('#sound-button')
    const messages = translations[language]
    button.innerHTML = icon(enabled ? 'volume' : 'volumeOff')
    button.setAttribute('aria-pressed', String(enabled))
    button.title = enabled ? messages.soundOn : messages.soundOff
  }

  /** Return focus after a language choice rebuilds the translated shell. */
  focusLanguage(): void {
    this.menu?.focus()
  }

  /** Dismiss transient navigation when backgrounding or opening a modal. */
  closeLanguage(): void {
    this.menu?.close()
  }

  /** Replace modal content, preserving an already-open dialog and its focus scope. */
  showDialog(content: string): void {
    this.closeLanguage()
    const dialog = this.element<HTMLDialogElement>('#dialog')
    this.element('#dialog-content').innerHTML = content

    if (!dialog.open) {
      dialog.showModal()
    }
  }

  /** Close through the native API so Escape and buttons share one lifecycle callback. */
  closeDialog(): void {
    this.element<HTMLDialogElement>('#dialog').close()
  }

  /** Place validation feedback next to the custom-board form. */
  showCustomError(message: string): void {
    this.element('#custom-error').textContent = message
  }

  /** Delegate focus bookkeeping to the board that owns the cell buttons. */
  rememberFocus(index: number): void {
    this.board?.rememberFocus(index)
  }

  /** Delegate arrow/Home/End navigation and report whether the key was consumed. */
  navigate(index: number, key: NavigationKey): NavigationResult {
    return this.board?.navigate(index, key) ?? 'unavailable'
  }

  /** Native Escape dismissal has no command button, so acknowledge it at the DOM boundary. */
  private readonly handleDialogCancel = (): void => {
    this.onFeedback('dismiss')
  }

  /** Release the mounted DOM when the application is disposed or hot-reloaded. */
  dispose(): void {
    this.resizing.disconnect()
    this.menu?.dispose()
    this.menu = null
    this.board = null
    this.root.replaceChildren()
  }

  /** Show the scrolling hint only when the minimum cell size actually requires overflow. */
  private updateOverflowHint(): void {
    const viewport = this.element('.board-viewport')
    this.element('.scroll-hint').hidden = viewport.scrollWidth <= viewport.clientWidth + 1
  }

  /** Fail visibly when a template and its renderer disagree about a required element. */
  private element<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector)

    if (!element) {
      throw new Error(`Missing UI element: ${selector}`)
    }

    return element
  }
}
