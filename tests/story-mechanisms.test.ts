import assert from 'node:assert/strict'
import test from 'node:test'
import { clueIsolated } from '../src/game/clue-isolation.js'
import { actStory, createStoryRun, storyPath } from '../src/game/story.js'
import { checkpointStory, restoreStoryWorld } from '../src/game/story-checkpoint.js'
import { decodeStoryWorld } from '../src/persistence/story-world-decoder.js'
import { parseJson } from '../src/persistence/json-reader.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { CampSession } from '../src/application/camp-session.js'
import { StorySession } from '../src/application/story-session.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'
import type { StoryRun } from '../src/types/story.js'

/** Open only publicly proven reachable neighbors, leaving mechanism operation to the player. */
function isolate(run: StoryRun): StoryRun {
  for (let turn = 0; turn < 60; turn++) {
    const previous = run
    const known = deduceMines(run.board.game, run.board.walls)
    for (const index of known.mines)
      if (run.board.game.cells[index]?.visibility === 'hidden')
        run = actStory(run, { type: 'flag', index })
    for (const index of known.safe)
      if (
        run.board.game.cells[index]?.visibility === 'hidden' &&
        storyPath(run.board, run.player, index)
      )
        run = actStory(run, { type: 'visit', index })
    if (run === previous) break
  }
  return run
}

test('quarry controls require public isolation and physical operation; gates block flooding and routes', () => {
  for (const floor of [4, 6]) {
    const initial = createStoryRun(floor)
    const control = initial.board.scene.mechanisms![0]!
    assert.equal(storyPath(initial.board, initial.player, initial.board.exit), null)
    assert.equal(actStory(initial, { type: 'operate', index: control.index }), initial)
    const ready = isolate(initial)
    assert.equal(clueIsolated(ready.board, control.index), true)
    assert.ok(ready.board.walls.includes(control.gate))
    assert.equal(ready.board.game.cells[40]!.visibility, 'hidden')
    const opened = actStory(ready, { type: 'operate', index: control.index })
    assert.ok(!opened.board.walls.includes(control.gate))
    assert.deepEqual(
      opened.board.game.cells,
      ready.board.game.cells,
      'gate release never floods or changes clues',
    )
    assert.equal(opened.player, control.index)
    assert.equal(opened.health, 3)
    assert.equal(actStory(opened, { type: 'operate', index: control.index }), opened)
    const solved = isolate(opened)
    assert.ok(storyPath(solved.board, solved.player, solved.board.exit))
    assert.equal(solved.health, 3)
    const retry = actStory({ ...opened, health: 0, phase: 'fallen' }, { type: 'retry' })
    assert.deepEqual(retry.operated, opened.operated)
    assert.ok(!retry.board.walls.includes(control.gate))
  }
})

test('mechanism outcomes round-trip without accepting invented controls or closed-gate positions', () => {
  const run = actStory(isolate(createStoryRun(6)), { type: 'operate', index: 13 })
  const world = checkpointStory(run)
  assert.deepEqual(restoreStoryWorld(decodeStoryWorld(parseJson(JSON.stringify(world)))!), run)
  const scene = world.scenes[0]!
  for (const invalid of [
    { ...scene, operated: [10] },
    { ...scene, operated: [13, 13] },
    { ...scene, operated: [], player: 30 },
  ])
    assert.equal(decodeStoryWorld(parseJson(JSON.stringify({ ...world, scenes: [invalid] }))), null)
})

test('retiring an old active world pays 200 once and keeps camp purchases and independent runs', () => {
  const repo = new VariantRepository(new MemoryStorage())
  const rogue = new ExpeditionSession(repo, new FakeRuntime())
  rogue.start('explorer', [])
  const camp = new CampSession(repo)
  camp.saveStory({
    ...camp.story,
    world: { revision: 1, active: 'north-road', scenes: [], hasVisited: false },
  })
  const journal = repo.expedition()!.journal
  const session = new StorySession(camp)
  assert.equal(session.run, null)
  assert.equal(camp.camp.supplies, 200)
  assert.deepEqual(repo.expedition()!.journal, journal)
  assert.ok(camp.story.completed.includes('reach-camp'))
  session.moveCamp(51)
  session.meetGuide()
  session.completeDialogue('guide')
  assert.equal(camp.story.mapOwned, true)
  assert.equal(new StorySession(new CampSession(repo)).camp.camp.supplies, 200)
})
