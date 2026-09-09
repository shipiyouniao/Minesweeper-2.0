import { storyConditionMet } from '../src/game/story-quests.js'
import { milestoneProgress } from '../src/game/milestones.js'
import { campaignLayout } from '../src/game/campaign-layout.js'
import { connectedFloor } from '../src/game/dungeon-path.js'
import assert from 'node:assert/strict'
import test from 'node:test'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { CampSession } from '../src/application/camp-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { checkpointStory } from '../src/game/story-checkpoint.js'
import { createStoryRun } from '../src/game/story.js'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { approachPath } from '../src/game/dungeon-path.js'
import type { Departure, ExpeditionAction } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

const departure: Departure = {
  campaign: 'tower-road-v4',
  title: null,
  training: [],
  battleRelics: false,
  packs: [],
  difficulty: 'relaxed',
  seed: 0,
  profession: 'explorer',
  equipment: [],
  archive: false,
}

/** Place a valid story save at the physical entry without touching its independent roguelite. */
function ready(repository: VariantRepository): void {
  const camp = new CampSession(repository)
  const run = createStoryRun(7)
  camp.saveStory({
    ...camp.story,
    arrived: false,
    completed: ['reach-camp', 'meet-guide', 'survey-road', 'repair-lift', 'reach-tower'],
    world: checkpointStory({ ...run, player: run.board.exit }),
    journal: null,
  })
}

test('campaign and roguelite preserve independent attempts and frozen build resources', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const rogue = new ExpeditionSession(repository, new FakeRuntime())
  rogue.start('explorer', [])
  const original = repository.expedition()!.journal
  ready(repository)
  const balance = repository.expedition()!.camp.supplies
  const projected = repository.forCampaign()
  const stage = new ExpeditionSession(projected, new FakeRuntime())
  assert.equal(stage.start('explorer', []), true)
  assert.equal(stage.run!.health, 10)
  assert.equal(stage.run!.departure.campaign, 'tower-road-v4')
  assert.equal(stage.dispatch({ type: 'reveal', index: 12 }), true)
  assert.equal(stage.run!.health, 5)
  assert.equal(stage.dispatch({ type: 'probe', index: 22 }), true)
  assert.equal(stage.run!.probes, 1)
  const before = stage.run
  rogue.persist()
  stage.persist()
  const restored = new ExpeditionSession(
    new VariantRepository(storage).forCampaign(),
    new FakeRuntime(),
  )
  assert.deepEqual(restored.run, before)
  assert.deepEqual(repository.expedition()!.journal, original)
  assert.equal(restored.start('explorer', []), false)
  assert.equal(restored.dispatch({ type: 'retreat' }), true)
  assert.equal(repository.expedition()!.campaign!.journal, null)
  assert.deepEqual(repository.expedition()!.journal, original)
  assert.equal(repository.expedition()!.camp.supplies, balance)
})

test('campaign entry requires the story prerequisite and physical location', () => {
  const repository = new VariantRepository(new MemoryStorage())
  assert.equal(
    new ExpeditionSession(repository.forCampaign(), new FakeRuntime()).start('explorer', []),
    false,
  )
})

test('all three authored campaign floors can be cleared from public clues without tools or damage', () => {
  let run = createExpedition(departure)
  const actions: ExpeditionAction[] = []
  const apply = (action: ExpeditionAction) => {
    const next = actExpedition(run, action)
    if (next !== run) actions.push(action)
    return next
  }
  for (let floor = 1; floor <= 3; floor++) {
    assert.equal(run.floor, floor)
    const connected = connectedFloor(run.game, run.entrance)
    assert.deepEqual(
      run.walls,
      run.game.cells.flatMap((cell, index) => (!cell.mine && !connected.has(index) ? [index] : [])),
    )
    assert.ok(run.walls.length < 4, 'the board perimeter must not become walls')
    for (let turn = 0; turn < 200 && run.phase === 'exploring'; turn++) {
      const knowledge = deduceMines(run.game, run.walls)
      let changed = false
      for (const index of knowledge.mines) {
        const next = apply({ type: 'flag', index })
        changed ||= next !== run
        run = next
      }
      for (const index of knowledge.safe) {
        if (run.game.cells[index]!.visibility !== 'hidden' || !approachPath(run, index)) continue
        const next = apply({ type: 'reveal', index })
        changed ||= next !== run
        run = next
      }
      if (!changed) break
    }
    for (const index of run.treasures) run = apply({ type: 'move', index })
    run = apply({ type: 'move', index: run.exit })
    assert.equal(run.health, 10, `floor ${floor} must not require damage`)
    assert.equal(run.phase, floor === 3 ? 'won' : 'reward', `floor ${floor} must be solvable`)
    if (floor < 3)
      run = apply(run.offers[0] ? { type: 'relic', relic: run.offers[0] } : { type: 'descend' })
  }
  const repository = new VariantRepository(new MemoryStorage())
  ready(repository)
  const balance = repository.expedition()!.camp.supplies
  const session = new ExpeditionSession(repository.forCampaign(), new FakeRuntime())
  assert.equal(session.start('explorer', []), true)
  for (const action of actions) assert.equal(session.dispatch(action), true)
  assert.equal(session.run!.phase, 'won')
  const progress = milestoneProgress(session.camp)
  assert.equal(progress.floors, 3)
  assert.equal(progress.chests, 6)
  assert.equal(progress.wins, 1)
  assert.ok(progress.travel > 0)
  const story = repository.expedition()!.story!
  assert.equal(story.campaignActivity?.floors, 3)
  assert.equal(story.campaignActivity?.chests, 6)
  assert.equal(story.campaignActivity?.wins, 1)
  assert.ok(storyConditionMet({ kind: 'campaign', metric: 'chests', target: 6 }, story))
  assert.equal(storyConditionMet({ kind: 'campaign', metric: 'chests', target: 7 }, story), false)

  assert.equal(repository.expedition()!.camp.supplies, balance + 50)
  session.persist()
  const restored = new ExpeditionSession(repository.forCampaign(), new FakeRuntime())
  assert.equal(restored.run, null)
  assert.equal(restored.start('explorer', []), false)
  assert.equal(repository.expedition()!.camp.supplies, balance + 50)
  assert.deepEqual(milestoneProgress(restored.camp), progress)
  assert.deepEqual(repository.expedition()!.story!.campaignActivity, story.campaignActivity)
})

test('the obsolete framed campaign retires without changing the world or roguelite', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const rogue = new ExpeditionSession(repository, new FakeRuntime())
  rogue.start('explorer', [])
  ready(repository)
  const stage = new ExpeditionSession(repository.forCampaign(), new FakeRuntime())
  stage.start('explorer', [])
  const original = repository.expedition()!
  const key = 'minesweeper.variants.v1.expedition'
  storage.setItem(key, storage.getItem(key)!.replaceAll('tower-road-v4', 'tower-road-v2'))
  const fresh = new VariantRepository(storage)
  const restored = new ExpeditionSession(fresh.forCampaign(), new FakeRuntime())
  assert.equal(restored.run, null)
  assert.deepEqual(fresh.expedition()!.story, original.story)
  assert.deepEqual(fresh.expedition()!.journal, original.journal)
  assert.equal(fresh.expedition()!.camp.supplies, original.camp.supplies)
  assert.equal(restored.start('explorer', []), true)
  assert.equal(restored.run!.departure.campaign, 'tower-road-v4')
})

test('campaign layouts reveal only the entrance opening and distribute hazards across the board', () => {
  for (let floor = 1; floor <= 3; floor++) {
    const layout = campaignLayout(floor)
    const visible = layout.game.cells.flatMap((cell, index) =>
      cell.visibility === 'revealed' ? [index] : [],
    )
    assert.ok(visible.length >= 7 && visible.length <= 20)
    for (let row = 0; row < 9; row++)
      assert.ok(
        visible.filter((index) => Math.floor(index / 9) === row).length < 9,
        'no entire row is pre-revealed',
      )
    const edgeMines = layout.game.cells.filter(
      (cell, index) =>
        cell.mine && (index < 9 || index >= 72 || index % 9 === 0 || index % 9 === 8),
    )
    assert.ok(edgeMines.length >= 3, 'the perimeter participates in the puzzle')
    assert.equal(layout.treasures.length, 2)
    assert.ok(
      Math.abs(Math.floor(layout.treasures[0]! / 9) - Math.floor(layout.treasures[1]! / 9)) >= 3,
      'caches require separate exploration',
    )
  }
})

test('restarting a campaign restores its lesson while reopening it preserves resources', () => {
  const repository = new VariantRepository(new MemoryStorage())
  ready(repository)
  const session = new ExpeditionSession(repository.forCampaign(), new FakeRuntime())
  session.start('explorer', [])
  session.setCampaignLesson(4)
  session.dispatch({ type: 'probe', index: 22 })
  const before = session.run
  session.setCampaignLesson(0)
  assert.equal(session.campaignLesson, 0)
  assert.deepEqual(session.run, before)
  session.setCampaignLesson(4)
  session.dispatch({ type: 'retreat' })
  const restarted = new ExpeditionSession(repository.forCampaign(), new FakeRuntime())
  assert.equal(restarted.start('explorer', []), true)
  assert.equal(restarted.campaignLesson, 0)
})

test('each campaign floor has a distinct entrance and exit', () => {
  const layouts = [1, 2, 3].map(campaignLayout)
  assert.equal(new Set(layouts.map((layout) => layout.entrance)).size, 3)
  assert.equal(new Set(layouts.map((layout) => layout.exit)).size, 3)
})
test('v3 first-floor progress upgrades without resetting the lesson or resources', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  ready(repository)
  const session = new ExpeditionSession(repository.forCampaign(), new FakeRuntime())
  session.start('explorer', [])
  session.dispatch({ type: 'probe', index: 22 })
  session.setCampaignLesson(1)
  const before = session.run!
  const key = 'minesweeper.variants.v1.expedition'
  storage.setItem(key, storage.getItem(key)!.replaceAll('tower-road-v4', 'tower-road-v3'))
  const restored = new ExpeditionSession(
    new VariantRepository(storage).forCampaign(),
    new FakeRuntime(),
  )
  assert.deepEqual(restored.run, before)
  assert.equal(restored.campaignLesson, session.campaignLesson)
})

test('roguelite advances shared milestones without advancing campaign-only story objectives', () => {
  const repository = new VariantRepository(new MemoryStorage())
  ready(repository)
  const before = repository.expedition()!.story
  const session = new ExpeditionSession(repository, new FakeRuntime())
  session.start('explorer', [])
  for (let index = 0; index < session.run!.game.cells.length; index++) {
    if (!approachPath(session.run!, index) || session.run!.game.cells[index]!.mine) continue
    if (session.dispatch({ type: 'reveal', index })) break
  }
  assert.deepEqual(repository.expedition()!.story, before)
})
