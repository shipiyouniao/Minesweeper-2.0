import { RANKED_DIFFICULTIES } from '../game/difficulty.js'
import { message, translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { RankedDifficulty } from '../types/game.js'
import type { Language } from '../types/localization.js'
import type { Survey, SurveyRecord } from '../types/survey.js'
import { siteHeaderTemplate } from './templates.js'
import { SURVEY_PRESETS } from '../game/survey.js'
import { gameplayStyles } from './gameplay-styles.js'
import { guidanceStyles } from './guidance-styles.js'
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
  return `<div class="difficulty-tabs ${sharedStyles['difficulty-tabs']}" aria-label="${records ? t.records : t.difficulty}">${RANKED_DIFFICULTIES.map((difficulty) => `<button class="${selected === difficulty ? 'selected' : ''}" data-survey-${records ? 'record' : 'difficulty'}="${difficulty}" aria-pressed="${selected === difficulty}">${t[difficulty]}<span>${SURVEY_PRESETS[difficulty].width} × ${SURVEY_PRESETS[difficulty].height}</span></button>`).join('')}</div>`
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
        <aside class="survey-sidebar ${panel} tw:p-5 tw:flex tw:flex-col tw:gap-5"><div class="survey-counters tw:grid tw:grid-cols-2 tw:gap-3"></div><div class="tw:border-0 tw:border-t tw:border-solid tw:border-line tw:pt-4"><p class="tw:text-[clamp(14px,0.9vw,18px)] tw:font-medium">${message(language, 'survey.hint')}</p><div class="survey-focus tw:my-3 tw:text-[clamp(14px,0.9vw,18px)] tw:text-accent tw:leading-7" role="status"></div><p class="tw:text-[clamp(12px,0.8vw,16px)] tw:text-muted tw:leading-relaxed">${message(language, 'survey.bookkeeping')}</p><div class="survey-example" aria-hidden="true"><strong>2 1</strong><span>⚑</span><span>⚑</span><span class="survey-example-safe">·</span><span>⚑</span></div></div><p class="survey-status tw:text-[clamp(14px,0.9vw,18px)] tw:text-muted" role="status"></p><button class="secondary-button ${sharedStyles['secondary-button']}" data-control="new">${icon('reset')} ${t.restart}</button></aside>
      </div>
    </main><div class="action-dock ${gameplayStyles['action-dock']} survey-dock"><div class="survey-mode"></div><p class="survey-mode-hint ${gameplayStyles['sonar-target-hint']}"></p></div>
    <dialog class="survey-dialog ${guidanceStyles['sonar-dialog']}" aria-labelledby="survey-dialog-title"><div class="survey-dialog-content ${guidanceStyles['sonar-dialog-content']}"></div></dialog>`
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
