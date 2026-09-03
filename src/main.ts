import { act, createGame, PRESETS, stats, validConfig, type Config, type Difficulty, type Game } from './game/engine.js'
import { translations, languageOf, type Language } from './i18n.js'
import { icon } from './icons.js'
import { Repository, difficultyOf, type Score } from './storage.js'

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('App root is missing')
const app = root
const repo = new Repository({
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: key => localStorage.removeItem(key),
})
repo.migrateLegacy()
const params = new URLSearchParams(location.search)
let language: Language = languageOf(params.get('lang') ?? repo.preference('language') ?? navigator.language)
let mode = difficultyOf(params.get('mode') ?? repo.preference('difficulty'))
const initial = repo.load(mode)
let game = initial?.game ?? fresh(mode === 'custom' ? { width: 12, height: 12, mines: 20 } : PRESETS[mode])
let elapsed = initial?.elapsed ?? 0
let runningSince: number | null = null
let paused = game.phase === 'playing'
let flagMode = false
let focusIndex = 0
let resumeAfterDialog = false
let currentScore: Score | null = null
let recordMode: Exclude<Difficulty, 'custom'> = mode === 'custom' ? 'easy' : mode
let lastTouchFlag = -Infinity
let longPress: ReturnType<typeof setTimeout> | undefined
let touchStart: { x: number; y: number } | null = null

function fresh(config: Config): Game {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return createGame(config, values[0] ?? 0)
}
function messages() { return translations[language] }
function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const value = app.querySelector<T>(selector)
  if (!value) throw new Error(`Missing UI element: ${selector}`)
  return value
}
function escape(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}
function formatTime(milliseconds: number, precise = false): string {
  const seconds = Math.floor(milliseconds / 1000)
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0'))
  if (seconds >= 3600) parts.unshift(String(Math.floor(seconds / 3600)))
  return parts.join(':') + (precise ? `.${Math.floor(milliseconds % 1000 / 100)}` : '')
}
function time(): number { return elapsed + (runningSince === null ? 0 : performance.now() - runningSince) }
function stopClock(): void { elapsed = time(); runningSince = null }
function persist(): void { repo.save(mode, game, time()) }

function renderApp(): void {
  const t = messages()
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
  document.title = `${t.title} · Minesweeper 2.0`
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="./" aria-label="Minesweeper 2.0"><span class="brand-mark">${icon('flag')}</span><span>Minesweeper<span class="brand-version">2.0</span></span></a>
      <nav aria-label="${t.play}"><button class="text-button" data-action="help">${t.how}</button><button class="text-button" data-action="records">${t.records}</button>
      <label class="language-picker">${icon('globe')}<select id="language" aria-label="${t.language}"><option value="zh" ${language === 'zh' ? 'selected' : ''}>中文</option><option value="en" ${language === 'en' ? 'selected' : ''}>English</option><option value="ja" ${language === 'ja' ? 'selected' : ''}>日本語</option></select></label></nav>
    </header>
    <main class="layout">
      <section class="introduction" aria-labelledby="intro-title">
        <p class="eyebrow"><span></span> THE CLASSIC, REIMAGINED</p>
        <h1 id="intro-title">${t.tagline}</h1><p class="intro-copy">${t.intro}</p>
        <img class="hero-art" src="${import.meta.env.BASE_URL}assets/quiet-board.png" alt="" width="1254" height="1254" fetchpriority="low" />
        <div class="intro-bottom"><span class="tiny-rule"></span><p>${t.edition}</p></div>
      </section>
      <section class="game-section" aria-label="${t.title}">
        <div class="game-heading"><h2>${t.title}</h2><button class="icon-button" data-action="help" aria-label="${t.how}">${icon('help')}</button></div>
        <div class="difficulty-tabs" role="group" aria-label="${t.difficulty}">${(['easy', 'medium', 'expert', 'custom'] as const).map(key => `<button data-mode="${key}" aria-pressed="${mode === key}" class="${mode === key ? 'selected' : ''}">${t[key]}${key === 'custom' ? '<span>＋</span>' : `<span>${PRESETS[key].width} × ${PRESETS[key].height}</span>`}</button>`).join('')}</div>
        <div class="game-card">
          <div class="score-strip"><div><span>${icon('flag')}${t.mines}</span><strong id="mine-count">010</strong></div><div><span>${icon('clock')}${t.time}</span><strong id="timer">00:00</strong></div><div><span>${icon('trophy')}${t.best}</span><strong id="best">—</strong></div></div>
          <div class="board-shell"><div class="board-viewport" tabindex="-1"><div id="board" class="board" role="grid" aria-label="${t.board}" aria-rowcount="${game.config.height}" aria-colcount="${game.config.width}"></div></div>
          <div id="pause-cover" class="pause-cover" hidden><span class="pause-art">${icon('leaf')}</span><h3>${t.paused}</h3><p>${t.pausedNote}</p><button class="primary-button" data-action="pause">${icon('play')}${t.resume}</button></div></div>
          <div class="status-line" role="status" aria-live="polite"><span id="status-dot" class="status-dot"></span><span id="status"></span><span id="progress"></span></div>
          <div class="game-toolbar"><div class="input-mode" role="group" aria-label="${t.flagMode}"><button data-action="reveal-mode" aria-pressed="${!flagMode}">${icon('pointer')}<span>${t.reveal}</span></button><button data-action="flag-mode" aria-pressed="${flagMode}">${icon('flag')}<span>${t.flag}</span></button></div>
          <div class="toolbar-right"><button id="pause-button" class="icon-button" data-action="pause" aria-label="${t.pause}">${icon('pause')}</button><button class="new-button" data-action="new">${icon('reset')}<span>${t.restart}</span></button></div></div>
        </div>
        <div class="under-board"><p class="desktop-hint">${t.helpMouse}</p><p class="touch-hint">${t.helpTouch}</p><p>${t.helpChord}</p></div>
        <p class="scroll-hint" ${game.config.width <= 9 ? 'hidden' : ''}>${t.scrollHint}</p>
        <p id="storage-note" class="storage-note" hidden>${t.storageOff}</p>
      </section>
    </main>
    <footer class="site-footer"><span>${t.footer}</span><div><span>${icon('check')}${t.firstSafe}</span><span>${icon('check')}${t.autoSave}</span><a href="https://github.com/shipiyouniao/Minesweeper-2.0" target="_blank" rel="noopener noreferrer">${t.source} ↗</a></div></footer>
    <dialog id="dialog" aria-labelledby="dialog-title"><button class="dialog-close icon-button" data-action="close" aria-label="${t.close}">${icon('close')}</button><div id="dialog-content"></div></dialog>`
  const board = element('#board')
  board.style.setProperty('--columns', String(game.config.width))
  board.classList.toggle('dense', game.config.width > 9)
  for (let row = 0; row < game.config.height; row++) {
    const line = document.createElement('div')
    line.className = 'board-row'
    line.setAttribute('role', 'row')
    for (let col = 0; col < game.config.width; col++) {
      const button = document.createElement('button')
      const index = row * game.config.width + col
      button.type = 'button'
      button.className = 'cell'
      button.dataset['cell'] = String(index)
      button.setAttribute('role', 'gridcell')
      button.tabIndex = index === focusIndex ? 0 : -1
      line.append(button)
    }
    board.append(line)
  }
  element<HTMLDialogElement>('#dialog').addEventListener('close', () => {
    if (resumeAfterDialog && game.phase === 'playing') { paused = false; runningSince = performance.now() }
    resumeAfterDialog = false
    draw()
  })
  draw()
}

function draw(): void {
  const t = messages(), ended = game.phase === 'won' || game.phase === 'lost'
  for (const button of app.querySelectorAll<HTMLButtonElement>('[data-cell]')) {
    const index = Number(button.dataset['cell'])
    const cell = game.cells[index]
    if (!cell) continue
    const showMine = ended && cell.mine
    const wrong = ended && !cell.mine && cell.visibility === 'flagged'
    button.className = `cell ${cell.visibility}${showMine ? ' mine' : ''}${wrong ? ' wrong' : ''}${index === game.exploded ? ' exploded' : ''}`
    button.dataset['state'] = cell.visibility
    button.dataset['number'] = cell.visibility === 'revealed' ? String(cell.adjacent) : ''
    let label = t.closed, content = ''
    if (wrong) { content = icon('close'); label = t.wrongFlag }
    else if (cell.visibility === 'flagged') { content = icon('flag'); label = t.flagged }
    else if (showMine) { content = icon('mine'); label = t.mine }
    else if (cell.visibility === 'revealed') { content = cell.adjacent ? String(cell.adjacent) : ''; label = cell.adjacent ? `${t.around} ${cell.adjacent}` : t.empty }
    // Unrevealed mines and clue values are deliberately absent from the DOM.
    button.innerHTML = content
    button.setAttribute('aria-label', `${t.row} ${Math.floor(index / game.config.width) + 1}, ${t.column} ${index % game.config.width + 1}: ${label}`)
    button.setAttribute('aria-disabled', String(paused || ended))
  }
  element('#pause-cover').hidden = !paused
  element('#board').inert = paused
  element('.board-viewport').classList.toggle('obscured', paused)
  const status = paused ? t.paused : game.phase === 'ready' ? t.ready : game.phase === 'won' ? t.won : game.phase === 'lost' ? t.lost : t.playing
  element('#status').textContent = status
  element('#status-dot').dataset['phase'] = game.phase
  const counts = stats(game)
  element('#progress').textContent = `${counts.revealed} / ${game.cells.length - game.config.mines}`
  element('#progress').title = t.progress
  element('#mine-count').textContent = String(game.config.mines - counts.flags).padStart(3, '0')
  const best = mode === 'custom' ? undefined : repo.scores(mode)[0]
  element('#best').textContent = best ? formatTime(best.milliseconds) : '—'
  const pauseButton = element<HTMLButtonElement>('#pause-button')
  pauseButton.disabled = game.phase !== 'playing'
  pauseButton.innerHTML = icon(paused ? 'play' : 'pause')
  pauseButton.setAttribute('aria-label', paused ? t.resume : t.pause)
  element('[data-action="reveal-mode"]').setAttribute('aria-pressed', String(!flagMode))
  element('[data-action="flag-mode"]').setAttribute('aria-pressed', String(flagMode))
  drawTime()
}
function drawTime(): void {
  element('#timer').textContent = formatTime(time())
  element('#storage-note').hidden = repo.available
}

function play(index: number, flag = flagMode): void {
  if (paused || element<HTMLDialogElement>('#dialog').open) return
  const previous = game
  game = act(game, { type: flag ? 'flag' : 'reveal', index })
  if (game === previous) return
  if (previous.phase === 'ready' && game.firstClick !== null) runningSince = performance.now()
  const finished = game.phase === 'won' || game.phase === 'lost'
  if (finished) {
    stopClock()
    if (game.phase === 'won' && mode !== 'custom') {
      const nickname = repo.preference('name')
      currentScore = { id: crypto.randomUUID(), name: typeof nickname === 'string' ? nickname : 'Player', milliseconds: elapsed, date: new Date().toISOString() }
      repo.record(mode, currentScore)
    }
  }
  persist()
  draw()
  if (finished) showResult()
}

function changeMode(next: Difficulty, custom?: Config): void {
  persist()
  mode = next
  const saved = custom ? null : repo.load(mode)
  game = saved?.game ?? fresh(custom ?? (mode === 'custom' ? { width: 12, height: 12, mines: 20 } : PRESETS[mode]))
  elapsed = saved?.elapsed ?? 0
  runningSince = null
  paused = game.phase === 'playing'
  focusIndex = 0
  currentScore = null
  repo.setPreference('difficulty', mode)
  renderApp()
}
function newGame(): void {
  resumeAfterDialog = false
  game = fresh(game.config)
  elapsed = 0; runningSince = null; paused = false; focusIndex = 0; currentScore = null
  persist()
  renderApp()
}
function togglePause(): void {
  if (game.phase !== 'playing') return
  paused = !paused
  if (paused) { stopClock(); persist() } else runningSince = performance.now()
  draw()
}
function modal(content: string): void {
  const dialog = element<HTMLDialogElement>('#dialog')
  if (!dialog.open) {
    resumeAfterDialog = game.phase === 'playing' && !paused
    if (resumeAfterDialog) { stopClock(); paused = true; persist(); draw() }
  }
  element('#dialog-content').innerHTML = content
  if (!dialog.open) dialog.showModal()
}
function showHelp(): void {
  const t = messages()
  modal(`<p class="eyebrow">HOW TO PLAY</p><h2 id="dialog-title">${t.howTitle}</h2><p class="dialog-intro">${t.howIntro}</p><ol class="help-list">${(['One', 'Two', 'Three', 'Four'] as const).map((key, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><div><h3>${t[`step${key}`]}</h3><p>${t[`step${key}Note`]}</p></div></li>`).join('')}</ol><p class="safe-note">${icon('check')}${t.readyNote}</p>`)
}
function showRecords(): void {
  const t = messages(), records = repo.scores(recordMode)
  modal(`<p class="eyebrow">PERSONAL RECORDS</p><h2 id="dialog-title">${t.records}</h2><p class="dialog-intro">${t.recordsNote}</p><div class="record-tabs">${(['easy', 'medium', 'expert'] as const).map(key => `<button data-record-mode="${key}" aria-pressed="${recordMode === key}">${t[key]}</button>`).join('')}</div>${records.length ? `<table class="records-table"><thead><tr><th>#</th><th>${t.player}</th><th>${t.time}</th><th>${t.date}</th></tr></thead><tbody>${records.map((score, i) => `<tr><td>${String(i + 1).padStart(2, '0')}</td><td>${escape(score.name)}</td><td>${formatTime(score.milliseconds, true)}</td><td>${score.id.startsWith('legacy-') ? '—' : new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' }).format(new Date(score.date))}</td></tr>`).join('')}</tbody></table>` : `<div class="empty-records">${icon('trophy')}<p>${t.noRecords}</p></div>`}`)
}
function showCustom(): void {
  const t = messages(), config = game.config
  modal(`<p class="eyebrow">YOUR OWN LITTLE FIELD</p><h2 id="dialog-title">${t.custom}</h2><p class="dialog-intro">${t.customHint}</p><form id="custom-form"><div class="custom-fields"><label>${t.width}<input name="width" type="number" min="5" max="40" step="1" value="${config.width}" required></label><label>${t.height}<input name="height" type="number" min="5" max="30" step="1" value="${config.height}" required></label><label>${t.mineCount}<input name="mines" type="number" min="1" max="1191" step="1" value="${config.mines}" required></label></div><p id="custom-error" class="form-error" role="alert"></p><button class="primary-button" type="submit">${t.start}${icon('arrow')}</button></form>`)
}
function showResult(): void {
  const t = messages(), won = game.phase === 'won'
  modal(`<div class="result-symbol ${won ? 'win' : ''}">${icon(won ? 'flag' : 'mine')}</div><h2 id="dialog-title">${won ? t.won : t.lost}</h2><p class="dialog-intro">${won ? t.wonNote : t.lostNote}</p><p class="result-time">${formatTime(elapsed, true)}<span>${t.time}</span></p>${won && currentScore ? `<p class="saved-label">${icon('check')}${t.recordSaved}</p><form id="name-form"><label for="player-name">${t.name}</label><div class="name-field"><input id="player-name" name="name" maxlength="32" value="${escape(currentScore.name)}" autocomplete="nickname"><button class="secondary-button">${t.save}</button></div></form>` : ''}<button class="primary-button result-restart" data-action="restart-confirmed">${icon('reset')}${t.restart}</button>`)
}

app.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null
  if (!target) return
  if (target.dataset['cell'] !== undefined) {
    if (performance.now() - lastTouchFlag < 700) return
    play(Number(target.dataset['cell']))
    return
  }
  const nextMode = target.dataset['mode']
  if (nextMode) {
    if (nextMode === 'custom') showCustom()
    else if (nextMode !== mode) changeMode(difficultyOf(nextMode))
    return
  }
  const nextRecord = target.dataset['recordMode']
  if (nextRecord === 'easy' || nextRecord === 'medium' || nextRecord === 'expert') { recordMode = nextRecord; showRecords(); return }
  switch (target.dataset['action']) {
    case 'help': showHelp(); break
    case 'records': showRecords(); break
    case 'close': element<HTMLDialogElement>('#dialog').close(); break
    case 'pause': togglePause(); break
    case 'flag-mode': flagMode = true; draw(); break
    case 'reveal-mode': flagMode = false; draw(); break
    case 'restart-confirmed': newGame(); break
    case 'new': {
      if (game.phase !== 'playing') { newGame(); break }
      const t = messages()
      modal(`<h2 id="dialog-title">${t.confirmTitle}</h2><p class="dialog-intro">${t.confirmNote}</p><div class="dialog-actions"><button class="secondary-button" data-action="close">${t.cancel}</button><button class="primary-button" data-action="restart-confirmed">${t.restart}</button></div>`)
      break
    }
  }
})
app.addEventListener('contextmenu', event => {
  const cell = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cell]') : null
  if (!cell) return
  event.preventDefault()
  if (performance.now() - lastTouchFlag < 700) return
  play(Number(cell.dataset['cell']), true)
})
app.addEventListener('change', event => {
  if (event.target instanceof HTMLSelectElement && event.target.id === 'language') {
    language = languageOf(event.target.value)
    repo.setPreference('language', language)
    renderApp()
  }
})
app.addEventListener('submit', event => {
  event.preventDefault()
  if (!(event.target instanceof HTMLFormElement)) return
  const data = new FormData(event.target)
  if (event.target.id === 'custom-form') {
    const config = { width: Number(data.get('width')), height: Number(data.get('height')), mines: Number(data.get('mines')) }
    if (!validConfig(config)) { element('#custom-error').textContent = messages().invalid; return }
    resumeAfterDialog = false
    changeMode('custom', config)
  } else if (event.target.id === 'name-form' && currentScore) {
    const name = String(data.get('name') ?? '').trim().slice(0, 32) || 'Player'
    currentScore = { ...currentScore, name }
    repo.record(mode, currentScore)
    repo.setPreference('name', name)
    element<HTMLDialogElement>('#dialog').close()
  }
})
app.addEventListener('focusin', event => {
  if (event.target instanceof HTMLButtonElement && event.target.dataset['cell'] !== undefined) {
    for (const cell of app.querySelectorAll<HTMLButtonElement>('[data-cell]')) cell.tabIndex = cell === event.target ? 0 : -1
    focusIndex = Number(event.target.dataset['cell'])
  }
})
app.addEventListener('keydown', event => {
  if (element<HTMLDialogElement>('#dialog').open || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
  const key = event.key.toLowerCase()
  if (key === 'p') { event.preventDefault(); togglePause(); return }
  if (key === 'n') { event.preventDefault(); element<HTMLButtonElement>('[data-action="new"]').click(); return }
  const cell = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-cell]') : null
  if (!cell) return
  const index = Number(cell.dataset['cell']), { width, height } = game.config
  let next = index
  if (key === 'arrowleft') next = index % width ? index - 1 : index
  else if (key === 'arrowright') next = index % width < width - 1 ? index + 1 : index
  else if (key === 'arrowup') next = Math.max(index % width, index - width)
  else if (key === 'arrowdown') next = Math.min((height - 1) * width + index % width, index + width)
  else if (key === 'home') next = index - index % width
  else if (key === 'end') next = index - index % width + width - 1
  else if (key === 'f') { event.preventDefault(); play(index, true); return }
  else if (key === ' ' || key === 'enter') { event.preventDefault(); play(index, false); return }
  else return
  event.preventDefault()
  element<HTMLButtonElement>(`[data-cell="${next}"]`).focus({ preventScroll: false })
})
function cancelLongPress(): void { clearTimeout(longPress); touchStart = null }
app.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse') return
  const cell = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cell]') : null
  if (!cell) return
  cancelLongPress()
  touchStart = { x: event.clientX, y: event.clientY }
  longPress = setTimeout(() => { lastTouchFlag = performance.now(); play(Number(cell.dataset['cell']), true); touchStart = null }, 450)
})
app.addEventListener('pointermove', event => {
  if (touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 10) cancelLongPress()
})
app.addEventListener('pointerup', cancelLongPress)
app.addEventListener('pointercancel', cancelLongPress)
app.addEventListener('scroll', cancelLongPress, true)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.phase === 'playing' && !paused) { stopClock(); paused = true; resumeAfterDialog = false; persist(); draw() }
})
window.addEventListener('pagehide', () => { stopClock(); persist() })
renderApp()
setInterval(() => { drawTime(); if (runningSince !== null) persist() }, 1000)
