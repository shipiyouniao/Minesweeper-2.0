import { RANKED_DIFFICULTIES } from '../game/difficulty.js'
import { message, translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { RankedDifficulty } from '../types/game.js'
import type { Language } from '../types/localization.js'
import type { Survey, SurveyRecord } from '../types/survey.js'
import { siteHeaderTemplate } from './templates.js'
import { sharedStyles } from './shared-styles.js'

/** Keep common presentation utilities explicit; the specialized sheet owns only board geometry. */
const panel = 'tw:rounded-panel tw:border tw:border-solid tw:border-line tw:bg-surface'
const button = `icon-button ${sharedStyles['icon-button']}`

/** Independent preset tabs use familiar localized names without changing Classic preferences. */
export function surveyDifficulties(
  language: Language,
  selected: RankedDifficulty,
  records = false,
): string {
  const t = translations[language]
  return `<div class="tw:flex tw:flex-wrap tw:gap-2 tw:my-4" aria-label="${records ? t.records : t.difficulty}">${RANKED_DIFFICULTIES.map((difficulty) => `<button class="tw:rounded-lg tw:px-4 tw:py-2 tw:text-[clamp(14px,0.9vw,18px)] tw:text-muted tw:aria-pressed:bg-accent-soft tw:aria-pressed:text-accent tw:hover:bg-surface-alt" data-survey-${records ? 'record' : 'difficulty'}="${difficulty}" aria-pressed="${selected === difficulty}">${t[difficulty]}</button>`).join('')}</div>`
}

/** Mount a quiet field-notebook layout with sticky constraints inside the board's own scroll host. */
export function surveyTemplate(language: Language, state: Survey): string {
  const t = translations[language]
  return `${siteHeaderTemplate(language, 'data-control')}
    <main class="survey-main tw:[width:min(94%,1440px)] tw:min-[2400px]:[width:min(90%,1600px)] tw:mx-auto tw:px-0 tw:pb-8 ">
      <div class="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mt-3"><div><p class="eyebrow ${sharedStyles['eyebrow']}">SURVEY / 04</p><h1 class="tw:text-[clamp(30px,2.2vw,48px)] tw:my-2">${message(language, 'survey.title')}</h1><p class="tw:text-muted tw:text-[clamp(14px,0.9vw,18px)] tw:mt-2">${message(language, 'survey.intro')}</p></div>
      <div class="tw:flex tw:gap-1"><button class="${button}" data-control="records" aria-label="${t.records}">${icon('trophy')}</button><button class="${button}" data-control="sound" aria-label="${t.sound}"></button><button class="${button}" data-control="pause" aria-label="${t.pause}"></button></div></div>
      <p class="survey-storage tw:text-[clamp(14px,0.9vw,18px)] tw:text-muted" role="status"></p>${surveyDifficulties(language, state.difficulty)}
      <div class="tw:grid tw:gap-5 tw:items-start tw:min-[960px]:grid-cols-[minmax(0,1fr)_280px] tw:min-[1600px]:grid-cols-[minmax(0,1fr)_320px]">
        <section class="survey-board-panel ${panel} tw:min-w-0 tw:overflow-hidden"><div class="tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-2 tw:gap-2 tw:text-[clamp(12px,0.8vw,16px)] tw:text-muted"><span>${state.game.config.width} × ${state.game.config.height} · ${state.game.config.mines} ${message(language, 'survey.mines')}</span><span id="survey-legend">${message(language, 'survey.legend')}</span><button class="${button}" data-control="zoom" aria-label="${message(language, 'survey.zoom')}">${icon('globe')}</button></div>
          <div class="tw:relative"><div class="board-viewport survey-viewport"><div class="survey-grid"><div class="survey-corner" aria-hidden="true">↘</div><div class="survey-column-heads"></div><div class="survey-row-heads"></div><div class="board" role="grid" aria-label="${message(language, 'survey.title')}" aria-describedby="survey-legend"></div></div></div>
          <div class="survey-pause tw:absolute tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:bg-surface" hidden><p>${t.paused}</p><button class="primary-button ${sharedStyles['primary-button']}" data-control="pause">${t.resume}</button></div></div>
        </section>
        <aside class="survey-sidebar ${panel} tw:p-5 tw:flex tw:flex-col tw:gap-5"><div class="survey-counters tw:grid tw:grid-cols-2 tw:gap-3"></div><div class="tw:border-0 tw:border-t tw:border-solid tw:border-line tw:pt-4"><p class="tw:text-[clamp(14px,0.9vw,18px)] tw:font-medium">${message(language, 'survey.hint')}</p><div class="survey-focus tw:my-3 tw:text-[clamp(14px,0.9vw,18px)] tw:text-accent tw:leading-7" role="status"></div><p class="tw:text-[clamp(12px,0.8vw,16px)] tw:text-muted tw:leading-relaxed">${message(language, 'survey.bookkeeping')}</p></div><p class="survey-status tw:text-[clamp(14px,0.9vw,18px)] tw:text-muted" role="status"></p><button class="secondary-button ${sharedStyles['secondary-button']}" data-control="new">${icon('reset')} ${t.restart}</button></aside>
      </div>
      <div class="survey-controls tw:sticky tw:bottom-0 tw:z-10 tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:mt-4 tw:py-3 tw:bg-paper"><div class="survey-mode tw:[&_.mode-cycle]:flex tw:[&_.mode-cycle]:flex-col tw:[&_.mode-cycle]:items-center tw:[&_.mode-cycle]:gap-1 tw:[&_.mode-cycle]:rounded-xl tw:[&_.mode-cycle]:bg-accent tw:[&_.mode-cycle]:text-white tw:[&_.mode-cycle]:px-4 tw:[&_.mode-cycle]:py-3 tw:[&_.mode-cycle]:min-w-24 tw:[&_.mode-cycle]:text-[clamp(14px,0.9vw,18px)] tw:[&_.mode-cycle_small]:text-[10px] tw:[&_.mode-cycle:hover]:brightness-110"></div><p class="survey-mode-hint tw:text-[clamp(12px,0.8vw,16px)] tw:text-muted tw:flex-1 tw:min-w-40"></p></div>
    </main><dialog class="survey-dialog" aria-labelledby="survey-dialog-title"><div class="survey-dialog-content"></div></dialog>`
}

/** A short illustrated rule card uses familiar board glyphs instead of a dense opening paragraph. */
export function surveyHelpTemplate(language: Language): string {
  const t = translations[language]
  return `<h2 id="survey-dialog-title" tabindex="-1">${message(language, 'survey.title')}</h2><div class="tw:grid tw:gap-5 tw:[&_p]:text-[clamp(14px,0.9vw,18px)] tw:[&_p]:leading-relaxed tw:[&_p]:text-muted">
    <section><strong>① ${message(language, 'survey.help-local-title')}</strong><p>${message(language, 'survey.help-local')}</p></section>
    <section><strong>↔ ${message(language, 'survey.help-lines-title')}</strong><p>${message(language, 'survey.help-lines')}</p></section>
    <section><strong>⚑ ${message(language, 'survey.help-marks-title')}</strong><p>${message(language, 'survey.help-marks')}</p></section>
    <section><strong>⌨ ${message(language, 'survey.help-controls-title')}</strong><p>${message(language, 'survey.help-controls')}</p></section>
    <button class="primary-button ${sharedStyles['primary-button']}" data-control="close">${t.close}</button></div>`
}

/** Rank completed surveys independently; dates are formatted only after persistence validation. */
export function surveyRecordsTemplate(
  language: Language,
  difficulty: RankedDifficulty,
  records: readonly SurveyRecord[],
): string {
  const t = translations[language]
  const entries = records.filter((record) => record.difficulty === difficulty)
  return `<h2 id="survey-dialog-title" tabindex="-1">${message(language, 'survey.title')} · ${t.records}</h2>${surveyDifficulties(language, difficulty, true)}<p>${message(language, 'survey.rank-hint')}</p>${entries.length ? `<ol class="tw:my-5 tw:grid tw:gap-3 tw:list-none tw:p-0">${entries.map((record) => `<li class="tw:flex tw:justify-between tw:gap-4"><time>${new Date(record.date).toLocaleDateString(language === 'zh' ? 'zh-CN' : language)}</time><span>${message(language, 'survey.moves')} <strong>${record.moves.toLocaleString(language)}</strong></span></li>`).join('')}</ol>` : `<p>${message(language, 'survey.no-records')}</p>`}<button class="primary-button ${sharedStyles['primary-button']}" data-control="close">${t.close}</button>`
}
