import { gameplayStyles } from './gameplay-styles.js'
import { RANKED_DIFFICULTIES } from '../game/difficulty.js'
import { compareSonar, SONAR_CHARGES } from '../game/sonar.js'
import { translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { RankedDifficulty } from '../types/game.js'
import type { Language } from '../types/localization.js'
import type { Sonar, SonarRecord } from '../types/sonar.js'
import { sonarCopy } from './sonar-copy.js'
import { siteHeaderTemplate } from './templates.js'

/** An original vector instrument matches the existing line-icon system at every board scale. */
export function sonarIcon(): string {
  return '<svg class="icon sonar-instrument" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 19 5M12 2v2M2 12h2M12 20v2M20 12h2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'
}

/** Render independent difficulty/record tabs using existing localized preset names. */
export function sonarDifficulties(
  language: Language,
  selected: RankedDifficulty,
  records = false,
): string {
  const t = translations[language]
  return `<div class="sonar-difficulties" aria-label="${records ? t.records : t.difficulty}">${RANKED_DIFFICULTIES.map((difficulty) => `<button type="button" data-${records ? 'sonar-record' : 'sonar-difficulty'}="${difficulty}" aria-pressed="${difficulty === selected}">${t[difficulty]}</button>`).join('')}</div>`
}

/** Mount a calm instrument panel; dynamic counters and readings have dedicated update regions. */
export function sonarTemplate(language: Language, state: Sonar): string {
  const t = translations[language]
  const s = sonarCopy(language)
  return `${siteHeaderTemplate(language, 'data-control')}
    <main class="sonar-main"><div class="sonar-heading"><div><p class="eyebrow">SONAR / 03</p><h1>${s.title}</h1><p>${s.intro}</p></div><div class="game-heading-actions"><button class="icon-button sonar-mobile-records" data-control="records" aria-label="${t.records}">${icon('trophy')}</button><button class="icon-button" data-control="sound" aria-label="${t.sound}">${icon('volume')}</button><button class="icon-button" data-control="pause" aria-label="${t.pause}">${icon('pause')}</button></div></div>
    <p class="sonar-storage" role="status"></p>${sonarDifficulties(language, state.difficulty)}
    <div class="sonar-layout"><section class="sonar-board-panel"><div class="sonar-board-heading"><span>${state.game.config.width} × ${state.game.config.height} · ${state.game.config.mines} ${s.mines}</span><button class="icon-button" data-control="zoom" aria-label="${s.zoom}">${icon('globe')}</button></div><div class="sonar-play-area"><div class="board-viewport"><div class="sonar-grid-wrap"><div class="board" role="grid" aria-label="${s.title}"></div><svg class="sonar-overlay" aria-hidden="true"></svg><div class="sonar-pulse" aria-hidden="true"></div></div></div><div class="sonar-pause" hidden><p>${t.paused}</p><button class="primary-button" data-control="pause">${t.resume}</button></div></div></section>
    <aside class="sonar-sidebar"><section class="sonar-instrument-panel"><div class="sonar-dial" aria-hidden="true">${sonarIcon()}</div><div class="sonar-counters"></div><p class="sonar-status" role="status" aria-live="polite"></p><button class="secondary-button" data-control="new">${icon('reset')} ${t.restart}</button></section><section class="sonar-log-panel"><h2>${s.history}</h2><div class="sonar-log"></div><div class="sonar-comparison"></div></section></aside></div>
    </main><div class="action-dock ${gameplayStyles['action-dock']} sonar-dock ${gameplayStyles['sonar-dock']}"><button class="dock-slot sonar-scan" data-control="scan">${sonarIcon()}<strong>${s.scan}</strong><small><span class="sonar-charge-count">${SONAR_CHARGES}</span></small></button><div class="sonar-mode"></div><p class="sonar-target-hint ${gameplayStyles['sonar-target-hint']}"></p></div>
    <dialog class="sonar-dialog" aria-labelledby="sonar-dialog-title"><div class="sonar-dialog-content"></div></dialog>`
}

/** Show numbered public readings; selection highlights at most two regions together. */
export function sonarLogTemplate(
  state: Sonar,
  selected: readonly number[],
  language: Language,
): string {
  const s = sonarCopy(language)
  const t = translations[language]
  if (!state.readings.length) return `<p class="sonar-empty">${s.empty}</p>`
  return state.readings
    .map(
      (reading, index) =>
        `<button class="sonar-reading sonar-color-${index % 3}" data-sonar-reading="${index}" aria-pressed="${selected.includes(index)}"><span class="sonar-badge">${index + 1}</span><span><strong>${reading.mines} <small>${s.mines}</small></strong><small>${t.row} ${Math.floor(reading.center / state.game.config.width) + 1} · ${t.column} ${(reading.center % state.game.config.width) + 1}</small></span>${icon('check')}</button>`,
    )
    .join('')
}

/** Explain overlap subtraction from public totals, without certifying any individual guess. */
export function sonarComparisonTemplate(
  state: Sonar,
  selected: readonly number[],
  language: Language,
): string {
  const s = sonarCopy(language)
  const [a, b] = selected
  const left = a === undefined ? undefined : state.readings[a]
  const right = b === undefined ? undefined : state.readings[b]
  if (!left || !right) return `<p>${s.compareHint}</p>`
  const comparison = compareSonar(state.game.config, left, right)
  return `<h3>${s.comparison}</h3><div class="sonar-equation"><span class="sonar-badge sonar-color-${a! % 3}">${a! + 1}</span><span>−</span><span class="sonar-badge sonar-color-${b! % 3}">${b! + 1}</span><span>=</span><strong>${comparison.difference > 0 ? '+' : ''}${comparison.difference}</strong></div><p>${s.difference}</p><small>${s.shared}: ${comparison.common.length} · ${s.exclusive}: ${comparison.leftOnly.length} / ${comparison.rightOnly.length}</small>`
}

/** Keep move/scan rankings separate from time rankings and from other modes' result tables. */
export function sonarRecordsTemplate(
  language: Language,
  difficulty: RankedDifficulty,
  records: readonly SonarRecord[],
): string {
  const t = translations[language]
  const s = sonarCopy(language)
  const entries = records.filter((record) => record.difficulty === difficulty)
  return `<h2 id="sonar-dialog-title" tabindex="-1">${s.title} · ${t.records}</h2>${sonarDifficulties(language, difficulty, true)}<p>${s.rankHint}</p>${entries.length ? `<ol class="sonar-records">${entries.map((record) => `<li><time>${new Date(record.date).toLocaleDateString(language === 'zh' ? 'zh-CN' : language)}</time><span>${s.moves} <strong>${record.moves.toLocaleString(language)}</strong></span><span>${s.scans} <strong>${record.scans}</strong></span></li>`).join('')}</ol>` : `<p>${s.noRecords}</p>`}<button class="primary-button" data-control="close">${t.close}</button>`
}
