import type { Difficulty, RankedDifficulty } from '../types/game.js'
import type { Language } from '../types/localization.js'
import type { GameRepository } from '../types/storage.js'
import type { InputActions, UiCommand, NavigationKey, FormSubmission } from '../types/ui.js'
import { GameSession } from '../application/game-session.js'
import { validConfig } from '../game/engine.js'
import { translations } from '../i18n.js'
import { AppView } from './app-view.js'
import { InputController } from './input-controller.js'
import {
  customTemplate,
  helpTemplate,
  recordsTemplate,
  restartTemplate,
  resultTemplate,
} from './templates.js'

/** Coordinates application services and views; browser event mechanics live in InputController. */
export class MinesweeperApp implements InputActions {
  private readonly session: GameSession
  private readonly repository: GameRepository
  private readonly view: AppView
  private readonly input: InputController
  private readonly ticker: number
  private language: Language
  private flagMode = false
  private recordMode: RankedDifficulty

  /** Mount a complete app with explicit session, repository, and locale dependencies. */
  constructor(
    root: HTMLElement,
    session: GameSession,
    repository: GameRepository,
    language: Language,
  ) {
    this.session = session
    this.repository = repository
    this.language = language
    this.recordMode = session.state.mode === 'custom' ? 'easy' : session.state.mode
    this.view = new AppView(root, this.handleDialogClose)
    this.input = new InputController(root, this)

    this.mount(true)
    this.ticker = window.setInterval(this.tick, 1000)
  }

  /** Expose native modal state to the input adapter's shortcut guard. */
  get dialogOpen(): boolean {
    return this.view.dialogOpen
  }

  /** Send a player action through the session and present any resulting outcome. */
  play(index: number, flag = this.flagMode): void {
    if (!this.session.play({ type: flag ? 'flag' : 'reveal', index })) {
      return
    }

    this.render()
    const state = this.session.state

    if (state.game.phase === 'won' || state.game.phase === 'lost') {
      this.showDialog(resultTemplate(this.language, state))
    }
  }

  /** Route named UI commands to a focused application operation. */
  command(action: UiCommand): void {
    switch (action) {
      case 'help':
        this.showDialog(helpTemplate(this.language))
        break
      case 'records':
        this.showRecords()
        break
      case 'close':
        this.view.closeDialog()
        break
      case 'pause':
        this.session.togglePause()
        this.render()
        break
      case 'flag-mode':
      case 'reveal-mode':
        this.flagMode = action === 'flag-mode'
        this.render()
        break
      case 'restart-confirmed':
        this.restart()
        break
      case 'new':
        this.requestRestart()
        break
    }
  }

  /** Open custom configuration or switch to another difficulty's saved session. */
  selectDifficulty(value: Difficulty): void {
    if (value === 'custom') {
      this.showDialog(customTemplate(this.language, this.session.state.game.config))
      return
    }

    const next = value

    if (next !== this.session.state.mode) {
      this.session.changeDifficulty(next)
      this.mount(true)
    }
  }

  /** Change the records tab without replacing the current game or dialog pause. */
  selectRecords(value: RankedDifficulty): void {
    this.recordMode = value
    this.showRecords()
  }

  /** Rebuild translated labels while preserving the active game and board focus. */
  selectLanguage(value: Language): void {
    this.language = value
    this.repository.setPreference({ key: 'language', value: this.language })
    this.mount(false)
  }

  /** Validate user-entered values before passing them into session operations. */
  submit(submission: FormSubmission): void {
    if (submission.kind === 'custom') {
      const config = submission.config

      if (!validConfig(config)) {
        this.view.showCustomError(translations[this.language].invalid)
        return
      }

      this.session.changeDifficulty('custom', config)
      this.mount(true)
    } else {
      this.session.renameRecord(submission.name)
      this.view.closeDialog()
    }
  }

  /** Forward focus updates to the view that owns the board elements. */
  rememberFocus(index: number): void {
    this.view.rememberFocus(index)
  }

  /** Forward navigation while keeping keyboard geometry independent of game rules. */
  navigate(index: number, key: NavigationKey): boolean {
    return this.view.navigate(index, key)
  }

  /** Pause and save on backgrounding, then show the privacy cover on return. */
  suspend(): void {
    this.session.suspend()
    this.render()
  }

  /** Release timers, event listeners, and DOM on teardown or development hot reload. */
  dispose(): void {
    clearInterval(this.ticker)
    this.input.dispose()
    this.session.suspend()
    this.view.dispose()
  }

  /** Recreate board markup only when dimensions or language require it. */
  private mount(resetFocus: boolean): void {
    // A hold on the old board must never flag the same index on its replacement.
    this.input.cancelGesture()
    this.view.mount(this.session.state, this.language, this.flagMode, resetFocus)
    this.render()
  }

  /** Read presentation dependencies and render one immutable session snapshot. */
  private render(): void {
    const state = this.session.state
    const best = state.mode === 'custom' ? undefined : this.repository.scores(state.mode)[0]

    this.view.render(state, this.language, this.flagMode, best, this.repository.available)
  }

  /** Stop gameplay before showing content so modal time never contributes to a score. */
  private showDialog(content: string): void {
    this.session.openDialog()
    this.render()
    this.view.showDialog(content)
  }

  /** Load the requested leaderboard and render it through a pure template. */
  private showRecords(): void {
    const scores = this.repository.scores(this.recordMode)

    this.showDialog(recordsTemplate(this.language, this.recordMode, scores))
  }

  /** Protect an unfinished game with confirmation before replacing its progress. */
  private requestRestart(): void {
    if (this.session.state.game.phase === 'playing') {
      this.showDialog(restartTemplate(this.language))
    } else {
      this.restart()
    }
  }

  /** Start a fresh board and clear dialog/gesture/focus state from its predecessor. */
  private restart(): void {
    this.session.restart()
    this.mount(true)
  }

  /** Handle Escape and close buttons through the same session pause ownership rule. */
  private readonly handleDialogClose = (): void => {
    this.session.closeDialog()
    this.render()
  }

  /** Refresh elapsed time and checkpoint only while the clock is running. */
  private readonly tick = (): void => {
    if (this.session.running) {
      this.session.persist()
    }

    this.view.renderTime(this.session.state.elapsed, this.repository.available)
  }
}
