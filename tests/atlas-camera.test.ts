import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  atlasDetail,
  atlasPosition,
  clampAtlasCamera,
  visibleAtlasTiles,
  zoomAtlas,
} from '../src/ui/atlas-camera.js'
import { ATLAS_PLACES, WOODLAND_REGION } from '../src/game/atlas-catalog.js'
import { atlasDestination } from '../src/game/atlas-connections.js'
import { STORY_ATLAS_SCENES, storyAtlasIndex, storyAtlasUnlocked } from '../src/game/story-atlas.js'
import { storyTaskLocation } from '../src/game/story-task-location.js'
import type { StoryProgress } from '../src/types/story.js'

const progress: StoryProgress = {
  arrived: true,
  completed: ['reach-camp'],
  claimed: ['reach-camp'],
  campPosition: 31,
  journal: null,
}

test('atlas zoom preserves the anchored point and bounds every chart edge', () => {
  const size = { width: 800, height: 460 },
    anchor = { x: 120, y: -40 }
  const camera = { zoom: 2, x: 25, y: -10 }
  const next = zoomAtlas(camera, 3, anchor, size, 'world')
  assert.equal((anchor.x - camera.x) / camera.zoom, (anchor.x - next.x) / next.zoom)
  assert.equal((anchor.y - camera.y) / camera.zoom, (anchor.y - next.y) / next.zoom)
  assert.deepEqual(clampAtlasCamera({ zoom: 2, x: 9999, y: -9999 }, size), {
    zoom: 2,
    x: 400,
    y: -230,
  })
  assert.equal(zoomAtlas(camera, 99, anchor, size, 'region').zoom, 4)
  assert.equal(zoomAtlas(camera, 99, anchor, size, 'world').zoom, 8)
  assert.deepEqual(zoomAtlas(camera, -5, anchor, size, 'local'), { zoom: 1, x: 0, y: 0 })
})

test('visible tile addresses cover the screen without mounting the complete high-resolution map', () => {
  for (const width of [320, 1440, 3840])
    for (const zoom of [1, 1.7, 2, 3.5, 4, 6, 8]) {
      const size = { width, height: 460 }
      for (const sign of [-1, 0, 1]) {
        const camera = clampAtlasCamera({ zoom, x: sign * width * 4, y: -sign * 460 * 4 }, size)
        const tiles = visibleAtlasTiles(camera, size)
        assert.ok(tiles.length >= 1 && tiles.length <= 9)
        assert.equal(new Set(tiles.map((tile) => tile.key)).size, tiles.length)
        for (const x of [1, width / 2, width - 1])
          for (const y of [1, 230, 459]) {
            const sourceX = (x - width / 2 - camera.x) / (width * zoom) + 0.5
            const sourceY = (y - 230 - camera.y) / (460 * zoom) + 0.5
            assert.ok(
              tiles.some(
                (tile) =>
                  sourceX >= tile.column / tile.divisions &&
                  sourceX <= (tile.column + 1) / tile.divisions &&
                  sourceY >= tile.row / tile.divisions &&
                  sourceY <= (tile.row + 1) / tile.divisions,
              ),
            )
          }
      }
    }
  assert.deepEqual(visibleAtlasTiles({ zoom: 2, x: 0, y: 0 }, { width: 0, height: 0 }), [])
})

test('semantic detail and region placement share a complete named place catalog', () => {
  assert.deepEqual(
    ATLAS_PLACES.map((place) => place.scene).sort(),
    STORY_ATLAS_SCENES.map((scene) => scene.id).sort(),
  )
  assert.equal(new Set(ATLAS_PLACES.map((place) => place.scene)).size, ATLAS_PLACES.length)
  assert.equal(atlasDetail('region', 1), 'districts')
  assert.equal(atlasDetail('region', 2), 'places')
  assert.equal(atlasDetail('world', 1), 'regions')
  assert.equal(atlasDetail('world', 2.5), 'districts')
  assert.equal(atlasDetail('world', 4), 'places')
  for (const place of ATLAS_PLACES) {
    assert.deepEqual(atlasPosition(place, 'region', WOODLAND_REGION), place)
    const point = atlasPosition(place, 'world', WOODLAND_REGION)
    assert.ok(point.x >= WOODLAND_REGION.x && point.x <= WOODLAND_REGION.x + WOODLAND_REGION.width)
    assert.ok(point.y >= WOODLAND_REGION.y && point.y <= WOODLAND_REGION.y + WOODLAND_REGION.height)
  }
})

test('atlas links and task pins preserve discovery and gameplay progress', () => {
  const before = structuredClone(progress)
  const road = STORY_ATLAS_SCENES.find((scene) => scene.id === 'north-road')!
  assert.equal(atlasDestination(road, 12, progress), null)
  const repaired = { ...progress, facts: ['west-line-restored'] as const }
  assert.equal(atlasDestination(road, 12, repaired), storyAtlasIndex('northwest-bridge'))
  assert.equal(storyAtlasUnlocked(progress, null, storyAtlasIndex('blockade-pass')), false)
  assert.equal(storyTaskLocation(progress, 'open-blockade'), 'northwest-bridge')
  assert.equal(
    storyTaskLocation({ ...repaired, facts: ['west-shortcut'] }, 'open-blockade'),
    'blockade-pass',
  )
  assert.equal(storyTaskLocation(progress, 'rescue-toma'), 'quarry-yard')
  assert.deepEqual(progress, before)
})
