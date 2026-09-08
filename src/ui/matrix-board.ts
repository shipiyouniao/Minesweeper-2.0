import { sharedStyles } from './shared-styles.js'
import { activePrism, matrixLine } from '../game/matrix-logic.js'
import { message, translations } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { MatrixExpedition } from '../types/matrix.js'
import type { SurveyAxis } from '../types/survey.js'
import type { Expedition } from '../types/variants.js'
import { boardZoomTemplate } from './board-zoom.js'
import { spriteImage } from './dungeon-sprites.js'
import { escapeHtml } from './presentation.js'
import { professionCopy } from './variant-copy.js'

/** Share Survey's measured sticky headers, with line clicks routed through expedition AP rules. */
export function matrixBoardFrame(language: Language, run: MatrixExpedition): string {
  const e = run.encounter
  const prism = activePrism(run)
  /** Render one axis from public evidence, retaining contradictions as player hypotheses. */
  function headers(axis: SurveyAxis): string {
    return (axis === 'row' ? e.rows : e.columns)
      .map((runs, index) => {
        const reading = matrixLine(run, axis, index)
        const label = `${translations[language][axis]} ${index + 1}: ${runs.join(' ') || '0'}. ${message(language, 'matrix.line-action')}`
        return `<button type="button" class="survey-line" data-control="matrix-${axis}:${index}" data-active="${axis === prism.axis && index === prism.line}" data-complete="${reading.complete}" data-over="${reading.conflict}" aria-label="${escapeHtml(label)}"><span class="survey-runs">${(runs.length ? runs : [0]).map((size) => `<strong>${size}</strong>`).join('')}</span></button>`
      })
      .join('')
  }
  return `<section class="variant-board-panel matrix-panel" aria-label="${message(language, 'matrix.name')}">
    <div class="board-frame-heading ${sharedStyles['board-frame-heading']}"><h2>${message(language, 'matrix.name')}</h2>${boardZoomTemplate(message(language, 'survey.zoom'))}</div>
    <ol class="matrix-circuits">${e.prisms.map((entry, index) => `<li data-current="${e.phase === index + 1}" data-cleared="${index + 1 < e.phase}">${spriteImage('matrix-prism')}<span>${index + 1} · ${translations[language][entry.axis]} ${entry.line + 1}</span></li>`).join('')}</ol>
    <div class="survey-board-surface"><div class="board-viewport survey-viewport"><div class="survey-grid matrix-grid" style="--columns:${run.game.config.width};--row-runs:${Math.max(1, ...e.rows.map((runs) => runs.length))}"><div class="survey-corner" aria-hidden="true">◇</div><div class="survey-column-heads">${headers('column')}</div><div class="survey-row-heads">${headers('row')}</div><div class="board" data-side="a" role="grid" aria-label="${message(language, 'matrix.name')}"></div></div></div></div>
    <p class="matrix-legend">${message(language, 'matrix.legend')}</p>
  </section>`
}

/** Replace local-number clues with public terrain and show each frozen optical path on its cells. */
export function markMatrixCell(
  language: Language,
  run: Expedition,
  cell: HTMLElement,
  index: number,
): void {
  const e = run.encounter
  if (e?.kind !== 'matrix') return
  const common = translations[language]
  const coordinates = `${common.row} ${Math.floor(index / run.game.config.width) + 1}, ${common.column} ${(index % run.game.config.width) + 1}`
  cell.removeAttribute('data-number')
  cell.querySelector('.landmark-clue')?.remove()
  if (
    run.game.cells[index]?.visibility === 'revealed' &&
    !run.walls.includes(index) &&
    !cell.classList.contains('mine')
  ) {
    if (!cell.querySelector('img')) cell.textContent = ''
    cell.setAttribute('aria-label', `${coordinates}, ${message(language, 'matrix.floor')}`)
  }
  const station = e.prisms.findIndex((prism) => prism.index === index)
  if (station >= 0) {
    const name = message(language, 'matrix.prism', { number: station + 1 })
    cell.classList.add('landmark-cell', 'matrix-prism')
    cell.classList.toggle('matrix-active', station + 1 === e.phase)
    cell.innerHTML = `${spriteImage('matrix-prism')}<span class="matrix-station">${station + 1}</span>`
    cell.setAttribute('aria-label', `${coordinates}, ${name}`)
  }
  if (index === e.boss) {
    cell.classList.add('matrix-core')
    cell.classList.toggle('matrix-exposed', e.exposedUntil >= e.turn)
  }
  const active = e.prisms[e.phase - 1]!
  const live = run.phase === 'boss'
  const incoming = live && e.beam.includes(index)
  const returning = live && e.armed && e.returnBeam.includes(index)
  cell.classList.toggle('matrix-ray-row', incoming && active.axis === 'row')
  cell.classList.toggle('matrix-ray-column', incoming && active.axis === 'column')
  cell.classList.toggle('matrix-return-row', returning && active.axis === 'column')
  cell.classList.toggle('matrix-return-column', returning && active.axis === 'row')
  cell.classList.toggle('matrix-pressure', live && e.pressure.includes(index))
  // Numeric-clue replacement must retain the pawn's accessible position on floor and prism tiles.
  if (index === run.player)
    cell.setAttribute(
      'aria-label',
      `${cell.getAttribute('aria-label')}, ${professionCopy(language, run.departure.profession).name}`,
    )
}
