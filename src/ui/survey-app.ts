import { sharedStyles } from './shared-styles.js'
import { SurveySession } from '../application/survey-session.js'
import { cueForMove } from '../audio/cues.js'
import { message, translations } from '../i18n.js'
import type { SurveyRepository } from '../persistence/survey-repository.js'
import type { InteractionCue, SoundEffects } from '../types/audio.js'
import type { RankedDifficulty } from '../types/game.js'
import type { SurveyAction, SurveyAxis } from '../types/survey.js'
import type { Language } from '../types/localization.js'
import type { GameRepository } from '../types/storage.js'
import type { BoardInputMode, NavigationKey } from '../types/ui.js'
import type { SurveyCommand, SurveyInputActions } from '../types/survey-ui.js'
import { secondaryBoardAction } from './board-actions.js'
import { nextBoardMode } from './board-controls.js'
import { SurveyInput } from './survey-input.js'
import { surveyRecordsTemplate } from './survey-templates.js'
import { SurveyView } from './survey-view.js'

/** Coordinate Survey's puzzle, presentation and device adapters through explicit ports. */
export class SurveyApp implements SurveyInputActions {
  private readonly root: HTMLElement
  private readonly session: SurveySession
  private readonly repository: SurveyRepository
  private readonly preferences: GameRepository
  private readonly sounds: SoundEffects
  private readonly onLanguage: (language: Language) => void
  private language: Language
  private view: SurveyView
  private readonly input: SurveyInput
  private paused = false
  private mode: BoardInputMode = 'reveal'
  private pendingDifficulty: RankedDifficulty | null = null
  private recordDifficulty: RankedDifficulty

  /** Restore one independent puzzle and compose its device adapters. */
  constructor(
    root: HTMLElement,
    session: SurveySession,
    repository: SurveyRepository,
    preferences: GameRepository,
    language: Language,
    sounds: SoundEffects,
    onLanguage: (language: Language) => void,
  ) {
    this.root = root
    this.session = session
    this.repository = repository
    this.preferences = preferences
    this.language = language
    this.sounds = sounds
    this.onLanguage = onLanguage
    this.recordDifficulty = session.state.difficulty
    this.view = this.createView()
    this.input = new SurveyInput(root, this)
    this.render()
  }

  /** All cell paths share the same privacy/modal guard. */
  get blocked(): boolean {
    return this.paused || this.view.dialogOpen
  }

  /** Apply the selected primary operation using Survey's immutable rules. */
  play(index: number): void {
    if (this.blocked) return
    this.apply({ index, type: this.mode })
  }

  /** Right-click/hold share the existing public mark cycle and quick-open rule. */
  secondary(index: number): void {
    if (this.blocked) return

    const action = secondaryBoardAction(this.session.state.game, index)
    if (action) this.apply({ index, type: action })
  }

  /** Direct keyboard annotations retain their meaning independently of the touch mode. */
  direct(index: number, type: 'flag' | 'mark-safe' | 'chord'): void {
    if (this.blocked) return
    this.apply({ index, type })
  }

  /** Header shortcuts share modal guards, scoring and persistence with cell operations. */
  openLine(axis: SurveyAxis, line: number): void {
    if (this.blocked) return
    this.apply({ type: 'chord-line', axis, index: line })
  }

  /** Route presentation commands while keeping restart confirmation separate from rule transitions. */
  command(command: SurveyCommand): void {
    if (command.type !== 'sound') this.sounds.play(command.type === 'close' ? 'dismiss' : 'tap')

    const t = translations[this.language]
    switch (command.type) {
      case 'sound':
        this.sounds.setEnabled(!this.sounds.enabled)
        this.preferences.setPreference({ key: 'sound', value: this.sounds.enabled })
        this.sounds.play('tap')
        break
      case 'cycle-mode':
        if (this.blocked) return
        this.mode = nextBoardMode(this.mode)
        break
      case 'pause':
        if (this.view.dialogOpen) return
        this.paused = !this.paused
        this.view.closeLanguage()
        this.input.cancelGesture()
        this.session.persist()
        break
      case 'zoom':
        this.view.toggleZoom()
        return
      case 'help':
        if (this.blocked) return
        this.input.cancelGesture()
        this.view.showTutorial()
        this.render()
        return
      case 'records':
        this.recordDifficulty = this.session.state.difficulty
        this.showRecords()
        return
      case 'record-difficulty':
        this.recordDifficulty = command.value
        this.showRecords()
        return
      case 'new':
      case 'difficulty':
        if (command.type === 'difficulty' && command.value === this.session.state.difficulty) return
        this.pendingDifficulty =
          command.type === 'difficulty' ? command.value : this.session.state.difficulty
        if (this.session.state.game.phase === 'playing' && this.session.state.moves > 0) {
          this.showDialog(
            `<h2 id="survey-dialog-title" tabindex="-1">${t.confirmTitle}</h2><p>${t.confirmNote}</p><div class="dialog-actions ${sharedStyles['dialog-actions']}"><button class="secondary-button ${sharedStyles['secondary-button']}" data-control="close">${t.cancel}</button><button class="primary-button ${sharedStyles['primary-button']}" data-control="confirm">${t.start}</button></div>`,
          )
          return
        }
        this.restart()
        return
      case 'confirm':
        this.restart()
        return
      case 'close':
        this.view.closeDialog()
        return
    }

    this.render()
    if (command.type === 'cycle-mode')
      this.root.querySelector<HTMLButtonElement>('.mode-cycle')?.focus({ preventScroll: true })
  }

  /** Track a visible target without allowing focus itself to spend information. */
  focus(index: number): void {
    this.view.rememberFocus(index)
    this.preview(index)
  }

  /** Forward shared board geometry and use mute-aware feedback for edges and movement. */
  navigate(index: number, key: NavigationKey): void {
    const result = this.view.navigate(index, key)

    this.preview(this.view.focusIndex)
    this.sounds.play(result === 'moved' ? 'navigate' : 'blocked')
  }

  /** Highlight a public coordinate; hidden clues never influence hover output. */
  preview(index: number | null): void {
    this.view.preview(this.blocked ? null : index)
  }

  /** A clue highlights only its own axis, so the affected line is visible before activation. */
  previewLine(axis: SurveyAxis, line: number): void {
    if (this.blocked) this.view.preview(null)
    else this.view.previewLine(axis, line)
  }

  /** Checkpoint and cover both the board and its line observations when backgrounded. */
  suspend(): void {
    this.paused = this.session.state.game.phase === 'playing' || this.paused
    this.sounds.stop()
    this.view.closeLanguage()
    this.session.persist()
    this.render()
  }

  /** Unlock Web Audio from the original user gesture. */
  unlock(): void {
    this.sounds.unlock()
  }

  /** Route navigation feedback through the same global sound preference. */
  readonly feedback = (cue: InteractionCue): void => {
    this.sounds.play(cue)
  }

  /** Save before releasing mode-owned events and audio resources. */
  dispose(): void {
    this.session.persist()
    this.input.dispose()
    this.view.dispose()
    this.sounds.dispose()
  }

  /** Ordinary operations report their actual public outcome through the shared sound adapter. */
  private apply(action: SurveyAction): void {
    const before = this.session.state.game
    if (!this.session.dispatch(action)) {
      this.sounds.play('blocked')
      return
    }

    this.render()

    const after = this.session.state.game
    const cue =
      action.type === 'mark-safe'
        ? after.safeMarks.includes(action.index)
          ? 'flag'
          : 'unflag'
        : cueForMove(
            before,
            after,
            action.type === 'chord-line'
              ? after.cells.findIndex(
                  (cell, index) => cell.visibility !== before.cells[index]?.visibility,
                )
              : action.index,
          )
    if (cue) this.sounds.play(cue)

    this.showResult()
  }

  /** Show a dismissible terminal result after an accepted excavation. */
  private showResult(): void {
    const after = this.session.state.game
    if (after.phase === 'won' || after.phase === 'lost') {
      const t = translations[this.language]
      this.showDialog(
        `<h2 id="survey-dialog-title" tabindex="-1">${after.phase === 'won' ? message(this.language, 'survey.win') : message(this.language, 'survey.loss')}</h2><p>${message(this.language, 'survey.moves')}: ${this.session.state.moves}</p><div class="dialog-actions ${sharedStyles['dialog-actions']}"><button class="secondary-button ${sharedStyles['secondary-button']}" data-control="close">${t.close}</button><button class="primary-button ${sharedStyles['primary-button']}" data-control="new">${t.restart}</button></div>`,
      )
    }
  }

  /** Restart only the current mode, preserving its independent best-result table. */
  private restart(): void {
    if (this.pendingDifficulty === null) return

    this.input.cancelGesture()
    this.session.restart(this.pendingDifficulty)
    this.pendingDifficulty = null
    this.paused = false
    this.mode = 'reveal'
    this.view.dispose()
    this.view = this.createView()
    this.render()
  }

  /** Remount locale text while preserving the puzzle and roving board focus. */
  private readonly changeLanguage = (language: Language): void => {
    const focus = this.view.focusIndex

    this.input.cancelGesture()
    this.language = language
    this.preferences.setPreference({ key: 'language', value: language })

    const url = new URL(location.href)

    url.searchParams.set('lang', language)
    history.replaceState(null, '', url)
    this.view.dispose()
    this.view = this.createView(focus)
    this.render()
    this.view.focusLanguage()
    this.onLanguage(language)
    this.sounds.play('confirm')
  }

  /** Compose a view with explicit callbacks instead of leaking browser state into the session. */
  private createView(focus = 0): SurveyView {
    return new SurveyView(
      this.root,
      this.language,
      this.session.state,
      this.changeLanguage,
      this.feedback,
      this.dialogClosed,
      focus,
    )
  }

  /** Closing a dialog never removes a background-owned privacy pause. */
  private readonly dialogClosed = (): void => {
    this.pendingDifficulty = null
    this.render()
  }

  /** Cancel pending gestures before opening a modal so release cannot also excavate. */
  private showDialog(content: string): void {
    this.input.cancelGesture()
    this.view.showDialog(content)
    this.render()
  }

  /** Render record tabs without replacing the active puzzle. */
  private showRecords(): void {
    this.showDialog(
      surveyRecordsTemplate(this.language, this.recordDifficulty, this.session.records),
    )
  }

  /** Keep storage/recovery feedback outside the normal short tool hint. */
  private render(): void {
    const storage = !this.repository.available
      ? translations[this.language].storageOff
      : this.repository.recovered
        ? message(this.language, 'survey.recovered')
        : ''
    this.view.render(
      this.session.state,
      this.paused,
      this.mode,
      this.sounds.enabled,
      storage,
      this.session.atMoveLimit,
    )
  }
}
