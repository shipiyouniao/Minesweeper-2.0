import { sharedStyles } from './shared-styles.js'
import { guidanceStyles } from './guidance-styles.js'
import { approachPath } from '../game/dungeon-path.js'
import { act, neighbors } from '../game/engine.js'
import { actExpedition, createExpedition } from '../game/expedition.js'
import { actSonar, sonarCharges, sonarObscured } from '../game/sonar.js'
import { actSurvey, surveyLine } from '../game/survey.js'
import { surveyPractice } from '../game/survey-practice.js'
import { placedBoard } from '../game/variant-board.js'
import { message, translations } from '../i18n.js'
import type { Sonar } from '../types/sonar.js'
import { boardControlsTemplate, nextBoardMode } from './board-controls.js'
import { tutorialLesson } from './tutorial-lessons.js'

import type { Game } from '../types/game.js'
import type { TutorialDefinition } from '../types/guidance.js'
import type { Language } from '../types/localization.js'
import type { BoardInputMode } from '../types/ui.js'
import type { Expedition, Ruleset } from '../types/variants.js'
import { spriteImage } from './dungeon-sprites.js'

const players = new WeakMap<HTMLDialogElement, TutorialPlayer>()

/** Reuse the application's modal pause/focus lifecycle and isolate all practice state in memory. */
export function startTutorial(dialog: HTMLDialogElement, mode: Ruleset, language: Language): void {
  players.get(dialog)?.dispose()
  const player = new TutorialPlayer(dialog, mode, language)
  players.set(dialog, player)
}

/** Release practice listeners and held gestures before the owning application removes its dialog. */
export function stopTutorial(dialog: HTMLDialogElement): void {
  players.get(dialog)?.dispose()
  players.delete(dialog)
}

/** A lesson advances only after the requested real rule transition succeeds. */
class TutorialPlayer {
  private readonly events = new AbortController()
  private readonly lesson: TutorialDefinition
  private a: Game
  private sonar: Sonar
  private survey = surveyPractice()
  private b: Game
  private run: Expedition
  private step = 0
  private completed = false
  private mode: BoardInputMode = 'reveal'
  private tool: 'probe' | 'scan' | null = null
  private message = ''
  private hold: ReturnType<typeof setTimeout> | null = null
  private held = false
  private moving = false
  private movement: Animation | null = null

  private readonly originalClassName: string
  private readonly originalMarkup: string
  private disposed = false
  private readonly originalLabel: string | null
  private readonly dialog: HTMLDialogElement
  private readonly ruleset: Ruleset
  private readonly language: Language

  /** Create isolated practice state and bind input for the lifetime of this lesson dialog. */
  constructor(dialog: HTMLDialogElement, ruleset: Ruleset, language: Language) {
    this.originalClassName = dialog.className
    this.originalMarkup = dialog.innerHTML
    this.originalLabel = dialog.getAttribute('aria-labelledby')
    this.dialog = dialog
    this.ruleset = ruleset
    this.language = language
    this.lesson = tutorialLesson(ruleset, language)
    const board = placedBoard({ width: 5, height: 5, mines: 3 }, new Set([4, 16, 22]), 7, 0)
    this.a = { ...board, cells: board.cells.map((cell) => ({ ...cell, visibility: 'hidden' })) }
    if (ruleset === 'survey') this.a = this.survey.game
    this.sonar = { game: this.a, difficulty: 'easy', readings: [], moves: 0, excavations: 0 }
    this.b = placedBoard(board.config, new Set([6, 18, 24]), 8, 0)
    const base = createExpedition({
      title: null,
      seed: 7,
      difficulty: 'relaxed',
      profession: 'explorer',
      equipment: [],
      packs: [],
      training: [],
      archive: false,
      battleRelics: false,
    })
    this.run = {
      ...base,
      game: board,
      entrance: 0,
      exit: 24,
      player: 0,
      walls: [],
      treasures: [13],
      collected: [],
      travelled: [0],
      confirmedMines: [],
      surveyedCells: [],
      triggeredMines: [],
      scannedRows: [],
      shields: 1,
    }
    dialog.classList.add('guidance-dialog', ...guidanceStyles['guidance-dialog'].split(' '))
    dialog.dataset['tutorial'] = ruleset
    dialog.setAttribute('aria-labelledby', 'tutorial-title')
    dialog.addEventListener('click', this.click, { signal: this.events.signal })
    dialog.addEventListener('keydown', this.key, { signal: this.events.signal })
    dialog.addEventListener('contextmenu', this.secondary, { signal: this.events.signal })
    dialog.addEventListener('pointerdown', this.pointerDown, { signal: this.events.signal })
    dialog.addEventListener('pointerup', this.clearHold, { signal: this.events.signal })
    dialog.addEventListener('pointercancel', this.clearHold, { signal: this.events.signal })
    dialog.addEventListener('pointermove', this.clearHold, { signal: this.events.signal })
    dialog.addEventListener('close', () => this.dispose(), {
      once: true,
      signal: this.events.signal,
    })
    this.render()
    if (!dialog.open) dialog.showModal()
    this.focusTarget()
  }

  /** Cancel practice motion and input, then restore the dialog owned by the main game. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.movement?.cancel()
    delete this.dialog.dataset['practiceMoving']
    this.clearHold()
    this.events.abort()
    this.dialog.className = this.originalClassName
    delete this.dialog.dataset['tutorial']
    this.dialog.innerHTML = this.originalMarkup
    if (this.originalLabel) this.dialog.setAttribute('aria-labelledby', this.originalLabel)
  }

  /** Render practice cells using public clues, the lesson target and expedition landmarks. */
  private board(game: Game, side: 'a' | 'b'): string {
    const step = this.lesson.steps[this.step]
    const ring = step?.action === 'inspect' ? neighbors(game.config, step.index) : []
    const grid = `<div class="practice-board" role="grid" aria-label="${side.toUpperCase()}" aria-rowcount="5" aria-colcount="5">${game.cells
      .map((cell, index) => {
        const target =
          step?.side === side &&
          (step.index === index ||
            (step.action === 'scan' && this.ruleset !== 'sonar' && Math.floor(index / 5) === 4))
        const masked = this.ruleset === 'sonar' && sonarObscured(this.sonar, index)
        const known = cell.visibility === 'revealed'
        const flag = cell.visibility === 'flagged'
        const player = this.ruleset === 'expedition' && this.run.player === index
        const label = `${message(this.language, 'tutorial-player.row')} ${Math.floor(index / 5) + 1}, ${message(this.language, 'tutorial-player.column')} ${(index % 5) + 1}, ${flag ? message(this.language, 'tutorial-player.flag') : known ? (this.ruleset === 'survey' ? translations[this.language].empty : masked ? '≈' : cell.adjacent) : message(this.language, 'tutorial-player.covered')}`
        const entity =
          this.ruleset === 'expedition'
            ? player
              ? spriteImage('player')
              : index === 24
                ? spriteImage('exit')
                : index === 13 && !this.run.collected.includes(13)
                  ? spriteImage('treasure')
                  : ''
            : ''
        return `<button class="practice-cell ${known ? 'open' : ''} ${flag ? 'flagged' : ''} ${target ? 'practice-target' : ''} ${ring.includes(index) ? 'practice-neighbor' : ''}" data-practice-cell="${index}" data-practice-side="${side}" ${this.ruleset === 'survey' ? `aria-describedby="practice-survey-row-${Math.floor(index / 5)} practice-survey-column-${index % 5}"` : ''} aria-label="${label}${target ? ', ' + message(this.language, 'tutorial-player.try-here') : ''}" tabindex="${target && step?.index === index ? '0' : '-1'}">${entity || (flag ? '⚑' : known && cell.adjacent ? (masked ? '≈' : cell.adjacent) : '')}${this.ruleset === 'expedition' && this.run.surveyedCells.includes(index) && !known && !flag ? '<span class="practice-safe">✓</span>' : ''}</button>`
      })
      .join('')}</div>`
    const field =
      this.ruleset === 'survey'
        ? `<div class="practice-survey"><span></span><div class="practice-survey-columns">${this.surveyHeaders('column')}</div><div class="practice-survey-rows">${this.surveyHeaders('row')}</div>${grid}</div>`
        : grid
    return `<section class="practice-board-wrap"><h3>${this.ruleset === 'twin' ? side.toUpperCase() : message(this.language, 'tutorial-player.practice-field')}</h3>${field}</section>`
  }

  /** Give practice cells the same accessible ordered-run descriptions as the real puzzle. */
  private surveyHeaders(axis: 'row' | 'column'): string {
    return (axis === 'row' ? this.survey.rows : this.survey.columns)
      .map((runs, index) => {
        const label = message(this.language, 'survey.line', {
          axis: translations[this.language][axis],
          number: index + 1,
          runs: runs.join(', ') || '0',
          flags: surveyLine(this.survey, axis, index).flags,
        })
        return `<span id="practice-survey-${axis}-${index}" aria-label="${label}">${runs.join(axis === 'row' ? ' ' : '<br>') || '0'}</span>`
      })
      .join('')
  }

  /** Refresh lesson instructions, controls and progress from the current practice state. */
  private render(): void {
    const step = this.lesson.steps[this.step]
    const done = !step
    this.dialog.innerHTML = `<header class="guidance-header ${guidanceStyles['guidance-header']}"><div><span class="guidance-eyebrow ${guidanceStyles['guidance-eyebrow']}">FIELD NOTES / ${message(this.language, 'tutorial-player.learn-by-doing')}</span><h2 id="tutorial-title">${this.lesson.title}</h2></div><button class="guidance-close ${guidanceStyles['guidance-close']}" data-practice="close" aria-label="${message(this.language, 'tutorial-player.exit-practice')}">×</button></header><div class="lesson-progress ${guidanceStyles['lesson-progress']}" aria-label="${this.step + 1} / ${this.lesson.steps.length}">${this.lesson.steps.map((_, i) => `<span class="${i < this.step ? 'done' : i === this.step ? 'current' : ''}"></span>`).join('')}</div><div class="guidance-layout ${guidanceStyles['guidance-layout']}"><article class="lesson-note ${guidanceStyles['lesson-note']}"><span class="lesson-number ${guidanceStyles['lesson-number']}">${done ? '✓' : String(this.step + 1).padStart(2, '0')}</span><h3>${step?.title ?? message(this.language, 'tutorial-player.ready-for-the-field')}</h3><p>${step?.text ?? this.lesson.ending}</p><p class="lesson-feedback ${guidanceStyles['lesson-feedback']}" role="status">${this.message || (this.completed ? message(this.language, 'tutorial-player.good-continue-when-you-are-ready') : '')}</p>${this.ruleset === 'expedition' ? `<div class="practice-vitals ${guidanceStyles['practice-vitals']}">♥ ${this.run.health}/${this.run.maxHealth} · ◇ ${this.run.shields} · ${message(this.language, 'tutorial-player.chests')} ${this.run.collected.length}/1</div>` : ''}</article><div class="lesson-workspace ${guidanceStyles['lesson-workspace']} ${this.ruleset === 'twin' ? 'practice-twins' : ''}">${this.board(this.ruleset === 'expedition' ? this.run.game : this.a, 'a')}${this.ruleset === 'twin' ? this.board(this.b, 'b') : ''}<div class="practice-dock ${guidanceStyles['practice-dock']}">${this.ruleset === 'sonar' ? `<button class="practice-tool" data-practice="scan">${spriteImage('scanner')}<span>${message(this.language, 'tutorial-player.sonar')} · ${sonarCharges(this.sonar)}</span></button>` : ''}${this.ruleset === 'expedition' ? `<button class="practice-tool ${this.tool === 'probe' ? 'selected' : ''}" data-practice="probe">${spriteImage('probe')}<span>${message(this.language, 'tutorial-player.probe')} · ${this.run.probes}</span></button><button class="practice-tool ${this.tool === 'scan' ? 'selected' : ''}" data-practice="scan">${spriteImage('scanner')}<span>${message(this.language, 'tutorial-player.scan')} · ${this.run.scans}</span></button><button class="practice-tool" data-practice="skill" ${this.run.skillUsed ? 'disabled' : ''}>${spriteImage('skill-explorer')}<span>${message(this.language, 'tutorial-player.light')}</span></button>` : ''}${boardControlsTemplate(this.language, this.mode, 'data-action').replace('data-action="cycle-mode"', 'data-practice="cycle"')}</div></div></div><footer class="guidance-footer ${guidanceStyles['guidance-footer']}"><button class="text-button ${sharedStyles['text-button']}" data-practice="restart">${message(this.language, 'tutorial-player.start-again')}</button><span>${message(this.language, 'tutorial-player.click-tap-arrows-enter')}</span><button class="primary-button ${sharedStyles['primary-button']}" data-practice="${done ? 'close' : 'next'}" ${!done && !this.completed ? 'disabled' : ''}>${done ? message(this.language, 'tutorial-player.back-to-game') : message(this.language, 'tutorial-player.continue')} →</button></footer>`
    if (this.ruleset === 'survey' && this.mode === 'chord')
      this.dialog
        .querySelector('.mode-cycle')
        ?.setAttribute('title', message(this.language, 'survey.chord'))
  }

  /** Focus the next required action without scrolling the page underneath the lesson. */
  private focusTarget(): void {
    const step = this.lesson.steps[this.step]
    const selector = this.completed
      ? '[data-practice="next"]'
      : step?.action === 'mode'
        ? '[data-practice="cycle"]'
        : step?.action === 'skill'
          ? '[data-practice="skill"]'
          : step?.action === 'probe' || step?.action === 'scan'
            ? `[data-practice="${step.action}"]`
            : '.practice-target'
    this.dialog.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
  }

  /** Explain an out-of-sequence practice action without spending resources or advancing. */
  private reject(): void {
    this.message = message(
      this.language,
      'tutorial-player.try-the-highlighted-action-first-nothing-was',
    )
    const feedback = this.dialog.querySelector('.lesson-feedback')
    if (feedback) feedback.textContent = this.message
  }

  /** Accept only the requested lesson interaction and advance its isolated game state. */
  private applyCell(index: number, side: 'a' | 'b', secondary = false): void {
    const step = this.lesson.steps[this.step]
    if (!step || this.completed || this.moving) return
    if (
      step.side !== side ||
      (step.action === 'scan' && this.ruleset !== 'sonar'
        ? Math.floor(index / 5) !== 4
        : step.index !== index)
    ) {
      this.reject()
      return
    }
    if (step.action === 'inspect') this.completed = true
    else if (this.ruleset === 'expedition') {
      const before = this.run
      if (step.action === 'probe' && this.tool === 'probe')
        this.run = actExpedition(before, { type: 'probe', index })
      else if (step.action === 'scan' && this.tool === 'scan')
        this.run = actExpedition(before, { type: 'sweep', row: Math.floor(index / 5) })
      else if (step.action === 'cell' && this.mode === 'reveal')
        this.run = actExpedition(before, {
          type: before.game.cells[index]?.visibility === 'revealed' ? 'move' : 'reveal',
          index,
        })
      const next = this.run
      this.tool = null
      if (
        next !== before &&
        step.action === 'cell' &&
        next.player !== before.player &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        this.run = before
        void this.walk(before, next, index)
        return
      }
      this.completed = next !== before
    } else if (this.ruleset === 'sonar' && step.action === 'scan' && this.tool === 'scan') {
      const next = actSonar(this.sonar, { type: 'scan', index })
      this.completed = next !== this.sonar
      this.sonar = next
      this.a = next.game
      this.tool = null
    } else if (step.action === 'cell') {
      const type = secondary ? 'flag' : this.mode
      const expected = step.mode ?? 'reveal'
      if (type !== expected) {
        this.reject()
        return
      }
      const before = side === 'a' ? this.a : this.b
      const next =
        this.ruleset === 'survey'
          ? (this.survey = actSurvey(this.survey, { type, index })).game
          : this.ruleset === 'sonar'
            ? (this.sonar = actSonar(this.sonar, { type, index })).game
            : act(before, { type, index })
      if (side === 'a') this.a = next
      else this.b = next
      this.completed = next !== before
    }
    if (!this.completed) {
      this.reject()
      return
    }
    this.message = ''
    this.render()
    this.focusTarget()
  }

  /** Follow the same safe approach as a real move, then reveal or collect on arrival. */
  private async walk(before: Expedition, next: Expedition, destination: number): Promise<void> {
    const path = approachPath(before, destination) ?? [before.player]
    if (path[path.length - 1] !== next.player) path.push(next.player)
    const source = this.dialog.querySelector<HTMLElement>(`[data-practice-cell="${before.player}"]`)
    const sprite = source?.querySelector('img')
    this.moving = true
    this.dialog.dataset['practiceMoving'] = 'true'
    if (source) source.style.zIndex = '3'
    try {
      if (source && sprite) {
        const origin = source.getBoundingClientRect()
        const frames = path.map((index) => {
          const cell = this.dialog.querySelector<HTMLElement>(`[data-practice-cell="${index}"]`)!
          const rect = cell.getBoundingClientRect()
          return { transform: `translate(${rect.x - origin.x}px, ${rect.y - origin.y}px)` }
        })
        this.movement = sprite.animate(frames, {
          duration: (path.length - 1) * 190,
          easing: 'linear',
          fill: 'forwards',
        })
        await this.movement.finished
      }
      if (this.disposed) return
      this.run = next
      this.completed = true
      this.message = ''
      this.render()
      this.focusTarget()
    } catch {
      // Closing or restarting cancels the old lesson without advancing its replacement.
    } finally {
      this.movement?.cancel()
      this.movement = null
      this.moving = false
      if (!this.disposed) delete this.dialog.dataset['practiceMoving']
    }
  }

  /** Route lesson buttons and cell clicks while keeping real game handlers isolated. */
  private readonly click = (event: MouseEvent): void => {
    event.stopPropagation()
    if (this.held) {
      this.held = false
      return
    }
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-practice],[data-practice-cell]')
        : null
    if (!target) return
    if (target.dataset['practiceCell'] !== undefined) {
      this.applyCell(
        Number(target.dataset['practiceCell']),
        target.dataset['practiceSide'] === 'b' ? 'b' : 'a',
      )
      return
    }
    const command = target.dataset['practice'],
      step = this.lesson.steps[this.step]
    if (command === 'close') {
      this.dispose()
      this.dialog.close()
      return
    }
    if (command === 'restart') {
      startTutorial(this.dialog, this.ruleset, this.language)
      return
    }
    if (this.moving) return
    if (command === 'next' && this.completed) {
      this.step++
      this.completed = false
      this.message = ''
      this.render()
      this.focusTarget()
      return
    }
    if (this.completed || !step) return
    if (command === 'cycle') {
      this.mode = nextBoardMode(this.mode)
      this.completed = step.action === 'mode' && this.mode === step.mode
      this.message = ''
      this.render()
      this.focusTarget()
    } else if (command === 'skill' && step.action === 'skill') {
      const next = actExpedition(this.run, { type: 'skill' })
      this.completed = next !== this.run
      this.run = next
      this.message = ''
      this.render()
      this.focusTarget()
    } else if ((command === 'probe' || command === 'scan') && step.action === command) {
      this.tool = command
      this.message = ''
      this.render()
      this.dialog.querySelector<HTMLElement>('.practice-target')?.focus({ preventScroll: true })
    } else this.reject()
  }

  /** Provide keyboard cell navigation and activation inside the practice dialog. */
  private readonly key = (event: KeyboardEvent): void => {
    event.stopPropagation()
    const target =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>('[data-practice-cell]')
        : null
    if (!target) return
    const index = Number(target.dataset['practiceCell']),
      side = target.dataset['practiceSide'] === 'b' ? 'b' : 'a'
    const offset =
      event.key === 'ArrowLeft' || event.key === 'h'
        ? -1
        : event.key === 'ArrowRight' || event.key === 'l'
          ? 1
          : event.key === 'ArrowUp' || event.key === 'k'
            ? -5
            : event.key === 'ArrowDown' || event.key === 'j'
              ? 5
              : 0
    if (offset) {
      event.preventDefault()
      this.dialog
        .querySelector<HTMLElement>(
          `[data-practice-side="${side}"][data-practice-cell="${Math.max(0, Math.min(24, index + offset))}"]`,
        )
        ?.focus()
    }
    if (event.key.toLowerCase() === 'f') {
      event.preventDefault()
      this.applyCell(index, side, true)
    }
    if (event.key.toLowerCase() === 'c' && this.lesson.steps[this.step]?.mode === 'chord') {
      event.preventDefault()
      this.mode = 'chord'
      this.applyCell(index, side)
    }
  }

  /** Translate a practice right-click into the same secondary action used by touch. */
  private readonly secondary = (event: MouseEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    const cell =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-practice-cell]')
        : null
    if (cell)
      this.applyCell(
        Number(cell.dataset['practiceCell']),
        cell.dataset['practiceSide'] === 'b' ? 'b' : 'a',
        true,
      )
  }

  /** Schedule the practice secondary action for a touch hold on a target cell. */
  private readonly pointerDown = (event: PointerEvent): void => {
    event.stopPropagation()
    this.held = false
    const cell =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-practice-cell]')
        : null
    if (event.pointerType !== 'touch' || !cell) return
    this.hold = setTimeout(() => {
      this.held = true
      this.applyCell(
        Number(cell.dataset['practiceCell']),
        cell.dataset['practiceSide'] === 'b' ? 'b' : 'a',
        true,
      )
    }, 500)
  }
  /** Cancel any pending touch hold before it can act on a released or replaced target. */
  private readonly clearHold = (): void => {
    if (this.hold !== null) clearTimeout(this.hold)
    this.hold = null
  }
}
