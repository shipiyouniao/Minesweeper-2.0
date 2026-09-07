import { sonarCharges, sonarObscured, sonarRegion } from '../game/sonar.js'
import { translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { InteractionCue } from '../types/audio.js'
import type { Language } from '../types/localization.js'
import type { Sonar } from '../types/sonar.js'
import type { BoardInputMode, NavigationKey, NavigationResult } from '../types/ui.js'
import { BoardView } from './board-view.js'
import { boardControlsTemplate, boardControlHint } from './board-controls.js'
import { LanguageMenu } from './language-menu.js'
import { sonarCopy } from './sonar-copy.js'
import { sonarComparisonTemplate, sonarLogTemplate, sonarTemplate } from './sonar-templates.js'

/** Own the board, overlays, native modal and animation lifetimes without changing puzzle state. */
export class SonarView {
  private readonly root: HTMLElement
  private readonly language: Language
  private readonly board: BoardView
  private readonly menu: LanguageMenu
  private readonly dialog: HTMLDialogElement
  private readonly listeners = new AbortController()
  private readonly resizing: ResizeObserver
  private state: Sonar
  private selected: readonly number[] = []
  private target: number | null = null
  private enlarged = false
  private pulse: Animation | null = null
  private returnFocus: HTMLElement | null = null

  /** Mount stable cells and use geometry-driven overlays so zoom and resize cannot misalign scans. */
  constructor(
    root: HTMLElement,
    language: Language,
    state: Sonar,
    onLanguage: (value: Language) => void,
    feedback: (cue: InteractionCue) => void,
    onClose: () => void,
    focus = 0,
  ) {
    this.root = root
    this.language = language
    this.state = state
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
    root.innerHTML = sonarTemplate(language, state)
    const tutorial = this.element<HTMLButtonElement>('.tutorial-entry')
    tutorial.dataset['control'] = 'help'
    tutorial.textContent = sonarCopy(language).help
    this.board = new BoardView(this.element('.board'), state.game.config, focus)
    this.menu = new LanguageMenu(this.element('.language-picker'), onLanguage, feedback)
    this.dialog = this.element<HTMLDialogElement>('.sonar-dialog')
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
    this.resizing = new ResizeObserver(() => {
      this.stopPulse()
      this.renderOverlay()
    })
    this.resizing.observe(this.element('.sonar-grid-wrap'))
  }

  /** Expose actual modal state to every input path. */
  get dialogOpen(): boolean {
    return this.dialog.open
  }

  /** Preserve the roving target through language changes and temporary controls. */
  get focusIndex(): number {
    return this.board.focusIndex
  }

  /** Repaint public cells and counters without replacing the board or moving the page. */
  render(
    state: Sonar,
    paused: boolean,
    mode: BoardInputMode,
    targeting: boolean,
    selected: readonly number[],
    sound: boolean,
    message: string,
    storageMessage: string,
  ): void {
    this.state = state
    this.selected = selected
    const t = translations[this.language]
    const s = sonarCopy(this.language)
    this.board.render(state.game, paused || this.dialogOpen, t)
    for (const cell of this.root.querySelectorAll<HTMLElement>('[data-cell]')) {
      const index = Number(cell.dataset['cell'])
      const coordinate = `${t.row} ${Math.floor(index / state.game.config.width) + 1}, ${t.column} ${(index % state.game.config.width) + 1}: `
      const confirmed =
        state.readings.some((reading) => reading.center === Number(cell.dataset['cell'])) &&
        state.game.cells[Number(cell.dataset['cell'])]?.mine
      cell.classList.toggle('sonar-confirmed-mine', Boolean(confirmed))
      if (confirmed)
        cell.setAttribute(
          'aria-label',
          coordinate +
            (this.language === 'zh'
              ? '已确认地雷'
              : this.language === 'ja'
                ? '地雷確認済み'
                : 'Confirmed mine'),
        )
      const masked = sonarObscured(state, Number(cell.dataset['cell']))
      cell.classList.toggle('sonar-obscured', masked)
      if (masked) {
        cell.textContent = '≈'
        cell.removeAttribute('data-number')
        cell.setAttribute(
          'aria-label',
          coordinate +
            (this.language === 'zh'
              ? '模糊数字 · 扫描后看清'
              : this.language === 'ja'
                ? '不鮮明な数字 · 走査で判読'
                : 'Obscured clue · scan to clarify'),
        )
      }
    }
    this.element('.board-viewport').classList.toggle('obscured', paused)
    this.element('.sonar-pause').hidden = !paused
    this.element('.sonar-sidebar').inert = paused
    this.element('.sonar-sidebar').classList.toggle('sonar-private', paused)
    this.element('.sonar-storage').textContent = storageMessage
    this.element('.sonar-counters').innerHTML =
      `<div><span>${s.charges}</span><strong>${sonarCharges(state)}</strong></div><div><span>${this.language === 'zh' ? '充能' : this.language === 'ja' ? '充填' : 'Recharge'}</span><progress max="4" value="${state.excavations % 4}" aria-label="${this.language === 'zh' ? '安全挖掘充能' : 'Recharge'}"></progress><strong>${state.excavations % 4} / 4</strong></div><div><span>${s.moves}</span><strong>${state.moves.toLocaleString(this.language)}</strong></div>`
    this.element('.sonar-log').innerHTML = sonarLogTemplate(state, selected, this.language)
    this.element('.sonar-comparison').innerHTML = sonarComparisonTemplate(
      state,
      selected,
      this.language,
    )
    this.element('.sonar-status').textContent = message
    this.element('.sonar-mode').innerHTML = boardControlsTemplate(
      this.language,
      mode,
      'data-control',
    )
    if (mode === 'reveal') this.element('.mode-cycle').setAttribute('title', s.revealHint)
    this.element('.sonar-charge-count').textContent = String(sonarCharges(state))
    const scan = this.element<HTMLButtonElement>('[data-control="scan"]')
    // At zero charges targeting still recalls previous centers, but never reveals a new reading.
    scan.disabled = paused || state.game.phase !== 'playing'
    scan.setAttribute('aria-pressed', String(targeting))
    this.element('.sonar-target-hint').textContent = paused
      ? ''
      : targeting
        ? s.aim
        : message || (mode === 'reveal' ? s.revealHint : boardControlHint(this.language, mode))
    const audio = this.element('[data-control="sound"]')
    audio.innerHTML = icon(sound ? 'volume' : 'volumeOff')
    audio.setAttribute('aria-pressed', String(sound))
    audio.setAttribute('title', sound ? t.soundOn : t.soundOff)
    this.element('[data-control="pause"]').innerHTML = icon(paused ? 'play' : 'pause')
    if (!targeting || paused) this.target = null
    this.renderOverlay()
  }

  /** Update targeting geometry without repainting cells or announcing every mouse pixel. */
  preview(index: number | null): void {
    this.target = index
    this.renderOverlay()
  }

  /** Keep exactly one tabbable cell; pointer focus never scrolls the page. */
  rememberFocus(index: number): void {
    this.board.rememberFocus(index)
  }

  /** Move keyboard focus using shared board geometry. */
  navigate(index: number, key: NavigationKey): NavigationResult {
    return this.board.navigate(index, key)
  }

  /** Return keyboard targeting to its visible cell without scrolling the whole page. */
  focusBoard(): void {
    this.element<HTMLButtonElement>(`[data-cell="${this.focusIndex}"]`).focus({
      preventScroll: true,
    })
  }

  /** Dismiss temporary language navigation before privacy covers or dialogs open. */
  closeLanguage(): void {
    this.menu.close()
  }

  /** Focus the newly mounted translation control after a locale change. */
  focusLanguage(): void {
    this.menu.focus()
  }

  /** Offer larger cell targets with horizontal panning; normal layout fits the available width. */
  toggleZoom(): void {
    this.enlarged = !this.enlarged
    this.element('.sonar-board-panel').classList.toggle('sonar-enlarged', this.enlarged)
    const label = this.enlarged ? sonarCopy(this.language).fit : sonarCopy(this.language).zoom
    this.element('[data-control="zoom"]').setAttribute('aria-label', label)
    this.stopPulse()
  }

  /** A successful paid scan sends a radial wave; reduced motion keeps the static reading instead. */
  animateScan(center: number): void {
    this.stopPulse()
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cell = this.element<HTMLElement>(`[data-cell="${center}"]`).getBoundingClientRect()
    const wrap = this.element('.sonar-grid-wrap').getBoundingClientRect()
    const pulse = this.element('.sonar-pulse')
    pulse.style.left = `${cell.x - wrap.x + cell.width / 2}px`
    pulse.style.top = `${cell.y - wrap.y + cell.height / 2}px`
    pulse.style.width = pulse.style.height = `${cell.width * 4}px`
    this.pulse = pulse.animate(
      [
        { transform: 'translate(-50%, -50%) scale(.05)', opacity: 0.9 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
      ],
      { duration: 850, easing: 'cubic-bezier(.12,.45,.3,1)' },
    )
  }

  /** Stop visual work before backgrounding, resize, remount or mode changes. */
  stopPulse(): void {
    this.pulse?.cancel()
    this.pulse = null
  }

  /** Native dialogs provide focus containment and Escape handling. */
  showDialog(content: string): void {
    this.menu.close()
    this.stopPulse()
    if (!this.dialog.open)
      this.returnFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    this.element('.sonar-dialog-content').innerHTML = content
    if (!this.dialog.open) this.dialog.showModal()
    this.dialog.querySelector<HTMLElement>('#sonar-dialog-title')?.focus()
  }

  /** Close through the same native callback used by Escape. */
  closeDialog(): void {
    this.dialog.close()
  }

  /** Release all document listeners and animations before removing the shell. */
  dispose(): void {
    this.listeners.abort()
    this.resizing.disconnect()
    this.menu.dispose()
    this.stopPulse()
    this.root.replaceChildren()
  }

  /** Draw region borders from actual cell rectangles, never from concealed mine identities. */
  private renderOverlay(): void {
    const overlay = this.element<SVGSVGElement>('.sonar-overlay')
    const wrap = this.element('.sonar-grid-wrap').getBoundingClientRect()
    if (!wrap.width || !wrap.height) return
    overlay.setAttribute('viewBox', `0 0 ${wrap.width} ${wrap.height}`)
    const fragments: string[] = []
    for (const index of this.selected) {
      const reading = this.state.readings[index]
      if (reading)
        fragments.push(this.regionShape(reading.center, `sonar-color-${index % 3}`, index + 1))
    }
    if (this.target !== null) fragments.push(this.regionShape(this.target, 'sonar-preview', null))
    overlay.innerHTML = fragments.join('')
  }

  /** A selected region has both a color and a number so hue is never the only identifier. */
  private regionShape(center: number, className: string, label: number | null): string {
    const region = sonarRegion(this.state.game.config, center)
    const first = region[0]
    const last = region.at(-1)
    if (first === undefined || last === undefined) return ''
    const origin = this.element('.sonar-grid-wrap').getBoundingClientRect()
    const a = this.element(`[data-cell="${first}"]`).getBoundingClientRect()
    const b = this.element(`[data-cell="${last}"]`).getBoundingClientRect()
    const x = a.x - origin.x + 1
    const y = a.y - origin.y + 1
    return `<g class="${className}"><rect x="${x}" y="${y}" width="${b.right - a.left - 2}" height="${b.bottom - a.top - 2}" rx="5"/>${label === null ? '' : `<circle cx="${x + 9}" cy="${y + 9}" r="8"/><text x="${x + 9}" y="${y + 12}">${label}</text>`}</g>`
  }

  /** Fail at the template boundary if a required typed element is missing. */
  private element<T extends Element = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector)
    if (!element) throw new Error(`Missing Sonar element: ${selector}`)
    return element
  }
}
