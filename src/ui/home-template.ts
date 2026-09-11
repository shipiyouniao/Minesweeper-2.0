import { message, translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { Language } from '../types/localization.js'
import type { FreeMode, MenuPage } from '../types/navigation.js'
import { spriteImage } from './dungeon-sprites.js'
import { FREE_MODES, routeHref } from './navigation.js'
import { sharedStyles } from './shared-styles.js'
import { brandTemplate, languageMenuTemplate } from './templates.js'
import { variantCopy } from './variant-copy.js'

/** Keep mode names identical in the directory and their game screens. */
export function freeModeName(language: Language, mode: FreeMode): string {
  if (mode === 'sonar') return message(language, 'sonar-copy.sonar')

  if (mode === 'survey') return message(language, 'survey.title')

  return variantCopy(language)[mode]
}

/** Keep each rule description on a literal, checked localization key. */
function freeModeNote(language: Language, mode: FreeMode): string {
  switch (mode) {
    case 'classic':
      return message(language, 'home.classic-note')
    case 'twin':
      return message(language, 'home.twin-note')
    case 'sonar':
      return message(language, 'home.sonar-note')
    case 'survey':
      return message(language, 'home.survey-note')
  }
}

/** Use decorative, code-drawn boards that suggest each rule without exposing a live puzzle. */
function modeIllustration(mode: FreeMode): string {
  const cells = Array.from({ length: 16 }, (_, index) => {
    const clue = index === 5 ? '1' : index === 9 ? '2' : index === 10 ? '1' : ''
    return `<span class="mini-cell ${clue ? 'is-open' : ''}">${mode === 'survey' ? '' : clue}</span>`
  }).join('')

  return `<div class="mode-illustration illustration-${mode}" aria-hidden="true"><div class="mini-board">${cells}</div>${mode === 'twin' ? `<div class="mini-board mini-board-partner">${cells}</div>` : ''}${mode === 'sonar' ? '<span class="mini-scan"></span>' : ''}${mode === 'survey' ? '<span class="mini-columns">1 2 1 3</span><span class="mini-rows">2<br>1 1<br>3<br>2</span>' : ''}</div>`
}

/** Present two large destinations; entering Expedition restores its normal camp/run flow. */
function homeCards(language: Language): string {
  return `<div class="home-destinations">
    <a class="destination-card destination-expedition" data-route href="${routeHref({ page: 'story' }, language)}">
      <span class="destination-index" aria-hidden="true">01 / EXPEDITION</span>
      <div class="expedition-art" aria-hidden="true"><span class="expedition-orbit"></span>${spriteImage('player', 'home-explorer')}${spriteImage('exit', 'home-stairs')}</div>
      <div class="destination-copy"><h2>${variantCopy(language).expedition}</h2><p>${message(language, 'home.expedition-note')}</p></div>
      <span class="destination-enter">${message(language, 'home.enter-expedition')}<span class="destination-arrow">${icon('arrow')}</span></span>
    </a>
    <a class="destination-card destination-free glass-panel" data-route href="${routeHref({ page: 'free' }, language)}">
      <span class="destination-index" aria-hidden="true">02 / FREE PLAY</span>
      <div class="free-art" aria-hidden="true">${modeIllustration('classic')}<span class="free-art-flag">${icon('flag')}</span></div>
      <div class="destination-copy"><h2>${message(language, 'home.free')}</h2><p>${message(language, 'home.free-note')}</p></div>
      <span class="destination-enter">${message(language, 'home.choose-mode')}<span class="destination-arrow">${icon('arrow')}</span></span>
    </a>
  </div>`
}

/** Give every free mode a stable link, short rule description and distinct board motif. */
function freeCards(language: Language): string {
  return `<div class="free-destinations">${FREE_MODES.map((mode, index) => `<a class="free-mode-card glass-panel" data-route href="${routeHref({ page: 'game', mode }, language)}"><div class="mode-card-top"><span class="destination-index" aria-hidden="true">0${index + 1}</span>${modeIllustration(mode)}</div><h2>${freeModeName(language, mode)}</h2><p>${freeModeNote(language, mode)}</p><span class="destination-enter">${translations[language].start}<span class="destination-arrow">${icon('arrow')}</span></span></a>`).join('')}</div>`
}

/** Render menu-only chrome with the same language and sound controls as the game. */
export function homeTemplate(page: MenuPage, language: Language, sound: boolean): string {
  const t = translations[language]
  return `<header class="site-header ${sharedStyles['site-header']}"><div class="header-identity">${brandTemplate(language)}${page === 'free' ? `<a class="route-back" data-route href="${routeHref({ page: 'home' }, language)}">${icon('arrow')}<span>${message(language, 'home.back')}</span></a>` : ''}</div><nav aria-label="${message(language, 'home.settings')}"><button class="icon-button ${sharedStyles['icon-button']}" data-home-sound aria-label="${sound ? t.soundOn : t.soundOff}" aria-pressed="${sound}">${icon(sound ? 'volume' : 'volumeOff')}</button>${languageMenuTemplate(language)}</nav></header>
    <main class="home-main" data-menu="${page}"><div class="home-heading"><p class="home-eyebrow">MINEFARER</p><h1 tabindex="-1" data-route-heading>${page === 'home' ? message(language, 'home.title') : message(language, 'home.free')}</h1><p>${page === 'home' ? message(language, 'home.note') : message(language, 'home.directory-note')}</p></div>${page === 'home' ? homeCards(language) : freeCards(language)}</main>
    <footer class="home-footer"><span>${message(language, 'home.saved')}</span><a href="https://github.com/shipiyouniao/minefarer" target="_blank" rel="noopener noreferrer">${t.source} ↗</a></footer>`
}
