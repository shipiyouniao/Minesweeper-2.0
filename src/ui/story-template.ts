import { pinnedStoryTasks, storyQuestPanel } from './story-quests.js'
import { storyDialogueTemplate } from './story-dialogue.js'
import { neighbors } from '../game/engine.js'
import { CAMP_SITES } from '../game/story-content.js'
import { storyTeachingTarget } from '../game/story.js'
import { message, translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { Language } from '../types/localization.js'
import type { CampSite, StoryViewState } from '../types/story.js'
import { campLabel, campPageName } from './camp-copy.js'
import { campTemplate } from './camp-template.js'
import { spriteImage } from './dungeon-sprites.js'
import { routeHref } from './navigation.js'
import { escapeHtml } from './presentation.js'
import { professionSprite } from './profession-presentation.js'
import { brandTemplate, languageMenuTemplate } from './templates.js'
import { titleTemplate } from './title-template.js'
import { equipmentCopy, professionCopy, variantCopy } from './variant-copy.js'

/** Use a single original guide sprite in dialogue and on the camp board. */
export function storyGuideImage(): string {
  return `<img class="story-guide" src="${import.meta.env.BASE_URL}assets/story/guide.png" alt="" width="128" height="128" draggable="false">`
}

/** Scene names remain literal catalog calls so localization checks cover every path. */
function sceneName(state: StoryViewState): string {
  switch (state.board.scene.id) {
    case 'awakening':
      return message(state.language, 'story.awakening')
    case 'trail':
      return message(state.language, 'story.trail')
    case 'approach':
      return message(state.language, 'story.approach')
    case 'camp':
      return message(state.language, 'story.camp')
  }
}

/** Keep the persistent camp's landmarks aligned with their existing service names. */
export function storySiteName(language: Language, site: CampSite): string {
  if (site.destination === 'guide') return message(language, 'story.guide')
  if (site.destination === 'road') return message(language, 'story.road')
  return campPageName(language, site.destination)
}

/** Build cell labels exclusively from public visibility, never covered mine truth. */
function cellTemplate(state: StoryViewState, index: number): string {
  const { board, language, run } = state
  const cell = board.game.cells[index]!
  if (board.walls.includes(index))
    return `<div class="story-tree" aria-hidden="true"><img src="${import.meta.env.BASE_URL}assets/story/tree.png" alt="" draggable="false"></div>`
  const site = run ? undefined : CAMP_SITES.find((entry) => entry.index === index)
  const lit = run
    ? storyTeachingTarget(run) === index
    : !state.progress.completed.includes('meet-guide') && index === 51
  const scoped =
    state.inspected !== null && neighbors(board.game.config, state.inspected).includes(index)
  const triggered = run?.triggered.includes(index)
  const flagged = cell.visibility === 'flagged'
  const covered = cell.visibility === 'hidden'
  const exit = index === board.exit
  const entrance = run && run.floor > 0 && index === board.entrance
  const destinations = [
    message(language, 'story.awakening'),
    message(language, 'story.trail'),
    message(language, 'story.approach'),
    message(language, 'story.camp'),
  ]
  const treasure = run && board.treasure === index && !run.collected
  const number = cell.visibility === 'revealed' && !cell.mine ? cell.adjacent : 0
  let label = covered ? message(language, 'story.covered') : message(language, 'story.safe')
  let content = ''
  if (triggered) {
    label = message(language, 'story.pulse')
    content = icon('flag')
  } else if (flagged) {
    label = message(language, 'story.marked')
    content = icon('flag')
  } else if (site) {
    label = storySiteName(language, site)
    content = site.destination === 'guide' ? storyGuideImage() : spriteImage(site.sprite)
  } else if (exit || entrance) {
    label = destinations[run ? run.floor + (exit ? 1 : -1) : 2]!
    content = `<img class="dungeon-sprite" src="${import.meta.env.BASE_URL}assets/story/lantern.png" alt="" draggable="false">`
  } else if (treasure) {
    label = message(language, 'story.satchel')
    content = spriteImage('treasure')
  } else if (!covered && run && cell.adjacent) {
    label = message(language, 'story.clue', { count: cell.adjacent })
    content = `<span class="story-clue">${cell.adjacent}</span>`
  }
  if (number && (site || exit || entrance || treasure)) {
    label += ` · ${message(language, 'story.clue', { count: number })}`
    if (index !== state.player) content += `<span class="story-clue-badge">${number}</span>`
  }
  const name = `${Math.floor(index / board.game.config.width) + 1}, ${(index % board.game.config.width) + 1}: ${label}`
  return `<button class="story-cell ${covered ? 'is-covered' : 'is-open'} ${flagged ? 'is-flagged' : ''} ${triggered ? 'is-triggered' : ''} ${lit ? 'is-teaching' : ''} ${scoped ? 'is-scope' : ''} ${site || exit || entrance ? 'is-site' : ''}" data-number="${number}" data-cell="${index}" data-story-cell="${index}" tabindex="${index === state.player ? 0 : -1}" aria-label="${escapeHtml(name)}" ${run?.phase === 'fallen' ? 'disabled' : ''}>${content}${site || exit || entrance ? `<span class="story-site-label">${label}</span>` : ''}</button>`
}

/** A single movable overlay keeps the chibi traveler above cell edges and clues. */
function sceneBoard(state: StoryViewState): string {
  const width = state.board.game.config.width
  const player = state.run ? 'player' : professionSprite(state.loadout.profession)
  const cell = state.board.game.cells[state.player]!
  const number = cell.visibility === 'revealed' && !cell.mine ? cell.adjacent : 0
  return `<div class="story-board" role="group" aria-label="${sceneName(state)}" style="--columns:${width};--rows:${state.board.game.config.height}">${state.board.game.cells.map((_cell, index) => cellTemplate(state, index)).join('')}<div class="story-traveler" aria-hidden="true" data-number="${number}" data-player="${state.player}" style="--player-x:${state.player % width};--player-y:${Math.floor(state.player / width)}">${spriteImage(player)}${number ? `<span class="story-clue-badge">${number}</span>` : ''}</div></div>`
}

/** Teach the two primary interactions in the same fixed bottom control area as other modes. */
function sceneDock(state: StoryViewState): string {
  const language = state.language
  const run = state.run
  return `<footer class="story-dock"><div class="story-dock-inner">${run ? `<div class="story-modes" role="group" aria-label="${message(language, 'story.explore')}"><button data-story-action="explore" aria-pressed="${!state.flagMode}">${icon('pointer')}${message(language, 'story.explore')}</button><button data-story-action="flag" aria-pressed="${state.flagMode}">${icon('flag')}${message(language, 'story.flag')}</button></div>${run.phase === 'fallen' || state.exhausted ? `<button class="story-primary" data-story-action="retry">${message(language, 'story.retry')}</button>` : ''}` : ''}<button data-story-action="tasks">${icon('trophy')}${message(language, 'story.tasks')}</button><button data-story-action="map" class="${state.progress.mapOwned ? '' : 'is-unavailable'}">${icon('globe')}${message(language, 'story.map')}${state.progress.mapOwned ? '' : ' · —'}</button></div></footer>`
}

/** Camp services reuse the existing purchasing and loadout templates instead of duplicating them. */
export function storyTemplate(state: StoryViewState): string {
  const { language, run } = state
  const t = translations[language]
  const notice =
    state.feedback === 'route'
      ? message(language, 'story.route')
      : state.feedback === 'lesson'
        ? message(language, 'story.lesson')
        : state.inspected !== null
          ? message(language, 'story.inspect')
          : ''
  const hero = `${import.meta.env.BASE_URL}assets/story/camp-banner.png`
  return `<header class="site-header"><div class="header-identity">${brandTemplate(language)}<a class="route-back" data-route href="${routeHref({ page: 'home' }, language)}">${icon('arrow')}<span>${message(language, 'home.back')}</span></a></div><nav><a class="story-temporary" data-route href="${routeHref({ page: 'game', mode: 'expedition' }, language)}">${message(language, 'story.temporary')}</a><button class="icon-button" data-story-action="sound" aria-label="${state.sound ? t.soundOn : t.soundOff}" aria-pressed="${state.sound}">${icon(state.sound ? 'volume' : 'volumeOff')}</button>${languageMenuTemplate(language)}</nav></header>
  <main class="story-main" data-story-scene="${state.board.scene.id}">
    ${!state.storageAvailable ? `<p role="alert">${message(language, 'story.storage')}</p>` : ''}
    <section class="story-banner glass-panel" style="--story-hero:url('${hero}')"><div><p class="eyebrow">${run ? message(language, 'story.prologue') : 'MINEFARER / CAMP'}</p><h1 data-route-heading>${sceneName(state)}</h1><p>${run ? `${run.floor + 1} / 3` : `${new Intl.NumberFormat(language).format(state.camp.supplies)} ${variantCopy(language).supplies}`}</p></div></section>
    ${state.service ? `<div class="story-service">${state.service.page === 'professions' ? titleTemplate(language, state.camp) : ''}${campTemplate(language, state.camp, state.loadout.profession, state.loadout.equipment, 'standard', state.service)}</div>` : `<div class="story-layout"><section class="story-stage glass-panel"><div class="story-stage-top">${run ? `<span class="story-hearts" aria-label="${message(language, 'story.health')}: ${run.health} / 3">${'♥'.repeat(run.health)}${'♡'.repeat(3 - run.health)}</span>` : ''}</div>${sceneBoard(state)}${notice ? `<p class="story-notice" role="status">${notice}</p>` : ''}</section><aside class="story-sidebar glass-panel">${pinnedStoryTasks(state)}${run ? `<a class="story-shortcut" data-route href="${routeHref({ page: 'game', mode: 'expedition' }, language)}"><strong>${message(language, 'story.temporary')} ↗</strong><span>${message(language, 'story.temporary-note')}</span></a>` : `<div class="story-loadout">${spriteImage(professionSprite(state.loadout.profession))}<h2>${professionCopy(language, state.loadout.profession).name}</h2>${titleTemplate(language, state.camp)}<p>${state.loadout.equipment.map((id) => equipmentCopy(language, id).name).join(' · ') || campLabel(language, 'empty')}</p></div>`}</aside></div>`}
  </main>${storyDialogueTemplate(state)}${storyQuestPanel(state)}${state.service ? '' : sceneDock(state)}`
}
