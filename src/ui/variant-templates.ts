import {
  EQUIPMENT,
  UPGRADES,
  equipmentCost,
  upgradeCost,
  reachableCells,
  FLOOR_COUNT,
} from '../game/expedition.js'
import { stats } from '../game/engine.js'
import { translations } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type {
  Camp,
  Equipment,
  Expedition,
  Profession,
  Twin,
  VariantRecord,
} from '../types/variants.js'
import type { VariantDescription } from '../types/variant-ui.js'
import {
  equipmentCopy,
  professionCopy,
  relicCopy,
  upgradeCopy,
  variantCopy,
} from './variant-copy.js'
import { escapeHtml } from './presentation.js'

/** Render one accessible choice card; its ID is a finite catalog value. */
function choice(
  control: string,
  description: VariantDescription,
  selected: boolean,
  disabled = false,
): string {
  return `<button class="choice-card" data-control="${control}" aria-pressed="${selected}" ${disabled ? 'disabled' : ''}>
    <strong>${description.name}</strong><span>${description.note}</span></button>`
}

/** Render a compact statistic with a readable label. */
function metric(label: string, value: number | string): string {
  return `<div><span>${label}</span><strong>${value}</strong></div>`
}

/** Render recent local results, preserving the separate ruleset's units. */
export function variantRecords(
  language: Language,
  records: readonly VariantRecord[],
  expedition: boolean,
): string {
  const t = variantCopy(language)
  const common = translations[language]
  return `<details class="variant-records"><summary>${t.records}</summary>${
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
  }</details>`
}

/** Present the permanent camp and departure choices without mixing them with run resources. */
export function campTemplate(
  language: Language,
  camp: Camp,
  profession: Profession,
  equipment: readonly Equipment[],
  records: readonly VariantRecord[],
): string {
  const t = variantCopy(language)
  const careers: readonly Profession[] = ['explorer', 'surveyor', 'engineer']
  const spent = equipment.reduce((total, item) => total + equipmentCost(item), 0)

  return `<section class="camp-panel"><p class="eyebrow">EXPEDITION / BASE CAMP</p><h1 tabindex="-1">${t.camp}</h1><p class="variant-intro">${t.campHelp}</p>
    <div class="variant-metrics">${metric(t.supplies, camp.supplies)}${metric(t.departures, camp.completed)}</div>
    <h2>${t.profession}</h2><div class="choice-grid">${careers.map((career) => choice(`profession:${career}`, professionCopy(language, career), career === profession, career !== 'explorer' && !camp.upgrades.includes(career))).join('')}</div>
    <h2>${t.equipment} <small>${spent} / 3</small></h2>
    ${camp.upgrades.includes('workshop') ? `<div class="choice-grid">${EQUIPMENT.map((item) => choice(`equipment:${item}`, equipmentCopy(language, item), equipment.includes(item), !equipment.includes(item) && spent + equipmentCost(item) > 3)).join('')}</div>` : `<p class="variant-note">${t.locked} · ${upgradeCopy(language, 'workshop').name}</p>`}
    <button class="primary-button" data-control="start">${t.start} ↗</button>
    <h2>${t.facilities}</h2><div class="choice-grid facilities">${UPGRADES.map((upgrade) => {
      const description = upgradeCopy(language, upgrade)
      return choice(
        `upgrade:${upgrade}`,
        {
          name: `${description.name} · ${camp.upgrades.includes(upgrade) ? t.owned : upgradeCost(upgrade) + ' ' + t.supplies}`,
          note: description.note,
        },
        camp.upgrades.includes(upgrade),
        camp.upgrades.includes(upgrade) || camp.supplies < upgradeCost(upgrade),
      )
    }).join('')}</div>${variantRecords(language, records, true)}</section>`
}

/** Render the common board frame; BoardView owns the actual grid cells. */
export function boardFrame(side: 'a' | 'b', label: string): string {
  return `<section class="variant-board-panel" aria-label="${label}"><h2>${label}</h2><div class="board-viewport"><div class="board" data-side="${side}" role="grid" aria-label="${label}"></div></div></section>`
}

/** Render expedition resources, inter-floor choices, and the active board placeholder. */
export function expeditionTemplate(
  language: Language,
  run: Expedition,
  earned: number,
  flagMode: boolean,
): string {
  const t = variantCopy(language)
  const common = translations[language]
  const terminal = run.phase === 'lost' || run.phase === 'won' || run.phase === 'retreated'
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
            : exitReady
              ? t.exitReady
              : t.exploring
  const relics = run.relics
    .map(
      (relic) =>
        `<li><strong>${relicCopy(language, relic).name}</strong><span>${relicCopy(language, relic).note}</span></li>`,
    )
    .join('')

  return `<div class="variant-metrics">${metric(t.floor, `${run.floor} / ${FLOOR_COUNT}`)}${metric(t.loot, run.loot)}${metric(t.probes, run.probes)}${metric(t.scans, run.scans)}${metric(t.shields, run.shields)}</div>
    <p class="variant-status" role="status" tabindex="-1">${status}</p>
    ${terminal ? `<div class="result-banner"><strong>${t.earned} +${earned}</strong><button class="primary-button" data-control="camp">${t.camp}</button></div>` : ''}
    ${run.phase === 'reward' ? `<div class="choice-grid">${run.offers.map((relic) => choice(`relic:${relic}`, relicCopy(language, relic), false)).join('')}</div><button class="text-button" data-control="retreat">${t.retreat}</button>` : ''}
    <div class="expedition-layout">${boardFrame('a', `${t.floor} ${run.floor}`)}<aside class="run-sidebar">
      ${
        run.phase === 'exploring'
          ? `<div class="variant-toolbar">${inputModeTemplate(language, flagMode)}
      <button class="secondary-button" data-control="probe" ${run.probes === 0 ? 'disabled' : ''}>${t.probe}</button>
      <button class="secondary-button" data-control="scan" ${run.scans === 0 ? 'disabled' : ''}>${t.scan}</button>
      <p class="variant-note">${t.scanHint}</p>
      <button class="primary-button" data-control="descend" ${!exitReady ? 'disabled' : ''}>${t.descend} ↗</button>
      <button class="text-button" data-control="retreat">${t.retreat}</button></div>`
          : ''
      }
      <h3>${t.relics}</h3>${relics ? `<ul class="relic-list">${relics}</ul>` : `<p class="variant-note">${t.noRelics}</p>`}
      <p class="variant-note">○ ${t.entrance} · ↗ ${t.exit} · ◇ ${t.treasure}</p>
      <ul class="scan-results">${run.scannedRows.map((row) => `<li>${common.row} ${row + 1}: <strong>${run.game.cells.slice(row * 9, row * 9 + 9).filter((cell) => cell.mine).length}</strong> ${t.rowMines}</li>`).join('')}</ul>
    </aside></div>`
}

/** Offer an explicit flag toggle for touch users alongside keyboard/right-click shortcuts. */
export function inputModeTemplate(language: Language, flagMode: boolean): string {
  const t = translations[language]
  return `<div class="variant-input-mode" role="group" aria-label="${t.play}"><button data-control="reveal-mode" aria-pressed="${!flagMode}">${t.reveal}</button><button data-control="flag-mode" aria-pressed="${flagMode}">${t.flag}</button></div>`
}

/** Present both boards at once, with responsive stacking on narrow screens. */
export function twinTemplate(
  language: Language,
  state: Twin,
  flagMode: boolean,
  records: readonly VariantRecord[],
): string {
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

  return `<div class="variant-metrics">${metric(t.steps, state.moves)}${metric('A · ' + common.progress, `${stats(state.a).revealed} / 69`)}${metric('B · ' + common.progress, `${stats(state.b).revealed} / 69`)}</div>
    <p class="variant-status" role="status" tabindex="-1">${status}</p>
    <div class="twin-tools">${inputModeTemplate(language, flagMode)}<button class="secondary-button" data-control="restart">${common.restart}</button></div>
    ${state.a.phase === 'won' || state.b.phase === 'won' ? `<p class="variant-note">${t.safePartner}</p>` : ''}
    <div class="twin-layout">${boardFrame('a', 'A')}${boardFrame('b', 'B')}</div>${variantRecords(language, records, false)}`
}
