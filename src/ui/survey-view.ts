import { stats } from '../game/engine.js'
import { surveyLine } from '../game/survey.js'
import { message, translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { InteractionCue } from '../types/audio.js'
import type { Language } from '../types/localization.js'
import type { Survey, SurveyAxis } from '../types/survey.js'
import type { BoardInputMode, NavigationKey, NavigationResult } from '../types/ui.js'
import { boardControlHint, boardControlsTemplate } from './board-controls.js'
import { BoardView } from './board-view.js'
import { LanguageMenu } from './language-menu.js'
import { startTutorial, stopTutorial } from './tutorial-player.js'
import { surveyTemplate } from './survey-templates.js'

/** Keep cells stable while public line counts, focus and modal state change around them. */
export class SurveyView {
  private readonly root: HTMLElement
  private readonly language: Language
  private readonly board: BoardView
  private readonly menu: LanguageMenu
  private readonly dialog: HTMLDialogElement
  private readonly listeners = new AbortController()
  private state: Survey
  private clueState: Survey | null = null
  private targetRow = -1
  private targetColumn = -1
  private paused = false
  private enlarged = false
  private returnFocus: HTMLElement | null = null

  /** Mount one board and its axis headers; disposal releases every mode-owned listener. */
  constructor(
    root: HTMLElement,
    language: Language,
    state: Survey,
    onLanguage: (language: Language) => void,
    feedback: (cue: InteractionCue) => void,
    onClose: () => void,
    focus = 0,
  ) {
    this.root = root
    this.language = language
    this.state = state
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
    root.innerHTML = surveyTemplate(language, state)
    this.element('.tutorial-entry').dataset['control'] = 'help'
    this.element('.survey-grid').style.setProperty('--columns', String(state.game.config.width))
    this.board = new BoardView(this.element('.board'), state.game.config, focus)
    this.menu = new LanguageMenu(this.element('.language-picker'), onLanguage, feedback)
    this.dialog = this.element<HTMLDialogElement>('.survey-dialog')
    this.buildHeaders()
    const grid = this.element('.survey-grid')
    grid.style.setProperty(
      '--row-runs',
      String(Math.max(...state.rows.map((runs) => runs.length), 1)),
    )
    grid.style.setProperty(
      '--column-runs',
      String(Math.max(...state.columns.map((runs) => runs.length), 1)),
    )

    this.dialog.addEventListener(
      'close',
      () => {
        onClose()
        if (this.returnFocus?.isConnected) this.returnFocus.focus({ preventScroll: true })
        this.returnFocus = null
      },
      { signal: this.listeners.signal },
    )
    this.dialog.addEventListener('cancel', () => feedback('dismiss'), {
      signal: this.listeners.signal,
    })
  }

  /** Every input adapter consults the native dialog state. */
  get dialogOpen(): boolean {
    return this.dialog.open
  }

  /** Preserve the roving coordinate when rebuilding localized chrome. */
  get focusIndex(): number {
    return this.board.focusIndex
  }

  /** Repaint only visible evidence and keep every board-derived surface covered while paused. */
  render(
    state: Survey,
    paused: boolean,
    mode: BoardInputMode,
    sound: boolean,
    storage: string,
    limited: boolean,
  ): void {
    this.state = state
    this.paused = paused
    const t = translations[this.language]
    this.board.render(state.game, paused || this.dialogOpen, t)
    this.element('.board-viewport').classList.toggle('obscured', paused)
    this.element('.survey-pause').hidden = !paused
    this.element('.survey-sidebar').classList.toggle('survey-private', paused)
    this.element('.survey-sidebar').inert = paused
    this.element('.survey-storage').textContent = storage
    this.element('.survey-mode').innerHTML = boardControlsTemplate(
      this.language,
      mode,
      'data-control',
    )
    this.element('.survey-mode-hint').textContent = paused
      ? ''
      : mode === 'reveal'
        ? message(this.language, 'survey.hint')
        : mode === 'chord'
          ? message(this.language, 'survey.chord')
          : boardControlHint(this.language, mode)
    if (mode === 'chord')
      this.element('.mode-cycle').setAttribute('title', message(this.language, 'survey.chord'))
    this.element('.survey-counters').innerHTML =
      `<div><span class="tw:text-[clamp(12px,0.8vw,16px)] tw:text-muted">${message(this.language, 'survey.moves')}</span><strong class="tw:block tw:text-[clamp(24px,1.6vw,32px)] tw:mt-1">${state.moves.toLocaleString(this.language)}</strong></div><div><span class="tw:text-[clamp(12px,0.8vw,16px)] tw:text-muted">${message(this.language, 'survey.remaining')}</span><strong class="tw:block tw:text-[clamp(24px,1.6vw,32px)] tw:mt-1">${stats(state.game).remaining}</strong></div>`
    this.element('.survey-status').textContent = limited
      ? message(this.language, 'survey.limit')
      : state.moves === 0
        ? message(this.language, 'survey.opening')
        : ''
    const audio = this.element('[data-control="sound"]')
    audio.innerHTML = icon(sound ? 'volume' : 'volumeOff')
    audio.setAttribute('aria-pressed', String(sound))
    audio.setAttribute('title', sound ? t.soundOn : t.soundOff)
    const pause = this.element('[data-control="pause"]')
    pause.innerHTML = icon(paused ? 'play' : 'pause')
    pause.setAttribute('aria-label', paused ? t.resume : t.pause)
    this.renderHeaders()
  }

  /** Hover/focus highlights whole lines, using coordinates alone. */
  preview(index: number | null): void {
    this.targetRow = index === null ? -1 : Math.floor(index / this.state.game.config.width)
    this.targetColumn = index === null ? -1 : index % this.state.game.config.width
    this.renderHeaders()
  }

  /** Focus a clue without also highlighting an unrelated crossing line. */
  previewLine(axis: SurveyAxis, line: number): void {
    this.targetRow = axis === 'row' ? line : -1
    this.targetColumn = axis === 'column' ? line : -1
    this.renderHeaders()
  }

  /** Pointer focus changes the next keyboard coordinate without scrolling. */
  rememberFocus(index: number): void {
    this.board.rememberFocus(index)
  }

  /** Shared keyboard geometry preserves normal Home/End and arrow behavior. */
  navigate(index: number, key: NavigationKey): NavigationResult {
    return this.board.navigate(index, key)
  }

  /** Keep the row and column headers in the same scroll container at either zoom level. */
  toggleZoom(): void {
    this.enlarged = !this.enlarged
    this.element('.survey-board-panel').classList.toggle('survey-enlarged', this.enlarged)
    const button = this.element('[data-control="zoom"]')
    const label = this.enlarged
      ? message(this.language, 'survey.fit')
      : message(this.language, 'survey.zoom')
    button.setAttribute('aria-label', label)
    button.setAttribute('title', label)
    button.setAttribute('aria-pressed', String(this.enlarged))
    this.element('[data-control="zoom"] span').textContent = this.enlarged ? '−' : '+'
  }

  /** Privacy covers and modal dialogs also dismiss the language popover. */
  closeLanguage(): void {
    this.menu.close()
  }

  /** Language replacement returns focus to the corresponding new control. */
  focusLanguage(): void {
    this.menu.focus()
  }

  /** Preserve the initiating control for Escape and button-driven dialog dismissal. */
  showDialog(content: string): void {
    this.menu.close()
    if (!this.dialog.open)
      this.returnFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    this.element('.survey-dialog-content').innerHTML = content
    if (!this.dialog.open) this.dialog.showModal()
    this.dialog.querySelector<HTMLElement>('#survey-dialog-title')?.focus()
  }

  /** Run the shared interactive lesson with isolated Survey rules and its own practice board. */
  showTutorial(): void {
    this.menu.close()
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    startTutorial(this.dialog, 'survey', this.language)
  }

  /** Native close restores focus through the single close handler. */
  closeDialog(): void {
    this.dialog.close()
  }

  /** Detach callbacks before removing a potentially open modal during restart or unmount. */
  dispose(): void {
    this.listeners.abort()
    this.menu.dispose()
    stopTutorial(this.dialog)
    this.root.replaceChildren()
  }

  /** Stable IDs associate each square with both of its public constraints for screen readers. */
  private buildHeaders(): void {
    for (const axis of ['row', 'column'] as const) {
      const length = axis === 'row' ? this.state.game.config.height : this.state.game.config.width
      this.element(`.survey-${axis}-heads`).innerHTML = Array.from(
        { length },
        (_, index) =>
          `<button type="button" class="survey-line" id="survey-${axis}-${index}" data-axis="${axis}" data-line="${index}" aria-keyshortcuts="Enter Space C"></button>`,
      ).join('')
    }
    for (const cell of this.root.querySelectorAll<HTMLElement>('[data-cell]')) {
      const index = Number(cell.dataset['cell'])
      cell.setAttribute(
        'aria-describedby',
        `survey-row-${Math.floor(index / this.state.game.config.width)} survey-column-${index % this.state.game.config.width}`,
      )
    }
  }

  /** Refresh public constraints only on a move; hover changes highlights without solving again. */
  private renderHeaders(): void {
    const t = translations[this.language]
    const row = this.paused ? -1 : this.targetRow
    const column = this.paused ? -1 : this.targetColumn
    const focused: string[] = []
    for (const axis of ['row', 'column'] as const) {
      for (const header of this.root.querySelectorAll<HTMLElement>(`[data-axis="${axis}"]`)) {
        const index = Number(header.dataset['line'])
        if (this.clueState !== this.state) {
          const line = surveyLine(this.state, axis, index)
          const label = message(this.language, 'survey.line', {
            axis: t[axis],
            number: index + 1,
            runs: line.runs.join(', ') || '0',
            flags: line.flags,
          })
          header.innerHTML = `<span class="tw:sr-only">${label}</span><span class="survey-runs" aria-hidden="true">${(line.runs.length ? line.runs : [0]).map((run) => `<strong>${run}</strong>`).join('')}</span>`
          header.setAttribute('aria-label', label)
          header.setAttribute('aria-description', message(this.language, 'survey.line-action'))
          header.title = `${label}. ${message(this.language, 'survey.line-action')}`
          header.dataset['over'] = String(line.conflict)
          header.dataset['complete'] = String(line.complete)
        }
        header.dataset['active'] = String(index === (axis === 'row' ? row : column))
        header.setAttribute(
          'aria-disabled',
          String(this.paused || this.dialogOpen || this.state.game.phase !== 'playing'),
        )
        if (header.dataset['active'] === 'true')
          focused.push(header.getAttribute('aria-label') ?? '')
      }
    }
    for (const cell of this.root.querySelectorAll<HTMLElement>('[data-cell]')) {
      const index = Number(cell.dataset['cell'])
      cell.classList.toggle(
        'survey-cross',
        Math.floor(index / this.state.game.config.width) === row ||
          index % this.state.game.config.width === column,
      )
    }
    this.element('.survey-focus').textContent = focused.join(' · ')
    this.clueState = this.state
  }

  /** Fail at the template boundary if required markup is missing. */
  private element<T extends Element = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector)
    if (!element) throw new Error(`Missing Survey element: ${selector}`)
    return element
  }
}
