import { ATLAS_PLACES } from '../game/atlas-catalog.js'
import { storyAtlasIndex, storyAtlasUnlocked } from '../game/story-atlas.js'
import { message } from '../i18n.js'
import { atlasRouteLayer } from './atlas-route-layer.js'
import { spriteImage } from './dungeon-sprites.js'
import { escapeHtml } from './presentation.js'
import { worldSceneName } from './world-copy.js'
import type { AtlasDistrict, AtlasPlace } from '../types/atlas.js'
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
function placeMarkers(state: StoryViewState): string {
  const current = state.board.scene.id
  return ATLAS_PLACES.map((place) => {
    const index = storyAtlasIndex(place.scene)
    const open = storyAtlasUnlocked(state.progress, state.run, index)
    const name = open
      ? worldSceneName(state.language, place.scene)
      : message(state.language, 'story.map-unvisited')

    return `<button class="atlas-node ${place.scene === current ? 'is-current' : ''}" data-map-name="${escapeHtml(name)}" style="--x:${place.x}%;--y:${place.y}%" data-story-action="${place.scene === 'reed-camp' ? 'map-region' : 'map-scene'}" data-scene="${index}" ${open ? '' : 'disabled'}>${placeImage(place)}<strong>${escapeHtml(name)}</strong>${place.scene === current ? `<span>${message(state.language, 'story.atlas-here')}</span>` : ''}</button>`
  }).join('')
}

/** A district click zooms to its member locations; it never moves the player or opens a save. */
function districtMarkers(state: StoryViewState): string {
  const districts: readonly AtlasDistrict[] = ['woodland', 'camp', 'quarry', 'west']
  return districts
    .map((district) => {
      const places = ATLAS_PLACES.filter((place) => place.district === district)
      const known = places.filter((place) =>
        storyAtlasUnlocked(state.progress, state.run, storyAtlasIndex(place.scene)),
      )
      const discovered = known.length > 0
      // Keep the first known destination centered instead of pulling it toward unseen places.
      const focusPlaces = discovered ? known : places
      const center = {
        x: focusPlaces.reduce((sum, place) => sum + place.x, 0) / focusPlaces.length,
        y: focusPlaces.reduce((sum, place) => sum + place.y, 0) / focusPlaces.length,
      }
      const name = discovered
        ? districtName(state.language, district)
        : message(state.language, 'story.map-unvisited')

      return `<button class="atlas-node atlas-district-node" style="--x:${center.x}%;--y:${center.y}%" data-map-focus="${district}" data-map-x="${center.x}" data-map-y="${center.y}" data-map-target-zoom="2.5" ${discovered ? '' : 'disabled'}>${placeImage(places[0]!)}<strong>${name}</strong></button>`
    })
    .join('')
}

/** Terrain tiles and semantic marker layers share the same camera and coordinate system. */
export function atlasChart(state: StoryViewState): string {
  const region = message(state.language, 'story.atlas-woodland')

  return `<div class="atlas-chart atlas-chart-world"><div class="atlas-tile-layer" aria-hidden="true"></div>${atlasRouteLayer(state)}<div class="atlas-marker-layer" data-atlas-detail="districts"><span class="atlas-world-label">${region}</span>${districtMarkers(state)}</div><div class="atlas-marker-layer" data-atlas-detail="places">${placeMarkers(state)}</div><span class="atlas-compass" aria-hidden="true">N<br>✧</span></div>`
}
