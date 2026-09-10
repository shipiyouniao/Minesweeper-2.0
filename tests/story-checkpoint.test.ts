import assert from 'node:assert/strict'
import test from 'node:test'
import { CampSession } from '../src/application/camp-session.js'
import { StorySession } from '../src/application/story-session.js'
import { checkpointStory, restoreStoryWorld } from '../src/game/story-checkpoint.js'
import { actStory, createStoryRun } from '../src/game/story.js'
import { STORY_REVISION } from '../src/game/story-content.js'
import { parseJson } from '../src/persistence/json-reader.js'
import { decodeStoryWorld } from '../src/persistence/story-world-decoder.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { MemoryStorage } from './helpers.js'

const key = 'minesweeper.variants.v1.expedition'

test('checkpoint restores clues, mistakes, health and position without serializing terrain', () => {
  let run = createStoryRun()
  run = actStory(run, { type: 'inspect', index: 12 })
  run = actStory(run, { type: 'visit', index: 22 })
  const saved = checkpointStory(run)
  const decoded = decodeStoryWorld(parseJson(JSON.stringify(saved)))!
  assert.deepEqual(restoreStoryWorld(decoded), run)
  assert.equal(saved.scenes[0]!.health, 2)
  assert.ok(!JSON.stringify(saved).includes('mine'))
  assert.ok(!JSON.stringify(saved).includes('adjacent'))
})

test('checkpoint rejects exposed mines, unsafe players, duplicate scenes and invalid health', () => {
  const world = checkpointStory(createStoryRun())
  const scene = world.scenes[0]!
  for (const invalid of [
    { ...world, scenes: [scene, scene] },
    { ...world, scenes: [{ ...scene, revealed: [22] }] },
    { ...world, scenes: [{ ...scene, player: 22 }] },
    { ...world, scenes: [{ ...scene, health: 0 }] },
    { ...world, scenes: [{ ...scene, flagged: [31, 31] }] },
    { ...world, scenes: [{ ...scene, triggered: [22] }] },
  ])
    assert.equal(decodeStoryWorld(parseJson(JSON.stringify(invalid))), null)
})

test('10,000 actions remain playable and save size depends on scene state, not playtime', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  let session = new StorySession(new CampSession(repository))
  session.dispatch({ type: 'visit', index: 20 })
  session.dispatch({ type: 'visit', index: 19 })
  const bytes = storage.getItem(key)!.length
  for (let i = 0; i < 10000; i++) {
    assert.equal(session.dispatch({ type: 'visit', index: i % 2 === 0 ? 20 : 19 }), true)
    if (i % 2000 === 1999) session = new StorySession(new CampSession(repository))
  }
  assert.equal(storage.getItem(key)!.length, bytes)
  assert.equal(session.camp.story.journal, null)
  assert.ok(storage.getItem(key)!.includes('"schemaVersion":4'))
  assert.ok(!storage.getItem(key)!.includes('"actions"'))
  assert.ok(storage.data.size <= 3)
})

test('corrupt world data recovers the last valid save instead of resetting the prologue', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const session = new StorySession(new CampSession(repository))
  session.dispatch({ type: 'inspect', index: 12 })
  session.dispatch({ type: 'flag', index: 22 })
  const backup = storage.getItem(key + '.backup')!
  storage.setItem(key, storage.getItem(key)!.replace('"player":19', '"player":-1'))
  const recovered = new VariantRepository(storage)
  const restored = new StorySession(new CampSession(recovered))
  assert.equal(restored.run?.inspected, true)
  assert.equal(restored.run?.player, 19)
  assert.notEqual(storage.getItem(key), null)
  assert.ok(backup.includes('"inspected":true'))
})

test('retiring an incompatible world preserves outcomes and compensates an active attempt once', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const camp = new CampSession(repository)
  camp.saveStory({
    ...camp.story,
    world: { revision: 0, active: 'awakening', hasVisited: false, scenes: [] },
  })
  const retired = new StorySession(camp)
  assert.equal(retired.run, null)
  assert.equal(retired.camp.camp.supplies, 200)
  assert.equal(retired.camp.story.world?.active, null)
  const restored = new StorySession(new CampSession(new VariantRepository(storage)))
  assert.equal(restored.camp.camp.supplies, 200)
  restored.moveCamp(49)
  assert.equal(restored.leaveCamp(), true)
  assert.equal(restored.run?.floor, 2)
  assert.equal(restored.camp.camp.supplies, 200)
})

test('unknown future story versions remain untouched when the current client tries to save', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const session = new StorySession(new CampSession(repository))
  const future = storage.getItem(key)!.replace('"schemaVersion":4', '"schemaVersion":99')
  storage.setItem(key, future)
  const older = new VariantRepository(storage)
  older.saveExpedition(repository.expedition()!)
  assert.equal(older.available, false)
  assert.equal(storage.getItem(key), future)
  assert.ok(session.run)
})

test('a newer world revision is write-protected rather than retired by an older client', () => {
  const storage = new MemoryStorage()
  const current = new VariantRepository(storage)
  new StorySession(new CampSession(current))
  const before = storage.getItem(key)!
  const future = before.replace(`"revision":${STORY_REVISION}`, `"revision":${STORY_REVISION + 1}`)
  assert.notEqual(future, before)
  storage.setItem(key, future)
  const older = new VariantRepository(storage)
  new StorySession(new CampSession(older))
  assert.equal(older.available, false)
  assert.equal(storage.getItem(key), future)
})

test('camp restores world hearts and keeps them after departure and reload', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const camp = new CampSession(repository)
  const road = createStoryRun(3, 1)
  camp.saveStory({
    ...camp.story,
    arrived: false,
    mapOwned: true,
    completed: ['reach-camp', 'meet-guide'],
    world: checkpointStory({ ...road, player: road.board.entrance }),
  })
  const session = new StorySession(new CampSession(repository))
  assert.equal(session.dispatch({ type: 'return' }), true)
  assert.equal(session.run, null)
  assert.equal(restoreStoryWorld(session.camp.story.world!, 'north-road')!.health, 3)
  assert.equal(session.enterNorthRoad(), true)
  assert.equal(session.run!.health, 3)
  assert.equal(new StorySession(new CampSession(new VariantRepository(storage))).run!.health, 3)
})
