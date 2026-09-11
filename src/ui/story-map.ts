import { message } from '../i18n.js'
import { icon } from '../icons.js'
import { storyAtlasIndex, STORY_ATLAS_SCENES } from '../game/story-atlas.js'
import { atlasLocal } from './atlas-local.js'
import { atlasChart } from './atlas-chart.js'
import { worldSceneName } from './world-copy.js'
import { escapeHtml } from './presentation.js'
import type { StoryViewState } from '../types/story.js'

/** Explain the latest permanent world change without mutating route or quest progress. */
function worldOutcome(state: StoryViewState): string {
  const { language, progress } = state
  if (progress.facts?.includes('chapter-one-cleared'))
    return `<p data-chapter-location>${message(language, 'finale.ending-location')}</p>`

  if (progress.facts?.includes('west-line-restored'))
    return `<p data-west-location>${message(language, 'finale.location')}</p>`

  if (progress.facts?.includes('beacon-recovered'))
    return `<p data-waterway-location>${message(language, 'waterway.location')}</p>`

  if (progress.facts?.includes('ridge-surveyed'))
    return `<p data-ridge-location>${message(language, 'ridge.location')}</p>`

  return ''
}

/** Compose the map shell; local boards, geographic tiles and camera input have separate owners. */
export function storyMap(state: StoryViewState): string {
  const lang = state.language
  const level = state.mapLevel ?? 'local'
  const current = storyAtlasIndex(state.run?.board.scene.id ?? 'camp')
  const scene = state.mapScene ?? current
  const world = message(lang, 'story.atlas-world')
  const region = message(lang, 'story.atlas-region')
  const local = message(lang, 'story.atlas-local')
  const regionName = message(lang, 'story.atlas-woodland')
  const name = worldSceneName(lang, STORY_ATLAS_SCENES[scene]?.id ?? 'camp')
  const title = level === 'world' ? world : level === 'region' ? regionName : name
  const scale = `<button class="atlas-scale" data-story-action="map-level" data-level="${level === 'local' ? 'region' : level === 'region' ? 'world' : 'local'}">${icon('globe')}<span>${level === 'local' ? local : level === 'region' ? region : world}</span><span aria-hidden="true">↻</span></button>`
  const back =
    level === 'world'
      ? ''
      : `<button class="atlas-back" data-story-action="map-level" data-level="${level === 'local' ? 'region' : 'world'}">← ${level === 'local' ? regionName : world}</button>`
  const position = message(lang, 'story.atlas-here')
  const map =
    level === 'local'
      ? atlasLocal(state, scene, current)
      : { drawing: atlasChart(state, level), landmarks: '' }
  const legendLabel = message(lang, 'story.atlas-legend')
  const legend = `<div class="atlas-legend-control"><button class="atlas-legend-toggle" data-story-action="map-legend" aria-label="${legendLabel}" title="${legendLabel}" aria-expanded="${!!state.mapLegend}" aria-controls="story-map-legend">${icon('layers')}</button>${state.mapLegend ? `<div class="atlas-legend" id="story-map-legend"><span><i class="atlas-position"></i>${position}: ${worldSceneName(lang, STORY_ATLAS_SCENES[current]?.id ?? 'camp')}</span><span><i class="atlas-route-key"></i>${message(lang, 'story.atlas-route')}</span>${map.landmarks ? `<ul class="atlas-landmarks">${map.landmarks}</ul>` : ''}</div>` : ''}</div>`
  const zoom = `<div class="atlas-zoom"><button data-map-zoom="out" aria-label="${message(lang, 'story.atlas-zoom-out')}">−</button><input type="range" min="100" max="${level === 'world' ? 800 : 400}" step="5" value="100" aria-label="${message(lang, 'story.atlas-zoom')}"><button data-map-zoom="in" aria-label="${message(lang, 'story.atlas-zoom-in')}">+</button><output class="atlas-zoom-value">100%</output><button data-map-zoom="reset">${message(lang, 'story.atlas-fit')}</button>${legend}</div>`

  return `<div class="story-map" data-map-level="${level}" data-map-scene="${scene}"><div class="atlas-toolbar">${back}${scale}</div><div class="atlas-heading"><h3>${escapeHtml(title)}</h3>${worldOutcome(state)}</div><div class="atlas-canvas"><div class="atlas-viewport" tabindex="0" role="group" aria-label="${escapeHtml(title)}" data-enter-label="${message(lang, 'story.atlas-enter')}"><div class="atlas-scene">${map.drawing}</div></div></div>${zoom}</div>`
}
