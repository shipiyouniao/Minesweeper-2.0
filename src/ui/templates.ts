import { DIFFICULTIES, RANKED_DIFFICULTIES } from '../game/difficulty.js'
import type { HelpStep } from '../types/ui.js'
import type { Config, Difficulty, RankedDifficulty } from '../types/game.js'
import type { Language, Messages } from '../types/localization.js'
import type { Score } from '../types/storage.js'
import type { SessionState } from '../types/session.js'
import { PRESETS } from '../game/engine.js'
import { translations } from '../i18n.js'
import { icon } from '../icons.js'
import { escapeHtml, formatTime } from './presentation.js'

/** Display each language in its own script so the picker remains recognizable. */
function languageName(language: Language): string {
  switch (language) {
    case 'zh':
      return '中文'
    case 'en':
      return 'English'
    case 'ja':
      return '日本語'
  }
}

/** Render one radio-style menu option with a visible selected indicator. */
function languageOption(language: Language, selected: Language): string {
  return /* HTML */ `
    <button
      type="button"
      class="language-option"
      role="menuitemradio"
      lang="${language === 'zh' ? 'zh-CN' : language}"
      data-language="${language}"
      aria-checked="${language === selected}"
      tabindex="-1"
    >
      <span>${languageName(language)}</span>
      ${icon('check')}
    </button>
  `
}

/** Render an original flyout inspired by VitePress's compact translation control. */
export function languageMenuTemplate(language: Language): string {
  const label = translations[language].language

  return /* HTML */ `
    <div class="language-picker">
      <button
        type="button"
        class="language-trigger"
        aria-label="${label}"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="language-menu"
      >
        ${icon('globe')}
        <span class="language-current">${languageName(language)}</span>
        ${icon('chevron')}
      </button>
      <div id="language-menu" class="language-menu" role="menu" aria-label="${label}" hidden>
        ${languageOption('zh', language)}${languageOption('en', language)}${languageOption('ja', language)}
      </div>
    </div>
  `
}

/** Render the static application shell from state; event binding belongs to the view. */
export function appTemplate(state: SessionState, language: Language, flagMode: boolean): string {
  const t = translations[language]
  const { game, mode } = state

  return /* HTML */ `
    <header class="site-header">
      <a class="brand" href="./" aria-label="Minesweeper 2.0">
        <span class="brand-mark">${icon('flag')}</span>
        <span>
          Minesweeper
          <span class="brand-version">2.0</span>
        </span>
      </a>
      <nav aria-label="${t.play}">
        <button class="text-button" data-action="help">${t.how}</button>
        <button class="text-button" data-action="records">${t.records}</button>
        ${languageMenuTemplate(language)}
      </nav>
    </header>
    <main class="layout">
      <section class="introduction" aria-labelledby="intro-title">
        <p class="eyebrow">
          <span></span>
          THE CLASSIC, REIMAGINED
        </p>
        <h1 id="intro-title">${t.tagline}</h1>
        <p class="intro-copy">${t.intro}</p>
        <img
          class="hero-art"
          src="${import.meta.env.BASE_URL}assets/quiet-board.png"
          alt=""
          width="1254"
          height="1254"
          fetchpriority="low"
        />
        <div class="intro-bottom">
          <span class="tiny-rule"></span>
          <p>${t.edition}</p>
        </div>
      </section>
      <section class="game-section" aria-label="${t.title}">
        <div class="game-heading">
          <h2>${t.title}</h2>
          <div class="game-heading-actions">
            <button
              id="sound-button"
              class="icon-button"
              data-action="toggle-sound"
              aria-label="${t.sound}"
              aria-pressed="true"
            >
              ${icon('volume')}
            </button>
            <button class="icon-button" data-action="help" aria-label="${t.how}">
              ${icon('help')}
            </button>
          </div>
        </div>
        <div class="difficulty-tabs" role="group" aria-label="${t.difficulty}">
          ${DIFFICULTIES.map((key) => difficultyButton(key, mode, t)).join('')}
        </div>
        <div class="game-card">
          <div class="score-strip">
            <div>
              <span>${icon('flag')}${t.mines}</span>
              <strong id="mine-count">010</strong>
            </div>
            <div>
              <span>${icon('clock')}${t.time}</span>
              <strong id="timer">00:00</strong>
            </div>
            <div>
              <span>${icon('trophy')}${t.best}</span>
              <strong id="best">—</strong>
            </div>
          </div>
          <div class="board-shell">
            <div class="board-viewport" tabindex="-1">
              <div
                id="board"
                class="board"
                role="grid"
                aria-label="${t.board}"
                aria-rowcount="${game.config.height}"
                aria-colcount="${game.config.width}"
              ></div>
            </div>
            <div id="pause-cover" class="pause-cover" hidden>
              <span class="pause-art">${icon('leaf')}</span>
              <h3>${t.paused}</h3>
              <p>${t.pausedNote}</p>
              <button class="primary-button" data-action="pause">${icon('play')}${t.resume}</button>
            </div>
          </div>
          <div class="status-line" role="status" aria-live="polite">
            <span id="status-dot" class="status-dot"></span>
            <span id="status"></span>
            <span id="progress"></span>
          </div>
          <div class="game-toolbar">
            <div class="input-mode" role="group" aria-label="${t.flagMode}">
              <button data-action="reveal-mode" aria-pressed="${!flagMode}">
                ${icon('pointer')}
                <span>${t.reveal}</span>
              </button>
              <button data-action="flag-mode" aria-pressed="${flagMode}">
                ${icon('flag')}
                <span>${t.flag}</span>
              </button>
            </div>
            <div class="toolbar-right">
              <button
                id="pause-button"
                class="icon-button"
                data-action="pause"
                aria-label="${t.pause}"
              >
                ${icon('pause')}
              </button>
              <button class="new-button" data-action="new">
                ${icon('reset')}
                <span>${t.restart}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="under-board">
          <p class="desktop-hint">${t.helpMouse}</p>
          <p class="touch-hint">${t.helpTouch}</p>
          <p>${t.helpChord}</p>
        </div>
        <p class="scroll-hint" ${game.config.width <= 9 ? 'hidden' : ''}>${t.scrollHint}</p>
        <p id="storage-note" class="storage-note" hidden>${t.storageOff}</p>
      </section>
    </main>
    <footer class="site-footer">
      <span>${t.footer}</span>
      <div>
        <span>${icon('check')}${t.firstSafe}</span>
        <span>${icon('check')}${t.autoSave}</span>
        <a
          href="https://github.com/shipiyouniao/Minesweeper-2.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${t.source} ↗
        </a>
      </div>
    </footer>
    <dialog id="dialog" aria-labelledby="dialog-title">
      <button class="dialog-close icon-button" data-action="close" aria-label="${t.close}">
        ${icon('close')}
      </button>
      <div id="dialog-content"></div>
    </dialog>
  `
}

/** Explain the rules using the currently selected translation. */
export function helpTemplate(language: Language): string {
  const t = translations[language]
  const steps: readonly HelpStep[] = [
    { title: t.stepOne, note: t.stepOneNote },
    { title: t.stepTwo, note: t.stepTwoNote },
    { title: t.stepThree, note: t.stepThreeNote },
    { title: t.stepFour, note: t.stepFourNote },
  ]

  return /* HTML */ `
    <p class="eyebrow">HOW TO PLAY</p>
    <h2 id="dialog-title">${t.howTitle}</h2>
    <p class="dialog-intro">${t.howIntro}</p>
    <ol class="help-list">
      ${steps.map((step, index) => helpStep(step, index)).join('')}
    </ol>
    <p class="safe-note">${icon('check')}${t.readyNote}</p>
  `
}

/** Render local records with escaped player names and locale-aware dates. */
export function recordsTemplate(
  language: Language,
  recordMode: RankedDifficulty,
  records: readonly Score[],
): string {
  const t = translations[language]

  return /* HTML */ `
    <p class="eyebrow">PERSONAL RECORDS</p>
    <h2 id="dialog-title">${t.records}</h2>
    <p class="dialog-intro">${t.recordsNote}</p>
    <div class="record-tabs">
      ${RANKED_DIFFICULTIES.map((key) => recordTab(key, recordMode, t)).join('')}
    </div>
    ${recordsTable(language, records, t)}
  `
}

/** Render a practice-board form; the controller validates its submitted values. */
export function customTemplate(language: Language, config: Config): string {
  const t = translations[language]

  return /* HTML */ `
    <p class="eyebrow">YOUR OWN LITTLE FIELD</p>
    <h2 id="dialog-title">${t.custom}</h2>
    <p class="dialog-intro">${t.customHint}</p>
    <form id="custom-form">
      <div class="custom-fields">
        <label>
          ${t.width}
          <input
            name="width"
            type="number"
            min="5"
            max="40"
            step="1"
            value="${config.width}"
            required
          />
        </label>
        <label>
          ${t.height}
          <input
            name="height"
            type="number"
            min="5"
            max="30"
            step="1"
            value="${config.height}"
            required
          />
        </label>
        <label>
          ${t.mineCount}
          <input
            name="mines"
            type="number"
            min="1"
            max="1191"
            step="1"
            value="${config.mines}"
            required
          />
        </label>
      </div>
      <p id="custom-error" class="form-error" role="alert"></p>
      <button class="primary-button" type="submit">${t.start}${icon('arrow')}</button>
    </form>
  `
}

/** Render a completed game's outcome and optional editable leaderboard entry. */
export function resultTemplate(language: Language, state: SessionState): string {
  const t = translations[language]
  const { game, elapsed, currentScore } = state
  const won = game.phase === 'won'

  return /* HTML */ `
    <div class="result-symbol ${won ? 'win' : ''}">${icon(won ? 'flag' : 'mine')}</div>
    <h2 id="dialog-title">${won ? t.won : t.lost}</h2>
    <p class="dialog-intro">${won ? t.wonNote : t.lostNote}</p>
    <p class="result-time">
      ${formatTime(elapsed, true)}
      <span>${t.time}</span>
    </p>
    ${won && currentScore ? nameForm(currentScore, t) : ''}
    <button class="primary-button result-restart" data-action="restart-confirmed">
      ${icon('reset')}${t.restart}
    </button>
  `
}

/** Ask before replacing an unfinished game at the current difficulty. */
export function restartTemplate(language: Language): string {
  const t = translations[language]

  return /* HTML */ `
    <h2 id="dialog-title">${t.confirmTitle}</h2>
    <p class="dialog-intro">${t.confirmNote}</p>
    <div class="dialog-actions">
      <button class="secondary-button" data-action="close">${t.cancel}</button>
      <button class="primary-button" data-action="restart-confirmed">${t.restart}</button>
    </div>
  `
}

/** Render one difficulty choice while keeping preset dimensions out of custom mode. */
function difficultyButton(key: Difficulty, selected: Difficulty, messages: Messages): string {
  const dimensions = key === 'custom' ? '＋' : `${PRESETS[key].width} × ${PRESETS[key].height}`

  return /* HTML */ `
    <button
      data-mode="${key}"
      aria-pressed="${selected === key}"
      class="${selected === key ? 'selected' : ''}"
    >
      ${messages[key]}
      <span>${dimensions}</span>
    </button>
  `
}

/** Render one numbered help item from explicit translated content. */
function helpStep(step: HelpStep, index: number): string {
  return /* HTML */ `
    <li>
      <span>${String(index + 1).padStart(2, '0')}</span>
      <div>
        <h3>${step.title}</h3>
        <p>${step.note}</p>
      </div>
    </li>
  `
}

/** Render one local-records tab without changing the active board's difficulty. */
function recordTab(key: RankedDifficulty, selected: Difficulty, messages: Messages): string {
  return /* HTML */ `
    <button data-record-mode="${key}" aria-pressed="${selected === key}">${messages[key]}</button>
  `
}

/** Render an empty state or a complete table from already validated records. */
function recordsTable(language: Language, records: readonly Score[], messages: Messages): string {
  if (records.length === 0) {
    return /* HTML */ `
      <div class="empty-records">
        ${icon('trophy')}
        <p>${messages.noRecords}</p>
      </div>
    `
  }

  return /* HTML */ `
    <table class="records-table">
      <thead>
        <tr>
          <th>#</th>
          <th>${messages.player}</th>
          <th>${messages.time}</th>
          <th>${messages.date}</th>
        </tr>
      </thead>
      <tbody>${records.map((score, index) => recordRow(language, score, index)).join('')}</tbody>
    </table>
  `
}

/** Escape the player name and omit unavailable dates for imported legacy records. */
function recordRow(language: Language, score: Score, index: number): string {
  const date = score.id.startsWith('legacy-')
    ? '—'
    : new Intl.DateTimeFormat(language, {
        month: 'short',
        day: 'numeric',
      }).format(new Date(score.date))

  return /* HTML */ `
    <tr>
      <td>${String(index + 1).padStart(2, '0')}</td>
      <td>${escapeHtml(score.name)}</td>
      <td>${formatTime(score.milliseconds, true)}</td>
      <td>${date}</td>
    </tr>
  `
}

/** Render the editable name of the already-saved result, escaping its attribute value. */
function nameForm(score: Score, messages: Messages): string {
  return /* HTML */ `
    <p class="saved-label">${icon('check')}${messages.recordSaved}</p>
    <form id="name-form">
      <label for="player-name">${messages.name}</label>
      <div class="name-field">
        <input
          id="player-name"
          name="name"
          maxlength="32"
          value="${escapeHtml(score.name)}"
          autocomplete="nickname"
        />
        <button class="secondary-button">${messages.save}</button>
      </div>
    </form>
  `
}
