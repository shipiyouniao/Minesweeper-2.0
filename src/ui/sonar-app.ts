import { SonarSession } from '../application/sonar-session.js'
import { cueForMove } from '../audio/cues.js'
import { sonarCharges } from '../game/sonar.js'
import { translations } from '../i18n.js'
import type { SonarRepository } from '../persistence/sonar-repository.js'
import type { InteractionCue, SoundEffects } from '../types/audio.js'
import type { RankedDifficulty } from '../types/game.js'
import type { Language } from '../types/localization.js'
import type { GameRepository } from '../types/storage.js'
import type { BoardInputMode, NavigationKey } from '../types/ui.js'
import type { SonarCommand, SonarInputActions } from '../types/sonar-ui.js'
import { secondaryBoardAction } from './board-actions.js'
import { nextBoardMode } from './board-controls.js'
import { SonarInput } from './sonar-input.js'
import { sonarCopy } from './sonar-copy.js'
import { startTutorial } from './tutorial-player.js'
import { sonarRecordsTemplate } from './sonar-templates.js'
import { SonarView } from './sonar-view.js'

/** Coordinate Sonar's puzzle, presentation and device adapters through explicit ports. */
export class SonarApp implements SonarInputActions {
  private readonly root: HTMLElement
  private readonly session: SonarSession
  private readonly repository: SonarRepository
  private readonly preferences: GameRepository
  private readonly sounds: SoundEffects
  private readonly onLanguage: (language: Language) => void
  private language: Language
  private view: SonarView
  private readonly input: SonarInput
  private paused = false
  private armed = false
  private mode: BoardInputMode = 'reveal'
  private selected: readonly number[]
  private message = ''
  private pendingDifficulty: RankedDifficulty | null = null
  private recordDifficulty: RankedDifficulty

  /** Restore the last two readings as a useful initial comparison without changing the save. */
  constructor(
    root: HTMLElement,
    session: SonarSession,
    repository: SonarRepository,
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
    this.selected = session.state.readings.map((_, index) => index).slice(-2)
    this.recordDifficulty = session.state.difficulty
    this.view = this.createView()
    this.input = new SonarInput(root, this)
    this.render()
  }

  /** All cell paths share the same privacy/modal guard. */
  get blocked(): boolean {
    return this.paused || this.view.dialogOpen
  }

  /** Aiming changes the next primary activation, never a player flag's meaning. */
  get targeting(): boolean {
    return this.armed
  }

  /** Apply a normal board action or explicitly confirm a selected scan target. */
  play(index: number): void {
    if (this.blocked) return
    if (this.armed) {
      this.scan(index)
      return
    }
    this.apply(index, this.mode)
  }

  /** Right-click/hold share the existing public mark cycle and quick-open rule. */
  secondary(index: number): void {
    if (this.blocked) return
    if (this.armed) {
      this.cancelTarget()
      return
    }
    const action = secondaryBoardAction(this.session.state.game, index)
    if (action) this.apply(index, action)
  }

  /** Direct keyboard annotations remain explicit and cancel a pending scan first. */
  direct(index: number, type: 'flag' | 'mark-safe' | 'chord'): void {
    if (this.blocked) return
    this.cancelTarget()
    this.apply(index, type)
  }

  /** Route presentation commands while keeping restart confirmation separate from rule transitions. */
  command(command: SonarCommand): void {
    if (command.type !== 'sound') this.sounds.play(command.type === 'close' ? 'dismiss' : 'tap')
    const t = translations[this.language]
    switch (command.type) {
      case 'sound':
        this.sounds.setEnabled(!this.sounds.enabled)
        this.preferences.setPreference({ key: 'sound', value: this.sounds.enabled })
        this.sounds.play('tap')
        break
      case 'scan':
        if (this.blocked || this.session.state.game.phase !== 'playing') {
          this.sounds.play('blocked')
          return
        }
        this.armed = !this.armed
        this.message = ''
        this.render()
        if (this.armed) {
          this.view.focusBoard()
          this.preview(this.view.focusIndex)
        }
        return
      case 'cycle-mode':
        if (this.blocked) return
        this.armed = false
        this.mode = nextBoardMode(this.mode)
        break
      case 'reading':
        if (this.blocked || !this.session.state.readings[command.value]) return
        this.armed = false
        this.selected = this.selected.includes(command.value)
          ? this.selected.filter((index) => index !== command.value)
          : [...this.selected, command.value].slice(-2)
        break
      case 'pause':
        if (this.view.dialogOpen) return
        this.paused = !this.paused
        this.armed = false
        this.view.stopPulse()
        this.view.closeLanguage()
        this.input.cancelGesture()
        this.session.persist()
        break
      case 'zoom':
        this.view.toggleZoom()
        return
      case 'help':
        if (this.blocked) return
        this.showDialog('')
        const dialog = this.root.querySelector<HTMLDialogElement>('dialog')
        if (dialog) startTutorial(dialog, 'sonar', this.language)
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
        if (this.session.state.game.phase === 'playing') {
          this.showDialog(
            `<h2 id="sonar-dialog-title" tabindex="-1">${t.confirmTitle}</h2><p>${t.confirmNote}</p><div class="dialog-actions"><button class="secondary-button" data-control="close">${t.cancel}</button><button class="primary-button" data-control="confirm">${t.start}</button></div>`,
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
    if (command.type === 'reading')
      this.root
        .querySelector<HTMLButtonElement>(`[data-sonar-reading="${command.value}"]`)
        ?.focus({ preventScroll: true })
    else if (command.type === 'cycle-mode')
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
    this.sounds.play(result === 'moved' ? 'navigate' : 'blocked')
  }

  /** Preview only selected-tool geometry; hidden clues never influence hover output. */
  preview(index: number | null): void {
    this.view.preview(this.armed && !this.blocked ? index : null)
  }

  /** Cancel both logical targeting and its visible frame. */
  cancelTarget(): void {
    if (!this.armed) return
    this.armed = false
    this.message = ''
    this.sounds.play('dismiss')
    this.render()
  }

  /** Checkpoint and cover both the board and its saved observations when backgrounded. */
  suspend(): void {
    this.paused = this.session.state.game.phase === 'playing' || this.paused
    this.armed = false
    this.sounds.stop()
    this.view.stopPulse()
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

  /** Save before releasing mode-owned events, wave animations and audio resources. */
  dispose(): void {
    this.session.persist()
    this.input.dispose()
    this.view.dispose()
    this.sounds.dispose()
  }

  /** A paid reading and a recalled reading have distinct state changes and feedback. */
  private scan(index: number): void {
    const state = this.session.state
    const existing = state.readings.findIndex((reading) => reading.center === index)
    if (existing >= 0) {
      this.selected = [...this.selected.filter((reading) => reading !== existing), existing].slice(
        -2,
      )
      this.message = sonarCopy(this.language).duplicate
      this.armed = false
      this.sounds.play('confirm')
      this.render()
      return
    }
    if (!this.session.dispatch({ type: 'scan', index })) {
      this.message = sonarCharges(state) <= 0 ? sonarCopy(this.language).exhausted : ''
      this.sounds.play('blocked')
      this.render()
      return
    }
    this.selected = [...this.selected, this.session.state.readings.length - 1].slice(-2)
    this.armed = false
    const reading = this.session.state.readings.at(-1)!
    const s = sonarCopy(this.language)
    this.message = `${s.reading} ${this.session.state.readings.length}: ${reading.mines} ${s.mines}`
    this.render()
    this.view.animateScan(index)
    this.sounds.play('sonar-pulse')
    this.showResult()
  }

  /** Ordinary operations use the shared engine and its actual public outcome sounds. */
  private apply(index: number, type: BoardInputMode): void {
    const before = this.session.state.game
    if (!this.session.dispatch({ type, index })) {
      this.sounds.play('blocked')
      return
    }
    this.message = ''
    this.render()
    const after = this.session.state.game
    const cue =
      type === 'mark-safe'
        ? after.safeMarks.includes(index)
          ? 'flag'
          : 'unflag'
        : cueForMove(before, after, index)
    if (cue) this.sounds.play(cue)
    this.showResult()
  }

  /** Both a direct excavation and a paid scan can finish the board. */
  private showResult(): void {
    const after = this.session.state.game
    if (after.phase === 'won' || after.phase === 'lost') {
      const t = translations[this.language]
      const s = sonarCopy(this.language)
      this.showDialog(
        `<h2 id="sonar-dialog-title" tabindex="-1">${after.phase === 'won' ? s.win : s.loss}</h2><p>${s.moves}: ${this.session.state.moves} · ${s.scans}: ${this.session.state.readings.length}</p><div class="dialog-actions"><button class="secondary-button" data-control="close">${t.close}</button><button class="primary-button" data-control="new">${t.restart}</button></div>`,
      )
    }
  }

  /** Restart only the current mode, preserving its independent best-result table. */
  private restart(): void {
    if (this.pendingDifficulty === null) return
    this.input.cancelGesture()
    this.session.restart(this.pendingDifficulty)
    this.pendingDifficulty = null
    this.selected = []
    this.message = ''
    this.armed = false
    this.paused = false
    this.mode = 'reveal'
    this.view.dispose()
    this.view = this.createView()
    this.render()
  }

  /** Remount locale text while preserving the puzzle, scan selection and roving board focus. */
  private readonly changeLanguage = (language: Language): void => {
    const focus = this.view.focusIndex
    this.input.cancelGesture()
    this.language = language
    this.message = ''
    this.armed = false
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
  private createView(focus = 0): SonarView {
    return new SonarView(
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

  /** Cancel targeting before showing any modal so Enter cannot also scan the covered board. */
  private showDialog(content: string): void {
    this.input.cancelGesture()
    this.armed = false
    this.view.showDialog(content)
    this.render()
  }

  /** Render record tabs without replacing the active puzzle. */
  private showRecords(): void {
    this.showDialog(
      sonarRecordsTemplate(this.language, this.recordDifficulty, this.session.records),
    )
  }

  /** Keep storage/recovery feedback outside the normal short tool hint. */
  private render(): void {
    const s = sonarCopy(this.language)
    const state = this.session.state
    const storage = !this.repository.available
      ? translations[this.language].storageOff
      : this.repository.recovered
        ? s.recovered
        : ''
    const message = this.session.atMoveLimit
      ? s.limit
      : this.message || (state.game.phase === 'ready' ? s.opening : '')
    this.view.render(
      state,
      this.paused,
      this.mode,
      this.armed,
      this.selected,
      this.sounds.enabled,
      message,
      storage,
    )
  }
}
