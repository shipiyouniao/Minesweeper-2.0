import { titleTemplate } from './title-template.js'
import type { BoardInputMode } from '../types/ui.js'
import { boardControlsTemplate } from './board-controls.js'
import { reachableCells } from '../game/expedition.js'
import { professionSkillTemplate } from './profession-skill-template.js'
import { VARIANT_TIERS, expeditionFloors } from '../game/variant-difficulty.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import { stats } from '../game/engine.js'
import { translations } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { Camp, Expedition, Twin, VariantRecord } from '../types/variants.js'
import type { VariantDescription } from '../types/variant-ui.js'
import { difficultyCopy, relicCopy, variantCopy } from './variant-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import type { DungeonSprite, DungeonTool } from '../types/dungeon-ui.js'
import { relicSprite } from './relic-presentation.js'
import { expeditionReward, expeditionRewardPercent } from '../game/expedition-rewards.js'
import { vitalityTemplate } from './vitality-template.js'
import { escapeHtml } from './presentation.js'
import { tacticalTemplate, tacticalControlsTemplate } from './tactical-template.js'
import { tacticalCopy } from './tactical-copy.js'
import { icon } from '../icons.js'
import { mirrorBoardLabel } from './mirror-board.js'
import { magneticPlaybar } from './magnetic-board.js'

/** Render one accessible choice card; its ID is a finite catalog value. */
export function choice(
  control: string,
  description: VariantDescription,
  selected: boolean,
  disabled = false,
  sprite: DungeonSprite | null = null,
): string {
  return `<button class="choice-card" data-control="${control}" aria-pressed="${selected}" ${disabled ? 'disabled' : ''}>
    ${sprite ? spriteImage(sprite) : ''}<strong>${description.name}</strong><span>${description.note}</span></button>`
}

/** Render a compact statistic with a readable label. */
function metric(label: string, value: number | string): string {
  return `<div class="variant-metric"><span>${label}</span><strong>${value}</strong></div>`
}

/** Render recent local results, preserving the separate ruleset's units. */
function recordList(
  language: Language,
  records: readonly VariantRecord[],
  expedition: boolean,
): string {
  const t = variantCopy(language)
  const common = translations[language]
  return `<section class="variant-records">${
    records.length === 0
      ? `<p>${t.noRecords}</p>`
      : `<ol>${records
          .map(
            (
              record,
            ) => `<li><time>${escapeHtml(new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' }).format(new Date(record.date)))}</time>
    <span>${record.outcome === 'won' ? common.won : record.outcome === 'retreated' ? t.retreated : common.lost}</span>
    <span>${record.steps} ${t.steps}${expedition ? ` · ${t.floor} ${record.depth} · +${record.earned} ${t.supplies}` : ''}</span></li>`,
          )
          .join('')}</ol>`
  }</section>`
}

/** Render the common board frame; BoardView owns the actual grid cells. */
export function boardFrame(side: 'a' | 'b', label: string, controls = ''): string {
  return `<section class="variant-board-panel" aria-label="${label}"><div class="board-frame-heading"><h2>${label}</h2>${controls}</div><div class="board-viewport"><div class="board" data-side="${side}" role="grid" aria-label="${label}"></div></div></section>`
}

/** Render expedition resources, inter-floor choices, and the active board placeholder. */
export function expeditionTemplate(
  language: Language,
  run: Expedition,
  earned: number,
  inputMode: BoardInputMode,
  camp?: Camp,
): string {
  const t = variantCopy(language)
  const common = translations[language]
  const terminal = run.phase === 'lost' || run.phase === 'won' || run.phase === 'retreated'
  const rate = expeditionRewardPercent(run.departure) / 100
  const exitReady = reachableCells(run).has(run.exit)
  const status =
    run.phase === 'won'
      ? t.won
      : run.phase === 'lost'
        ? t.lost
        : run.phase === 'retreated'
          ? t.retreated
          : run.phase === 'reward'
            ? t.reward
            : run.phase === 'boss'
              ? tacticalCopy(language, run.encounter?.kind).name
              : exitReady
                ? t.exitReady
                : t.exploring
  const relics = run.relics
    .map((relic) => {
      const description = relicCopy(language, relic)
      let used = ''

      if (run.runTriggers.includes(relic)) used = t.relicUsedRun
      else if (run.floorTriggers.includes(relic)) used = t.relicUsedFloor
      else if (run.encounter?.turnTriggers.includes(relic)) used = t.relicUsedTurn

      const badge = used ? `<small class="relic-trigger">${used}</small>` : ''
      return `<li>${spriteImage(relicSprite(relic))}<strong>${description.name}</strong><span>${description.note}</span>${badge}</li>`
    })
    .join('')

  return `
    ${run.phase === 'boss' ? '' : `<p class="variant-status" role="status" tabindex="-1">${status}</p>`}
    ${terminal ? `<button class="primary-button" data-control="result">${t.viewResult} · +${earned}</button>` : ''}
    ${run.phase === 'reward' ? `<button class="primary-button" data-control="rewards">${run.offers.length ? t.chooseRelic : t.nextFloor}</button><button class="secondary-button retreat-button" data-control="retreat"><span aria-hidden="true">↶</span>${t.retreat}</button>` : ''}
    <div class="board-play-area"><div class="expedition-layout">${run.encounter?.kind === 'mirror' ? `<div class="mirror-boards"><div class="mirror-active" data-realm="${run.encounter.active}">${boardFrame('a', mirrorBoardLabel(language, run, true), boardZoomTemplate(language))}</div><div class="mirror-comparison">${boardFrame('b', mirrorBoardLabel(language, run, false))}</div></div>` : run.encounter?.kind === 'clock' ? `<div class="clock-stage">${boardFrame('a', `${t.floor} ${run.floor}`, boardZoomTemplate(language))}</div>` : run.encounter?.kind === 'magnetic' ? `<div class="magnetic-stage">${magneticPlaybar(language, run)}${boardFrame('a', `${t.floor} ${run.floor}`, boardZoomTemplate(language))}</div>` : boardFrame('a', `${t.floor} ${run.floor}`, boardZoomTemplate(language))}<aside class="run-sidebar"><section class="run-overview">${camp ? titleTemplate(language, camp) : ''}<p class="variant-note">${t.difficulty} · ${difficultyCopy(language, run.departure.difficulty)} · ${run.game.config.width} × ${run.game.config.height}</p><div class="variant-metrics">${metric(t.floor, `${run.floor} / ${expeditionFloors(run.departure)}`)}${metric(t.loot, run.loot)}${metric(t.steps, run.steps)}</div>
    <p class="variant-note reward-rate">${t.rewardRate} ×${rate}</p>
    ${vitalityTemplate(language, run)}</section>${tacticalTemplate(language, run)}
      ${
        run.phase === 'exploring' || run.phase === 'boss'
          ? `<div class="variant-toolbar"><div class="action-dock expedition-dock" aria-label="${t.equipment}">
      <p class="dock-target-hint tool-hint" role="status"></p>
      ${run.phase === 'boss' ? tacticalControlsTemplate(language, run) : ''}
      ${toolButton('probe', t.probes, run.probes)}${toolButton('scan', t.scans, run.scans)}
      ${professionSkillTemplate(language, run)}${boardControlsTemplate(language, inputMode, 'data-control')}</div>
      ${run.probeReport ? `<p class="probe-result" role="status">${t.probeResult.replace('{count}', String(run.probeReport.mines))}</p>` : ''}
      <button class="secondary-button retreat-button" data-control="retreat"><span aria-hidden="true">↶</span>${t.retreat}</button></div>`
          : ''
      }
      <details class="relic-menu" data-relic-menu><summary><span>${spriteImage('treasure')}${t.relics}</span><strong>${run.relics.length}</strong></summary>${relics ? `<ul class="relic-list">${relics}</ul>` : `<p class="variant-note">${t.noRelics}</p>`}</details>

      <ul class="scan-results">${run.scannedRows.map((row) => `<li>${common.row} ${row + 1}: <strong>${run.game.cells.slice(row * run.game.config.width, (row + 1) * run.game.config.width).filter((cell) => cell.mine).length}</strong> ${t.rowMines}</li>`).join('')}</ul>
    </aside></div></div>`
}

/** Present existing offers in a modal without changing reward or advancement rules. */
export function relicRewardTemplate(language: Language, run: Expedition): string {
  const t = variantCopy(language)
  const choices = run.offers
    .map((relic) =>
      choice(`relic:${relic}`, relicCopy(language, relic), false, false, relicSprite(relic)),
    )
    .join('')

  return `<button class="dialog-close icon-button" data-control="cancel" aria-label="${translations[language].close}">${icon('close')}</button>
    <p class="eyebrow">${t.floor} ${run.floor} / ${expeditionFloors(run.departure)}</p>
    <h2 id="expedition-dialog-title" tabindex="-1" autofocus>${t.floorCleared}</h2>
    <p class="dialog-intro">${run.offers.length ? t.reward : t.nextFloor}</p>
    ${choices ? `<div class="choice-grid">${choices}</div>` : `<button class="primary-button" data-control="descend">${t.nextFloor}</button>`}`
}

/** Display an already committed settlement; opening or closing this view never grants supplies. */
export function expeditionResultTemplate(language: Language, run: Expedition): string {
  const t = variantCopy(language)
  const reward = expeditionReward(run)
  const title = run.phase === 'won' ? t.won : run.phase === 'lost' ? t.lost : t.retreated
  const number = new Intl.NumberFormat(language)

  return `<button class="dialog-close icon-button" data-control="cancel" aria-label="${translations[language].close}">${icon('close')}</button>
    <p class="eyebrow">${t.floor} ${run.floor} / ${expeditionFloors(run.departure)}</p>
    <h2 id="expedition-dialog-title" tabindex="-1" autofocus>${title}</h2>
    <div class="settlement-total">${spriteImage('treasure')}<span>${t.earned}</span><strong>+${number.format(reward.total)}</strong></div>
    <p class="dialog-intro reward-breakdown">${t.rewardBase} ${number.format(reward.base)} + ${t.rewardBonus} ${number.format(reward.bonus)} = ${number.format(reward.total)}</p>
    <button class="primary-button" data-control="camp">${t.camp}</button>`
}

/** Present both boards at once, with responsive stacking on narrow screens. */
export function twinTemplate(language: Language, state: Twin, inputMode: BoardInputMode): string {
  const t = variantCopy(language)
  const common = translations[language]
  const status =
    state.phase === 'ready'
      ? t.ready
      : state.phase === 'won'
        ? common.won
        : state.phase === 'lost'
          ? common.lost
          : common.playing

  return `${difficultyTemplate(language, state.difficulty, false)}<div class="variant-metrics">${metric(t.steps, state.moves)}${metric('A · ' + common.progress, `${stats(state.a).revealed} / ${state.a.cells.length - state.a.config.mines}`)}${metric('B · ' + common.progress, `${stats(state.b).revealed} / ${state.a.cells.length - state.a.config.mines}`)}</div>
    <p class="variant-status" role="status" tabindex="-1">${status}</p>
    <div class="twin-tools"><button class="secondary-button" data-control="restart">${common.restart}</button></div>
    ${state.a.phase === 'won' || state.b.phase === 'won' ? `<p class="variant-note">${t.safePartner}</p>` : ''}
    <div class="board-play-area"><div class="action-dock compact-dock">${boardControlsTemplate(language, inputMode, 'data-control')}</div><div class="twin-layout">${boardFrame('a', 'A', boardZoomTemplate(language))}${boardFrame('b', 'B')}</div></div>`
}

/** Render a square, explicitly targeted inventory button with a persistent charge badge. */
function toolButton(tool: DungeonTool, label: string, count: number): string {
  return `<button class="inventory-tool dock-slot" data-control="${tool}" data-tool="${tool}" aria-label="${label}: ${count}" title="${label}" aria-pressed="false" ${count === 0 ? 'disabled' : ''}>${spriteImage(tool === 'scan' ? 'scanner' : 'probe')}<span class="tool-count">${count}</span><span class="tool-label">${label}</span></button>`
}

/** Keep results in distinct tier sections so unlike board sizes are never presented as peers. */
export function variantRecords(
  language: Language,
  records: readonly VariantRecord[],
  expedition: boolean,
): string {
  if (records.length === 0) return recordList(language, records, expedition)
  const difficulties: readonly (VariantDifficulty | undefined)[] = [
    ...VARIANT_TIERS.map((tier) => tier.id),
    undefined,
  ]

  return difficulties
    .map((difficulty) => {
      const matching = records.filter((record) => record.difficulty === difficulty)
      return matching.length
        ? `<h3>${difficultyCopy(language, difficulty)}</h3>${recordList(language, matching, expedition)}`
        : ''
    })
    .join('')
}

/** Expose dimensions before departure with wrapping buttons instead of a browser select. */
export function difficultyTemplate(
  language: Language,
  selected: VariantDifficulty | undefined,
  expedition: boolean,
): string {
  const t = variantCopy(language)

  return `<fieldset class="variant-difficulty"><legend>${t.difficulty}${selected ? '' : ` · ${t.legacyDifficulty}`}</legend><div>${VARIANT_TIERS.map(
    (tier) => {
      const size = expedition ? tier.size : tier.twin.width
      return `<button data-control="difficulty:${tier.id}" aria-pressed="${selected === tier.id}"><strong>${difficultyCopy(language, tier.id)}</strong><span>${size} × ${size}${expedition ? ` · ${tier.floors} ${t.floor}` : ''}</span></button>`
    },
  ).join('')}</div></fieldset>`
}

/** Keep zoom outside the grid so touch and keyboard users can choose usable target sizes. */
function boardZoomTemplate(language: Language): string {
  const t = variantCopy(language)
  const lens =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>'
  return `<div class="board-zoom"><button class="zoom-icon" data-control="zoom" aria-label="${t.zoom}" title="${t.zoom}" aria-pressed="false">${lens}<span aria-hidden="true">+</span></button></div>`
}
