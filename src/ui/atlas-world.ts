import { ATLAS_REGIONS } from '../game/atlas-regions.js'
import { storyAtlasIndex, storyAtlasUnlocked } from '../game/story-atlas.js'
import { message } from '../i18n.js'
import { worldSceneName } from './world-copy.js'
import { atlasTerrain } from './atlas-world-terrain.js'
import { escapeHtml } from './presentation.js'
import type { AtlasRegionId } from '../types/atlas.js'
import type { Language } from '../types/localization.js'
import type { StoryViewState } from '../types/story.js'

/** Regional names remain independent of individual scene titles. */
export function atlasRegionName(language: Language, region: AtlasRegionId): string {
  return region === 'woodland'
    ? message(language, 'story.atlas-woodland')
    : message(language, 'story.atlas-reedbank')
}

/** World regions occupy fixed footprints; only discovered geography breaks through the fog. */
export function atlasWorld(state: StoryViewState): string {
  const regions = ATLAS_REGIONS.filter((region) =>
    storyAtlasUnlocked(state.progress, state.run, storyAtlasIndex(region.entrance)),
  )
  const land = regions
    .map((region) => {
      const x = (region.x - region.width / 2) * 8
      const y = (region.y - region.height / 2) * 4.6
      const terrain =
        region.id === 'woodland'
          ? atlasTerrain({ key: 'world', column: 0, row: 0, divisions: 1 })
          : riverTerrain()
      return `<svg x="${x}" y="${y}" width="${region.width * 8}" height="${region.height * 4.6}" viewBox="0 0 800 460" preserveAspectRatio="none"><defs><radialGradient id="atlas-reveal-${region.id}"><stop offset=".68" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="atlas-mask-${region.id}"><rect width="800" height="460" fill="url(#atlas-reveal-${region.id})"/></mask></defs><g mask="url(#atlas-mask-${region.id})">${terrain}</g></svg>`
    })
    .join('')
  const markers = regions
    .map((region) => {
      const name = escapeHtml(atlasRegionName(state.language, region.id))
      return `<button class="atlas-node atlas-region-node" style="--x:${region.x}%;--y:${region.y}%" data-map-name="${name}" data-story-action="map-region" data-scene="${storyAtlasIndex(region.entrance)}"><img src="${import.meta.env.BASE_URL}assets/story/${region.id === 'woodland' ? 'tree' : 'lantern'}.png" alt="" draggable="false"><strong>${name}</strong></button>`
    })
    .join('')

  return `<div class="atlas-chart atlas-world-overview"><svg class="atlas-terrain" viewBox="0 0 800 460" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="atlas-fog"><stop stop-color="#dce3df"/><stop offset="1" stop-color="#adbcb9"/></radialGradient></defs><rect width="800" height="460" fill="url(#atlas-fog)"/><g fill="none" stroke="#91a7a0" stroke-width=".5" opacity=".35"><path d="M0 115H800M0 230H800M0 345H800M200 0V460M400 0V460M600 0V460"/><ellipse cx="400" cy="230" rx="290" ry="170"/><ellipse cx="400" cy="230" rx="360" ry="210"/></g>${land}</svg><span class="atlas-unknown-label">${message(state.language, 'story.atlas-unsurveyed')}</span><div class="atlas-marker-layer">${markers}</div><span class="atlas-compass" aria-hidden="true">N<br>✧</span></div>`
}

/** The new river region shows its real camp and return pass, leaving future chapter sites unnamed. */
export function atlasReedbank(state: StoryViewState): string {
  const destinations = [
    { scene: 'reed-camp' as const, x: 56, y: 53 },
    { scene: 'blockade-pass' as const, x: 85, y: 82 },
  ]
  const markers = destinations
    .map((place) => {
      const index = storyAtlasIndex(place.scene)
      const name = escapeHtml(
        place.scene === 'reed-camp'
          ? worldSceneName(state.language, place.scene)
          : atlasRegionName(state.language, 'woodland'),
      )
      const open = storyAtlasUnlocked(state.progress, state.run, index)
      return `<button class="atlas-node" style="--x:${place.x}%;--y:${place.y}%" data-map-name="${name}" data-story-action="${place.scene === 'reed-camp' ? 'map-scene' : 'map-region'}" data-scene="${index}" ${open ? '' : 'disabled'}><img src="${import.meta.env.BASE_URL}assets/story/lantern.png" alt="" draggable="false"><strong>${name}</strong></button>`
    })
    .join('')

  return `<div class="atlas-chart atlas-river-region">${riverTerrain()}<span class="atlas-unknown-label">${message(state.language, 'story.atlas-unsurveyed')}</span><div class="atlas-marker-layer">${markers}</div><span class="atlas-compass" aria-hidden="true">N<br>✧</span></div>`
}

/** Reuse the same river geography in the world overview and its detailed regional chart. */
function riverTerrain(): string {
  return `<svg class="atlas-terrain" viewBox="0 0 800 460" preserveAspectRatio="none" aria-hidden="true"><rect width="800" height="460" fill="#dce1cd"/><path d="M0 10Q290 160 380 40T800 110V0H0Z" fill="#c7d3c4"/><path d="M130-30Q570 170 290 280T450 510" fill="none" stroke="#9bbdbd" stroke-width="90"/><path d="M130-30Q570 170 290 280T450 510" fill="none" stroke="#c5d9d5" stroke-width="45"/><path d="M448 244Q580 310 680 377" fill="none" stroke="#849875" stroke-width="3" stroke-dasharray="8 5"/><path d="m440 235-80 0m0-9v18" stroke="#9f8563" stroke-width="6"/></svg>`
}
