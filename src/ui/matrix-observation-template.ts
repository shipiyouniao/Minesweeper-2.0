import { activeRegion, crystalKnowledge } from '../game/matrix-logic.js'
import { tacticalPlan } from '../game/tactical-planning.js'
import { message, translations } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { MatrixExpedition } from '../types/matrix.js'
import { spriteImage } from './dungeon-sprites.js'
import { escapeHtml } from './presentation.js'
import { sharedStyles } from './shared-styles.js'
import { tacticalPlanCopy } from './tactical-copy.js'

/** Translate a local target into the ordinary battlefield's one-based coordinates. */
function coordinateLabel(language: Language, run: MatrixExpedition, index: number): string {
  const common = translations[language]
  return `${common.row} ${Math.floor(index / run.game.config.width) + 1}, ${common.column} ${(index % run.game.config.width) + 1}`
}

/** Render public discoveries and optional guesses, never an uncollected crystal identity. */
function observationCell(
  language: Language,
  run: MatrixExpedition,
  index: number,
  selected: number | null,
): string {
  const found = run.encounter.collected.includes(index)
  const empty = crystalKnowledge(run, index) === 'safe'
  const guessed = run.encounter.notes.includes(index)
  const description = found
    ? message(language, 'matrix.collected')
    : empty
      ? message(language, 'matrix.empty-cell')
      : guessed
        ? message(language, 'matrix.note')
        : message(language, 'matrix.unresolved')
  const content = found ? spriteImage('matrix-crystal') : empty ? '×' : guessed ? '◇' : '·'
  const label = escapeHtml(`${coordinateLabel(language, run, index)}: ${description}`)

  return `<button class="matrix-mini-cell" data-control="matrix-pick:${index}" aria-pressed="${selected === index}" aria-label="${label}">${content}</button>`
}

/** Keep replayable rules and pure observation markup separate from DOM ownership. */
export function matrixObservationTemplate(
  language: Language,
  run: MatrixExpedition,
  selected: number | null,
): string {
  const region = activeRegion(run)
  const plan = selected === null ? null : tacticalPlan(run, { type: 'attune', index: selected })
  const note =
    selected === null ? null : tacticalPlan(run, { type: 'mark-crystal', index: selected })
  const columns = region.columns
    .map(
      (runs) => `<span class="matrix-mini-runs">${(runs.length ? runs : [0]).join('<br>')}</span>`,
    )
    .join('')
  const rows = region.rows
    .map((runs, row) => {
      const cells = region.indices
        .slice(row * 3, row * 3 + 3)
        .map((index) => observationCell(language, run, index, selected))
        .join('')
      return `<span class="matrix-mini-runs">${(runs.length ? runs : [0]).join(' ')}</span>${cells}`
    })
    .join('')
  const target =
    selected === null
      ? message(language, 'matrix.select')
      : coordinateLabel(language, run, selected)
  const actions = run.encounter.exposed
    ? `<p role="status">${message(language, 'matrix.open-hint')}</p>`
    : `<div class="matrix-local-actions"><button class="secondary-button ${sharedStyles['secondary-button']}" data-control="mark-crystal:${selected ?? 0}" ${note?.allowed ? '' : 'disabled'}>${message(language, 'matrix.note')}</button><button class="primary-button ${sharedStyles['primary-button']}" data-control="attune-cell:${selected ?? 0}" ${plan?.allowed ? '' : 'disabled'}>${message(language, 'matrix.attune')}</button></div><p class="matrix-target-cost">${plan ? tacticalPlanCopy(language, plan) : message(language, 'matrix.attune-hint')}</p>`

  return `<div class="matrix-observation-heading"><strong>${message(language, 'matrix.observe')}</strong><button class="icon-button ${sharedStyles['icon-button']}" data-control="observe" aria-label="${translations[language].close}">×</button></div>
    <p>${message(language, 'matrix.observation-hint')}</p>
    <div class="matrix-mini"><span aria-hidden="true">◇</span>${columns}${rows}</div>
    <p class="matrix-target-label">${target}</p>${actions}`
}
