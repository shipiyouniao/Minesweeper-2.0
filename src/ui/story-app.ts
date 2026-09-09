import { message } from '../i18n.js'
import { storyTaskName } from './story-quests.js'
import { CampSession } from '../application/camp-session.js'
import { StorySession } from '../application/story-session.js'
import { CAMP_SCENE, CAMP_SITES } from '../game/story-content.js'
import { buildStoryBoard, storyPath } from '../game/story.js'
import type { VariantRepository } from '../persistence/variant-repository.js'
import type { SoundEffects } from '../types/audio.js'
import type { CampScreen } from '../types/camp-navigation.js'
import type { Language } from '../types/localization.js'
import type { GameRepository } from '../types/storage.js'
import type { StoryFeedback, StoryHold, StoryViewState } from '../types/story.js'
import type { MountedGame } from '../types/variants.js'
import { BoardRightClick } from './board-right-click.js'
import { navigateCamp } from './camp-navigation.js'
import { LanguageMenu } from './language-menu.js'
import { storyTemplate } from './story-template.js'
import { StoryPerformance } from './story-performance.js'
import { StoryMapControls } from './story-map-controls.js'
import { storyDialogueEvent } from '../game/story-events.js'
import { TitleMenu } from './title-menu.js'
import { parseVariantCommand } from './variant-input.js'

/** Coordinate scene rules, shared camp services and gesture-safe chibi movement. */
export class StoryApp implements MountedGame {
  private readonly root: HTMLElement
  private readonly session: StorySession
  private readonly repository: VariantRepository
  private readonly preferences: GameRepository
  private readonly sounds: SoundEffects
  private readonly onLanguage: (language: Language) => void
  private language: Language
  private service: CampScreen | null = null
  private conversation: 'guide' | 'road' | null = null
  private flagMode = false
  private inspected: number | null = null
  private feedback: StoryFeedback = 'none'
  private readonly listeners = new AbortController()
  private readonly rightClick: BoardRightClick
  private readonly performance: StoryPerformance
  private languageMenu: LanguageMenu | null = null
  private titleMenu: TitleMenu | null = null
  private hold: StoryHold | null = null
  private suppressClickUntil = 0
  private animation: Animation | null = null
  private generation = 0
  private moving = false
  private panel: 'tasks' | 'map' | null = null
  private mapLevel: 'local' | 'region' | 'world' = 'local'
  private mapScene = 3
  private mapLegend = false
  private readonly mapControls = new StoryMapControls()
  private touchInput = matchMedia('(pointer: coarse)').matches
  private questTimer: ReturnType<typeof setTimeout> | null = null

  /** Restore the active scene and any unfinished dialogue. */
  constructor(
    root: HTMLElement,
    repository: VariantRepository,
    preferences: GameRepository,
    language: Language,
    sounds: SoundEffects,
    onLanguage: (language: Language) => void,
  ) {
    this.root = root
    this.repository = repository
    this.preferences = preferences
    this.language = language
    this.sounds = sounds
    this.onLanguage = onLanguage
    this.session = new StorySession(new CampSession(repository))
    this.performance = new StoryPerformance(
      root,
      sounds,
      this.session.run?.floor === 0 &&
        this.session.camp.story.journal?.actions.length === 0 &&
        !this.session.camp.story.dialogue?.active &&
        !this.session.camp.story.dialogue?.completed.includes('wake'),
    )
    this.rightClick = new BoardRightClick(root, (cell) => {
      void this.activate(Number(cell.dataset['storyCell']), true)
    })
    const options = { signal: this.listeners.signal }
    root.addEventListener('click', this.click, options)
    root.addEventListener('keydown', this.key, options)
    root.addEventListener('pointerdown', this.down, options)
    root.addEventListener('pointermove', this.move, options)
    window.addEventListener('pointerup', this.release, options)
    window.addEventListener('pointercancel', this.release, options)
    root.addEventListener('contextmenu', this.context, options)
    window.addEventListener('blur', this.cancelHold, options)
    this.render()
  }

  /** Cancel presentation only; accepted movement was already checkpointed by the session. */
  dispose(): void {
    this.mapControls.dispose()
    this.generation++
    if (this.questTimer) clearTimeout(this.questTimer)
    this.animation?.cancel()
    this.cancelHold()
    this.performance.dispose()
    this.listeners.abort()
    this.rightClick.dispose()
    this.languageMenu?.dispose()
    this.titleMenu?.dispose()
    this.sounds.dispose()
  }

  /** Assemble a coherent view from scene progress and the current shared wallet/loadout. */
  private snapshot(): StoryViewState {
    const run = this.session.run
    const progress = this.session.camp.story
    const board = run?.board ?? buildStoryBoard(CAMP_SCENE)
    const saved = progress.campPosition
    return {
      panel: this.panel,
      mapLevel: this.mapLevel,
      mapScene: this.mapScene,
      mapLegend: this.mapLegend,
      touchInput: this.touchInput,
      language: this.language,
      run,
      board,
      player: run?.player ?? (board.walls.includes(saved) ? board.entrance : saved),
      progress,
      camp: this.session.camp.camp,
      loadout: this.session.camp.loadout,
      service: this.service,
      conversation: this.conversation,
      flagMode: this.flagMode,
      inspected:
        run?.practicedFlag && !run.practicedReveal
          ? (board.scene.safeClue ?? this.inspected)
          : this.inspected,
      feedback: this.feedback,
      sound: this.sounds.enabled,
      storageAvailable: this.repository.available,
      exhausted: this.session.exhausted,
    }
  }

  /** Preserve keyboard focus without scrolling when stable scene markup is refreshed. */
  private render(): void {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const cell = active?.dataset['storyCell']
    const control = active?.dataset['storyAction']
    const task = active?.dataset['task']
    const banner = this.root.querySelector('.story-quest-reveal')
    const expanded = [...this.root.querySelectorAll<HTMLDetailsElement>('.story-quest[open]')].map(
      (details) => ({
        id: details.dataset['task'],
        panel: !!details.closest('.story-quest-panel'),
      }),
    )
    this.languageMenu?.dispose()
    this.titleMenu?.dispose()
    document.documentElement.lang = this.language === 'zh' ? 'zh-CN' : this.language
    document.title = 'Minefarer'
    let state = this.snapshot()
    const dialogue = storyDialogueEvent(state)
    if (dialogue && state.progress.dialogue?.active?.id !== dialogue) {
      this.session.checkpointDialogue(dialogue, 0)
      state = this.snapshot()
    }
    this.root.innerHTML = storyTemplate(state)
    if (banner) this.root.append(banner)
    for (const details of this.root.querySelectorAll<HTMLDetailsElement>('.story-quest'))
      details.open = expanded.some(
        (entry) =>
          entry.id === details.dataset['task'] &&
          entry.panel === !!details.closest('.story-quest-panel'),
      )
    this.performance.present(state)
    this.mapControls.mount(this.root)
    const picker = this.root.querySelector<HTMLElement>('.language-picker')!
    this.languageMenu = new LanguageMenu(picker, this.selectLanguage, (cue) =>
      this.sounds.play(cue),
    )
    const titles = this.root.querySelector<HTMLElement>('.title-cabinet')
    this.titleMenu = titles ? new TitleMenu(titles, (cue) => this.sounds.play(cue)) : null
    if (cell !== undefined) this.focusCell(Number(cell))
    else if (control)
      this.root
        .querySelector<HTMLElement>(
          `[data-story-action="${control}"]${task ? `[data-task="${task}"]` : ''}`,
        )
        ?.focus({ preventScroll: true })
  }

  /** Route finite service commands through the existing catalogs and shared camp operations. */
  private campCommand(value: string): void {
    if (this.session.run) return
    const command = parseVariantCommand(value)
    if (!command) return
    const camp = this.session.camp
    const loadout = camp.loadout
    let changed = true
    switch (command.type) {
      case 'camp-page': {
        if (command.value === 'overview') {
          this.service = null
          break
        }
        const site = CAMP_SITES.find((s) => s.destination === command.value)
        if (site) {
          this.service = null
          this.render()
          void this.activate(site.index, false)
        }
        return
      }
      case 'shop-category':
      case 'shop-item':
        this.service = navigateCamp(
          this.service ?? { page: 'shop', category: 'all', selected: 'surveyor' },
          command,
        )
        break
      case 'upgrade':
        changed = camp.purchase(command.value)
        break
      case 'claim-milestone':
        changed = camp.claim(command.value)
        break
      case 'equip-title':
        changed = camp.title(command.value)
        break
      case 'profession':
        changed = camp.selectLoadout({ profession: command.value, equipment: loadout.equipment })
        if (!changed)
          changed = camp.selectLoadout({
            profession: command.value,
            equipment: loadout.equipment.filter((item) => item !== 'guard'),
          })
        break
      case 'equipment':
        changed = camp.selectLoadout({
          ...loadout,
          equipment: loadout.equipment.includes(command.value)
            ? loadout.equipment.filter((item) => item !== command.value)
            : [...loadout.equipment, command.value],
        })
        break
      default:
        return
    }
    this.sounds.play(changed ? 'confirm' : 'blocked')
    this.render()
    const focus = this.root.querySelector<HTMLElement>(`[data-control="${value}"]`)
    if (focus && !(focus instanceof HTMLButtonElement && focus.disabled))
      focus.focus({ preventScroll: true })
    if (command.type === 'shop-item')
      this.root
        .querySelector('.shop-detail')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  /** Apply one scene action; route preview/animation never reads covered mine locations. */
  private async activate(index: number, flag: boolean): Promise<void> {
    if (this.root.querySelector('dialog.story-dialogue[open]')) return
    if (this.moving || this.performance.busy || !Number.isInteger(index)) return
    if (this.session.run?.floor === 0 && !this.session.camp.story.accepted?.includes('reach-camp'))
      return
    const state = this.snapshot()
    const cell = state.board.game.cells[index]
    if (!cell || state.board.walls.includes(index)) return
    this.feedback = 'none'
    if (state.run && flag) {
      const changed = this.session.dispatch({ type: 'flag', index })
      this.sounds.play(changed ? 'flag' : 'blocked')
      this.render()
      return
    }
    if (state.run && cell.visibility === 'revealed' && cell.adjacent) {
      this.inspected = index
      if (this.session.dispatch({ type: 'inspect', index })) {
        this.sounds.play('confirm')
        this.render()
        return
      }
    }
    const path = state.run
      ? storyPath(state.board, state.player, index)
      : this.session.campPath(index)
    if (!path) {
      this.feedback = 'route'
      this.sounds.play('blocked')
      this.render()
      return
    }
    const changed = state.run
      ? this.session.dispatch({ type: 'visit', index })
      : this.session.moveCamp(index)
    if (!changed && index !== state.player) {
      this.sounds.play('blocked')
      return
    }
    const hurt = state.run && this.session.run && state.run.health > this.session.run.health
    const destination = this.session.run?.player ?? this.session.camp.story.campPosition
    const animationPath = path.at(-1) === destination ? path : [...path, destination]
    const generation = ++this.generation
    this.moving = true
    this.sounds.play(hurt ? 'loss' : cell.visibility === 'hidden' ? 'reveal' : 'navigate')
    await this.walk(animationPath)
    if (generation !== this.generation) return
    this.moving = false
    this.feedback = hurt ? 'hurt' : 'none'
    if (state.run && this.session.run?.player === this.session.run?.board.exit) {
      if (this.session.dispatch({ type: 'continue' })) {
        this.inspected = null
        this.flagMode = false
        this.panel = null
      } else this.feedback = 'lesson'
    } else if (
      state.run &&
      state.run.floor > 0 &&
      this.session.run?.player === this.session.run?.board.entrance
    ) {
      if (this.session.dispatch({ type: 'return' })) {
        this.inspected = null
        this.flagMode = false
        this.panel = null
      }
    }
    if (!state.run) {
      if (index === state.board.exit && this.session.leaveCamp()) {
        this.conversation = null
        this.inspected = null
        this.panel = null
      }
      const site = CAMP_SITES.find((entry) => entry.index === index)
      if (site?.destination === 'guide') {
        this.session.meetGuide()
        this.conversation = 'guide'
      } else if (site?.destination === 'road') this.conversation = 'road'
      else if (site)
        this.service = { page: site.destination, category: 'all', selected: 'surveyor' }
    }
    this.render()
    if (!state.run && index === 51) this.performance.react('greet')
    if (
      state.run &&
      state.run.floor === this.session.run?.floor &&
      !state.run.collected &&
      this.session.run?.collected
    )
      this.performance.react('collect')
  }

  /** Give accepted objectives a large scene title, with cleanup even when motion is disabled. */
  private questReveal(title: string, subtitle: string): void {
    this.root.querySelector('.story-quest-reveal')?.remove()
    if (this.questTimer) clearTimeout(this.questTimer)
    const banner = document.createElement('div')
    banner.className = 'story-quest-reveal'
    banner.setAttribute('role', 'status')
    const heading = document.createElement('h2')
    heading.textContent = title
    const label = document.createElement('p')
    label.textContent = subtitle
    banner.append(label, heading)
    this.root.append(banner)
    this.sounds.play('confirm')
    this.questTimer = setTimeout(() => {
      banner.remove()
      this.questTimer = null
    }, 2800)
  }

  /** Animate the existing chibi over a path; reduced-motion users see the committed destination. */
  private async walk(path: readonly number[]): Promise<void> {
    const traveler = this.root.querySelector<HTMLElement>('.story-traveler')
    if (!traveler || path.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return
    const frames = path.flatMap((index) => {
      const cell = this.root.querySelector<HTMLElement>(`[data-story-cell="${index}"]`)
      return cell ? [{ left: `${cell.offsetLeft}px`, top: `${cell.offsetTop}px` }] : []
    })
    traveler.classList.add('is-walking')
    this.animation = traveler.animate(frames, {
      duration: Math.min(1800, (path.length - 1) * 100),
      fill: 'forwards',
      easing: 'linear',
    })
    try {
      await this.animation.finished
    } catch {
      /* Navigation can cancel presentation after the move has committed. */
    }
    this.animation = null
    traveler.classList.remove('is-walking')
  }

  /** Delegate ordinary clicks while a held touch suppresses its compatibility click. */
  private readonly click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    this.sounds.unlock()
    const button = event.target.closest<HTMLElement>(
      '[data-story-cell], [data-story-action], [data-control]',
    )
    if (!button) return
    if (button.dataset['storyAction'] === 'wake') {
      this.performance.skipOpening()
      return
    }
    if (this.performance.busy) return
    if (button.dataset['storyAction'] === 'dialogue') {
      const id = storyDialogueEvent(this.snapshot())
      if (!id) return
      if (this.performance.advance()) {
        const hadMap = this.session.camp.story.mapOwned
        const task = this.session.completeDialogue(id)
        const map = !hadMap && this.session.camp.story.mapOwned
        this.render()
        if (task)
          this.questReveal(
            storyTaskName(this.language, task),
            message(this.language, 'story.quest-accepted'),
          )
        else if (map)
          this.questReveal(
            message(this.language, 'story.map'),
            message(this.language, 'story.map-received'),
          )
      } else this.session.checkpointDialogue(id, this.performance.currentBeat)
      return
    }
    const index = button.dataset['storyCell']
    if (index !== undefined) {
      if (performance.now() < this.suppressClickUntil) {
        event.preventDefault()
        return
      }
      void this.activate(Number(index), this.flagMode)
      return
    }
    if (this.moving) return
    if (button.dataset['control']) {
      this.campCommand(button.dataset['control'])
      return
    }
    switch (button.dataset['storyAction']) {
      case 'map-legend':
        this.mapLegend = !this.mapLegend
        break
      case 'map-level': {
        const level = button.dataset['level']
        if (level !== 'local' && level !== 'region' && level !== 'world') return
        this.mapLevel = level
        break
      }
      case 'map-scene': {
        const scene = Number(button.dataset['scene'])
        if (
          !Number.isInteger(scene) ||
          scene < 0 ||
          scene > (this.session.camp.story.arrived ? 4 : (this.session.run?.floor ?? 3))
        )
          return
        this.mapScene = scene
        this.mapLevel = 'local'
        break
      }
      case 'tasks':
      case 'map':
        if (button.dataset['storyAction'] === 'map' && this.panel !== 'map') {
          this.mapScene = this.session.run?.floor ?? 3
          this.mapLevel = 'local'
          this.mapLegend = false
        }
        this.panel =
          this.panel === button.dataset['storyAction']
            ? null
            : (button.dataset['storyAction'] as 'tasks' | 'map')
        break
      case 'close-panel':
        this.panel = null
        break
      case 'pin': {
        const id = button.dataset['task']
        if (id === 'reach-camp' || id === 'lost-satchel' || id === 'meet-guide')
          this.session.togglePin(id)
        break
      }
      case 'flag':
        this.flagMode = true
        break
      case 'explore':
        this.flagMode = false
        break
      case 'back':
        this.service = null
        break
      case 'sound':
        this.sounds.setEnabled(!this.sounds.enabled)
        this.preferences.setPreference({ key: 'sound', value: this.sounds.enabled })
        break
      case 'retry':
        this.session.dispatch({ type: 'retry' })
        this.inspected = null
        break
      case 'continue':
        if (!this.session.dispatch({ type: 'continue' })) this.feedback = 'lesson'
        this.inspected = null
        this.flagMode = false
        break
      default:
        return
    }
    this.sounds.play('confirm')
    this.render()
    if (
      button.dataset['storyAction'] === 'map-level' ||
      button.dataset['storyAction'] === 'map-scene'
    )
      this.root.querySelector<HTMLElement>('.atlas-scale')?.focus({ preventScroll: true })
  }

  /** Maintain roving focus while leaving browser scrolling and all nonboard keys alone. */
  private focusCell(index: number): void {
    const target = this.root.querySelector<HTMLElement>(`[data-story-cell="${index}"]`)
    if (!target) return
    for (const cell of this.root.querySelectorAll<HTMLElement>('[data-story-cell]'))
      cell.tabIndex = cell === target ? 0 : -1
    target.focus({ preventScroll: true })
  }

  /** Mouse, keyboard and touch all call the same finite scene actions. */
  private readonly key = (event: KeyboardEvent): void => {
    this.sounds.unlock()
    if (this.performance.busy) {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.performance.skipOpening()
      }
      return
    }
    if (event.key === 'Escape' && this.panel) {
      this.panel = null
      this.render()
      return
    }
    const cell =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>('[data-story-cell]')
        : null
    if (!cell) return
    const index = Number(cell.dataset['storyCell'])
    const width = this.snapshot().board.game.config.width
    if (event.key.toLowerCase() === 'f') {
      event.preventDefault()
      void this.activate(index, true)
      return
    }
    const delta =
      event.key === 'ArrowLeft'
        ? -1
        : event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp'
            ? -width
            : event.key === 'ArrowDown'
              ? width
              : 0
    if (!delta) return
    event.preventDefault()
    const target = index + delta
    if (Math.abs(delta) === 1 && Math.floor(target / width) !== Math.floor(index / width)) return
    this.focusCell(target)
    this.sounds.play('navigate')
  }

  /** Arm a hold only for a touch cell; scrolling past the threshold cancels it. */
  private readonly down = (event: PointerEvent): void => {
    this.sounds.unlock()
    const touch = event.pointerType !== 'mouse'
    if (touch !== this.touchInput) {
      this.touchInput = touch
      const objective = this.root.querySelector('[data-story-flag-guidance]')
      if (objective && this.session.run?.inspected && !this.session.run.practicedFlag)
        objective.textContent = touch
          ? message(this.language, 'story.flag-touch')
          : message(this.language, 'story.flag-mouse')
    }
    if (event.pointerType === 'mouse' || !event.isPrimary || this.moving) return
    const cell =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-story-cell]')
        : null
    if (!cell || !this.session.run) return
    this.cancelHold()
    const index = Number(cell.dataset['storyCell'])
    const timer = setTimeout(() => {
      if (!this.hold || this.hold.pointerId !== event.pointerId) return
      this.hold = { ...this.hold, fired: true }
      this.suppressClickUntil = performance.now() + 800
      void this.activate(index, true)
    }, 500)
    this.hold = {
      index,
      timer,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      fired: false,
    }
  }

  /** A pan remains a pan, including when it ends over another cell. */
  private readonly move = (event: PointerEvent): void => {
    if (
      this.hold?.pointerId === event.pointerId &&
      Math.hypot(event.clientX - this.hold.x, event.clientY - this.hold.y) > 8
    ) {
      this.suppressClickUntil = performance.now() + 500
      this.cancelHold()
    }
  }

  /** Native touch context menus must not scroll or target a replacement element. */
  private readonly context = (event: MouseEvent): void => {
    if (event.target instanceof Element && event.target.closest('[data-story-cell]'))
      event.preventDefault()
  }

  /** End a pending hold without interfering with the native click for an ordinary tap. */
  private readonly release = (event: PointerEvent): void => {
    if (this.hold?.pointerId !== event.pointerId) return
    this.cancelHold()
  }

  /** Clear a pending hold on scroll, cancellation, blur or route disposal. */
  private readonly cancelHold = (): void => {
    if (!this.hold) return
    if (this.hold.fired) this.suppressClickUntil = performance.now() + 800
    clearTimeout(this.hold.timer)
    this.hold = null
  }

  /** Translate the current scene without replacing either save or tutorial progress. */
  private readonly selectLanguage = (language: Language): void => {
    this.generation++
    this.animation?.cancel()
    this.moving = false
    this.language = language
    this.preferences.setPreference({ key: 'language', value: language })
    const url = new URL(location.href)
    url.searchParams.set('lang', language)
    history.replaceState(null, '', url)
    this.onLanguage(language)
    this.render()
    this.languageMenu?.focus()
    this.sounds.play('confirm')
  }
}
