import { sharedStyles } from './shared-styles.js'
import { activeRegion, matrixCharge } from '../game/matrix-logic.js'
import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { MatrixExpedition } from '../types/matrix.js'
import type { Expedition } from '../types/variants.js'
import { boardZoomTemplate } from './board-zoom.js'
import { spriteImage } from './dungeon-sprites.js'

/** Keep ordinary floor numbers and the same scrollport/zoom geometry as other encounters. */
export function matrixBoardFrame(language: Language, run: MatrixExpedition): string {
  return `<section class="variant-board-panel matrix-panel" aria-label="${message(language, 'matrix.name')}">
    <div class="board-frame-heading ${sharedStyles['board-frame-heading']}"><h2>${message(language, 'matrix.name')}</h2>${boardZoomTemplate(message(language, 'survey.zoom'))}</div>
    <p class="matrix-progress">${message(language, 'matrix.status', { phase: run.encounter.phase, count: matrixCharge(run) })}</p>
    <div class="board-viewport"><div class="board" data-side="a" role="grid" aria-label="${message(language, 'matrix.name')}"></div><div id="matrix-observation" class="matrix-observation" hidden></div></div>
    <p class="matrix-legend">${message(language, 'matrix.legend')}</p><p class="matrix-legend">${message(language, 'matrix.observation-hint')}</p>
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
  if (live && e.notes.includes(index))
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="matrix-guess" aria-hidden="true">${spriteImage('matrix-crystal')}</span>`,
    )

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

/** Toggle public nonogram clues on the actual board, preserving replayable crystal notes. */
export class MatrixObservation {
  private run: MatrixExpedition | null = null
  private open = false
  private readonly root: HTMLElement
  private readonly listeners = new AbortController()
  private readonly resizing = new ResizeObserver(() => this.position())

  private readonly language: Language
  private readonly cellLabels = new WeakMap<HTMLElement, string>()

  /** Bind observation controls and retain original labels for reversible board decoration. */
  constructor(root: HTMLElement, language: Language) {
    this.language = language
    this.root = root
    root.addEventListener('keydown', this.key, { signal: this.listeners.signal })
  }

  /** Release keyboard and resize listeners before the observation board is discarded. */
  dispose(): void {
    this.listeners.abort()
    this.resizing.disconnect()
  }

  /** Escape closes observation without consuming a turn or changing the selected cell. */
  private readonly key = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.open) this.toggle()
  }

  /** Only the active, unbroken observation region changes board input. */
  contains(index: number): boolean {
    return !!(
      this.open &&
      this.run &&
      !this.run.encounter.exposed &&
      activeRegion(this.run).indices.includes(index)
    )
  }

  /** Refresh observation state and reset it when a different encounter or floor replaces the board. */
  render(run: Expedition | null): void {
    const previous = this.run

    this.run =
      run?.encounter?.kind === 'matrix' && run.phase === 'boss'
        ? { ...run, encounter: run.encounter }
        : null
    if (
      !this.run ||
      this.run.encounter.exposed ||
      !previous ||
      previous.departure.seed !== this.run.departure.seed ||
      previous.floor !== this.run.floor
    )
      this.open = false

    this.resizing.disconnect()

    const grid = this.root.querySelector<HTMLElement>('.matrix-panel .board')
    if (grid) this.resizing.observe(grid)

    this.paint()
  }

  /** Toggle only an available observation region, keeping combat state unchanged. */
  toggle(): void {
    if (!this.run || this.run.encounter.exposed) return

    this.open = !this.open
    this.paint()
  }

  /** Highlight the chosen observation cell without revealing hidden terrain. */
  select(index: number): void {
    for (const cell of this.root.querySelectorAll<HTMLElement>('.matrix-panel [data-cell]'))
      cell.classList.toggle(
        'matrix-selected',
        this.contains(index) && Number(cell.dataset['cell']) === index,
      )
  }

  /** Synchronize observation visibility, public crystal notes and accessible cell labels. */
  private paint(): void {
    const holder = this.root.querySelector<HTMLElement>('.matrix-observation')
    const trigger = this.root.querySelector<HTMLElement>('[data-control="observe"]')

    trigger?.setAttribute('aria-expanded', String(this.open))
    trigger?.setAttribute('aria-pressed', String(this.open))
    for (const cell of this.root.querySelectorAll<HTMLElement>('.matrix-panel [data-cell]')) {
      const index = Number(cell.dataset['cell'])

      cell.classList.toggle(
        'matrix-crystal-note',
        this.contains(index) && !!this.run?.encounter.notes.includes(index),
      )

      const baseLabel = this.cellLabels.get(cell) ?? cell.getAttribute('aria-label') ?? ''

      this.cellLabels.set(cell, baseLabel)
      cell.setAttribute(
        'aria-label',
        cell.classList.contains('matrix-crystal-note')
          ? `${baseLabel}, ${message(this.language, 'matrix.note')}`
          : baseLabel,
      )
      if (!this.contains(index)) cell.classList.remove('matrix-selected')
    }

    if (!holder) return

    holder.hidden = !this.open || !this.run || this.run.encounter.exposed
    if (holder.hidden || !this.run) return

    const region = activeRegion(this.run)

    holder.innerHTML =
      region.rows
        .map(
          (runs, i) =>
            `<span class="matrix-edge-clue matrix-row-clue" data-region-offset="${i * 3}">${(runs.length ? runs : [0]).join(' ')}</span>`,
        )
        .join('') +
      region.columns
        .map(
          (runs, i) =>
            `<span class="matrix-edge-clue matrix-column-clue" data-region-offset="${i}">${(runs.length ? runs : [0]).join('<br>')}</span>`,
        )
        .join('')
    this.position()
  }

  /** Keep clues attached to their row/column during zoom and scrolling. */
  private position(): void {
    if (!this.run) return

    const holder = this.root.querySelector<HTMLElement>('.matrix-observation')
    const viewport = holder?.parentElement
    if (!holder || holder.hidden || !viewport) return

    const origin = viewport.getBoundingClientRect()
    const region = activeRegion(this.run)
    for (const clue of holder.querySelectorAll<HTMLElement>('[data-region-offset]')) {
      const index = region.indices[Number(clue.dataset['regionOffset'])]
      const cell = viewport.querySelector<HTMLElement>(`[data-cell="${index}"]`)
      if (!cell) continue

      const box = cell.getBoundingClientRect()
      const row = clue.classList.contains('matrix-row-clue')

      clue.style.left = `${box.left - origin.left + viewport.scrollLeft + (row ? -3 : box.width / 2)}px`
      clue.style.top = `${box.top - origin.top + viewport.scrollTop + (row ? box.height / 2 : -3)}px`
    }
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
