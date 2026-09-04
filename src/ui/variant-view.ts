import { frontierCells } from '../game/expedition.js'
import { translations } from '../i18n.js'
import type { Game } from '../types/game.js'
import type { Language } from '../types/localization.js'
import type { BoardSide, Expedition } from '../types/variants.js'
import type { InteractionCue } from '../types/audio.js'
import type { NavigationKey, NavigationResult } from '../types/ui.js'
import { BoardView } from './board-view.js'
import { LanguageMenu } from './language-menu.js'
import { languageMenuTemplate } from './templates.js'
import { variantCopy } from './variant-copy.js'

/** Owns special-mode DOM, focus restoration, language-menu and modal lifetimes. */
export class VariantView {
  private readonly root: HTMLElement
  private readonly language: Language
  private readonly content: HTMLElement
  private readonly status: HTMLElement
  private readonly dialog: HTMLDialogElement
  private readonly menu: LanguageMenu
  private a: BoardView | null = null
  private b: BoardView | null = null
  private focusA = 0
  private focusB = 0
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
    root.innerHTML = `<header class="site-header"><a class="brand" href="./">Minesweeper <span class="brand-version">2.0</span></a>
      <nav><button class="text-button" data-control="sound" aria-pressed="true">${common.sound}</button>${languageMenuTemplate(language)}</nav></header>
      <main class="variant-main ${mode}"><div class="variant-heading"><div><p class="eyebrow">A DIFFERENT KIND OF LOGIC</p><h1>${mode === 'expedition' ? t.expedition : t.twin}</h1></div><button class="secondary-button" data-control="pause">${common.pause}</button></div>
      <details class="variant-help"><summary>${common.how}</summary><p>${mode === 'expedition' ? t.expeditionHelp : t.twinHelp}</p><p>${t.controls}</p></details>
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
    this.menu = new LanguageMenu(picker, onLanguage, feedback)
    dialog.addEventListener('cancel', () => feedback('dismiss'), { signal: this.listeners.signal })
  }

  /** Expose modal state to application guards, including native Escape dismissal. */
  get dialogOpen(): boolean {
    return this.dialog.open
  }

  /** Preserve the selected expedition row even when a toolbar button receives focus. */
  get selectedRow(): number {
    return Math.floor(this.focusA / 9)
  }

  /** Replace content and restore a still-existing control or cell focus after repaint. */
  render(html: string, a: Game | null, b: Game | null, expedition: Expedition | null): void {
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
    if (expedition) this.markExpedition(expedition)

    const selector =
      cell !== undefined && (side === 'a' || side === 'b')
        ? `[data-side="${side}"] [data-cell="${CSS.escape(cell)}"]`
        : control
          ? `[data-control="${CSS.escape(control)}"]`
          : null
    const target = selector ? this.content.querySelector<HTMLElement>(selector) : null
    if (target && !target.hasAttribute('disabled')) target.focus({ preventScroll: true })
    else if (active)
      this.content.querySelector<HTMLElement>('.variant-status, h1')?.focus({ preventScroll: true })
  }

  /** Update availability warnings and accessible sound/pause state independently of the board. */
  chrome(
    available: boolean,
    recovered: boolean,
    sound: boolean,
    paused: boolean,
    atMoveLimit: boolean,
  ): void {
    const common = translations[this.language]
    this.status.textContent = atMoveLimit
      ? variantCopy(this.language).journalLimit
      : !available
        ? common.storageOff
        : recovered
          ? variantCopy(this.language).recovered
          : ''
    const button = this.root.querySelector<HTMLButtonElement>('[data-control="sound"]')
    if (button) {
      button.textContent = sound ? common.soundOn : common.soundOff
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
      pause.textContent = paused ? common.resume : common.pause
      pause.setAttribute('aria-pressed', String(paused))
    }
  }

  /** Show an application-owned confirmation using the browser's focus-trapping dialog. */
  confirm(message: string, label: string): void {
    const paragraph = this.dialog.querySelector('p')
    if (paragraph) paragraph.textContent = message
    const button = this.dialog.querySelector<HTMLButtonElement>('[data-control="confirm"]')
    if (button) button.textContent = label
    this.dialog.showModal()
  }

  /** Close a pending confirmation without replacing its trigger or board. */
  closeDialog(): void {
    this.dialog.close()
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
    this.listeners.abort()
    this.menu.dispose()
    this.dialog.close()
    this.root.replaceChildren()
  }

  /** Build and paint a board without exposing covered mines or clues. */
  private board(side: BoardSide, game: Game | null, index: number): BoardView | null {
    const element = this.content.querySelector<HTMLElement>(`[data-side="${side}"]`)
    if (!element || !game) return null
    const view = new BoardView(element, game.config, index)
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
      const mark =
        index === 0
          ? '○'
          : index === run.exit
            ? '↗'
            : treasure
              ? run.collected.includes(index)
                ? '◆'
                : '◇'
              : ''
      const label =
        index === 0
          ? t.entrance
          : index === run.exit
            ? t.exit
            : treasure
              ? run.collected.includes(index)
                ? t.collected
                : t.treasure
              : ''
      if (mark) {
        cell.dataset['landmark'] = mark
        cell.setAttribute('aria-label', cell.getAttribute('aria-label') + ', ' + label)
      }
      if (frontier.has(index))
        cell.setAttribute('aria-label', cell.getAttribute('aria-label') + ', ' + t.frontier)
    }
  }
}
