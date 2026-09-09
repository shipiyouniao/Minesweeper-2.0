import assert from 'node:assert/strict'
import test from 'node:test'
import { CampSession } from '../src/application/camp-session.js'
import { StorySession } from '../src/application/story-session.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { neighbors } from '../src/game/engine.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { CAMP_SCENE, CAMP_SITES, PROLOGUE_SCENES } from '../src/game/story-content.js'
import {
  actStory,
  buildStoryBoard,
  createStoryRun,
  storyLessonComplete,
  storyPath,
} from '../src/game/story.js'
import { decodeStory } from '../src/persistence/story-decoder.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import type { StoryAction, StoryRun } from '../src/types/story.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

test('story chords require matching flags and preserve physical pickup and travel', () => {
  const initial = createStoryRun()
  assert.equal(actStory(initial, { type: 'chord', index: 21 }), initial)
  const flagged = actStory(initial, { type: 'flag', index: 22 })
  const opened = actStory(flagged, { type: 'chord', index: 21 })
  assert.equal(opened.board.game.cells[31]!.visibility, 'revealed')
  assert.equal(opened.board.game.cells[22]!.visibility, 'flagged')
  assert.equal(opened.player, 21)
  assert.equal(opened.health, 3)
  assert.equal(opened.practicedReveal, true)
  assert.equal(opened.collected, false)
  assert.equal(opened.floor, 0)
  assert.equal(actStory(opened, { type: 'chord', index: 21 }), opened)
  const wrong = actStory(initial, { type: 'flag', index: 31 })
  const hurt = actStory(wrong, { type: 'chord', index: 21 })
  assert.equal(hurt.health, 2)
  assert.deepEqual(hurt.triggered, [22])
  assert.equal(hurt.player, 21)
  assert.equal(hurt.board.game.cells[31]!.visibility, 'flagged')
})

test('camp return and both travel directions preserve explored scenes and pay rewards only once', () => {
  const repository = new VariantRepository(new MemoryStorage())
  let session = new StorySession(new CampSession(repository))
  const boards = []
  for (let floor = 0; floor < 3; floor++) {
    solveFloor(
      session.run!,
      (action) => {
        session.dispatch(action)
      },
      () => session.run!,
    )
    boards.push(session.run!.board)
    assert.equal(session.dispatch({ type: 'continue' }), true)
  }
  const supplies = session.camp.camp.supplies
  assert.equal(session.leaveCamp(), false)
  session.moveCamp(buildStoryBoard(CAMP_SCENE).exit)
  assert.equal(session.leaveCamp(), true)
  session = new StorySession(new CampSession(repository))
  for (let floor = 2; floor >= 0; floor--) {
    assert.equal(session.run!.floor, floor)
    assert.deepEqual(session.run!.board, boards[floor])
    if (floor > 0) {
      assert.equal(session.dispatch({ type: 'visit', index: session.run!.board.entrance }), true)
      assert.equal(session.dispatch({ type: 'return' }), true)
      session = new StorySession(new CampSession(repository))
    }
  }
  for (let floor = 0; floor < 3; floor++) {
    session.dispatch({ type: 'visit', index: session.run!.board.exit })
    assert.equal(session.dispatch({ type: 'continue' }), true)
  }
  assert.equal(session.run, null)
  assert.equal(session.camp.camp.supplies, supplies)
  session = new StorySession(new CampSession(repository))
  assert.equal(session.run, null)
  assert.equal(session.leaveCamp(), true)
  assert.deepEqual(session.run!.board, boards[2])
})

test('legacy camp saves reopen the surveyed prologue without replaying rewards', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const camp = new CampSession(repository)
  camp.saveStory({
    ...camp.story,
    arrived: true,
    completed: ['reach-camp', 'lost-satchel'],
    campPosition: 49,
    journal: null,
  })
  const balance = camp.camp.supplies
  const session = new StorySession(new CampSession(repository))
  assert.equal(session.leaveCamp(), true)
  assert.equal(session.run!.floor, 2)
  assert.ok(session.run!.board.game.cells.every((cell) => cell.visibility !== 'hidden'))
  const restored = new StorySession(new CampSession(repository))
  assert.deepEqual(restored.run, session.run)
  assert.equal(restored.dispatch({ type: 'continue' }), true)
  assert.equal(restored.camp.camp.supplies, balance)
})

test('story quests start empty and acceptance, tracking and map ownership survive reload', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const session = new StorySession(new CampSession(repository))
  assert.deepEqual(session.camp.story.accepted, [])
  assert.deepEqual(session.camp.story.pinned, [])
  session.receiveMap()
  assert.equal(session.camp.story.mapOwned, false)
  assert.equal(session.acceptTask(), 'reach-camp')
  assert.equal(session.acceptTask(), null)
  session.togglePin('reach-camp')
  session.togglePin('meet-guide')
  const resumed = new StorySession(new CampSession(repository))
  assert.deepEqual(resumed.camp.story.accepted, ['reach-camp'])
  assert.deepEqual(resumed.camp.story.pinned, [])
  resumed.togglePin('reach-camp')
  assert.deepEqual(resumed.camp.story.pinned, ['reach-camp'])
})

test('legacy story saves retain completed quests and maps without inventing starting quests', () => {
  assert.deepEqual(decodeStory({ journal: { revision: 1, actions: [] } })?.accepted, [])
  const legacy = decodeStory({ completed: ['reach-camp', 'meet-guide'] })!
  assert.deepEqual(legacy.accepted, ['reach-camp', 'meet-guide'])
  assert.deepEqual(legacy.pinned, [])
  assert.equal(legacy.mapOwned, true)
  assert.equal(decodeStory({ completed: ['meet-guide'], mapOwned: false })?.mapOwned, false)
  assert.deepEqual(
    decodeStory({
      accepted: ['reach-camp'],
      pinned: ['fake', 'meet-guide', 'reach-camp', 'reach-camp'],
    })?.pinned,
    ['reach-camp'],
  )
})

/** Solve with public clue constraints, then perform the authored teaching and travel objectives. */
function solveFloor(
  initial: StoryRun,
  dispatch: (action: StoryAction) => void,
  read: () => StoryRun,
): void {
  if (initial.board.scene.clue !== null)
    dispatch({ type: 'inspect', index: initial.board.scene.clue })
  for (let turn = 0; turn < 100; turn++) {
    const run = read()
    const deduction = deduceMines(run.board.game, run.board.walls)
    for (const index of deduction.mines) dispatch({ type: 'flag', index })
    let changed = false
    for (const index of deduction.safe) {
      const current = read()
      if (
        current.board.game.cells[index]?.visibility !== 'hidden' ||
        !storyPath(current.board, current.player, index)
      )
        continue
      dispatch({ type: 'visit', index })
      changed = true
    }
    if (!changed && !deduction.mines.length) break
  }
  const safe = initial.board.scene.teachingSafe
  if (safe !== null) dispatch({ type: 'visit', index: safe })
  const treasure = initial.board.treasure
  if (treasure !== null) dispatch({ type: 'visit', index: treasure })
  dispatch({ type: 'visit', index: initial.board.exit })
  assert.equal(
    read().player,
    initial.board.exit,
    initial.board.scene.id + ' must be reachable by deduction',
  )
  assert.equal(storyLessonComplete(read()), true)
  assert.equal(read().health, initial.health, 'public deduction never guesses or takes damage')
}

test('all authored floors have exact truthful clues and a public-information route to their objectives', () => {
  for (let floor = 0; floor < PROLOGUE_SCENES.length; floor++) {
    let run = createStoryRun(floor)
    for (let index = 0; index < run.board.game.cells.length; index++) {
      assert.equal(
        run.board.game.cells[index]!.adjacent,
        neighbors(run.board.game.config, index).filter((n) => run.board.game.cells[n]!.mine).length,
      )
    }
    solveFloor(
      run,
      (action) => {
        run = actStory(run, action)
      },
      () => run,
    )
    assert.equal(actStory(run, { type: 'continue' }).phase, floor === 2 ? 'arrived' : 'exploring')
  }
})

test('scene movement uses public ground, requires actual arrival and does not auto-exit', () => {
  let run = createStoryRun()
  assert.equal(actStory(run, { type: 'continue' }), run)
  assert.equal(storyPath(run.board, run.player, 25), null)
  for (const index of [-1, 63, 1.5, NaN, 0])
    assert.equal(actStory(run, { type: 'visit', index }), run)
  const other = {
    ...run.board,
    game: {
      ...run.board.game,
      cells: run.board.game.cells.map((c) =>
        c.visibility === 'hidden' ? { ...c, mine: !c.mine } : c,
      ),
    },
  }
  assert.deepEqual(storyPath(run.board, run.player, 22), storyPath(other, run.player, 22))
  run = actStory(run, { type: 'visit', index: 22 })
  assert.equal(run.health, 2)
  assert.equal(run.player, 21)
  assert.ok(run.triggered.includes(22))
  assert.equal(actStory(run, { type: 'flag', index: 22 }), run)
  run = actStory(run, { type: 'inspect', index: 12 })
  run = actStory(run, { type: 'visit', index: 31 })
  run = actStory(run, { type: 'visit', index: 34 })
  assert.equal(run.floor, 0)
  assert.equal(run.phase, 'exploring')
  assert.equal(
    storyLessonComplete(run),
    true,
    'triggering the teaching mine must not softlock the lesson',
  )
})

test('blank reveal expands through all connected zero ground but never through walls', () => {
  let run = createStoryRun(1)
  run = actStory(run, { type: 'visit', index: 29 })
  run = actStory(run, { type: 'visit', index: 30 })
  assert.equal(run.board.game.cells[31]!.visibility, 'revealed')
  assert.equal(run.board.game.cells[31]!.adjacent, 0)
  for (const index of neighbors(run.board.game.config, 31))
    assert.equal(run.board.game.cells[index]!.visibility, 'revealed')
  assert.equal(run.health, 3)
  assert.equal(run.phase, 'exploring')
  run = actStory(run, { type: 'visit', index: 52 })
  assert.equal(storyLessonComplete(run), true)
  assert.equal(actStory(run, { type: 'continue' }).floor, 2)
})

test('prologue reload, camp arrival and optional reward settle once without replacing a live roguelite', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const roguelite = new ExpeditionSession(repository, new FakeRuntime())
  assert.equal(roguelite.start('explorer', []), true)
  const original = repository.expedition()!.journal
  let story = new StorySession(new CampSession(repository))
  for (let floor = 0; floor < 3; floor++) {
    solveFloor(
      story.run!,
      (action) => {
        story.dispatch(action)
      },
      () => story.run!,
    )
    const before = story.run
    story = new StorySession(new CampSession(repository))
    assert.deepEqual(story.run, before)
    assert.equal(story.dispatch({ type: 'continue' }), true)
  }
  assert.equal(story.run, null)
  assert.equal(story.camp.camp.supplies, 90)
  assert.deepEqual(repository.expedition()!.journal, original)
  assert.equal(story.camp.camp.completed, 0, 'teaching must not farm ordinary expedition goals')
  for (let reload = 0; reload < 3; reload++) story = new StorySession(new CampSession(repository))
  assert.equal(story.camp.camp.supplies, 90)
  assert.equal(story.camp.story.claimed.length, 2)
  assert.equal(story.moveCamp(51), true)
  story.meetGuide()
  assert.ok(story.camp.story.completed.includes('meet-guide'))
  assert.equal(story.camp.camp.supplies, 90)
  const resumed = new ExpeditionSession(repository, new FakeRuntime())
  assert.equal(resumed.dispatch({ type: 'retreat' }), true)
  assert.ok(
    repository.expedition()!.story?.arrived,
    'roguelite settlement preserves story progress',
  )
})

test('camp facilities are connected, share purchases and persist the actual next departure loadout', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  new ExpeditionSession(repository, new FakeRuntime()).persist()
  const save = repository.expedition()!
  repository.saveExpedition({ ...save, camp: { ...save.camp, supplies: 10000 } })
  const camp = new CampSession(repository)
  assert.equal(camp.purchase('surveyor'), true)
  assert.equal(camp.selectLoadout({ profession: 'surveyor', equipment: [] }), true)
  assert.equal(new ExpeditionSession(repository, new FakeRuntime()).loadout.profession, 'surveyor')
  const board = buildStoryBoard(CAMP_SCENE)
  for (const site of CAMP_SITES) assert.ok(storyPath(board, board.entrance, site.index))
})

test('obsolete story attempts retire once with 200 supplies and preserve permanent progress', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const camp = new CampSession(repository)
  camp.saveStory({
    arrived: false,
    completed: [],
    claimed: [],
    campPosition: 31,
    journal: { revision: 0, actions: [] },
  })
  const first = new StorySession(new CampSession(repository))
  assert.equal(first.run, null)
  assert.equal(first.camp.camp.supplies, 200)
  const second = new StorySession(new CampSession(repository))
  assert.equal(second.camp.camp.supplies, 200)
  assert.equal(second.camp.story.journal, null)
})

test('unavailable storage still permits completing the prologue and using camp in the active tab', () => {
  const storage = {
    getItem: (_key: string): string | null => {
      throw new Error('unavailable')
    },
    setItem: (_key: string, _value: string): void => {
      throw new Error('unavailable')
    },
    removeItem: (_key: string): void => {
      throw new Error('unavailable')
    },
  }
  const repository = new VariantRepository(storage)
  const story = new StorySession(new CampSession(repository))
  for (let floor = 0; floor < 3; floor++) {
    solveFloor(
      story.run!,
      (action) => {
        story.dispatch(action)
      },
      () => story.run!,
    )
    story.dispatch({ type: 'continue' })
  }
  assert.equal(repository.available, false)
  assert.equal(story.run, null)
  assert.equal(story.camp.camp.supplies, 90)
  assert.equal(story.moveCamp(51), true)
  story.meetGuide()
  assert.ok(story.camp.story.completed.includes('meet-guide'))
})

test('malformed story revisions cannot claim retirement compensation', () => {
  for (const revision of [-1, 0.5, 1_000_001]) {
    assert.equal(decodeStory({ journal: { revision, actions: [] } })?.journal, null)
  }
  assert.equal(decodeStory({ journal: { actions: [] } })?.journal, null)
})

test('archive purchases preserve the frozen departure of a paused roguelite', () => {
  const repository = new VariantRepository(new MemoryStorage())
  new ExpeditionSession(repository, new FakeRuntime()).persist()
  const save = repository.expedition()!
  repository.saveExpedition({ ...save, camp: { ...save.camp, supplies: 10000 } })
  const session = new ExpeditionSession(repository, new FakeRuntime())
  assert.equal(session.start('explorer', []), true)
  const run = session.run
  assert.equal(new CampSession(repository).purchase('archive'), true)
  const resumed = new ExpeditionSession(repository, new FakeRuntime())
  assert.deepEqual(resumed.run, run)
  assert.equal(resumed.run!.departure.archive, false)
  assert.ok(resumed.camp.upgrades.includes('archive'))
})

test('a full legacy journal migrates to a checkpoint and keeps accepting actions', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const camp = new CampSession(repository)
  const actions: StoryAction[] = Array.from({ length: 3000 }, () => ({ type: 'flag', index: 22 }))
  camp.saveStory({ ...camp.story, journal: { revision: 1, actions } })
  const session = new StorySession(new CampSession(repository))
  assert.equal(session.camp.story.journal, null)
  assert.ok(session.camp.story.world)
  assert.equal(session.dispatch({ type: 'inspect', index: 12 }), true)
  assert.deepEqual(new StorySession(new CampSession(repository)).run, session.run)
})

test('a concurrent roguelite checkpoint and settlement preserve newer story and camp changes', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const expedition = new ExpeditionSession(repository, new FakeRuntime())
  expedition.start('explorer', [])
  const story = new StorySession(new CampSession(new VariantRepository(storage)))
  for (let floor = 0; floor < 3; floor++) {
    solveFloor(
      story.run!,
      (action) => {
        story.dispatch(action)
      },
      () => story.run!,
    )
    story.dispatch({ type: 'continue' })
  }
  story.moveCamp(51)
  assert.notEqual(story.camp.story.campPosition, 51, 'the traveler stands beside the guide')
  story.meetGuide()
  const progress = story.camp.story
  const loadout = { profession: 'explorer' as const, equipment: [] }
  story.camp.selectLoadout(loadout)
  expedition.persist()
  assert.deepEqual(repository.expedition()!.story, progress)
  assert.equal(repository.expedition()!.camp.supplies, 90)
  assert.deepEqual(repository.expedition()!.loadout, loadout)
  assert.equal(expedition.dispatch({ type: 'retreat' }), true)
  assert.deepEqual(repository.expedition()!.story, progress)
  assert.equal(repository.expedition()!.camp.supplies, 90)
})

test('dialogue checkpoints survive reload and completion accepts a quest only once', () => {
  const repository = new VariantRepository(new MemoryStorage())
  let session = new StorySession(new CampSession(repository))
  session.checkpointDialogue('wake', 1)
  session = new StorySession(new CampSession(repository))
  assert.deepEqual(session.camp.story.dialogue?.active, { id: 'wake', beat: 1 })
  assert.equal(session.completeDialogue('wake'), 'reach-camp')
  session = new StorySession(new CampSession(repository))
  assert.equal(session.completeDialogue('wake'), null)
  assert.deepEqual(session.camp.story.dialogue, { completed: ['wake'], active: null })
  assert.deepEqual(session.camp.story.accepted, ['reach-camp'])
  session.camp.saveStory({ ...session.camp.story, completed: ['reach-camp'], pinned: [] })
  session.togglePin('reach-camp')
  assert.deepEqual(session.camp.story.pinned, [])
})

test('a full legacy return route migrates without resetting the player or paying again', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const camp = new CampSession(repository)
  const actions: StoryAction[] = [
    { type: 'return' },
    ...Array.from({ length: 2999 }, (): StoryAction => ({ type: 'flag', index: 13 })),
  ]
  camp.saveStory({
    ...camp.story,
    arrived: true,
    routeLegacy: true,
    completed: ['reach-camp', 'lost-satchel'],
    route: { revision: 1, actions: [] },
    journal: { revision: 1, actions },
  })
  const balance = camp.camp.supplies
  const session = new StorySession(camp)
  assert.equal(session.run?.floor, 2)
  assert.equal(camp.story.routeLegacy, undefined)
  assert.equal(camp.story.route, undefined)
  assert.equal(camp.story.journal, null)
  assert.equal(session.dispatch({ type: 'flag', index: 13 }), true)
  assert.deepEqual(new StorySession(new CampSession(repository)).run, session.run)
  assert.equal(camp.camp.supplies, balance)
})

test('the northern overworld route is physically discovered, reported once and retained on return', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const camp = new CampSession(repository)
  camp.saveStory({
    ...camp.story,
    arrived: true,
    completed: ['reach-camp', 'meet-guide'],
    mapOwned: true,
    campPosition: 13,
  })
  let session = new StorySession(camp)
  assert.equal(session.enterNorthRoad(), true)
  assert.equal(session.run!.board.scene.id, 'north-road')
  assert.equal(session.completeDialogue('north-road-start'), 'survey-road')
  session.completeDialogue('north-road-report')
  assert.ok(!camp.story.facts?.includes('road-reported'))
  solveFloor(
    session.run!,
    (action) => {
      session.dispatch(action)
    },
    () => session.run!,
  )
  session.dispatch({ type: 'visit', index: session.run!.board.exit })
  assert.ok(camp.story.facts?.includes('lift-discovered'))
  const board = session.run!.board
  assert.ok(!camp.story.completed.includes('survey-road'))
  session.completeDialogue('north-road-found')
  session.dispatch({ type: 'visit', index: session.run!.board.entrance })
  assert.equal(session.dispatch({ type: 'return' }), true)
  assert.equal(session.run, null)
  assert.equal(camp.story.campPosition, 13)
  session.moveCamp(51)
  const supplies = camp.camp.supplies
  session.completeDialogue('north-road-report')
  assert.ok(camp.story.completed.includes('survey-road'))
  assert.equal(camp.camp.supplies, supplies + 20)
  session = new StorySession(new CampSession(repository))
  session.completeDialogue('north-road-report')
  assert.equal(camp.camp.supplies, supplies + 20)
  session.moveCamp(13)
  assert.equal(session.enterNorthRoad(), true)
  assert.deepEqual(session.run!.board, board)
  session = new StorySession(new CampSession(repository))
  assert.equal(session.run!.board.scene.id, 'north-road')
  assert.deepEqual(session.run!.board, board)
})

test('quarry spindle requires collection, repairs persist and the tower has a physical return route', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const camp = new CampSession(repository)
  camp.saveStory({
    ...camp.story,
    arrived: true,
    completed: ['reach-camp', 'meet-guide', 'survey-road'],
    mapOwned: true,
    campPosition: 13,
  })
  let session = new StorySession(camp)
  assert.equal(session.enterNorthRoad(), true)
  session.dispatch({ type: 'visit', index: 75 })
  assert.equal(session.travelWorld(), false)
  session.completeDialogue('quarry-lead')
  assert.equal(session.travelWorld(), true)
  for (let floor = 4; floor <= 6; floor++) {
    assert.equal(session.run!.floor, floor)
    solveFloor(
      session.run!,
      (action) => {
        session.dispatch(action)
      },
      () => session.run!,
    )
    if (floor < 6) assert.equal(session.travelWorld(), true)
  }
  assert.ok(session.camp.story.facts?.includes('spindle-secured'))
  const retry = actStory({ ...session.run!, phase: 'fallen', health: 0 }, { type: 'retry' })
  assert.equal(retry.collected, true, 'retry must not respawn a secured spindle')
  assert.ok(!session.camp.story.facts?.includes('lift-restored'))
  session.completeDialogue('spindle-found')
  for (let floor = 6; floor >= 4; floor--) {
    session.dispatch({ type: 'visit', index: session.run!.board.entrance })
    assert.equal(session.travelWorld(), true)
  }
  assert.equal(session.run!.floor, 3)
  assert.equal(session.run!.player, 75)
  session.dispatch({ type: 'visit', index: session.run!.board.exit })
  assert.equal(session.travelWorld(), true)
  assert.ok(session.camp.story.completed.includes('repair-lift'))
  session.completeDialogue('lift-repaired')
  assert.equal(session.travelWorld(), true)
  assert.equal(session.run!.floor, 7)
  session.dispatch({ type: 'visit', index: session.run!.board.exit })
  session.completeDialogue('tower-arrival')
  assert.ok(session.camp.story.completed.includes('reach-tower'))
  const balance = session.camp.camp.supplies
  session = new StorySession(new CampSession(repository))
  assert.equal(session.run!.floor, 7)
  session.dispatch({ type: 'visit', index: session.run!.board.entrance })
  assert.equal(session.travelWorld(), true)
  assert.equal(session.run!.floor, 3)
  assert.equal(session.travelWorld(), true)
  assert.equal(session.run!.floor, 7)
  assert.equal(session.camp.camp.supplies, balance)
  assert.equal(
    session.camp.story.world!.scenes.filter((scene) => scene.id === 'quarry-machine').length,
    1,
  )
})
