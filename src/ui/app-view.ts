import type { SessionState } from '../application/game-session.js'
import { stats } from '../game/engine.js'
import { translations, type Language } from '../i18n.js'
import { icon } from '../icons.js'
import type { Score } from '../storage.js'
import { BoardView } from './board-view.js'
import { formatTime, statusText } from './presentation.js'
import { appTemplate } from './templates.js'

/** Owns application DOM updates and modal presentation, without changing game state. */
export class AppView {
  private readonly root: HTMLElement
  private readonly onDialogClose: () => void
  private board: BoardView | null = null

  /** Receive the mount point and notify the controller when a native dialog closes. */
  constructor(root: HTMLElement, onDialogClose: () => void) {
    this.root = root
    this.onDialogClose = onDialogClose
  }

  /** Expose the browser's actual dialog state for keyboard input routing. */
  get dialogOpen(): boolean {
    return this.element<HTMLDialogElement>('#dialog').open
  }

  /** Rebuild the shell on a new board or language change, optionally resetting focus. */
  mount(state: SessionState, language: Language, flagMode: boolean, resetFocus: boolean): void {
    const messages = translations[language]
    const focusIndex = resetFocus ? 0 : (this.board?.focusIndex ?? 0)

    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
    document.title = `${messages.title} · Minesweeper 2.0`
    this.root.innerHTML = appTemplate(state, language, flagMode)
    this.board = new BoardView(this.element('#board'), state.game.config, focusIndex)

    this.element<HTMLDialogElement>('#dialog').addEventListener('close', this.onDialogClose)
  }

  /** Update the board and controls from one consistent application snapshot. */
  render(
    state: SessionState,
    language: Language,
    flagMode: boolean,
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

    this.element('[data-action="reveal-mode"]').setAttribute('aria-pressed', String(!flagMode))
    this.element('[data-action="flag-mode"]').setAttribute('aria-pressed', String(flagMode))
    this.renderTime(state.elapsed, storageAvailable)
  }

  /** Refresh the small clock region without re-rendering every board cell. */
  renderTime(elapsed: number, storageAvailable: boolean): void {
    this.element('#timer').textContent = formatTime(elapsed)
    this.element('#storage-note').hidden = storageAvailable
  }

  /** Replace modal content, preserving an already-open dialog and its focus scope. */
  showDialog(content: string): void {
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
  navigate(index: number, key: string): boolean {
    return this.board?.navigate(index, key) ?? false
  }

  /** Release the mounted DOM when the application is disposed or hot-reloaded. */
  dispose(): void {
    this.board = null
    this.root.replaceChildren()
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
