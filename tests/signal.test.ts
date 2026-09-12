import assert from 'node:assert/strict'
import test from 'node:test'
import { createExpedition, actExpedition } from '../src/game/expedition.js'
import { approachPath, walkingPath } from '../src/game/dungeon-path.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { relayReady, floorObjectiveComplete } from '../src/game/floor-circuits.js'
import { campaignProgress, updateCampaign } from '../src/game/campaign-catalog.js'
import { pendingSignalScene } from '../src/game/signal-story.js'
import { signalLayout } from '../src/game/signal-layout.js'
import { parseRoute, routeHref, sameRoute } from '../src/ui/navigation.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { CampSession } from '../src/application/camp-session.js'
import { StorySession } from '../src/application/story-session.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { checkpointStory } from '../src/game/story-checkpoint.js'
import { createStoryRun } from '../src/game/story.js'
import { storyEnvelopeStatus } from '../src/persistence/story-encoder.js'
import type { Departure, Expedition, ExpeditionAction } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

const departure: Departure = {
  campaign: 'tower-relay-v1',
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

/** Solve only public constraints and physically reachable frontiers, recording accepted intents. */
function solve(record: boolean): {
  readonly run: Expedition
  readonly actions: readonly ExpeditionAction[]
} {
  let run = createExpedition(departure)
  const actions: ExpeditionAction[] = []
  const apply = (action: ExpeditionAction): boolean => {
    const next = actExpedition(run, action)
    if (next === run) return false
    actions.push(action)
    run = next
    return true
  }
  for (let floor = 1; floor <= 3; floor++) {
    for (let turn = 0; turn < 200 && run.phase === 'exploring'; turn++) {
      let changed = false
      const knowledge = deduceMines(run.game, run.walls)
      for (const index of knowledge.mines)
        if (run.game.cells[index]?.visibility === 'hidden')
          changed = apply({ type: 'flag', index }) || changed
      for (const index of knowledge.safe)
        if (
          index !== run.exit &&
          run.game.cells[index]?.visibility === 'hidden' &&
          approachPath(run, index)
        )
          changed = apply({ type: 'reveal', index }) || changed
      for (const relay of run.circuits!.relays)
        if ((record || !relay.optional) && relayReady(run, relay))
          changed = apply({ type: 'interact', index: relay.index }) || changed
      if (!changed) break
    }
    if (record && run.circuits!.record !== null)
      assert.ok(apply({ type: 'move', index: run.circuits!.record! }))
    assert.ok(
      apply({
        type: run.game.cells[run.exit]?.visibility === 'hidden' ? 'reveal' : 'move',
        index: run.exit,
      }),
    )
    assert.equal(run.health, 10, `floor ${floor} is solvable without tools or damage`)
    assert.equal(run.phase, floor === 3 ? 'won' : 'reward')
    if (floor < 3) assert.ok(apply({ type: 'relic', relic: run.offers[0]! }))
  }
  return { run, actions }
}

/** Place the previous stage's completion at the real tower doorway, preserving a running rogue. */
function ready(repository: VariantRepository): void {
  const camp = new CampSession(repository)
  const world = createStoryRun(7)
  camp.saveStory({
    ...camp.story,
    arrived: false,
    completed: ['reach-camp', 'meet-guide', 'survey-road', 'repair-lift', 'reach-tower'],
    world: checkpointStory({ ...world, player: world.board.exit }),
    journal: null,
    dialogue: { completed: ['tower-arrival'], active: null },
  })
  const saved = repository.expedition()!
  repository.saveExpedition({
    ...saved,
    campaign: updateCampaign(saved.campaign, {
      ...campaignProgress(saved.campaign, 'tower-galleries'),
      scenes: ['tower-response'],
      cleared: true,
      lesson: 4,
    }),
  })
}

test('signal rescue and its optional record are solvable using public clues in all three rooms', () => {
  assert.equal(solve(true).run.signalRecord, true)
  assert.equal(solve(false).run.signalRecord, undefined)
  assert.equal(new Set([1, 2, 3].map((floor) => signalLayout(floor).entrance)).size, 3)
})

test('sealed gates stop movement and opening floods; a solved relay still requires physical interaction', () => {
  let run = createExpedition(departure)
  const relay = run.circuits!.relays[0]!
  assert.equal(walkingPath(run, relay.gate), null)
  assert.equal(actExpedition(run, { type: 'reveal', index: relay.gate }), run)
  assert.equal(actExpedition(run, { type: 'interact', index: relay.index }), run)
  assert.ok(
    run.game.cells
      .filter((_cell, index) => index % 9 > 4)
      .every((cell) => cell.visibility === 'hidden'),
  )
  const actions = solve(false).actions
  for (const action of actions) {
    if (action.type === 'interact') break
    run = actExpedition(run, action)
  }
  assert.equal(relayReady(run, run.circuits!.relays[0]!), true)
  assert.equal(
    run.walls.includes(relay.gate),
    true,
    'marking hazards does not operate a distant switch',
  )
  assert.equal(floorObjectiveComplete(run), false)
  const opened = actExpedition(run, { type: 'interact', index: relay.index })
  assert.equal(opened.player, relay.index)
  assert.equal(opened.walls.includes(relay.gate), false)
  assert.equal(opened.game.cells[relay.gate]?.visibility, 'revealed')
  assert.deepEqual(
    opened.game.cells.map((cell) => cell.adjacent),
    run.game.cells.map((cell) => cell.adjacent),
  )
  assert.equal(actExpedition(opened, { type: 'interact', index: relay.index }), opened)
})

test('relay readiness does not inspect hidden mine bits or accept incomplete flag-only guesses', () => {
  const run = createExpedition(departure)
  const relay = run.circuits!.relays[0]!
  const altered = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell) =>
        cell.visibility === 'hidden' ? { ...cell, mine: !cell.mine } : cell,
      ),
    },
  }
  assert.equal(relayReady(run, relay), relayReady(altered, relay))
  assert.equal(relayReady(run, relay), false)
})

test('new stage keeps shared builds, independent journals and a once-only rescue reward', () => {
  const storage = new MemoryStorage(),
    repository = new VariantRepository(storage)
  const rogue = new ExpeditionSession(repository, new FakeRuntime())
  rogue.start('explorer', [])
  ready(repository)
  const oldRogue = repository.expedition()!.journal
  const galleries = campaignProgress(repository.expedition()!.campaign, 'tower-galleries')
  const stage = new ExpeditionSession(repository.forCampaign('tower-relay'), new FakeRuntime())
  assert.equal(stage.start('explorer', []), true)
  assert.equal(stage.campaignLesson, 4)
  const actions = solve(true).actions
  for (const action of actions.slice(0, 8)) assert.equal(stage.dispatch(action), true)
  stage.completeCampaignScene('entry')
  rogue.persist()
  const resumed = new ExpeditionSession(repository.forCampaign('tower-relay'), new FakeRuntime())
  assert.deepEqual(resumed.run, stage.run)
  assert.ok(resumed.stageProgress.scenes.includes('entry'))
  const balance = resumed.camp.supplies
  for (const action of actions.slice(8)) assert.equal(resumed.dispatch(action), true)
  assert.equal(resumed.camp.supplies, balance + 80)
  assert.equal(new CampSession(repository).signalRescue.cleared, true)
  assert.equal(new CampSession(repository).signalRescue.recordSaved, true)
  const camp = new CampSession(repository)
  assert.equal(pendingSignalScene(null, camp.signalRescue), 'rescued')
  const completed = camp.camp.completed
  camp.completeSignalRescue()
  camp.completeSignalRescue()
  assert.equal(pendingSignalScene(null, camp.signalRescue), null)
  assert.equal(camp.camp.supplies, balance + 80)
  assert.equal(camp.camp.completed, completed)
  resumed.persist()
  rogue.persist()
  assert.deepEqual(repository.expedition()!.journal, oldRogue)
  assert.deepEqual(
    campaignProgress(repository.expedition()!.campaign, 'tower-galleries'),
    galleries,
  )
  const complete = new ExpeditionSession(repository.forCampaign('tower-relay'), new FakeRuntime())
  assert.equal(complete.start('explorer', []), false)
  assert.equal(complete.camp.supplies, balance + 80)
})

test('route selection requires stage prerequisites and preserves physical world location', () => {
  const repo = new VariantRepository(new MemoryStorage())
  const session = new ExpeditionSession(repo.forCampaign('tower-relay'), new FakeRuntime())
  assert.equal(session.start('explorer', []), false)
  ready(repo)
  const before = repo.expedition()!.story
  assert.equal(session.start('explorer', []), true)
  assert.deepEqual(repo.expedition()!.story, before)
  const route = { page: 'campaign', stage: 'tower-relay' } as const
  assert.deepEqual(parseRoute(routeHref(route, 'zh')), route)
  assert.equal(sameRoute(route, { page: 'campaign' }), false)
})

test('legacy stage envelopes migrate once and newer stage content is kept read-only', () => {
  const storage = new MemoryStorage(),
    repo = new VariantRepository(storage)
  ready(repo)
  const save = repo.expedition()!
  const old = { ...campaignProgress(save.campaign, 'tower-galleries'), scenes: [] }
  const key = 'minesweeper.variants.v1.expedition'
  storage.setItem(
    key,
    JSON.stringify({
      ...save,
      campaign: {
        journal: old.journal,
        records: old.records,
        cleared: old.cleared,
        lesson: old.lesson,
      },
    }),
  )
  const migrated = repo.expedition()!
  assert.deepEqual(campaignProgress(migrated.campaign, 'tower-galleries'), old)
  repo.saveExpedition(migrated)
  const future = storage.getItem(key)!.replace('"id":"tower-galleries"', '"id":"future-stage"')
  assert.equal(storyEnvelopeStatus(future), 'unsupported')
  storage.setItem(key, future)
  const reader = new VariantRepository(storage)
  reader.expedition()
  reader.saveExpedition(migrated)
  assert.equal(storage.getItem(key), future)
})

test('story events follow circuit and record outcomes rather than repeated visits', () => {
  const empty = campaignProgress(undefined, 'tower-relay')
  const run = createExpedition(departure)
  assert.equal(pendingSignalScene(run, empty), 'entry')
  assert.equal(pendingSignalScene(run, { ...empty, scenes: ['entry'] }), null)
  assert.equal(pendingSignalScene(null, empty), null)
  assert.equal(pendingSignalScene(null, { ...empty, cleared: true }), 'rescued')
  assert.equal(pendingSignalScene(null, { ...empty, cleared: true, scenes: ['rescued'] }), null)
  assert.equal(
    pendingSignalScene(solve(false).run, {
      ...empty,
      scenes: ['entry', 'connected', 'archive', 'prison'],
    }),
    'rescued',
  )
})

test('retreat and retry retain completed dialogue without retaining the abandoned attempt', () => {
  const repo = new VariantRepository(new MemoryStorage())
  ready(repo)
  const first = new ExpeditionSession(repo.forCampaign('tower-relay'), new FakeRuntime())
  first.start('explorer', [])
  first.completeCampaignScene('entry')
  const balance = first.camp.supplies
  assert.equal(first.dispatch({ type: 'retreat' }), true)
  const retry = new ExpeditionSession(repo.forCampaign('tower-relay'), new FakeRuntime())
  assert.equal(retry.start('explorer', []), true)
  assert.equal(retry.run!.floor, 1)
  assert.deepEqual(retry.stageProgress.scenes, ['entry'])
  assert.equal(pendingSignalScene(retry.run, retry.stageProgress), null)
  assert.equal(retry.camp.supplies, balance)
})

test('authored relay objectives and all safe floor cells remain connected after disconnection', () => {
  for (let floor = 1; floor <= 3; floor++) {
    const layout = signalLayout(floor)
    const gates = layout.circuits.relays.map((relay) => relay.gate)
    const masonry = layout.walls.filter((wall) => !gates.includes(wall))
    const visited = new Set([layout.entrance]),
      queue = [layout.entrance]
    for (let cursor = 0; cursor < queue.length; cursor++)
      for (const index of adjacentSteps(layout.game, queue[cursor]!))
        if (!visited.has(index) && !masonry.includes(index) && !layout.game.cells[index]?.mine) {
          visited.add(index)
          queue.push(index)
        }
    for (let index = 0; index < layout.game.cells.length; index++)
      if (!masonry.includes(index) && !layout.game.cells[index]?.mine) assert.ok(visited.has(index))
    for (const relay of layout.circuits.relays) {
      assert.ok(visited.has(relay.index))
      assert.ok(visited.has(relay.gate))
      assert.equal(layout.game.cells[relay.gate]?.mine, false)
    }
  }
})

test('a rescued resident cannot overlap an old camp position or be walked through', () => {
  const repo = new VariantRepository(new MemoryStorage())
  ready(repo)
  const saved = repo.expedition()!
  repo.saveExpedition({
    ...saved,
    campaign: updateCampaign(saved.campaign, {
      ...campaignProgress(saved.campaign, 'tower-relay'),
      cleared: true,
    }),
  })
  const camp = new CampSession(repo)
  camp.saveStory({
    ...camp.story,
    arrived: true,
    campPosition: 33,
    world: { ...camp.story.world!, active: null },
  })
  const story = new StorySession(camp)
  const path = story.campPath(33)!
  assert.ok(path.length > 1)
  assert.equal(path.includes(33), false)
  assert.equal(path.includes(51), false)
  assert.ok(story.moveCamp(33))
  assert.notEqual(camp.story.campPosition, 33)
})

test('fresh relay attempts require the tower response but existing journals still resume', () => {
  const repository = new VariantRepository(new MemoryStorage())
  ready(repository)
  const saved = repository.expedition()!
  const first = campaignProgress(saved.campaign, 'tower-galleries')
  repository.saveExpedition({
    ...saved,
    campaign: updateCampaign(saved.campaign, { ...first, scenes: [] }),
  })
  const session = new ExpeditionSession(repository.forCampaign('tower-relay'), new FakeRuntime())
  assert.equal(session.start('explorer', []), false)
  assert.equal(campaignProgress(repository.expedition()!.campaign, 'tower-relay').journal, null)
  new CampSession(repository).completeStageScene('tower-galleries', 'tower-response')
  assert.ok(session.start('explorer', []))
  const run = session.run
  const active = repository.expedition()!
  repository.saveExpedition({
    ...active,
    campaign: updateCampaign(active.campaign, { ...first, scenes: [] }),
  })
  const resumed = new ExpeditionSession(repository.forCampaign('tower-relay'), new FakeRuntime())
  assert.deepEqual(resumed.run, run)
})
