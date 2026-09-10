import {
  CAMP_SCENE,
  CAMP_SITES,
  PROLOGUE_SCENES,
  NORTH_ROAD_SCENE,
  QUARRY_SCENES,
  TOWER_LANDING_SCENE,
  QUARRY_GATE,
} from '../game/story-content.js'
import { message } from '../i18n.js'
import { icon } from '../icons.js'
import type { CampSite, StoryViewState } from '../types/story.js'
import { campPageName } from './camp-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { escapeHtml } from './presentation.js'

/** Keep the map's facility pictures identical to the live camp landmarks. */
function landmarkImage(site: CampSite): string {
  return site.destination === 'guide'
    ? `<img src="${import.meta.env.BASE_URL}assets/story/guide.png" alt="" draggable="false">`
    : spriteImage(site.sprite)
}

/** Draw geographic context without consulting hidden hazards or changing the live scene. */
export function storyMap(state: StoryViewState): string {
  const lang = state.language
  const level = state.mapLevel ?? 'local'
  const current = state.run ? state.run.floor + (state.run.floor >= 3 ? 1 : 0) : 3
  const scene = state.mapScene ?? current
  const names = [
    message(lang, 'story.awakening'),
    message(lang, 'story.trail'),
    message(lang, 'story.approach'),
    message(lang, 'story.camp'),
    message(lang, 'story.north-road'),
    message(lang, 'story.quarry-yard'),
    message(lang, 'story.quarry-passage'),
    message(lang, 'story.quarry-machine'),
    message(lang, 'story.tower-landing'),
  ]
  const world = message(lang, 'story.atlas-world')
  const region = message(lang, 'story.atlas-region')
  const local = message(lang, 'story.atlas-local')
  const regionName = message(lang, 'story.atlas-woodland')
  const title = level === 'world' ? world : level === 'region' ? regionName : names[scene]!
  const scale = `<button class="atlas-scale" data-story-action="map-level" data-level="${level === 'local' ? 'region' : level === 'region' ? 'world' : 'local'}">${icon('globe')}<span>${level === 'local' ? local : level === 'region' ? region : world}</span><span aria-hidden="true">↻</span></button>`
  const back =
    level === 'world'
      ? ''
      : `<button class="atlas-back" data-story-action="map-level" data-level="${level === 'local' ? 'region' : 'world'}">← ${level === 'local' ? regionName : world}</button>`
  const position = message(lang, 'story.atlas-here')
  const explored = Math.max(
    state.progress.completed.includes('survey-road')
      ? 8
      : state.progress.facts?.includes('lift-discovered')
        ? 5
        : state.progress.arrived
          ? 3
          : 0,
    current,
    ...(state.progress.world?.scenes ?? []).map((entry) =>
      entry.id === 'north-road' ? 4 : PROLOGUE_SCENES.findIndex((scene) => scene.id === entry.id),
    ),
  )
  let drawing: string
  let landmarks = ''
  if (level === 'local') {
    const content = [
      ...PROLOGUE_SCENES,
      CAMP_SCENE,
      NORTH_ROAD_SCENE,
      ...QUARRY_SCENES,
      TOWER_LANDING_SCENE,
    ][scene]
    if (!content) {
      const backScene = scene === 5 ? 4 : 3
      drawing = `<div class="atlas-uncharted"><span>${icon('globe')}</span><p>${message(lang, 'story.atlas-uncharted')}</p><button class="atlas-back" data-map-name="${escapeHtml(names[backScene]!)}" data-story-action="map-scene" data-scene="${backScene}">← ${names[backScene]}</button></div>`
    } else {
      const cells = content.rows
        .join('')
        .split('')
        .map((terrain, index) => {
          const site = scene === 3 ? CAMP_SITES.find((entry) => entry.index === index) : undefined
          const traveler = scene === current && index === state.player
          const entrance = terrain === 'S'
          const exit = terrain === 'E'
          const destination =
            scene === 4 && index === QUARRY_GATE
              ? 5
              : scene === 4 && exit
                ? 8
                : scene === 5 && entrance
                  ? 4
                  : scene === 8 && entrance
                    ? 4
                    : scene === 7 && exit
                      ? 4
                      : scene === 8 && exit
                        ? null
                        : site?.destination === 'road'
                          ? 4
                          : exit
                            ? scene === 3
                              ? 2
                              : scene + 1
                            : entrance && scene > 0 && scene !== 3
                              ? scene - 1
                              : null
          const hidden = scene === current && state.board.game.cells[index]?.visibility === 'hidden'
          const name =
            destination !== null
              ? names[destination]!
              : site
                ? site.destination === 'guide'
                  ? message(lang, 'story.guide')
                  : site.destination === 'road'
                    ? message(lang, 'story.road')
                    : campPageName(lang, site.destination)
                : traveler
                  ? position
                  : exit
                    ? message(lang, 'story.road')
                    : terrain === '#'
                      ? message(lang, 'story.atlas-tree')
                      : ''
          const marker = site
            ? landmarkImage(site)
            : destination !== null
              ? icon('arrow')
              : entrance
                ? '<span class="atlas-entry">○</span>'
                : ''
          const tag = destination !== null ? 'button' : 'div'
          return `<${tag} class="atlas-tile ${destination !== null ? 'atlas-connection' : ''} ${terrain === '#' ? 'atlas-tree' : 'atlas-path'} ${hidden ? 'atlas-fog' : ''}" ${destination !== null ? `data-story-action="map-scene" data-scene="${destination}"` : ''} ${name ? `data-map-name="${escapeHtml(name)}"` : ''} ${site || destination !== null || traveler ? `role="button" tabindex="0" aria-label="${escapeHtml(name)}"` : ''}>${terrain === '#' ? `<img src="${import.meta.env.BASE_URL}assets/story/tree.png" alt="" draggable="false">` : marker}${traveler ? `<span class="atlas-position" aria-label="${position}"></span>` : ''}${destination !== null ? `<span class="atlas-destination">${name}</span>` : ''}</${tag}>`
        })
        .join('')
      landmarks =
        scene === 3
          ? CAMP_SITES.map(
              (site) =>
                `<li>${landmarkImage(site)}<span>${site.destination === 'guide' ? message(lang, 'story.guide') : site.destination === 'road' ? names[4] : campPageName(lang, site.destination)}</span></li>`,
            ).join('')
          : ''
      drawing = `<div class="atlas-local-layout"><div class="atlas-local-grid" style="--map-columns:${content.rows[0]!.length}" role="group" aria-label="${title}">${cells}</div></div>`
    }
  } else {
    const terrain = level === 'world' ? worldTerrain() : regionTerrain()
    const nodes =
      level === 'world'
        ? `<button class="atlas-node atlas-region-node" data-map-name="${escapeHtml(regionName)}" style="--x:39%;--y:61%" data-story-action="map-level" data-level="region">${spriteImage('workshop')}<strong>${regionName}</strong><span>${message(lang, 'story.atlas-enter')}</span></button><span class="atlas-unknown" style="left:73%;top:32%">${message(lang, 'story.map-unvisited')}</span>`
        : [
            [17, 73],
            [38, 48],
            [61, 66],
            [65, 30],
            [81, 47],
            [90, 64],
            [75, 81],
            [53, 87],
            [88, 14],
          ]
            .map(
              ([x, y], i) =>
                `<button class="atlas-node ${i === current ? 'is-current' : ''}" data-map-name="${escapeHtml(i > explored ? message(lang, 'story.map-unvisited') : names[i]!)}" style="--x:${x}%;--y:${y}%" data-story-action="map-scene" data-scene="${i}" ${i > explored ? 'disabled' : ''}>${i === 3 ? spriteImage('workshop') : i === 1 ? spriteImage('treasure') : `<img src="${import.meta.env.BASE_URL}assets/story/${i === 0 ? 'tree' : 'lantern'}.png" alt="">`}<strong>${i > explored ? message(lang, 'story.map-unvisited') : names[i]}</strong>${i === current ? `<span>${position}</span>` : ''}</button>`,
            )
            .join('')
    drawing = `<div class="atlas-chart atlas-chart-${level}">${terrain}${nodes}<span class="atlas-compass" aria-hidden="true">N<br>✧</span></div>`
  }
  const legend = `<div class="atlas-legend-control"><button class="atlas-legend-toggle" data-story-action="map-legend" aria-expanded="${!!state.mapLegend}" aria-controls="story-map-legend">${message(lang, 'story.atlas-legend')} ${state.mapLegend ? '−' : '+'}</button>${state.mapLegend ? `<div class="atlas-legend" id="story-map-legend"><span><i class="atlas-position"></i>${position}: ${names[current]}</span><span><i class="atlas-route-key"></i>${message(lang, 'story.atlas-route')}</span>${landmarks ? `<ul class="atlas-landmarks">${landmarks}</ul>` : ''}</div>` : ''}</div>`
  const zoom = `<div class="atlas-zoom"><button data-map-zoom="out" aria-label="${message(lang, 'story.atlas-zoom-out')}">−</button><input type="range" min="100" max="400" step="5" value="100" aria-label="${message(lang, 'story.atlas-zoom')}"><button data-map-zoom="in" aria-label="${message(lang, 'story.atlas-zoom-in')}">+</button><output class="atlas-zoom-value">100%</output><button data-map-zoom="reset">${message(lang, 'story.atlas-fit')}</button></div>`
  return `<div class="story-map" data-map-level="${level}" data-map-scene="${scene}"><div class="atlas-toolbar">${back}${scale}</div><div class="atlas-heading"><h3>${title}</h3></div><div class="atlas-canvas"><div class="atlas-viewport" data-enter-label="${message(lang, 'story.atlas-enter')}"><div class="atlas-scene">${drawing}</div></div>${legend}</div>${zoom}</div>`
}

/** Coastline and distant, uncharted land give the known region a place in the world. */
function worldTerrain(): string {
  return `<svg class="atlas-terrain" viewBox="0 0 800 460" preserveAspectRatio="none" aria-hidden="true"><rect width="800" height="460" fill="#c3d8d5"/><path d="M-20 92 Q80 6 174 70 T335 26 Q405 56 393 133 Q474 178 419 226 Q435 300 368 335 L313 441 Q241 470 207 403 Q117 403 103 318 Q17 287 33 224Z" fill="#dce0bd" stroke="#829f8a" stroke-width="3"/><path d="M481-20 Q518 87 588 88 Q650 143 783 66 L830 0M513 151 Q466 208 557 260 Q622 326 724 273 Q815 293 836 170 L804 99 Q688 155 619 121Z" fill="#d3d9c6" stroke="#9bac9b" stroke-width="2"/><path d="M48 162 Q162 95 218 180 T327 150 L359 231 Q252 340 176 303 T77 253Z" fill="#7a9c79" opacity=".6"/><path d="M299 71 Q252 152 300 214 T306 347" fill="none" stroke="#88b7c0" stroke-width="13"/><g fill="#b0bba0" stroke="#829582" stroke-width="2"><path d="m102 111 34-64 35 64-32-19Z"/><path d="m149 134 40-73 37 73-37-25Z"/><path d="m326 112 27-49 32 49-32-12Z"/></g><path d="M39 361q44-20 81 6M475 349q78-23 158 3M501 365q55-13 112 2M642 415q58-19 115-2" fill="none" stroke="#97bcbf" stroke-width="3"/></svg>`
}

/** The four authored scenes form a connected route through woodland to the camp. */
function regionTerrain(): string {
  return `<svg class="atlas-terrain" viewBox="0 0 800 460" preserveAspectRatio="none" aria-hidden="true"><rect width="800" height="460" fill="#e3e4c9"/><path d="M0 28Q154 68 217 1L406 0Q398 109 290 175T0 270ZM0 396Q169 357 232 460H0ZM421 460Q455 377 589 392T800 303V460Z" fill="#b9cbaa"/><path d="M713-10Q540 97 562 181T729 352L770 470" fill="none" stroke="#9dbfc0" stroke-width="26"/><path d="M713-10Q540 97 562 181T729 352L770 470" fill="none" stroke="#cee0d8" stroke-width="10"/><path d="M136 336 Q219 327 304 221 T488 304 Q553 299 569 213 T640 129" fill="none" stroke="#f8f1d5" stroke-width="18"/><path d="M136 336 Q219 327 304 221 T488 304 Q553 299 569 213 T640 129" fill="none" stroke="#a08b60" stroke-width="3" stroke-dasharray="7 7"/><path d="m544 223 39 10m-36-18 38 10" stroke="#8a7256" stroke-width="6"/><g fill="#829b76" opacity=".65">${[
    [75, 80],
    [123, 124],
    [190, 95],
    [360, 75],
    [417, 103],
    [719, 350],
    [664, 393],
    [344, 371],
    [72, 420],
  ]
    .map(([x, y]) => `<path d="M${x! - 16} ${y}l16-40 16 40h-10l13 18h-38l13-18Z"/>`)
    .join('')}</g></svg>`
}
