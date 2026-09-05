import { battleHealthCopy } from './combat-build-copy.js'
import { cueForVitality } from '../audio/cues.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import { ExpeditionSession } from '../application/expedition-session.js'
import { TwinSession } from '../application/twin-session.js'
import { allowedDeparture, expeditionEarnings } from '../game/expedition.js'
import { approachPath } from '../game/dungeon-path.js'
import { tacticalCellAction, tacticalPlan } from '../game/tactical-planning.js'
import { tacticalCopy } from './tactical-copy.js'
import type { DungeonTool } from '../types/dungeon-ui.js'
import { translations } from '../i18n.js'
import type { SoundEffects, InteractionCue } from '../types/audio.js'
import type { Language } from '../types/localization.js'
import type { GameRepository } from '../types/storage.js'
import type { BoardSide, Equipment, ExpeditionAction, Profession } from '../types/variants.js'
import type { VariantCommand, VariantInputActions } from '../types/variant-ui.js'
import type { NavigationKey } from '../types/ui.js'
import { VariantRepository } from '../persistence/variant-repository.js'
import { variantCopy } from './variant-copy.js'
import {
  campTemplate,
  expeditionTemplate,
  twinTemplate,
  variantRecords,
} from './variant-templates.js'
import { VariantView } from './variant-view.js'
import { VariantInput } from './variant-input.js'

/** Coordinates special-mode sessions with dedicated input and rendering adapters. */
export class VariantApp implements VariantInputActions {
  private readonly root: HTMLElement
  private readonly session: ExpeditionSession | TwinSession
  private readonly repository: VariantRepository
  private readonly preferences: GameRepository
  private language: Language
  private readonly sounds: SoundEffects
  private readonly onLanguage: (language: Language) => void
  private view: VariantView
  private readonly input: VariantInput
  private profession: Profession = 'explorer'
  private equipment: readonly Equipment[] = []
  private flagMode = false
  private paused = false
  private pending: 'retreat' | 'restart' | null = null
  private pendingDifficulty: VariantDifficulty | null = null
  private moving = false
  private walkGeneration = 0

  /** Wire one active mode, sharing only browser preferences and the sound port. */
  constructor(
    root: HTMLElement,
    session: ExpeditionSession | TwinSession,
    repository: VariantRepository,
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
    this.view = this.createView()
    this.input = new VariantInput(root, this)
    this.render()
  }

  /** Apply board input only while the board is visible and no modal owns interaction. */
  play(side: BoardSide, index: number, flag = this.flagMode): void {
    if (this.paused || this.view.dialogOpen || this.moving) {
      this.sounds.play('blocked')
      return
    }
    if (this.session instanceof ExpeditionSession && !flag) {
      const run = this.session.run
      if (run?.phase === 'boss') {
        const action = tacticalCellAction(run, index)
        const plan = tacticalPlan(run, action)
        this.view.previewRoute(index)
        if (!plan.allowed) {
          this.sounds.play('blocked')
          return
        }
        if (action.type !== 'move' && action.type !== 'reveal') {
          this.input.cancelTools()
          this.expedition(action)
          this.render()
          return
        }
        void this.walkAndPlay(index, plan.path, action.type === 'move')
        return
      }
      const path = run ? approachPath(run, index) : null
      if (!run || !path || (index === run.player && index !== run.exit)) {
        this.sounds.play('blocked')
        return
      }
      void this.walkAndPlay(index, path, run.game.cells[index]?.visibility === 'revealed')
      return
    }
    this.commitPlay(side, index, flag)
  }

  /** Commit one board action after any visible movement has completed. */
  private commitPlay(side: BoardSide, index: number, flag: boolean, move = false): void {
    const before =
      this.session instanceof TwinSession ? this.session.state[side] : this.session.run?.game
    const flagged = before?.cells[index]?.visibility === 'flagged'
    const previousRun = this.session instanceof ExpeditionSession ? this.session.run : null
    const changed =
      this.session instanceof TwinSession
        ? this.session.dispatch({ side, type: flag ? 'flag' : 'reveal', index })
        : this.session.dispatch({ type: flag ? 'flag' : move ? 'move' : 'reveal', index })
    if (!changed) {
      this.sounds.play('blocked')
      return
    }

    const phase =
      this.session instanceof TwinSession ? this.session.state.phase : this.session.run?.phase
    const currentRun = this.session instanceof ExpeditionSession ? this.session.run : null
    const vitalityCue = previousRun && currentRun ? cueForVitality(previousRun, currentRun) : null
    this.sounds.play(
      phase === 'lost'
        ? 'loss'
        : phase === 'won'
          ? 'win'
          : vitalityCue
            ? vitalityCue
            : flag
              ? flagged
                ? 'unflag'
                : 'flag'
              : move
                ? 'navigate'
                : 'reveal',
    )
    this.render()
  }

  /** Keep the session atomic while an interruptible, visible path animation runs. */
  private async walkAndPlay(index: number, path: readonly number[], move: boolean): Promise<void> {
    this.input.cancelTools()
    const generation = ++this.walkGeneration
    this.moving = true
    this.sounds.play('navigate')
    const finished = await this.view.walk(path)
    if (generation !== this.walkGeneration) return
    this.moving = false
    if (finished) this.commitPlay('a', index, false, move)
  }

  /** Discard pending movement before replacing or hiding its board. */
  private cancelMovement(): void {
    this.walkGeneration++
    this.moving = false
    this.view.cancelWalk()
    this.input.cancelTools()
  }

  /** Preview only an interactive expedition's explicit target area. */
  previewTool(tool: DungeonTool | null, index: number | null): void {
    if (tool && (this.paused || this.moving || this.view.dialogOpen)) return
    this.view.previewTool(tool, index)
  }

  /** Display a pointer or keyboard route only while interaction is available. */
  previewRoute(index: number | null): void {
    if (this.paused || this.moving || this.view.dialogOpen) return
    this.view.previewRoute(index)
  }

  /** Consume a targeted tool through the replayable domain action. */
  useTool(tool: DungeonTool, index: number): void {
    if (!(this.session instanceof ExpeditionSession)) return
    const run = this.session.run
    if (!run || this.paused || this.moving || this.view.dialogOpen) return

    this.expedition(
      tool === 'probe'
        ? { type: 'probe', index }
        : { type: 'sweep', row: Math.floor(index / run.game.config.width) },
    )
    this.render()
  }

  /** Route finite UI commands, preserving confirmation before destructive run replacement. */
  command(command: VariantCommand): void {
    const rewardAction =
      this.view.rewardOpen && (command.type === 'relic' || command.type === 'descend')
    const resultAction = this.view.resultOpen && command.type === 'camp'
    if (
      this.view.dialogOpen &&
      !rewardAction &&
      !resultAction &&
      command.type !== 'confirm' &&
      command.type !== 'cancel'
    )
      return
    if (
      this.paused &&
      command.type !== 'pause' &&
      command.type !== 'sound' &&
      command.type !== 'help' &&
      command.type !== 'records' &&
      command.type !== 'cancel' &&
      command.type !== 'confirm'
    )
      return
    if (command.type !== 'sound') this.sounds.play(command.type === 'cancel' ? 'dismiss' : 'tap')
    if (
      this.moving &&
      command.type !== 'sound' &&
      command.type !== 'pause' &&
      command.type !== 'help' &&
      command.type !== 'records'
    )
      return
    if (command.type !== 'probe' && command.type !== 'scan') this.cancelMovement()

    switch (command.type) {
      case 'rewards':
      case 'result':
        this.view.showExpeditionDialog()
        return
      case 'help': {
        const t = variantCopy(this.language)
        if (this.session instanceof ExpeditionSession && this.session.run?.phase === 'boss') {
          this.view.showInformation(
            translations[this.language].how,
            tacticalCopy(this.language, this.session.run.encounter?.kind)
              .help.map((paragraph) => `<p>${paragraph}</p>`)
              .join(''),
          )
          return
        }
        this.view.showInformation(
          translations[this.language].how,
          `<p>${this.session instanceof ExpeditionSession ? t.expeditionHelp : t.twinHelp}</p><p>${t.controls}</p>${this.session instanceof ExpeditionSession ? `<p>${battleHealthCopy(this.language)}</p><p>${t.toolHint}</p><p>${t.probeHint}</p><p>${t.scanHint}</p>` : ''}`,
        )
        return
      }
      case 'records':
        this.view.showInformation(
          variantCopy(this.language).records,
          variantRecords(
            this.language,
            this.session.records,
            this.session instanceof ExpeditionSession,
          ),
        )
        return
      case 'sound':
        this.sounds.setEnabled(!this.sounds.enabled)
        this.preferences.setPreference({ key: 'sound', value: this.sounds.enabled })
        this.sounds.play('tap')
        break
      case 'pause':
        this.paused = !this.paused
        break
      case 'flag-mode':
        this.flagMode = true
        break
      case 'reveal-mode':
        this.flagMode = false
        break
      case 'zoom':
        this.view.toggleZoom()
        return
      case 'descend':
        this.expedition({ type: 'descend' })
        break
      case 'skill':
        this.expedition({ type: 'skill' })
        break
      case 'attack':
        if (this.session instanceof ExpeditionSession && this.session.run?.encounter)
          this.expedition(tacticalCellAction(this.session.run, this.session.run.encounter.boss))
        break
      case 'brace':
      case 'end-turn':
        this.expedition({ type: command.type })
        break
      case 'difficulty':
        if (this.session instanceof ExpeditionSession) {
          this.session.selectDifficulty(command.value)
        } else if (this.session.state.difficulty !== command.value) {
          if (this.session.state.phase === 'playing') {
            this.pending = 'restart'
            this.pendingDifficulty = command.value
            this.view.confirm(
              translations[this.language].confirmNote,
              translations[this.language].restart,
            )
            return
          }
          this.session.restart(command.value)
        }
        break
      case 'start':
        if (this.session instanceof ExpeditionSession)
          this.result(this.session.start(this.profession, this.equipment))
        break
      case 'camp':
        if (this.session instanceof ExpeditionSession) this.result(this.session.returnToCamp())
        break
      case 'profession':
        if (
          this.session instanceof ExpeditionSession &&
          !this.session.run &&
          allowedDeparture(this.session.camp, command.value, [])
        ) {
          this.profession = command.value
          // Preserve compatible choices and drop only a guard that would exceed this career's cap.
          if (!allowedDeparture(this.session.camp, command.value, this.equipment)) {
            this.equipment = this.equipment.filter((item) => item !== 'guard')
          }
        }
        break
      case 'equipment':
        if (this.session instanceof ExpeditionSession && !this.session.run) {
          const equipment = this.equipment.includes(command.value)
            ? this.equipment.filter((item) => item !== command.value)
            : [...this.equipment, command.value]
          if (allowedDeparture(this.session.camp, this.profession, equipment))
            this.equipment = equipment
          else this.sounds.play('blocked')
        }
        break
      case 'upgrade':
        if (this.session instanceof ExpeditionSession)
          this.result(this.session.purchase(command.value))
        break
      case 'probe':
      case 'scan':
        this.input.selectTool(command.type)
        return
      case 'relic':
        this.expedition({ type: 'relic', relic: command.value })
        break
      case 'retreat':
        this.pending = 'retreat'
        this.view.confirm(
          variantCopy(this.language).retreatNote,
          variantCopy(this.language).retreat,
        )
        return
      case 'restart':
        this.pendingDifficulty = null
        if (this.session instanceof TwinSession && this.session.state.phase === 'playing') {
          this.pending = 'restart'
          this.view.confirm(
            translations[this.language].confirmNote,
            translations[this.language].restart,
          )
          return
        }
        if (this.session instanceof TwinSession) this.session.restart()
        break
      case 'cancel':
        this.pendingDifficulty = null
        this.pending = null
        this.view.closeDialog()
        return
      case 'confirm':
        if (!this.view.dialogOpen) return
        this.view.closeDialog()
        if (this.pending === 'retreat') this.expedition({ type: 'retreat' })
        else if (this.pending === 'restart' && this.session instanceof TwinSession)
          this.session.restart(
            this.pendingDifficulty ?? this.session.state.difficulty ?? 'standard',
          )
        this.pendingDifficulty = null
        this.pending = null
        break
    }

    this.render()
  }

  /** Preserve board selection and the corresponding coordinate highlight. */
  focus(side: BoardSide, index: number): void {
    this.view.focus(side, index)
  }

  /** Emit navigation feedback only for user-requested focus movement. */
  navigate(side: BoardSide, index: number, key: NavigationKey): void {
    if (this.paused || this.view.dialogOpen) return
    this.sounds.play(this.view.navigate(side, index, key) === 'moved' ? 'navigate' : 'blocked')
  }

  /** Resume audio on a gesture; no sound is requested by rendering. */
  unlock(): void {
    this.sounds.unlock()
  }

  /** Share mute-aware UI feedback with the input adapter and language menu. */
  readonly feedback = (cue: InteractionCue): void => {
    this.sounds.play(cue)
  }

  /** Hide the board on backgrounding and checkpoint its coherent session state. */
  suspend(): void {
    this.cancelMovement()
    this.paused = true
    this.sounds.stop()
    this.view.closeMenu()
    this.session.persist()
    this.render()
  }

  /** Release all owned effects before routing to another game mode or hot reload. */
  dispose(): void {
    this.cancelMovement()
    this.session.persist()
    this.input.dispose()
    this.view.dispose()
    this.sounds.dispose()
  }

  /** Render one session snapshot, showing terminal twin layouts consistently on both sides. */
  private render(): void {
    // Uncover before measuring cell geometry, so a resumed board never starts at zero width.
    this.view.chrome(
      this.repository.available,
      this.repository.recovered,
      this.sounds.enabled,
      this.paused,
      this.session.atMoveLimit,
      this.repository.migrated,
      this.repository.returnedSupplies,
    )

    if (this.session instanceof ExpeditionSession) {
      const run = this.session.run
      this.view.render(
        run
          ? expeditionTemplate(this.language, run, expeditionEarnings(run), this.flagMode)
          : campTemplate(
              this.language,
              this.session.camp,
              this.profession,
              this.equipment,
              this.session.difficulty,
            ),
        run?.game ?? null,
        null,
        run,
      )
    } else {
      const state = this.session.state
      const a = state.phase === 'lost' ? { ...state.a, phase: 'lost' as const } : state.a
      const b = state.phase === 'lost' ? { ...state.b, phase: 'lost' as const } : state.b
      this.view.render(twinTemplate(this.language, state, this.flagMode), a, b, null)
    }
  }

  /** Apply expedition-only commands and choose feedback from the resulting phase. */
  private expedition(action: ExpeditionAction): void {
    if (!(this.session instanceof ExpeditionSession)) return
    const before = this.session.run
    const changed = this.session.dispatch(action)
    const after = this.session.run
    const cue = before && after ? cueForVitality(before, after) : null

    this.sounds.play(!changed ? 'blocked' : after?.phase === 'won' ? 'win' : (cue ?? 'confirm'))
  }

  /** Give rejected purchases and accepted choices distinct audible feedback. */
  private result(changed: boolean): void {
    this.sounds.play(changed ? 'confirm' : 'blocked')
  }

  /** Bind one shell with its translated copy and typed language callback. */
  private createView(): VariantView {
    return new VariantView(
      this.root,
      this.language,
      this.session instanceof ExpeditionSession ? 'expedition' : 'twin',
      this.selectLanguage,
      this.feedback,
    )
  }

  /** Replace translated markup while preserving the same session and permanent preferences. */
  private readonly selectLanguage = (language: Language): void => {
    this.cancelMovement()
    this.language = language
    this.preferences.setPreference({ key: 'language', value: language })
    const url = new URL(location.href)
    url.searchParams.set('lang', language)
    history.replaceState(null, '', url)
    this.view.dispose()
    this.view = this.createView()
    this.render()
    this.view.focusLanguage()
    this.onLanguage(language)
    this.sounds.play('confirm')
  }
}
