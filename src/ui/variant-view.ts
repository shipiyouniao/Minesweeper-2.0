import { returnedToCampCopy } from './variant-copy.js'
import { battleText } from './combat-build-copy.js'
import { battleThreat } from '../game/combat-build.js'
import { frontierCells } from '../game/expedition.js'
import { probeArea } from '../game/dungeon-discovery.js'
import { translations } from '../i18n.js'
import type { Config, Game } from '../types/game.js'
import type { Language } from '../types/localization.js'
import type { BoardSide, Expedition } from '../types/variants.js'
import type { InteractionCue } from '../types/audio.js'
import type { NavigationKey, NavigationResult } from '../types/ui.js'
import { BoardView } from './board-view.js'
import { LanguageMenu } from './language-menu.js'
import { siteHeaderTemplate } from './templates.js'
import { professionCopy, variantCopy } from './variant-copy.js'
import { icon } from '../icons.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'
import type { DungeonTool } from '../types/dungeon-ui.js'
import { tacticalCellAction, tacticalPlan } from '../game/tactical-planning.js'
import { tacticalCopy, tacticalPlanCopy } from './tactical-copy.js'
import { bossSprite } from './tactical-sprites.js'
import { markBroodCell } from './brood-board.js'
import { ExpeditionDialog } from './expedition-dialog.js'

/** Owns special-mode DOM, focus restoration, language-menu and modal lifetimes. */
export class VariantView {
  private readonly root: HTMLElement
  private readonly language: Language
  private readonly content: HTMLElement
  private readonly status: HTMLElement
  private readonly dialog: HTMLDialogElement
  private readonly expeditionDialog: ExpeditionDialog
  private readonly menu: LanguageMenu
  private a: BoardView | null = null
  private b: BoardView | null = null
  private focusA = 0
  private focusB = 0
  private walking: Animation | null = null
  private resize: ResizeObserver | null = null
  private config: Config | null = null
  private enlarged = false
  private floorIdentity: string | null = null
  private expedition: Expedition | null = null
  private targetingTool = false
  private readonly listeners = new AbortController()

  /** Mount the stable shell once; only its mode content changes after an action. */
  constructor(
    root: HTMLElement,
    language: Language,
    mode: 'expedition' | 'twin',
    onLanguage: (language: Language) => void,
    feedback: (cue: InteractionCue) => void,
  ) {
    this.root = root
    this.language = language
    const t = variantCopy(language)
    const common = translations[language]
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
    root.innerHTML = `${siteHeaderTemplate(language, 'data-control')}
      <main class="variant-main ${mode}"><div class="game-heading variant-heading"><h2>${mode === 'expedition' ? t.expedition : t.twin}</h2><div class="game-heading-actions"><button class="icon-button" data-control="sound" aria-label="${common.sound}" aria-pressed="true">${icon('volume')}</button><button class="icon-button" data-control="pause" aria-label="${common.pause}">${icon('pause')}</button></div></div>
      <p class="variant-storage" role="status"></p><div class="variant-pause" hidden><p>${common.paused}</p><button class="primary-button" data-control="pause">${common.resume}</button></div><div class="variant-content"></div></main>
      <dialog aria-labelledby="variant-dialog-title"><h2 id="variant-dialog-title">${common.confirmTitle}</h2><p></p><div class="dialog-actions"><button class="secondary-button" data-control="cancel">${common.cancel}</button><button class="primary-button" data-control="confirm">${common.start}</button></div></dialog>`
    const content = root.querySelector<HTMLElement>('.variant-content')
    const status = root.querySelector<HTMLElement>('.variant-storage')
    const dialog = root.querySelector<HTMLDialogElement>('dialog')
    const picker = root.querySelector<HTMLElement>('.language-picker')
    if (!content || !status || !dialog || !picker) throw new Error('Variant shell is incomplete')
    this.content = content
    this.status = status
    this.dialog = dialog
    this.expeditionDialog = new ExpeditionDialog(root, language)
    this.menu = new LanguageMenu(picker, onLanguage, feedback)
    dialog.addEventListener('cancel', () => feedback('dismiss'), { signal: this.listeners.signal })
  }

  /** Expose modal state to application guards, including native Escape dismissal. */
  get dialogOpen(): boolean {
    return this.dialog.open || this.expeditionDialog.open
  }

  /** Distinguish reward selection from help and destructive-action confirmation. */
  get rewardOpen(): boolean {
    return this.expeditionDialog.rewardOpen
  }

  /** Distinguish an already settled expedition from pending relic selection. */
  get resultOpen(): boolean {
    return this.expeditionDialog.resultOpen
  }

  /** Reopen dismissed rewards or settlement without changing the session. */
  showExpeditionDialog(): void {
    if (this.expedition) this.expeditionDialog.show(this.expedition)
  }

  /** Replace content and restore a still-existing control or cell focus after repaint. */
  render(html: string, a: Game | null, b: Game | null, expedition: Expedition | null): void {
    this.resize?.disconnect()
    this.config = a?.config ?? null
    this.expedition = expedition
    this.targetingTool = false
    const oldA = this.content.querySelector<HTMLElement>('[data-side="a"]')?.parentElement
    const oldB = this.content.querySelector<HTMLElement>('[data-side="b"]')?.parentElement
    const scrollA = [oldA?.scrollLeft ?? 0, oldA?.scrollTop ?? 0]
    const scrollB = [oldB?.scrollLeft ?? 0, oldB?.scrollTop ?? 0]
    const identity = expedition
      ? `${expedition.departure.seed}:${expedition.floor}:${expedition.game.config.width}:${Boolean(expedition.encounter)}`
      : a
        ? `twin:${a.seed}:${a.config.width}`
        : null
    const sameBoard = identity === this.floorIdentity
    if (identity !== this.floorIdentity) {
      this.floorIdentity = identity
      this.focusA = expedition?.player ?? 0
      this.focusB = 0
    }
    const active =
      document.activeElement instanceof HTMLElement && this.content.contains(document.activeElement)
        ? document.activeElement
        : null
    const cell = active?.dataset['cell']
    const side = active?.closest<HTMLElement>('[data-side]')?.dataset['side']
    const control = active?.dataset['control']
    this.content.innerHTML = html
    this.a = this.board('a', a, this.focusA)
    this.b = this.board('b', b, this.focusB)
    this.applyZoom()
    if (expedition) this.markExpedition(expedition)
    if (expedition?.encounter) this.markTactical(expedition)
    if (sameBoard) {
      this.content
        .querySelector('[data-side="a"]')
        ?.parentElement?.scrollTo(scrollA[0] ?? 0, scrollA[1] ?? 0)
      this.content
        .querySelector('[data-side="b"]')
        ?.parentElement?.scrollTo(scrollB[0] ?? 0, scrollB[1] ?? 0)
    }

    const selector =
      cell !== undefined && (side === 'a' || side === 'b')
        ? `[data-side="${side}"] [data-cell="${CSS.escape(cell)}"]`
        : control
          ? `[data-control="${CSS.escape(control)}"]`
          : null
    const target = selector ? this.content.querySelector<HTMLElement>(selector) : null
    if (target && !target.hasAttribute('disabled')) target.focus({ preventScroll: true })
    else if (active)
      this.content
        .querySelector<HTMLElement>('.variant-status, .tactical-event, h1')
        ?.focus({ preventScroll: true })

    this.expeditionDialog.render(expedition, this.content.hidden !== false)
  }

  /** Update availability warnings and accessible sound/pause state independently of the board. */
  chrome(
    available: boolean,
    recovered: boolean,
    sound: boolean,
    paused: boolean,
    atMoveLimit: boolean,
    migrated = false,
    returnedSupplies: number | null = null,
  ): void {
    const common = translations[this.language]
    this.status.textContent = atMoveLimit
      ? variantCopy(this.language).journalLimit
      : returnedSupplies !== null && available
        ? returnedToCampCopy(this.language, returnedSupplies)
        : !available
          ? common.storageOff
          : recovered
            ? variantCopy(this.language).recovered
            : migrated
              ? variantCopy(this.language).migrated
              : ''
    const button = this.root.querySelector<HTMLButtonElement>('[data-control="sound"]')
    if (button) {
      button.innerHTML = icon(sound ? 'volume' : 'volumeOff')
      button.setAttribute('aria-label', sound ? common.soundOn : common.soundOff)
      button.title = sound ? common.soundOn : common.soundOff
      button.setAttribute('aria-pressed', String(sound))
    }
    const cover = this.root.querySelector<HTMLElement>('.variant-pause')
    if (cover) cover.hidden = !paused
    this.content.hidden = paused
    this.content.inert = paused
    const pause = this.root.querySelector<HTMLButtonElement>(
      '.variant-heading [data-control="pause"]',
    )
    if (pause) {
      pause.innerHTML = icon(paused ? 'play' : 'pause')
      pause.setAttribute('aria-label', paused ? common.resume : common.pause)
      pause.setAttribute('aria-pressed', String(paused))
    }
  }

  /** Show an application-owned confirmation using the browser's focus-trapping dialog. */
  confirm(message: string, label: string): void {
    this.dialog.innerHTML = `<h2 id="variant-dialog-title">${translations[this.language].confirmTitle}</h2><p></p><div class="dialog-actions"><button class="secondary-button" data-control="cancel">${translations[this.language].cancel}</button><button class="primary-button" data-control="confirm"></button></div>`
    const paragraph = this.dialog.querySelector('p')
    if (paragraph) paragraph.textContent = message
    const button = this.dialog.querySelector<HTMLButtonElement>('[data-control="confirm"]')
    if (button) button.textContent = label
    this.dialog.showModal()
  }

  /** Open help or records in the same native modal presentation used by classic mode. */
  showInformation(title: string, content: string): void {
    this.dialog.innerHTML = `<button class="dialog-close icon-button" data-control="cancel" aria-label="${translations[this.language].close}">${icon('close')}</button><h2 id="variant-dialog-title">${title}</h2>${content}`
    this.dialog.showModal()
  }

  /** Preview either the probe's clipped 3×3 area or the scanner's complete row. */
  previewTool(tool: DungeonTool | null, index: number | null): void {
    this.targetingTool = tool !== null
    if (tool) this.previewRoute(null)
    const config = this.config
    if (!config) return
    const area = index === null ? [] : probeArea(config, index)
    for (const button of this.content.querySelectorAll<HTMLElement>('[data-tool]'))
      button.setAttribute('aria-pressed', String(button.dataset['tool'] === tool))
    for (const cell of this.content.querySelectorAll<HTMLElement>('[data-side="a"] [data-cell]'))
      cell.classList.toggle(
        'tool-target',
        tool === 'probe'
          ? area.includes(Number(cell.dataset['cell']))
          : tool === 'scan' &&
              index !== null &&
              Math.floor(Number(cell.dataset['cell']) / config.width) ===
                Math.floor(index / config.width),
      )
    const hint = this.content.querySelector<HTMLElement>('.tool-hint')
    if (!hint) return
    const copy = variantCopy(this.language)
    if (!tool) {
      hint.textContent = copy.toolHint
      return
    }

    const description = tool === 'probe' ? copy.probeHint : copy.scanHint
    if (index === null) {
      hint.textContent = description
      return
    }

    const common = translations[this.language]
    const row = `${common.row} ${Math.floor(index / config.width) + 1}`
    const column = `${common.column} ${(index % config.width) + 1}`
    hint.textContent =
      tool === 'probe' ? `${description} · ${row} · ${column}` : `${description} · ${row}`
  }

  /** Highlight only publicly walkable routes; tool targeting takes visual precedence. */
  previewRoute(index: number | null): void {
    const run = this.expedition
    if (!run || run.phase !== 'boss') return
    const plan =
      index !== null && !this.targetingTool
        ? tacticalPlan(run, tacticalCellAction(run, index))
        : null
    const route = new Set(plan?.path ?? [])
    for (const cell of this.content.querySelectorAll<HTMLElement>('[data-cell]')) {
      const onRoute = route.has(Number(cell.dataset['cell']))
      cell.classList.toggle('tactical-route', onRoute)
      cell.classList.toggle('tactical-unaffordable', Boolean(plan && !plan.allowed && onRoute))
    }
    const hint = this.content.querySelector<HTMLElement>('.tactical-plan')
    if (hint)
      hint.textContent = plan
        ? tacticalPlanCopy(this.language, plan)
        : tacticalCopy(this.language, run.encounter?.kind).hint
  }

  /** Overlay public mechanisms and frozen attack warnings without exposing covered clues. */
  private markTactical(run: Expedition): void {
    const encounter = run.encounter
    if (!encounter) return
    const t = tacticalCopy(this.language, encounter.kind)
    for (const cell of this.content.querySelectorAll<HTMLElement>('[data-cell]')) {
      const index = Number(cell.dataset['cell'])
      const pylon =
        encounter.kind === 'bastion'
          ? encounter.pylons.find((entry) => entry.index === index)
          : null
      if (index === encounter.boss) {
        cell.classList.remove('wall-cell')
        cell.classList.add('boss-cell')
        cell.removeAttribute('aria-disabled')
        cell.innerHTML = spriteImage(bossSprite(encounter))
        cell.setAttribute('aria-label', `${t.name}, ${encounter.health} / ${encounter.maxHealth}`)
      } else if (pylon) {
        cell.classList.add('landmark-cell', 'pylon-cell')
        const mechanism =
          encounter.kind === 'bastion'
            ? encounter.mechanisms?.find((entry) => entry.index === index)
            : null
        if (mechanism) {
          cell.classList.add(mechanism.effect === 'weaken' ? 'mechanism-amber' : 'mechanism-blue')
          cell.title =
            mechanism.effect === 'weaken'
              ? battleText(
                  this.language,
                  'Suppressor · lowers future attacks to 3',
                  '抑制机关 · 后续攻击降至 3 点',
                  '抑制装置 · 以後の攻撃を3に軽減',
                )
              : battleText(
                  this.language,
                  'Resonator · four-turn core windows',
                  '共鸣机关 · 核心窗口延长至 4 回合',
                  '共鳴装置 · コア露出を4ターンに延長',
                )
        }

        cell.innerHTML = `${spriteImage(pylon.active ? 'bastion-pylon' : 'bastion-pylon-off')}${run.game.cells[index]?.visibility === 'revealed' ? `<span class="landmark-clue">${run.game.cells[index]?.adjacent ?? 0}</span>` : ''}`
        cell.setAttribute(
          'aria-label',
          `${cell.getAttribute('aria-label')}, ${pylon.active ? t.pylon : t.disabled}`,
        )
      }
      markBroodCell(this.language, run, cell, index)
      if (index === run.player && cell.classList.contains('landmark-cell'))
        cell.insertAdjacentHTML(
          'beforeend',
          `<span class="landmark-player">${spriteImage(professionSprite(run.departure.profession))}</span>`,
        )

      if (run.phase === 'boss' && encounter.intent.targets.includes(index)) {
        cell.classList.add('tactical-danger')
        const danger = `${t.danger} · ${battleThreat(encounter, index)}`
        cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${danger}`)
        cell.title = danger
      }
    }
  }

  /** Toggle larger touch targets without replacing the board or resetting its focus. */
  toggleZoom(): void {
    this.enlarged = !this.enlarged
    this.applyZoom()
  }

  /** Restore the chosen zoom after every content repaint. */
  private applyZoom(): void {
    this.content.classList.toggle('enlarged-boards', this.enlarged)
    const button = this.content.querySelector<HTMLElement>('[data-control="zoom"]')
    const hint = this.content.querySelector<HTMLElement>('.zoom-hint')
    const t = variantCopy(this.language)
    if (button) {
      button.textContent = this.enlarged ? t.fit : t.zoom
      button.setAttribute('aria-pressed', String(this.enlarged))
    }
    if (hint) hint.hidden = !this.enlarged
  }

  /** Animate a known safe path before committing the destination action. */
  async walk(path: readonly number[]): Promise<boolean> {
    const player = this.content.querySelector<HTMLElement>('.dungeon-player')
    if (!player || path.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return true
    const frames: Keyframe[] = []
    for (const index of path) {
      const cell = this.content.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${index}"]`)
      if (!cell) return false
      frames.push({ transform: `translate(${cell.offsetLeft}px, ${cell.offsetTop}px)` })
      cell.classList.add('walk-route')
    }
    this.walking = player.animate(frames, {
      duration: Math.min(1800, (path.length - 1) * 100),
      fill: 'forwards',
      easing: 'linear',
    })
    player.classList.add('walking')
    try {
      await this.walking.finished
      return true
    } catch {
      return false
    } finally {
      player.classList.remove('walking')
      this.walking = null
      for (const cell of this.content.querySelectorAll('.walk-route'))
        cell.classList.remove('walk-route')
    }
  }

  /** Cancel a walk when paused, backgrounded, remounted or disposed. */
  cancelWalk(): void {
    this.walking?.cancel()
  }

  /** Close a pending confirmation without replacing its trigger or board. */
  closeDialog(): void {
    this.dialog.close()
    this.expeditionDialog.close()
  }

  /** Dismiss transient menus when the page is backgrounded. */
  closeMenu(): void {
    this.menu.close()
  }

  /** Focus the language trigger after replacing translated markup. */
  focusLanguage(): void {
    this.menu.focus()
  }

  /** Maintain one tab stop per board and a purely coordinate-based partner highlight. */
  focus(side: BoardSide, index: number): void {
    if (side === 'a') {
      this.focusA = index
      this.a?.rememberFocus(index)
    } else {
      this.focusB = index
      this.b?.rememberFocus(index)
    }
    for (const cell of this.content.querySelectorAll<HTMLElement>('[data-cell]')) {
      cell.classList.toggle(
        'paired-focus',
        cell.dataset['cell'] === String(index) &&
          cell.closest<HTMLElement>('[data-side]')?.dataset['side'] !== side,
      )
    }
  }

  /** Delegate geometry to the shared board view so keyboard behavior stays consistent. */
  navigate(side: BoardSide, index: number, key: NavigationKey): NavigationResult {
    return (side === 'a' ? this.a : this.b)?.navigate(index, key) ?? 'unavailable'
  }

  /** Release native dialog and language listeners before removing the shell. */
  dispose(): void {
    this.cancelWalk()
    this.resize?.disconnect()
    this.listeners.abort()
    this.menu.dispose()
    this.expeditionDialog.dispose()
    this.dialog.close()
    this.root.replaceChildren()
  }

  /** Build and paint a board without exposing covered mines or clues. */
  private board(side: BoardSide, game: Game | null, index: number): BoardView | null {
    const element = this.content.querySelector<HTMLElement>(`[data-side="${side}"]`)
    if (!element || !game) return null
    element.dataset['cells'] = String(game.cells.length)
    const view = new BoardView(element, game.config, Math.min(index, game.cells.length - 1))
    view.render(game, false, translations[this.language])
    return view
  }

  /** Add advertised landmarks and legal frontier hints; hidden mine values never enter attributes. */
  private markExpedition(run: Expedition): void {
    const frontier = frontierCells(run)
    const t = variantCopy(this.language)
    for (const cell of this.content.querySelectorAll<HTMLElement>('[data-cell]')) {
      const index = Number(cell.dataset['cell'])
      const treasure = run.treasures.includes(index)
      cell.classList.toggle('frontier', run.phase === 'exploring' && frontier.has(index))
      const wall = run.walls.includes(index)
      const mark = wall
        ? 'wall'
        : index === run.entrance
          ? 'entrance'
          : index === run.exit
            ? 'exit'
            : treasure && !run.collected.includes(index)
              ? 'treasure'
              : run.game.phase === 'lost' && run.game.cells[index]?.mine
                ? 'mine'
                : null
      const label = wall
        ? t.wall
        : index === run.entrance
          ? t.entrance
          : index === run.exit
            ? t.exit
            : treasure
              ? run.collected.includes(index)
                ? t.collected
                : t.treasure
              : ''
      if (mark) {
        cell.classList.add('landmark-cell')
        if (wall) {
          cell.classList.add('wall-cell')
          cell.innerHTML = ''
          cell.setAttribute('aria-disabled', 'true')
        } else if (mark === 'mine') cell.innerHTML = ''
        else if (run.game.cells[index]?.visibility === 'revealed' && !run.game.cells[index]?.mine)
          cell.innerHTML = `<span class="landmark-clue">${run.game.cells[index]?.adjacent || ''}</span>`
        cell.insertAdjacentHTML('afterbegin', spriteImage(mark))
      }
      if (label) cell.setAttribute('aria-label', cell.getAttribute('aria-label') + ', ' + label)
      const confirmed = run.confirmedMines.includes(index)
      const surveyedSafe = run.surveyedCells.includes(index) && !confirmed && !wall
      cell.classList.toggle('confirmed-mine', confirmed)
      cell.classList.toggle(
        'surveyed-safe',
        surveyedSafe && run.game.cells[index]?.visibility === 'hidden',
      )
      if (confirmed || surveyedSafe) {
        const knowledge = confirmed ? t.confirmedMine : t.confirmedSafe
        cell.title = knowledge
        cell.setAttribute('aria-label', cell.getAttribute('aria-label') + ', ' + knowledge)
      }
      if (frontier.has(index))
        cell.setAttribute('aria-label', cell.getAttribute('aria-label') + ', ' + t.frontier)
    }
    const grid = this.content.querySelector<HTMLElement>('[data-side="a"]')
    const current = grid?.querySelector<HTMLElement>(`[data-cell="${run.player}"]`)
    if (grid && current) {
      current.classList.add('player-cell')
      const profession = professionCopy(this.language, run.departure.profession).name
      current.setAttribute(
        'aria-label',
        [current.getAttribute('aria-label'), profession].filter(Boolean).join(', '),
      )
      const player = document.createElement('div')
      player.className = 'dungeon-player'
      const clue = run.game.cells[run.player]?.adjacent ?? 0
      player.innerHTML = `${spriteImage(professionSprite(run.departure.profession))}${clue ? `<span class="landmark-clue">${clue}</span>` : ''}`
      player.style.width = `${current.offsetWidth}px`
      player.style.height = `${current.offsetHeight}px`
      player.style.transform = `translate(${current.offsetLeft}px, ${current.offsetTop}px)`
      player.setAttribute('aria-hidden', 'true')
      grid.append(player)
      let width = current.offsetWidth
      /** Reanchor the sprite after responsive cell geometry changes. */
      this.resize = new ResizeObserver(() => {
        if (width !== current.offsetWidth) this.cancelWalk()
        width = current.offsetWidth
        player.style.width = `${width}px`
        player.style.height = `${current.offsetHeight}px`
        player.style.transform = `translate(${current.offsetLeft}px, ${current.offsetTop}px)`
      })
      this.resize.observe(grid)
    }
  }
}
