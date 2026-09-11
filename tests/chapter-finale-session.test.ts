import { regionalCamp, isRegionalCamp } from '../src/game/regional-camps.js'
import assert from 'node:assert/strict'
import test from 'node:test'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { StorySession } from '../src/application/story-session.js'
import { CampSession } from '../src/application/camp-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { campaignProgress } from '../src/game/campaign-catalog.js'
import { createStoryRun } from '../src/game/story.js'
import { checkpointStory } from '../src/game/story-checkpoint.js'
import { recordStoryFacts } from '../src/game/story-quests.js'
import { pendingFinaleScene } from '../src/game/chapter-finale.js'
import { NORTHWEST_PORTALS } from '../src/game/northwest-world.js'
import { STORY_SCENES } from '../src/game/story-content.js'
import { buildStoryBoard } from '../src/game/story.js'
import { storyEnvelopeStatus } from '../src/persistence/story-encoder.js'
import { storyAtlasIndex, storyAtlasUnlocked } from '../src/game/story-atlas.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'
import { readyFinale } from './finale-fixtures.js'
import { solveFinale } from './finale-helpers.js'

test('fifth and sixth stage departures require their physical doorway, completed predecessor and world outcome', () => {
  const repo = new VariantRepository(new MemoryStorage())
  const camp = readyFinale(repo)
  const fifth = new ExpeditionSession(repo.forCampaign('tower-control'), new FakeRuntime())
  const sixth = new ExpeditionSession(repo.forCampaign('northwest-bastion'), new FakeRuntime())
  const world = createStoryRun(7)
  camp.saveStory({ ...camp.story, world: checkpointStory({ ...world, player: 33 }) })
  assert.equal(fifth.start('explorer', []), false)
  camp.saveStory({ ...camp.story, world: checkpointStory({ ...world, player: 34 }) })
  assert.equal(fifth.start('explorer', []), true)
  assert.equal(sixth.start('explorer', []), false)
  assert.equal(new StorySession(camp).travelNorthwest(), false)
})

test('complete chapter settlements resume every intent and preserve shared camp and other attempts', () => {
  const repo = new VariantRepository(new MemoryStorage())
  const camp = readyFinale(repo)
  const before = repo.expedition()!
  for (const id of ['tower-control', 'northwest-bastion'] as const) {
    if (id === 'northwest-bastion') {
      const world = createStoryRun(9)
      camp.saveStory(
        recordStoryFacts({ ...camp.story, world: checkpointStory({ ...world, player: 16 }) }, [
          'west-shortcut',
        ]),
      )
      camp.acceptDiscoveredRoutes()
    }
    let stage = new ExpeditionSession(repo.forCampaign(id), new FakeRuntime())
    assert.ok(stage.start('explorer', []))
    stage.completeCampaignScene(id === 'tower-control' ? 'control-entry' : 'pass-entry')
    for (const action of solveFinale(id).actions) {
      assert.ok(stage.dispatch(action), JSON.stringify(action))
      const run = stage.run
      if (run?.phase === 'won') break
      stage = new ExpeditionSession(repo.forCampaign(id), new FakeRuntime())
      assert.deepEqual(stage.run, run)
    }
    assert.equal(stage.run?.phase, 'won')
    const ending = id === 'tower-control' ? 'control-restored' : 'pass-open'
    assert.equal(pendingFinaleScene(null, camp.stageProgress(id)), ending)
    camp.completeStageScene(id, ending)
    assert.equal(pendingFinaleScene(null, camp.stageProgress(id)), null)
    assert.equal(
      new ExpeditionSession(repo.forCampaign(id), new FakeRuntime()).start('explorer', []),
      false,
    )
  }
  const after = repo.expedition()!
  assert.equal(after.camp.supplies, before.camp.supplies + 180 + 240)
  assert.ok(after.story?.completed.includes('open-blockade'))
  assert.ok(after.story?.facts?.includes('chapter-one-cleared'))
  assert.deepEqual(after.journal, before.journal)
  assert.deepEqual(after.records, before.records)
  for (const id of ['tower-galleries', 'tower-relay', 'ridge-observatory', 'old-waterway'] as const)
    assert.deepEqual(campaignProgress(after.campaign, id), campaignProgress(before.campaign, id))
})

test('the northwest bridge opens real persistent scenes and a reversible camp shortcut', () => {
  const repo = new VariantRepository(new MemoryStorage())
  const camp = readyFinale(repo)
  const road = createStoryRun(3)
  camp.saveStory({ ...camp.story, world: checkpointStory({ ...road, player: 12 }) })
  let story = new StorySession(camp)
  assert.equal(story.travelWorld(), false)
  camp.saveStory(recordStoryFacts(camp.story, ['west-line-restored']))
  assert.ok(story.travelWorld())
  assert.equal(story.run?.board.scene.id, 'northwest-bridge')
  for (const index of [76, 66, 14]) assert.ok(story.dispatch({ type: 'visit', index }))
  assert.ok(story.travelWorld())
  assert.equal(story.run?.board.scene.id, 'blockade-pass')
  assert.ok(camp.story.facts?.includes('west-shortcut'))
  story = new StorySession(new CampSession(repo))
  assert.equal(story.run?.board.scene.id, 'blockade-pass')
  assert.ok(story.dispatch({ type: 'visit', index: 92 }))
  assert.ok(story.travelWorld())
  assert.equal(story.run, null)
  assert.ok(camp.story.arrived)
  assert.equal(camp.story.campPosition, 19)
  assert.ok(story.travelNorthwest())
  assert.equal(new StorySession(camp).run?.player, 92)
  const scenes = camp.story.world!.scenes
  assert.equal(scenes.length, 3)
  assert.equal(new Set(scenes.map((scene) => scene.id)).size, 3)
  assert.ok(scenes.some((scene) => scene.id === 'north-road'))
})

test('atlas discovery permits both new local maps only after their physical route outcomes', () => {
  const camp = readyFinale(new VariantRepository(new MemoryStorage()))
  const bridge = storyAtlasIndex('northwest-bridge'),
    pass = storyAtlasIndex('blockade-pass')
  assert.equal(storyAtlasUnlocked(camp.story, null, bridge), false)
  assert.equal(storyAtlasUnlocked(camp.story, null, pass), false)
  const restored = recordStoryFacts(camp.story, ['west-line-restored'])
  assert.equal(storyAtlasUnlocked(restored, null, bridge), true)
  assert.equal(storyAtlasUnlocked(restored, null, pass), false)
  const crossed = recordStoryFacts(restored, ['west-shortcut'])
  assert.equal(storyAtlasUnlocked(crossed, null, pass), true)
  assert.equal(storyAtlasUnlocked(crossed, null, 99), false)
})

test('every northwest portal terminates on authored safe floor and future chapter saves stay read-only', () => {
  for (const portal of NORTHWEST_PORTALS) {
    const source = buildStoryBoard(
      isRegionalCamp(portal.scene)
        ? regionalCamp(portal.scene).scene
        : STORY_SCENES.find((scene) => scene.id === portal.scene)!,
    )
    const target = buildStoryBoard(
      isRegionalCamp(portal.destination)
        ? regionalCamp(portal.destination).scene
        : STORY_SCENES.find((scene) => scene.id === portal.destination)!,
    )
    for (const [board, index] of [
      [source, portal.index],
      [target, portal.arrival],
    ] as const) {
      assert.equal(board.walls.includes(index), false)
      assert.equal(board.game.cells[index]?.mine, false)
      assert.equal(board.game.cells[index]?.visibility, 'revealed')
    }
  }
  const storage = new MemoryStorage(),
    repo = new VariantRepository(storage)
  readyFinale(repo)
  assert.ok(
    new ExpeditionSession(repo.forCampaign('tower-control'), new FakeRuntime()).start(
      'explorer',
      [],
    ),
  )
  const key = 'minesweeper.variants.v1.expedition'
  const future = storage.getItem(key)!.replaceAll('tower-control-v1', 'tower-control-v2')
  storage.setItem(key, future)
  assert.equal(storyEnvelopeStatus(future), 'unsupported')
  new CampSession(new VariantRepository(storage)).acceptDiscoveredRoutes()
  assert.equal(storage.getItem(key), future)
})
