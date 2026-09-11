import { message } from '../i18n.js'
import { icon } from '../icons.js'
import { storyAtlasIndex, STORY_ATLAS_SCENES } from '../game/story-atlas.js'
import { atlasLocal } from './atlas-local.js'
import { atlasChart } from './atlas-chart.js'
import { ATLAS_ZOOM } from './atlas-camera.js'
import { worldSceneName } from './world-copy.js'
import { escapeHtml } from './presentation.js'
import type { StoryViewState } from '../types/story.js'

/** Compose the map shell; local boards, geographic tiles and camera input have separate owners. */
export function storyMap(state: StoryViewState): string {
  const lang = state.language
  const level = state.mapLevel ?? 'local'
  const current = storyAtlasIndex(state.board.scene.id)
  const scene = state.mapScene ?? current
  const world = message(lang, 'story.atlas-world')
  const local = message(lang, 'story.atlas-local')
  const name = worldSceneName(lang, STORY_ATLAS_SCENES[scene]?.id ?? 'camp')
  const title = level === 'world' ? world : name
  const navigation = `<button class="atlas-level" data-story-action="map-level" data-level="world" aria-pressed="${level === 'world'}">${icon('globe')}${world}</button><button class="atlas-level" data-story-action="map-level" data-level="local" aria-pressed="${level === 'local'}">${local}</button>`
  const position = message(lang, 'story.atlas-here')
  const map =
    level === 'local'
      ? atlasLocal(state, scene, current)
      : { drawing: atlasChart(state), landmarks: '' }
  const legendLabel = message(lang, 'story.atlas-legend')
  const routeLegend =
    level === 'world'
      ? `<span><i class="atlas-route-key is-closed"></i>${message(lang, 'story.atlas-route-closed')}</span><span><i class="atlas-route-key is-uncharted"></i>${message(lang, 'story.map-unvisited')}</span><span><i class="atlas-route-arrow" aria-hidden="true">→</i>${message(lang, 'story.atlas-route-one-way')}</span>`
      : ''
  const legend = `<div class="atlas-legend-control"><button class="atlas-legend-toggle" data-story-action="map-legend" aria-label="${legendLabel}" title="${legendLabel}" aria-expanded="${!!state.mapLegend}" aria-controls="story-map-legend">${icon('layers')}</button>${state.mapLegend ? `<div class="atlas-legend" id="story-map-legend"><span><i class="atlas-position"></i>${position}: ${worldSceneName(lang, STORY_ATLAS_SCENES[current]?.id ?? 'camp')}</span><span><i class="atlas-route-key"></i>${message(lang, 'story.atlas-route')}</span>${routeLegend}${map.landmarks ? `<ul class="atlas-landmarks">${map.landmarks}</ul>` : ''}</div>` : ''}</div>`
  const zoom = `<div class="atlas-zoom"><button data-map-zoom="out" aria-label="${message(lang, 'story.atlas-zoom-out')}">−</button><input type="range" min="${ATLAS_ZOOM.min * 100}" max="${ATLAS_ZOOM.max * 100}" step="${ATLAS_ZOOM.step * 100}" value="100" aria-label="${message(lang, 'story.atlas-zoom')}"><button data-map-zoom="in" aria-label="${message(lang, 'story.atlas-zoom-in')}">+</button><output class="atlas-zoom-value">100%</output><button data-map-zoom="reset">${message(lang, 'story.atlas-fit')}</button>${legend}</div>`

  return `<div class="story-map" data-map-level="${level}" data-map-scene="${scene}"><div class="atlas-toolbar">${navigation}</div><div class="atlas-heading"><h3>${escapeHtml(title)}</h3></div><div class="atlas-canvas"><div class="atlas-viewport" tabindex="0" role="group" aria-label="${escapeHtml(title)}" data-enter-label="${message(lang, 'story.atlas-enter')}"><div class="atlas-scene">${map.drawing}</div></div></div>${zoom}</div>`
}
