import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  atlasDetail,
  ATLAS_ZOOM,
  clampAtlasCamera,
  visibleAtlasTiles,
  zoomAtlas,
} from '../src/ui/atlas-camera.js'
import { ATLAS_REGIONS, atlasRegionForScene } from '../src/game/atlas-regions.js'
import { ATLAS_PLACES, ATLAS_ROUTES } from '../src/game/atlas-catalog.js'
import { atlasDestination } from '../src/game/atlas-connections.js'
import { atlasRouteState } from '../src/game/atlas-routes.js'
import { createStoryRun } from '../src/game/story.js'
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
  const next = zoomAtlas(camera, 3, anchor, size)
  assert.equal((anchor.x - camera.x) / camera.zoom, (anchor.x - next.x) / next.zoom)
  assert.equal((anchor.y - camera.y) / camera.zoom, (anchor.y - next.y) / next.zoom)
  assert.deepEqual(clampAtlasCamera({ zoom: 2, x: 9999, y: -9999 }, size), {
    zoom: 2,
    x: 400,
    y: -230,
  })
  assert.equal(zoomAtlas(camera, 99, anchor, size).zoom, ATLAS_ZOOM.max)
  assert.deepEqual(zoomAtlas(camera, -5, anchor, size), { zoom: ATLAS_ZOOM.min, x: 0, y: 0 })
})

test('visible tile addresses cover the screen without mounting the complete high-resolution map', () => {
  for (const width of [320, 1440, 3840])
    for (const zoom of [1, 1.7, 2, 3.5, 4, 5]) {
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

test('regional detail changes independently of the world overview', () => {
  assert.deepEqual(
    ATLAS_PLACES.map((place) => place.scene).sort(),
    STORY_ATLAS_SCENES.map((scene) => scene.id).sort(),
  )
  assert.equal(new Set(ATLAS_PLACES.map((place) => place.scene)).size, ATLAS_PLACES.length)
  assert.equal(atlasDetail('local', 1), 'places')
  assert.equal(atlasDetail('region', 1), 'districts')
  assert.equal(atlasDetail('region', 1.7), 'places')
  assert.equal(atlasDetail('region', 5), 'places')
  for (const place of ATLAS_PLACES) {
    assert.ok(place.x > 0 && place.x < 100)
    assert.ok(place.y > 0 && place.y < 100)
  }
})

test('every world location connects through a real doorway and the haul track stays one-way', () => {
  const repaired: StoryProgress = {
    ...progress,
    facts: ['west-line-restored', 'west-shortcut', 'chapter-one-cleared'],
  }
  const reached = new Set(['awakening'])
  for (const route of ATLAS_ROUTES) {
    const from = STORY_ATLAS_SCENES.find((scene) => scene.id === route.from)!
    const to = STORY_ATLAS_SCENES.find((scene) => scene.id === route.to)!
    assert.ok(from && to)
    assert.ok(
      [...from.rows.join('')].some(
        (_, index) => atlasDestination(from, index, repaired) === storyAtlasIndex(route.to),
      ),
      `${route.from} must have an actual exit to ${route.to}`,
    )
    if (route.oneWay)
      assert.ok(
        [...to.rows.join('')].every(
          (_, index) => atlasDestination(to, index, repaired) !== storyAtlasIndex(route.from),
        ),
      )
  }

  for (let pass = 0; pass < ATLAS_PLACES.length; pass++)
    for (const route of ATLAS_ROUTES) {
      if (reached.has(route.from)) reached.add(route.to)
      if (!route.oneWay && reached.has(route.to)) reached.add(route.from)
    }
  assert.deepEqual([...reached].sort(), ATLAS_PLACES.map((place) => place.scene).sort())
})

test('world roads distinguish discovery, repair, dialogue and the operated return shortcut', () => {
  const road = ATLAS_ROUTES.find((route) => route.access === 'lift')!
  assert.equal(atlasRouteState(road, progress, null), 'uncharted')
  const discovered: StoryProgress = {
    ...progress,
    completed: ['reach-camp', 'meet-guide', 'survey-road'],
  }
  assert.equal(atlasRouteState(road, discovered, null), 'closed')
  const repaired: StoryProgress = { ...discovered, facts: ['spindle-secured', 'lift-restored'] }
  assert.equal(atlasRouteState(road, repaired, null), 'closed')
  assert.equal(
    atlasRouteState(
      road,
      { ...repaired, dialogue: { completed: ['lift-repaired'], active: null } },
      null,
    ),
    'open',
  )

  const quarry = ATLAS_ROUTES.find((route) => route.access === 'quarry')!
  assert.equal(atlasRouteState(quarry, discovered, null), 'closed')
  assert.equal(atlasRouteState(quarry, { ...discovered, accepted: ['repair-lift'] }, null), 'open')

  const haul = ATLAS_ROUTES.find((route) => route.oneWay)!
  const run = { ...createStoryRun(6), collected: true }
  assert.equal(atlasRouteState(haul, discovered, run), 'closed')
  assert.equal(atlasRouteState(haul, discovered, { ...run, operated: [1] }), 'open')
  assert.deepEqual(progress.completed, ['reach-camp'])
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

test('world footprints stay separate from local coordinates and leave room for later arcs', () => {
  assert.equal(atlasRegionForScene('camp'), 'woodland')
  assert.equal(atlasRegionForScene('reed-camp'), 'reedbank')
  assert.equal(atlasDetail('world', 1), 'places')
  assert.equal(atlasDetail('world', 5), 'places')
  for (const region of ATLAS_REGIONS) {
    assert.equal(atlasRegionForScene(region.entrance), region.id)
    assert.ok(region.width * region.height < 500)
    assert.ok(region.x - region.width / 2 >= 0 && region.x + region.width / 2 <= 100)
    assert.ok(region.y - region.height / 2 >= 0 && region.y + region.height / 2 <= 100)
  }
  const [woodland, river] = ATLAS_REGIONS
  assert.ok(woodland && river)
  assert.ok(river.x + river.width / 2 <= woodland.x - woodland.width / 2)
})
