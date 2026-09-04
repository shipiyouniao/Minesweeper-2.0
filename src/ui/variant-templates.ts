import {
  EQUIPMENT,
  UPGRADES,
  equipmentCost,
  upgradeCost,
  reachableCells,
} from '../game/expedition.js'
import { VARIANT_TIERS, expeditionFloors } from '../game/variant-difficulty.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
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
  difficultyCopy,
  equipmentCopy,
  professionCopy,
  relicCopy,
  upgradeCopy,
  variantCopy,
} from './variant-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'
import type { DungeonSprite, DungeonTool } from '../types/dungeon-ui.js'
import { campProgressTemplate } from './camp-progress-template.js'
import { hasExpeditionHealth } from '../game/expedition-rules.js'
import { parseRelicPack } from '../game/relic-packs.js'
import { relicSprite } from './relic-presentation.js'
import { vitalityTemplate } from './vitality-template.js'
import { escapeHtml } from './presentation.js'

/** Render one accessible choice card; its ID is a finite catalog value. */
function choice(
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
  return `<div><span>${label}</span><strong>${value}</strong></div>`
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

/** Present the permanent camp and departure choices without mixing them with run resources. */
export function campTemplate(
  language: Language,
  camp: Camp,
  profession: Profession,
  equipment: readonly Equipment[],
  difficulty: VariantDifficulty = 'standard',
): string {
  const t = variantCopy(language)
  const number = new Intl.NumberFormat(language)
  const careers: readonly Profession[] = ['explorer', 'surveyor', 'engineer']
  const spent = equipment.reduce((total, item) => total + equipmentCost(item), 0)

  return `<section class="camp-panel"><p class="eyebrow">EXPEDITION / BASE CAMP</p><h1 tabindex="-1">${t.camp}</h1><p class="variant-intro">${t.campHelp}</p><p class="variant-note">${t.healthHint}</p>
    <div class="variant-metrics">${metric(t.supplies, number.format(camp.supplies))}${metric(t.departures, camp.completed)}</div>
    ${difficultyTemplate(language, difficulty, true)}
    <h2>${t.profession}</h2><div class="choice-grid">${careers.map((career) => choice(`profession:${career}`, professionCopy(language, career), career === profession, career !== 'explorer' && !camp.upgrades.includes(career), professionSprite(career))).join('')}</div>
    <h2>${t.equipment} <small>${spent} / 3</small></h2>
    ${camp.upgrades.includes('workshop') ? `<div class="choice-grid">${EQUIPMENT.map((item) => choice(`equipment:${item}`, equipmentCopy(language, item), equipment.includes(item), !equipment.includes(item) && spent + equipmentCost(item) > 3, item === 'guard' ? 'shield' : item)).join('')}</div>` : `<p class="variant-note">${t.locked} · ${upgradeCopy(language, 'workshop').name}</p>`}
    <button class="primary-button" data-control="start">${t.start} ↗</button>
    <h2>${t.facilities}</h2>${campProgressTemplate(language, camp)}<div class="choice-grid facilities">${UPGRADES.map(
      (upgrade) => {
        const description = upgradeCopy(language, upgrade)
        return choice(
          `upgrade:${upgrade}`,
          {
            name: `${description.name} · ${camp.upgrades.includes(upgrade) ? t.owned : number.format(upgradeCost(upgrade)) + ' ' + t.supplies}`,
            note: description.note,
          },
          camp.upgrades.includes(upgrade),
          camp.upgrades.includes(upgrade) || camp.supplies < upgradeCost(upgrade),
          parseRelicPack(upgrade),
        )
      },
    ).join('')}</div></section>`
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
    .map((relic) => {
      const description = relicCopy(language, relic)
      let used = ''

      if (run.runTriggers.includes(relic)) used = t.relicUsedRun
      else if (run.floorTriggers.includes(relic)) used = t.relicUsedFloor

      const badge = used ? `<small class="relic-trigger">${used}</small>` : ''
      return `<li>${spriteImage(relicSprite(relic))}<strong>${description.name}</strong><span>${description.note}</span>${badge}</li>`
    })
    .join('')

  return `<p class="variant-note">${t.difficulty} · ${difficultyCopy(language, run.departure.difficulty)} · ${run.game.config.width} × ${run.game.config.height}</p><div class="variant-metrics">${metric(t.floor, `${run.floor} / ${expeditionFloors(run.departure)}`)}${metric(t.loot, run.loot)}${metric(t.steps, run.steps)}</div>
    ${vitalityTemplate(language, run, !hasExpeditionHealth(run.departure))}
    <p class="variant-status" role="status" tabindex="-1">${status}</p>
    ${terminal ? `<div class="result-banner"><strong>${t.earned} +${earned}</strong><button class="primary-button" data-control="camp">${t.camp}</button></div>` : ''}
    ${run.phase === 'reward' ? `<div class="choice-grid">${run.offers.map((relic) => choice(`relic:${relic}`, relicCopy(language, relic), false, false, relicSprite(relic))).join('')}</div>${run.offers.length === 0 ? `<button class="primary-button" data-control="descend">${t.nextFloor}</button>` : ''}<button class="text-button" data-control="retreat">${t.retreat}</button>` : ''}
    ${boardZoomTemplate(language)}<div class="expedition-layout">${boardFrame('a', `${t.floor} ${run.floor}`)}<aside class="run-sidebar">
      ${
        run.phase === 'exploring'
          ? `<div class="variant-toolbar">${inputModeTemplate(language, flagMode)}
      <p class="variant-note tool-hint" role="status">${t.toolHint}</p>
      <div class="dungeon-inventory" role="group" aria-label="${t.equipment}">${toolButton('probe', t.probes, run.probes)}${toolButton('scan', t.scans, run.scans)}</div>
      ${run.probeReport ? `<p class="probe-result" role="status">${t.probeResult.replace('{count}', String(run.probeReport.mines))}</p>` : ''}
      <button class="text-button" data-control="retreat">${t.retreat}</button></div>`
          : ''
      }
      <h3>${t.relics}</h3>${relics ? `<ul class="relic-list">${relics}</ul>` : `<p class="variant-note">${t.noRelics}</p>`}
      <div class="dungeon-legend"><span>${spriteImage('entrance')}${t.entrance}</span><span>${spriteImage('exit')}${t.exit}</span><span>${spriteImage('treasure')}${t.treasure}</span><span>${spriteImage('wall')}${t.wall}</span></div>
      <ul class="scan-results">${run.scannedRows.map((row) => `<li>${common.row} ${row + 1}: <strong>${run.game.cells.slice(row * run.game.config.width, (row + 1) * run.game.config.width).filter((cell) => cell.mine).length}</strong> ${t.rowMines}</li>`).join('')}</ul>
    </aside></div>`
}

/** Offer an explicit flag toggle for touch users alongside keyboard/right-click shortcuts. */
export function inputModeTemplate(language: Language, flagMode: boolean): string {
  const t = translations[language]
  return `<div class="variant-input-mode" role="group" aria-label="${t.play}"><button data-control="reveal-mode" aria-pressed="${!flagMode}">${t.reveal}</button><button data-control="flag-mode" aria-pressed="${flagMode}">${t.flag}</button></div>`
}

/** Present both boards at once, with responsive stacking on narrow screens. */
export function twinTemplate(language: Language, state: Twin, flagMode: boolean): string {
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
    <div class="twin-tools">${inputModeTemplate(language, flagMode)}<button class="secondary-button" data-control="restart">${common.restart}</button></div>
    ${state.a.phase === 'won' || state.b.phase === 'won' ? `<p class="variant-note">${t.safePartner}</p>` : ''}
    ${boardZoomTemplate(language)}<div class="twin-layout">${boardFrame('a', 'A')}${boardFrame('b', 'B')}</div>`
}

/** Render a square, explicitly targeted inventory button with a persistent charge badge. */
function toolButton(tool: DungeonTool, label: string, count: number): string {
  return `<button class="inventory-tool" data-control="${tool}" data-tool="${tool}" aria-label="${label}: ${count}" title="${label}" aria-pressed="false" ${count === 0 ? 'disabled' : ''}>${spriteImage(tool === 'scan' ? 'scanner' : 'probe')}<span class="tool-count">${count}</span><span class="tool-label">${label}</span></button>`
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
function difficultyTemplate(
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
  return `<div class="board-zoom"><button class="text-button" data-control="zoom" aria-pressed="false">${t.zoom}</button><span class="variant-note zoom-hint" hidden>${t.zoomHint}</span></div>`
}
