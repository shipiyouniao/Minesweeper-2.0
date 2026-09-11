import { ATLAS_PLACES, WOODLAND_REGION } from '../game/atlas-catalog.js'
import { storyAtlasIndex, storyAtlasUnlocked } from '../game/story-atlas.js'
import { message } from '../i18n.js'
import { atlasPosition } from './atlas-camera.js'
import { spriteImage } from './dungeon-sprites.js'
import { escapeHtml } from './presentation.js'
import { worldSceneName } from './world-copy.js'
import type { AtlasDistrict, AtlasLevel, AtlasPlace } from '../types/atlas.js'
import type { Language } from '../types/localization.js'
import type { StoryViewState } from '../types/story.js'

/** District labels describe geography rather than revealing an undiscovered stage. */
function districtName(language: Language, district: AtlasDistrict): string {
  switch (district) {
    case 'woodland':
      return message(language, 'story.atlas-district-trail')
    case 'camp':
      return message(language, 'story.atlas-district-camp')
    case 'quarry':
      return message(language, 'story.atlas-district-quarry')
    case 'west':
      return message(language, 'story.atlas-district-west')
  }
}

/** Reuse the live scene's landmark art instead of drawing a second visual vocabulary. */
function placeImage(place: AtlasPlace): string {
  if (place.picture === 'workshop' || place.picture === 'treasure')
    return spriteImage(place.picture)
  return `<img src="${import.meta.env.BASE_URL}assets/story/${place.picture}.png" alt="" draggable="false">`
}

/** Fine detail contains actionable locations, with locked names replaced at the data boundary. */
function placeMarkers(state: StoryViewState, level: AtlasLevel): string {
  const current = state.run?.board.scene.id ?? 'camp'
  return ATLAS_PLACES.map((place) => {
    const index = storyAtlasIndex(place.scene)
    const open = storyAtlasUnlocked(state.progress, state.run, index)
    const name = open
      ? worldSceneName(state.language, place.scene)
      : message(state.language, 'story.map-unvisited')
    const point = atlasPosition(place, level, WOODLAND_REGION)

    return `<button class="atlas-node ${place.scene === current ? 'is-current' : ''}" data-map-name="${escapeHtml(name)}" style="--x:${point.x}%;--y:${point.y}%" data-story-action="map-scene" data-scene="${index}" ${open ? '' : 'disabled'}>${placeImage(place)}<strong>${escapeHtml(name)}</strong>${place.scene === current ? `<span>${message(state.language, 'story.atlas-here')}</span>` : ''}</button>`
  }).join('')
}

/** A district click zooms to its member locations; it never moves the player or opens a save. */
function districtMarkers(state: StoryViewState, level: AtlasLevel): string {
  const districts: readonly AtlasDistrict[] = ['woodland', 'camp', 'quarry', 'west']
  return districts
    .map((district) => {
      const places = ATLAS_PLACES.filter((place) => place.district === district)
      const discovered = places.some((place) =>
        storyAtlasUnlocked(state.progress, state.run, storyAtlasIndex(place.scene)),
      )
      const center = atlasPosition(
        {
          x: places.reduce((sum, place) => sum + place.x, 0) / places.length,
          y: places.reduce((sum, place) => sum + place.y, 0) / places.length,
        },
        level,
        WOODLAND_REGION,
      )
      const name = discovered
        ? districtName(state.language, district)
        : message(state.language, 'story.map-unvisited')

      return `<button class="atlas-node atlas-district-node" style="--x:${center.x}%;--y:${center.y}%" data-map-focus="${district}" data-map-x="${center.x}" data-map-y="${center.y}" data-map-target-zoom="${level === 'world' ? 4.5 : 2}" ${discovered ? '' : 'disabled'}>${placeImage(places[0]!)}<strong>${name}</strong></button>`
    })
    .join('')
}

/** Terrain tiles and semantic marker layers share the same camera and coordinate system. */
export function atlasChart(state: StoryViewState, level: AtlasLevel): string {
  const region = message(state.language, 'story.atlas-woodland')
  const overview =
    level === 'world'
      ? `<div class="atlas-marker-layer" data-atlas-detail="regions"><button class="atlas-node atlas-region-node" style="--x:28%;--y:57%" data-map-focus="woodland" data-map-x="28" data-map-y="57" data-map-target-zoom="2.5">${spriteImage('workshop')}<strong>${region}</strong></button><span class="atlas-unknown" style="left:73%;top:32%">${message(state.language, 'story.map-unvisited')}</span></div>`
      : ''

  return `<div class="atlas-chart atlas-chart-${level}" data-powered="${!!state.progress.facts?.includes('west-line-restored')}"><div class="atlas-tile-layer" aria-hidden="true"></div>${overview}<div class="atlas-marker-layer" data-atlas-detail="districts">${districtMarkers(state, level)}</div><div class="atlas-marker-layer" data-atlas-detail="places">${placeMarkers(state, level)}</div><span class="atlas-compass" aria-hidden="true">N<br>✧</span></div>`
}
