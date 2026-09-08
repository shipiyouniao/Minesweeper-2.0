import { sharedStyles } from './shared-styles.js'
import { activeRegion, matrixCharge } from '../game/matrix-logic.js'
import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { MatrixExpedition } from '../types/matrix.js'
import type { Expedition } from '../types/variants.js'
import { boardZoomTemplate } from './board-zoom.js'
import { spriteImage } from './dungeon-sprites.js'
import { matrixObservationTemplate } from './matrix-observation-template.js'

/** Keep ordinary floor numbers and the same scrollport/zoom geometry as other encounters. */
export function matrixBoardFrame(language: Language, run: MatrixExpedition): string {
  return `<section class="variant-board-panel matrix-panel" aria-label="${message(language, 'matrix.name')}">
    <div class="board-frame-heading ${sharedStyles['board-frame-heading']}"><h2>${message(language, 'matrix.name')}</h2>${boardZoomTemplate(message(language, 'survey.zoom'))}</div>
    <p class="matrix-progress">${message(language, 'matrix.status', { phase: run.encounter.phase, count: matrixCharge(run) })}</p>
    <div class="board-viewport"><div class="board" data-side="a" role="grid" aria-label="${message(language, 'matrix.name')}"></div></div>
    <p class="matrix-legend">${message(language, 'matrix.legend')}</p>
  </section>`
}

/** Decorate public region membership and extracted objects without replacing mine numbers. */
export function markMatrixCell(
  language: Language,
  run: Expedition,
  cell: HTMLElement,
  index: number,
): void {
  const e = run.encounter
  if (e?.kind !== 'matrix') return
  const live = run.phase === 'boss'
  const region = activeRegion({ ...run, encounter: e })
  cell.classList.toggle('matrix-region-cell', live && !e.exposed && region.indices.includes(index))
  cell.classList.toggle('matrix-crystal-note', live && e.notes.includes(index))
  if (e.collected.includes(index)) {
    cell.classList.add('matrix-collected-cell')
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="matrix-crystal">${spriteImage('matrix-crystal')}</span>`,
    )
    cell.setAttribute(
      'aria-label',
      `${cell.getAttribute('aria-label')}, ${message(language, 'matrix.collected')}`,
    )
  } else if (e.empty.includes(index)) {
    cell.classList.add('matrix-empty-cell')
    cell.setAttribute(
      'aria-label',
      `${cell.getAttribute('aria-label')}, ${message(language, 'matrix.empty-cell')}`,
    )
  }
  if (index === e.boss) {
    cell.classList.add('matrix-core')
    cell.classList.toggle('matrix-exposed', e.exposed)
  }
  if (region.indices.includes(index) && live && !e.exposed)
    cell.setAttribute(
      'aria-label',
      `${cell.getAttribute('aria-label')}, ${message(language, 'matrix.region')}`,
    )
}

/** Own the collapsible local observation UI and its target, independently of replayable rules. */
export class MatrixObservation {
  private run: MatrixExpedition | null = null
  private open = false
  private selected: number | null = null

  /** Retain one root and locale across normal board repaints. */
  constructor(root: HTMLElement, language: Language) {
    this.root = root
    this.language = language
    root.addEventListener('keydown', this.key, { signal: this.listeners.signal })
    window.addEventListener('resize', this.position, { signal: this.listeners.signal })
  }

  private readonly root: HTMLElement
  private readonly language: Language
  private readonly listeners = new AbortController()

  /** Remove popup listeners with the owning game view. */
  dispose(): void {
    this.listeners.abort()
  }

  /** Escape closes the observation overlay without trapping board navigation. */
  private readonly key = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.open) return
    this.toggle()
  }

  /** Fit the panel above the actual dock, including its mobile wrapped rows. */
  private readonly position = (): void => {
    const holder = this.root.querySelector<HTMLElement>('.matrix-observation')
    const dock = this.root.querySelector<HTMLElement>('.action-dock')?.getBoundingClientRect()
    if (!holder || !dock) return
    holder.style.bottom = `${Math.max(12, innerHeight - dock.top + 12)}px`
    holder.style.maxHeight = `${Math.max(80, dock.top - 24)}px`
  }

  /** Refresh after a domain action; a new encounter never inherits old UI targeting. */
  render(run: Expedition | null): void {
    const previous = this.run
    this.run =
      run?.encounter?.kind === 'matrix' && run.phase === 'boss'
        ? { ...run, encounter: run.encounter }
        : null
    if (
      !this.run ||
      !previous ||
      previous.departure.seed !== this.run.departure.seed ||
      previous.floor !== this.run.floor
    ) {
      this.open = false
      this.selected = null
    } else if (previous.encounter.phase !== this.run.encounter.phase) this.selected = null
    this.paint()
  }

  /** Toggle observation without spending AP or implicitly selecting a crystal. */
  toggle(): void {
    if (!this.run) return
    this.open = !this.open
    this.paint()
    if (this.open)
      this.root
        .querySelector<HTMLElement>('.matrix-observation button')
        ?.focus({ preventScroll: true })
    else
      this.root
        .querySelector<HTMLElement>('.tactical-controls [data-control="observe"]')
        ?.focus({ preventScroll: true })
  }

  /** Link a chosen mini-map square to its real coordinate using only public membership. */
  select(index: number): void {
    if (!this.run) return
    const selected = activeRegion(this.run).indices.includes(index) ? index : null
    if (this.selected === selected) return
    const miniFocused =
      document.activeElement instanceof HTMLElement &&
      document.activeElement.dataset['control']?.startsWith('matrix-pick:')
    this.selected = selected
    this.paint()
    if (miniFocused)
      this.root
        .querySelector<HTMLElement>(`[data-control="matrix-pick:${index}"]`)
        ?.focus({ preventScroll: true })
  }

  /** Render nine public cells; raw crystal identities never enter DOM attributes or labels. */
  private paint(): void {
    const holder = this.root.querySelector<HTMLElement>('.matrix-observation')
    const trigger = this.root.querySelector<HTMLElement>(
      '.tactical-controls [data-control="observe"]',
    )
    trigger?.setAttribute('aria-expanded', String(this.open))
    if (!holder || !this.run) return
    holder.hidden = !this.open
    this.position()
    const run = this.run
    const language = this.language
    for (const cell of this.root.querySelectorAll<HTMLElement>('[data-side="a"] [data-cell]'))
      cell.classList.toggle(
        'matrix-selected',
        this.open && !run.encounter.exposed && Number(cell.dataset['cell']) === this.selected,
      )
    if (!this.open) return
    holder.innerHTML = matrixObservationTemplate(language, run, this.selected)
  }
}

/** Animate collection and shield fracture only when new extraction is accepted. */
export function animateMatrixExtraction(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): void {
  if (
    before?.encounter?.kind !== 'matrix' ||
    after?.encounter?.kind !== 'matrix' ||
    before.departure.seed !== after.departure.seed ||
    before.floor !== after.floor ||
    before.encounter.collected.length === after.encounter.collected.length
  )
    return
  const index = after.encounter.lastAttuned
  const source = root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${index}"]`)
  const boss = root.querySelector<HTMLElement>(
    `[data-side="a"] [data-cell="${after.encounter.boss}"]`,
  )
  if (!source || !boss) return
  source.classList.add('matrix-extraction')
  if (after.encounter.exposed && !before.encounter.exposed) boss.classList.add('matrix-fracture')
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const from = source.getBoundingClientRect(),
    to = boss.getBoundingClientRect()
  const beam = document.createElement('div')
  beam.className = 'matrix-charge-beam'
  const x = from.x + from.width / 2,
    y = from.y + from.height / 2
  const dx = to.x + to.width / 2 - x,
    dy = to.y + to.height / 2 - y
  beam.style.cssText = `left:${x}px;top:${y}px;width:${Math.hypot(dx, dy)}px;transform:rotate(${Math.atan2(dy, dx)}rad)`
  root.append(beam)
  beam
    .animate(
      [
        { opacity: 0, scale: '0 1' },
        { opacity: 1, scale: '1 1', offset: 0.5 },
        { opacity: 0, scale: '1 1' },
      ],
      { duration: 700 },
    )
    .finished.then(
      () => beam.remove(),
      () => beam.remove(),
    )
}
