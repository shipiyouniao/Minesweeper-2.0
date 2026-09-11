import { regionalCamp, isRegionalCamp } from '../game/regional-camps.js'
import { campSiteImage, storySiteName } from './story-assets.js'
import { RESCUE_GATE, TOMA_CAMP_CELL } from '../game/rail-story.js'
import { northwestPortals, BASTION_GATE } from '../game/northwest-world.js'
import { worldSceneName } from './world-copy.js'
import { pinnedStoryTasks, storyQuestPanel } from './story-quests.js'
import { clueIsolated } from '../game/clue-isolation.js'
import { storyGateTemplate, storyMechanismName } from './story-mechanisms.js'
import { cartImage, tomaImage } from './rail-view.js'
import { campaignProgress, CAMPAIGN_STAGES } from '../game/campaign-catalog.js'
import { niaImage } from './signal-performance.js'
import { signalCopy } from './signal-copy.js'
import { OBSERVATORY_GATE } from '../game/observatory-layout.js'
import { WATERWAY_GATE } from '../game/waterway-layout.js'
import { campaignName } from './campaign-copy.js'
import { observatoryImage, drainageImage, consoleImage } from './power-view.js'
import { storyDialogueTemplate } from './story-dialogue.js'
import { neighbors } from '../game/engine.js'
import { QUARRY_GATE } from '../game/story-content.js'
import { storyTeachingTarget } from '../game/story.js'
import { message, translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { StoryViewState } from '../types/story.js'
import { campLabel } from './camp-copy.js'
import { campTemplate } from './camp-template.js'
import { spriteImage } from './dungeon-sprites.js'
import { routeHref } from './navigation.js'
import { escapeHtml } from './presentation.js'
import { professionSprite } from './profession-presentation.js'
import { brandTemplate, languageMenuTemplate } from './templates.js'
import { titleTemplate } from './title-template.js'
import { equipmentCopy, professionCopy, variantCopy } from './variant-copy.js'

/** Scene names remain literal catalog calls so localization checks cover every path. */
function sceneName(state: StoryViewState): string {
  return worldSceneName(state.language, state.board.scene.id)
}

export { storySiteName } from './story-assets.js'

/** Build cell labels exclusively from public visibility, never covered mine truth. */
function cellTemplate(state: StoryViewState, index: number): string {
  const { board, language, run } = state
  const cell = board.game.cells[index]!
  const gate = run ? storyGateTemplate(run, language, index) : null
  if (gate) return gate

  if (board.scene.water?.includes(index))
    return '<div class="story-river" aria-hidden="true"></div>'

  const portal = northwestPortals(board.scene.id, state.progress).find(
    (entry) => entry.index === index,
  )
  const bastionGate = board.scene.id === 'blockade-pass' && index === BASTION_GATE
  const control = run?.board.scene.mechanisms?.find((entry) => entry.index === index)
  if (board.walls.includes(index))
    return `<div class="story-tree" aria-hidden="true"><img src="${import.meta.env.BASE_URL}assets/story/tree.png" alt="" draggable="false"></div>`

  const camp = regionalCamp(state.progress.campId)
  const site = run ? undefined : camp.sites.find((entry) => entry.index === index)
  const lit = run
    ? storyTeachingTarget(run) === index
    : !state.progress.completed.includes('meet-guide') && index === 51
  const scoped =
    state.inspected !== null && neighbors(board.game.config, state.inspected).includes(index)
  const triggered = run?.triggered.includes(index)
  const flagged = cell.visibility === 'flagged'
  const covered = cell.visibility === 'hidden'
  const quarryGate = run?.floor === 3 && index === QUARRY_GATE
  const ridgeGate =
    run?.floor === 3 && index === OBSERVATORY_GATE && state.progress.facts?.includes('ridge-route')
  const waterwayGate =
    run?.floor === 3 && index === WATERWAY_GATE && state.progress.facts?.includes('ridge-surveyed')
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
  } else if (
    !run &&
    index === camp.nia &&
    campaignProgress(state.campaign, 'tower-relay').cleared
  ) {
    label = signalCopy(language).nia
    content = niaImage()
  } else if (
    !run &&
    camp.id === 'camp' &&
    index === TOMA_CAMP_CELL &&
    state.progress.facts?.includes('toma-rescued')
  ) {
    label = message(language, 'rail.toma')
    content = tomaImage()
  } else if (run?.board.scene.id === 'quarry-yard' && index === RESCUE_GATE) {
    label = message(language, 'rail.title')
    content = cartImage()
  } else if (site) {
    label = storySiteName(language, site)
    content = campSiteImage(site)
  } else if (control && run) {
    const status = run.operated.includes(index)
      ? message(language, 'story.mechanism-done')
      : clueIsolated(board, index)
        ? message(language, 'story.mechanism-operate')
        : message(language, 'story.mechanism-locked')

    label = storyMechanismName(language, control) + ' · ' + status
    content = spriteImage(run.operated.includes(index) ? 'bastion-pylon-off' : 'bastion-pylon')
  } else if (portal) {
    label =
      portal.destination === 'camp'
        ? message(language, 'finale.shortcut')
        : worldSceneName(language, portal.destination)
    content = spriteImage(isRegionalCamp(portal.destination) ? 'workshop' : 'exit')
  } else if (bastionGate) {
    label = message(language, 'finale.pass-title')
    content = spriteImage('bastion')
  } else if (
    run?.board.scene.id === 'tower-landing' &&
    exit &&
    state.progress.facts?.includes('beacon-recovered')
  ) {
    label = message(language, 'finale.control-title')
    content = consoleImage()
  } else if (waterwayGate) {
    label = message(language, 'waterway.title')
    content = drainageImage()
  } else if (ridgeGate) {
    label = message(language, 'ridge.title')
    content = observatoryImage()
  } else if (quarryGate) {
    label = message(language, 'story.quarry-yard')
    content = spriteImage('workshop')
  } else if (exit || entrance) {
    label =
      run && run.floor >= 4
        ? entrance
          ? run.floor === 4 || run.floor === 7
            ? message(language, 'story.north-road')
            : run.floor === 5
              ? message(language, 'story.quarry-yard')
              : message(language, 'story.quarry-passage')
          : run.floor === 4
            ? message(language, 'story.quarry-passage')
            : run.floor === 5
              ? message(language, 'story.quarry-machine')
              : run.floor === 6
                ? message(language, 'story.haul-track')
                : message(language, 'story.atlas-watchtower')
        : run?.board.scene.id === 'north-road'
          ? exit
            ? state.progress.facts?.includes('lift-restored')
              ? message(language, 'story.tower-landing')
              : message(language, 'story.lift')
            : message(language, 'story.camp')
          : destinations[run ? run.floor + (exit ? 1 : -1) : 2]!
    content =
      run?.floor === 3 && exit && state.progress.facts?.includes('lift-restored')
        ? spriteImage('workshop')
        : `<img class="dungeon-sprite" src="${import.meta.env.BASE_URL}assets/story/lantern.png" alt="" draggable="false">`
  } else if (treasure) {
    label =
      run?.floor === 6 ? message(language, 'story.spindle') : message(language, 'story.satchel')
    content = spriteImage('treasure')
  } else if (!covered && run && cell.adjacent) {
    label = message(language, 'story.clue', { count: cell.adjacent })
    content = `<span class="story-clue">${cell.adjacent}</span>`
  }

  if (
    number &&
    (site ||
      exit ||
      entrance ||
      quarryGate ||
      ridgeGate ||
      waterwayGate ||
      portal ||
      bastionGate ||
      treasure ||
      control)
  ) {
    label += ` · ${message(language, 'story.clue', { count: number })}`
    if (index !== state.player) content += `<span class="story-clue-badge">${number}</span>`
  }

  const name = `${Math.floor(index / board.game.config.width) + 1}, ${(index % board.game.config.width) + 1}: ${label}`

  return `<button class="story-cell ${board.scene.bridge?.includes(index) ? 'story-bridge-plank' : ''} ${covered ? 'is-covered' : 'is-open'} ${flagged ? 'is-flagged' : ''} ${triggered ? 'is-triggered' : ''} ${lit ? 'is-teaching' : ''} ${scoped ? 'is-scope' : ''} ${site || exit || entrance || quarryGate || ridgeGate || waterwayGate || portal || bastionGate ? 'is-site' : ''}" ${control ? `data-story-mechanism="${index}" data-operated="${!!run?.operated.includes(index)}"` : ''} data-number="${number}" data-cell="${index}" data-story-cell="${index}" ${site ? `data-story-facility="${site.destination}"` : ''} tabindex="${index === state.player ? 0 : -1}" aria-label="${escapeHtml(name)}" ${run?.phase === 'fallen' ? 'disabled' : ''}>${content}${site || exit || entrance || quarryGate || ridgeGate || waterwayGate || portal || bastionGate ? `<span class="story-site-label">${label}</span>` : ''}</button>`
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

  return `<footer class="story-dock"><div class="story-dock-inner">${run ? `<div class="story-modes" role="group" aria-label="${message(language, 'story.explore')}"><button data-story-action="explore" aria-pressed="${!state.flagMode}">${icon('pointer')}${message(language, 'story.explore')}</button><button data-story-action="flag" aria-pressed="${state.flagMode}">${icon('flag')}${message(language, 'story.flag')}</button></div>${campaignEntries(state)}${run.phase === 'fallen' ? `<button class="story-primary" data-story-action="retry">${message(language, 'story.retry')}</button>` : ''}` : ''}<button data-story-action="map" class="${state.progress.mapOwned ? '' : 'is-unavailable'}">${icon('globe')}${message(language, 'story.map')}${state.progress.mapOwned ? '' : ' · —'}</button><div class="story-resources"><span class="story-vitals"><span>${message(language, 'story.health')}</span><strong class="story-hearts" role="img" aria-label="${message(language, 'story.health')}: ${run?.health ?? 3} / 3">${'♥'.repeat(run?.health ?? 3)}${'♡'.repeat(3 - (run?.health ?? 3))}</strong></span><span class="story-wallet" aria-label="${variantCopy(language).supplies}">${spriteImage('treasure')}<span>${variantCopy(language).supplies}<strong>${new Intl.NumberFormat(language).format(state.camp.supplies)}</strong></span></span></div></div></footer>`
}

/** Camp services reuse the existing purchasing and loadout templates instead of duplicating them. */
export function storyTemplate(state: StoryViewState): string {
  const { language, run } = state
  const t = translations[language]
  const notice =
    state.feedback === 'cargo'
      ? message(language, 'story.haul-load')
      : state.feedback === 'route'
        ? message(language, 'story.route')
        : state.feedback === 'lesson'
          ? message(language, 'story.lesson')
          : state.inspected !== null
            ? message(language, 'story.inspect')
            : ''
  const reed = state.board.scene.id === 'reed-camp'
  const recollection = !!state.progress.facts?.includes('recollection-awakened')
  const hero = `${import.meta.env.BASE_URL}assets/story/${reed ? 'reed-camp-banner' : 'camp-banner'}.png`

  return `<header class="site-header"><div class="header-identity">${brandTemplate(language)}<a class="route-back" data-route href="${routeHref({ page: 'home' }, language)}">${icon('arrow')}<span>${message(language, 'home.back')}</span></a></div><nav>${recollection ? '' : `<a class="story-temporary" data-route href="${routeHref({ page: 'game', mode: 'expedition' }, language)}">${message(language, 'story.temporary')}</a>`}<button class="icon-button" data-story-action="sound" aria-label="${state.sound ? t.soundOn : t.soundOff}" aria-pressed="${state.sound}">${icon(state.sound ? 'volume' : 'volumeOff')}</button>${languageMenuTemplate(language)}</nav></header>
  <main class="story-main" data-story-scene="${state.board.scene.id}">
    ${!state.storageAvailable ? `<p role="alert">${message(language, 'story.storage')}</p>` : ''}
    <section class="story-banner glass-panel" style="--story-hero:url('${hero}')"><div><p class="eyebrow">${reed ? message(language, 'recollection.chapter') : run ? (run.floor < 3 ? message(language, 'story.prologue') : message(language, 'story.world-road')) : 'MINEFARER / CAMP'}</p><h1 data-route-heading>${sceneName(state)}</h1><p>${run ? (run.floor < 3 ? `${run.floor + 1} / 3` : message(language, 'story.atlas-woodland')) : `${new Intl.NumberFormat(language).format(state.camp.supplies)} ${variantCopy(language).supplies}`}</p></div></section>
    ${state.service ? `<div class="story-service">${state.service.page === 'professions' ? titleTemplate(language, state.camp) : ''}${campTemplate(language, state.camp, state.loadout.profession, state.loadout.equipment, 'standard', state.service)}</div>` : `<div class="story-layout"><section class="story-stage glass-panel">${sceneBoard(state)}${notice ? `<p class="story-notice" role="status">${notice}</p>` : ''}</section><aside class="story-sidebar glass-panel">${pinnedStoryTasks(state)}${run ? '' : `<div class="story-loadout">${spriteImage(professionSprite(state.loadout.profession))}<h2>${professionCopy(language, state.loadout.profession).name}</h2>${titleTemplate(language, state.camp)}<p>${state.loadout.equipment.map((id) => equipmentCopy(language, id).name).join(' · ') || campLabel(language, 'empty')}</p></div>`}</aside></div>`}
  </main><a hidden data-route data-recollection-route href="${routeHref({ page: 'recollection' }, language)}"></a>${storyDialogueTemplate(state)}${storyQuestPanel(state)}${state.service ? '' : sceneDock(state)}`
}

/** Show authored stages at their physical doorway; completed stages retain their own history. */
function campaignEntries(state: StoryViewState): string {
  const { run, language } = state
  if (!run) return ''

  const available = CAMPAIGN_STAGES.filter((stage) => {
    const entrance = stage.entrance
    return (
      state.progress.completed.includes(stage.entryTask) &&
      entrance.scene === run.board.scene.id &&
      run.player === (entrance.index ?? run.board.exit) &&
      (!entrance.fact || state.progress.facts?.includes(entrance.fact)) &&
      (entrance.index !== null || state.progress.dialogue?.completed.includes('tower-arrival')) &&
      !campaignProgress(state.campaign, stage.id).cleared &&
      (!stage.prerequisite || campaignProgress(state.campaign, stage.prerequisite).cleared)
    )
  })

  return `<div class="signal-stage-links">${available.map((stage) => `<a data-route data-story-campaign class="story-primary" href="${routeHref({ page: 'campaign', stage: stage.id }, language)}">${campaignName(language, stage.id)} →</a>`).join('')}</div>`
}
