import { regionalCamp, isRegionalCamp } from '../game/regional-camps.js'
import { campSiteImage, storySiteName } from './story-assets.js'
import { cartImage, tomaImage } from './rail-view.js'
import { RESCUE_GATE, TOMA_CAMP_CELL } from '../game/rail-story.js'
import { northwestPortals } from '../game/northwest-world.js'
import { atlasDestination } from '../game/atlas-connections.js'
import type { AtlasMarkup } from '../types/atlas.js'
import { worldSceneName } from './world-copy.js'
import { STORY_ATLAS_SCENES, storyAtlasIndex, storyAtlasUnlocked } from '../game/story-atlas.js'
import { message } from '../i18n.js'
import { OBSERVATORY_GATE } from '../game/observatory-layout.js'
import { WATERWAY_GATE } from '../game/waterway-layout.js'
import { observatoryImage, drainageImage } from './power-view.js'
import { icon } from '../icons.js'
import type { StoryViewState } from '../types/story.js'
import { escapeHtml } from './presentation.js'

/** Render a discovered local board with public landmarks; no hidden mine truth enters markup. */
export function atlasLocal(state: StoryViewState, scene: number, current: number): AtlasMarkup {
  const lang = state.language
  const names = STORY_ATLAS_SCENES.map((entry) => worldSceneName(lang, entry.id))
  const position = message(lang, 'story.atlas-here')
  const title = names[scene] ?? message(lang, 'story.atlas-uncharted')
  let drawing: string
  let landmarks = ''
  const content = STORY_ATLAS_SCENES[scene]
  if (!content || !storyAtlasUnlocked(state.progress, state.run, scene)) {
    const backScene = storyAtlasIndex(content?.id === 'quarry-yard' ? 'north-road' : 'camp')
    drawing = `<div class="atlas-uncharted"><span>${icon('globe')}</span><p>${message(lang, 'story.atlas-uncharted')}</p><button class="atlas-back" data-map-name="${escapeHtml(names[backScene]!)}" data-story-action="map-scene" data-scene="${backScene}">← ${names[backScene]}</button></div>`
  } else {
    const cells = content.rows
      .join('')
      .split('')
      .map((terrain, index) => {
        const portal = northwestPortals(content.id, state.progress).find(
          (entry) => entry.index === index,
        )
        const site = isRegionalCamp(content.id)
          ? regionalCamp(content.id).sites.find((entry) => entry.index === index)
          : undefined
        const ridge =
          content.id === 'north-road' &&
          index === OBSERVATORY_GATE &&
          state.progress.facts?.includes('ridge-route')
        const waterway =
          content.id === 'north-road' &&
          index === WATERWAY_GATE &&
          state.progress.facts?.includes('ridge-surveyed')
        const rescue = content.id === 'quarry-yard' && index === RESCUE_GATE
        const toma =
          content.id === 'camp' &&
          index === TOMA_CAMP_CELL &&
          state.progress.facts?.includes('toma-rescued')
        const traveler = scene === current && index === state.player
        const entrance = terrain === 'S'
        const exit = terrain === 'E'
        const destination = atlasDestination(content, index, state.progress)
        const hidden = scene === current && state.board.game.cells[index]?.visibility === 'hidden'
        const name = rescue
          ? message(lang, 'rail.title')
          : toma
            ? message(lang, 'rail.toma')
            : portal
              ? worldSceneName(lang, portal.destination)
              : waterway
                ? message(lang, 'waterway.title')
                : ridge
                  ? message(lang, 'ridge.title')
                  : destination !== null
                    ? names[destination]!
                    : site
                      ? storySiteName(lang, site)
                      : traveler
                        ? position
                        : exit
                          ? message(lang, 'story.road')
                          : terrain === '#'
                            ? message(lang, 'story.atlas-tree')
                            : ''
        const marker = rescue
          ? cartImage()
          : toma
            ? tomaImage()
            : waterway
              ? drainageImage()
              : ridge
                ? observatoryImage()
                : site
                  ? campSiteImage(site)
                  : destination !== null
                    ? icon('arrow')
                    : entrance
                      ? '<span class="atlas-entry">○</span>'
                      : ''
        const tag = destination !== null ? 'button' : 'div'

        return `<${tag} class="atlas-tile ${destination !== null ? 'atlas-connection' : ''} ${terrain === '#' ? 'atlas-tree' : 'atlas-path'} ${hidden ? 'atlas-fog' : ''}" ${destination !== null ? `data-story-action="map-scene" data-scene="${destination}"` : ''} ${name ? `data-map-name="${escapeHtml(name)}"` : ''} ${site || destination !== null || traveler || ridge || waterway || rescue || toma ? `role="button" tabindex="0" aria-label="${escapeHtml(name)}"` : ''}>${content.water?.includes(index) ? '<span class="atlas-river-tile"></span>' : terrain === '#' ? `<img src="${import.meta.env.BASE_URL}assets/story/tree.png" alt="" draggable="false">` : marker}${traveler ? `<span class="atlas-position" aria-label="${position}"></span>` : ''}${destination !== null ? `<span class="atlas-destination">${name}</span>` : ''}</${tag}>`
      })
      .join('')

    landmarks = isRegionalCamp(content.id)
      ? regionalCamp(content.id)
          .sites.map(
            (site) => `<li>${campSiteImage(site)}<span>${storySiteName(lang, site)}</span></li>`,
          )
          .join('')
      : ''
    drawing = `<div class="atlas-local-layout"><div class="atlas-local-grid" style="--map-columns:${content.rows[0]!.length}" role="group" aria-label="${title}">${cells}</div></div>`
  }

  return { drawing, landmarks }
}
