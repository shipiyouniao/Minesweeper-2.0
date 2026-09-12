import assert from 'node:assert/strict'
import test from 'node:test'
import { RecollectionSession } from '../src/application/recollection-session.js'
import { StorySession } from '../src/application/story-session.js'
import { CampSession } from '../src/application/camp-session.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeRecollection } from '../src/persistence/recollection-decoder.js'
import { generateRecollectionFloor } from '../src/game/recollection-layout.js'
import {
  recollectionDraw,
  snapshotRecollection,
  recollectionUnlocks,
  RECOLLECTION_BOSSES,
} from '../src/game/recollection.js'
import { createExpedition, actExpedition, frontierCells } from '../src/game/expedition.js'
import { floorObjectiveComplete } from '../src/game/floor-circuits.js'
import { enterEncounter } from '../src/game/encounter-roster.js'
import { encounterTier } from '../src/game/encounter-tiers.js'
import { expeditionConfig } from '../src/game/variant-difficulty.js'
import { regionalCamp } from '../src/game/regional-camps.js'
import { buildStoryBoard } from '../src/game/story.js'
import { milestoneProgress } from '../src/game/milestones.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { neighbors } from '../src/game/engine.js'
import { storyAtlasIndex, storyAtlasUnlocked } from '../src/game/story-atlas.js'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import {
  readyChapterTwo,
  finishRecollectionFloor,
  recollectionPowerSolution,
} from './recollection-helpers.js'
import { storyEnvelopeStatus } from '../src/persistence/story-encoder.js'
import { upgradeCost } from '../src/game/camp-progression.js'
import type { Expedition } from '../src/types/variants.js'
import { planRecollectionPower } from '../src/game/recollection-network.js'
import { generateDungeon } from '../src/game/dungeon-generator.js'

test('the second camp is physically gated and preserves the shared economy and paused attempt', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const camp = readyChapterTwo(repository)
  const paused = repository.expedition()!.journal
  const funded = repository.expedition()!
  repository.saveExpedition({ ...funded, camp: { ...funded.camp, supplies: 10000 } })
  const initial = camp.story
  camp.saveStory({ ...initial, facts: initial.facts!.filter((id) => id !== 'chapter-one-cleared') })
  assert.equal(new StorySession(camp).travelNorthwest(), false)
  assert.equal(storyAtlasUnlocked(camp.story, null, storyAtlasIndex('reed-camp')), false)
  camp.saveStory(initial)
  const story = new StorySession(camp)
  assert.ok(story.travelNorthwest())
  assert.equal(story.run, null)
  assert.equal(camp.story.campId, 'reed-camp')
  assert.equal(camp.story.campPosition, 102)
  assert.ok(camp.purchase('surveyor'))
  assert.equal(camp.camp.supplies, 10000 - upgradeCost('surveyor'))
  assert.ok(camp.selectLoadout({ profession: 'surveyor', equipment: [] }))
  assert.equal(new ExpeditionSession(repository, new FakeRuntime()).loadout.profession, 'surveyor')
  assert.ok(camp.story.accepted!.includes('settle-reed-camp'))
  assert.equal(story.leaveCamp(), false)
  assert.equal(story.enterNorthRoad(), false)
  assert.equal(story.completeRegionalScene('recollection-light'), false)
  assert.ok(story.completeRegionalScene('reed-arrival'))
  assert.ok(story.moveCamp(49))
  assert.ok(story.completeRegionalScene('recollection-light'))
  assert.ok(camp.story.completed.includes('settle-reed-camp'))
  const reload = new StorySession(new CampSession(repository))
  assert.equal(reload.camp.story.campId, 'reed-camp')
  assert.equal(reload.camp.story.campPosition, 49)
  assert.deepEqual(repository.expedition()!.journal, paused)
  assert.ok(reload.moveCamp(102))
  assert.ok(reload.travelNorthwest())
  assert.equal(reload.run!.board.scene.id, 'blockade-pass')
  assert.ok(reload.dispatch({ type: 'visit', index: 92 }))
  assert.ok(reload.travelNorthwest())
  assert.equal(camp.story.campId, 'camp')
  assert.equal(camp.story.campPosition, 19)
  assert.equal(camp.loadout.profession, 'surveyor')
  assert.equal(camp.camp.supplies, 10000 - upgradeCost('surveyor'))
  assert.ok(camp.story.facts!.includes('recollection-awakened'))
  assert.deepEqual(repository.expedition()!.journal, paused)
})

test('a future regional camp remains read-only instead of silently moving its save to the forest', () => {
  const storage = new MemoryStorage(),
    repository = new VariantRepository(storage)
  const camp = readyChapterTwo(repository),
    story = new StorySession(camp)
  assert.ok(story.travelNorthwest())
  const key = 'minesweeper.variants.v1.expedition'
  const future = storage.getItem(key)!.replace('"campId":"reed-camp"', '"campId":"future-camp"')
  assert.equal(storyEnvelopeStatus(future), 'unsupported')
  storage.setItem(key, future)
  new CampSession(new VariantRepository(storage)).acceptDiscoveredRoutes()
  assert.equal(storage.getItem(key), future)
})

test('mechanism floors reach a selected boss through accepted actions and replay without terrain leakage', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const camp = readyChapterTwo(repository),
    story = new StorySession(camp)
  assert.ok(story.travelNorthwest())
  assert.ok(story.completeRegionalScene('reed-arrival'))
  assert.ok(story.moveCamp(49))
  assert.ok(story.completeRegionalScene('recollection-light'))
  const old = new ExpeditionSession(repository, new FakeRuntime())
  assert.ok(old.dispatch({ type: 'retreat' }))
  assert.ok(old.returnToCamp())
  const session = new ExpeditionSession(repository, new FakeRuntime())
  assert.ok(
    session.start('explorer', [], 'relaxed', { floors: ['relay', 'routing'], bosses: ['bastion'] }),
  )
  for (let floor = 1; floor <= 3; floor++) {
    finishRecollectionFloor(session)
    if (floor < 3) {
      assert.equal(session.run!.phase, 'reward')
      assert.ok(session.dispatch({ type: 'relic', relic: session.run!.offers[0]! }))
    }
  }
  assert.equal(session.run!.phase, 'boss')
  assert.equal(session.run!.encounter!.kind, 'bastion')
  assert.equal(session.run!.circuits, undefined)
  assert.equal(session.run!.power, undefined)
  assert.deepEqual(new ExpeditionSession(repository, new FakeRuntime()).run, session.run)
})

test('each regional camp has safe reachable facilities and never forces a resident overlap', () => {
  for (const id of ['camp', 'reed-camp'] as const) {
    const camp = regionalCamp(id),
      board = buildStoryBoard(camp.scene)
    assert.ok(camp.scene.rows.every((row) => row.length === board.game.config.width))
    assert.equal(board.game.config.mines, 0)
    const seen = new Set([board.entrance]),
      queue = [board.entrance]
    for (const index of queue)
      for (const near of adjacentSteps(board.game, index)) {
        if (
          seen.has(near) ||
          board.walls.includes(near) ||
          near === camp.nia ||
          near === camp.toma ||
          (id === 'camp' && near === 51)
        )
          continue
        seen.add(near)
        queue.push(near)
      }
    for (const site of camp.sites.filter((site) => site.destination !== 'guide'))
      assert.ok(seen.has(site.index))
    assert.ok(seen.has(board.exit))
  }
})

test('recollection unlocks retain veteran bosses but reject unearned, empty and duplicate selections', () => {
  const repository = new VariantRepository(new MemoryStorage())
  readyChapterTwo(repository)
  const old = repository.expedition()!
  repository.saveExpedition({
    ...old,
    camp: {
      ...old.camp,
      milestones: { ...milestoneProgress(old.camp), bossKinds: ['brood', 'tide'] },
    },
  })
  assert.deepEqual(recollectionUnlocks(repository.expedition()!).bosses, [
    'bastion',
    'brood',
    'tide',
  ])
  for (const bad of [
    { floors: [], bosses: ['bastion'] },
    { floors: ['ordinary'], bosses: [] },
    { floors: ['missing'], bosses: ['bastion'] },
    { floors: ['relay', 'relay'], bosses: ['bastion'] },
    { floors: ['ordinary'], bosses: ['bastion', 'bastion'] },
  ])
    assert.equal(decodeRecollection(bad), null)
  const selection = { floors: ['relay'], bosses: ['bastion'] } as const
  const session = new RecollectionSession(repository, new FakeRuntime())
  assert.equal(session.available, false)
  assert.equal(session.toggleFloor('relay'), false)
  assert.equal(session.start(), false)
  const expedition = session.expedition
  assert.ok(expedition.dispatch({ type: 'retreat' }))
  assert.ok(expedition.returnToCamp())
  assert.equal(expedition.start('explorer', [], 'relaxed', selection), false)
})

test('configured departures replay their exact pools and cannot be edited during an active memory', () => {
  const repository = new VariantRepository(new MemoryStorage())
  const camp = readyChapterTwo(repository),
    story = new StorySession(camp)
  assert.ok(story.travelNorthwest())
  assert.ok(story.completeRegionalScene('reed-arrival'))
  assert.ok(story.moveCamp(49))
  assert.ok(story.completeRegionalScene('recollection-light'))
  const old = new ExpeditionSession(repository, new FakeRuntime())
  assert.ok(old.dispatch({ type: 'retreat' }))
  assert.ok(old.returnToCamp())
  const session = new RecollectionSession(repository, new FakeRuntime())
  assert.ok(session.toggleFloor('ordinary'))
  assert.ok(session.toggleFloor('routing'))
  assert.ok(session.selectDifficulty('advanced'))
  assert.ok(session.start())
  assert.deepEqual(session.expedition.run!.departure.recollection, {
    floors: ['relay'],
    bosses: ['bastion'],
    remainingBosses: ['bastion'],
  })
  assert.equal(session.toggleFloor('routing'), false)
  assert.equal(session.toggleBoss('matrix'), false)
  const before = session.expedition.run!
  const safe = [...frontierCells(before)].find((index) => !before.game.cells[index]!.mine)!
  assert.ok(session.expedition.dispatch({ type: 'reveal', index: safe }))
  assert.deepEqual(new ExpeditionSession(repository, new FakeRuntime()).run, session.expedition.run)
  assert.ok(session.expedition.dispatch({ type: 'retreat' }))
  assert.ok(session.expedition.returnToCamp())
  const restored = new RecollectionSession(repository, new FakeRuntime())
  assert.deepEqual(restored.selected, {
    floors: ['relay'],
    bosses: ['bastion'],
    remainingBosses: ['bastion'],
  })
  assert.equal(camp.story.campId, 'reed-camp')
  assert.equal(camp.story.campPosition, 49)
})

/** Solve terrain with a truth oracle solely to verify that every physical mechanism is operable. */
function exposeTerrain(run: Expedition): Expedition {
  return {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell) => ({
        ...cell,
        visibility: cell.mine ? 'flagged' : 'revealed',
      })),
    },
  }
}

test('random mechanisms use truthful connected terrain and can complete across all five sizes', () => {
  const signatures = new Set<string>()
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const)
    for (let seed = 0; seed < 12; seed++)
      for (const kind of ['relay', 'routing'] as const) {
        const departure = {
          ...CURRENT_DEPARTURE,
          difficulty,
          seed,
          recollection: { floors: [kind], bosses: ['bastion'] as const },
        }
        const layout = generateRecollectionFloor(kind, seed, expeditionConfig(departure, 1))
        assert.equal(layout.treasures.length, 3)
        assert.equal(layout.game.cells.filter((cell) => cell.mine).length, layout.game.config.mines)
        assert.deepEqual(
          generateRecollectionFloor(kind, seed, expeditionConfig(departure, 1)),
          layout,
        )
        signatures.add(layout.game.cells.map((cell) => Number(cell.mine)).join(''))
        for (const [index, cell] of layout.game.cells.entries())
          assert.equal(
            cell.adjacent,
            neighbors(layout.game.config, index).filter((near) => layout.game.cells[near]!.mine)
              .length,
          )
        let run = exposeTerrain(createExpedition(departure))
        assert.equal(floorObjectiveComplete(run), false)
        if (run.circuits)
          for (const relay of run.circuits.relays) {
            assert.equal(floorObjectiveComplete(run), false)
            const next = actExpedition(run, { type: 'interact', index: relay.index })
            assert.notEqual(next, run)
            run = next
          }
        else for (const action of recollectionPowerSolution(run)) run = actExpedition(run, action)
        assert.ok(floorObjectiveComplete(run))
      }
  assert.ok(signatures.size > 50)
})

test('generated mechanism counts and power topologies vary without unused branches or cycles', () => {
  for (const width of [9, 11, 13, 15, 17]) {
    const relayCounts = new Set<number>(),
      networkShapes = new Set<string>()
    const mines = Math.round(width * width * 0.2)
    for (let seed = 0; seed < 128; seed++) {
      const relay = generateRecollectionFloor('relay', seed, { width, height: width, mines })
      relayCounts.add(relay.circuits!.relays.length)
      assert.ok(relay.circuits!.relays.length >= 2)
      assert.equal(
        new Set(relay.circuits!.relays.map((entry) => entry.index)).size,
        relay.circuits!.relays.length,
      )
      const plan = planRecollectionPower(seed, width)
      networkShapes.add(
        JSON.stringify({
          junctions: plan.junctions,
          receivers: [...plan.receivers].sort((a, b) => a.node - b.node || a.branch - b.branch),
        }),
      )
      assert.ok(plan.junctions.length >= 2 && plan.junctions.length <= 4)
      assert.ok(plan.junctions.some((input) => input !== null))
      for (const [node, input] of plan.junctions.entries()) {
        assert.ok(
          input === null || input.node < node,
          'upstream references strictly precede their children',
        )
        for (const branch of [0, 1])
          assert.equal(
            [...plan.junctions, ...plan.receivers].filter(
              (entry) => entry?.node === node && entry.branch === branch,
            ).length,
            1,
            'each branch has exactly one useful downstream target',
          )
      }
    }
    assert.ok(relayCounts.size >= 2)
    assert.ok(
      networkShapes.size >= 8,
      `width ${width} needs structural variety, not only moved icons`,
    )
  }
})

test('every selector state in representative generated networks can still complete', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    const run = exposeTerrain(
      createExpedition({
        ...CURRENT_DEPARTURE,
        seed: 97,
        difficulty,
        recollection: { floors: ['routing'], bosses: ['bastion'] },
      }),
    )
    const power = run.power!
    for (let state = 0; state < 3 ** power.junctions.length; state++) {
      let digits = state
      const junctions = power.junctions.map((junction) => {
        const digit = digits % 3
        digits = Math.floor(digits / 3)
        return {
          ...junction,
          selected: digit === 0 ? null : digit === 1 ? (0 as const) : (1 as const),
        }
      })
      let current: Expedition = { ...run, power: { ...power, junctions } }
      for (const action of recollectionPowerSolution(current))
        current = actExpedition(current, action)
      assert.ok(floorObjectiveComplete(current))
    }
  }
})

test('terrain acceptance is bounded and cannot silently omit required mechanisms', () => {
  let attempts = 0
  assert.throws(
    () =>
      generateDungeon(17, 15, 9, 9, () => {
        attempts++
        return false
      }),
    /requirements/,
  )
  assert.ok(attempts > 0 && attempts <= 129)
})

test('boss selection is restricted to the departure pool and clears ordinary-room mechanisms', () => {
  for (const boss of RECOLLECTION_BOSSES) {
    const departure = {
      ...CURRENT_DEPARTURE,
      recollection: { floors: ['routing'] as const, bosses: [boss] },
    }
    const run = createExpedition(departure)
    const arena = enterEncounter({ ...run, floor: encounterTier(departure.difficulty).floors[0]! })
    assert.equal(arena.encounter!.kind, boss)
    assert.equal(arena.power, undefined)
    assert.equal(arena.circuits, undefined)
    assert.equal(arena.rail, undefined)
  }
})

test('recollection bags exhaust across departures, persist through decoding and refill without an immediate repeat', () => {
  const bosses = ['bastion', 'brood', 'clock'] as const
  for (let seed = 0; seed < 60; seed++) {
    let selection = decodeRecollection({
      floors: ['ordinary'],
      bosses: [...bosses],
      remainingBosses: [...bosses],
    })!
    const seen: string[] = []
    for (let draw = 0; draw < 12; draw++) {
      const next = recollectionDraw(selection, seed + draw, 0)
      if (draw) assert.notEqual(next.boss, seen.at(-1))
      seen.push(next.boss)
      selection = decodeRecollection({
        floors: ['ordinary'],
        bosses: [...bosses],
        remainingBosses: [...next.remainingBosses],
        lastBoss: next.boss,
      })!
      assert.ok(selection)
      if ((draw + 1) % 3 === 0) assert.equal(new Set(seen.slice(-3)).size, 3)
    }
    const original = { floors: ['ordinary'] as const, bosses, remainingBosses: bosses }
    for (let ordinal = 0; ordinal < 9; ordinal++) {
      const replay = recollectionDraw(original, seed, ordinal)
      assert.equal(replay.boss, recollectionDraw(original, seed, ordinal).boss)
    }
  }
  assert.equal(
    decodeRecollection({ floors: ['ordinary'], bosses: ['bastion'], remainingBosses: ['clock'] }),
    null,
  )
  assert.equal(
    decodeRecollection({
      floors: ['ordinary'],
      bosses: ['bastion'],
      remainingBosses: ['bastion', 'bastion'],
    }),
    null,
  )
})

test('accepted encounter entry persists the remaining boss bag once, including reload and another departure', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const camp = readyChapterTwo(repository)
  const story = new StorySession(camp)
  assert.ok(story.travelNorthwest())
  assert.ok(story.completeRegionalScene('reed-arrival'))
  assert.ok(story.moveCamp(49))
  assert.ok(story.completeRegionalScene('recollection-light'))
  const old = new ExpeditionSession(repository, new FakeRuntime())
  assert.ok(old.dispatch({ type: 'retreat' }))
  assert.ok(old.returnToCamp())
  const saved = repository.expedition()!
  repository.saveExpedition({
    ...saved,
    camp: {
      ...saved.camp,
      milestones: { ...milestoneProgress(saved.camp), bossKinds: ['bastion', 'brood'] },
    },
  })
  const seen: string[] = []
  for (let round = 0; round < 4; round++) {
    let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.ok(
      session.start('explorer', [], 'relaxed', {
        floors: ['ordinary'],
        bosses: ['bastion', 'brood'],
      }),
    )
    for (let floor = 1; floor <= 3; floor++) {
      finishRecollectionFloor(session)
      if (floor < 3) assert.ok(session.dispatch({ type: 'relic', relic: session.run!.offers[0]! }))
    }
    seen.push(session.run!.encounter!.kind)
    const beforeReload = new VariantRepository(storage).expedition()!.recollection!
    assert.equal(beforeReload.remainingBosses!.length, round % 2 === 0 ? 1 : 0)
    session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.equal(session.run!.encounter!.kind, seen.at(-1))
    assert.deepEqual(new VariantRepository(storage).expedition()!.recollection, beforeReload)
    assert.ok(session.dispatch({ type: 'retreat' }))
    assert.ok(session.returnToCamp())
  }
  assert.notEqual(seen[0], seen[1])
  assert.notEqual(seen[1], seen[2])
  assert.notEqual(seen[2], seen[3])
})

test('new boss snapshots ignore checkbox order while stored departures retain their replay order', () => {
  const original = {
    floors: ['ordinary'] as const,
    bosses: ['bastion', 'brood', 'clock'] as const,
    remainingBosses: ['bastion', 'brood', 'clock'] as const,
  }
  const rechecked = {
    ...original,
    bosses: ['brood', 'clock', 'bastion'] as const,
    remainingBosses: ['brood', 'clock', 'bastion'] as const,
  }
  assert.deepEqual(snapshotRecollection(original), snapshotRecollection(rechecked))
  const restored = decodeRecollection({
    floors: [...rechecked.floors],
    bosses: [...original.bosses],
    remainingBosses: [...rechecked.remainingBosses],
  })!
  assert.deepEqual(restored.remainingBosses, rechecked.remainingBosses)
  for (let seed = 0; seed < 60; seed++) {
    for (let ordinal = 0; ordinal < 9; ordinal++) {
      assert.deepEqual(
        recollectionDraw(snapshotRecollection(original), seed, ordinal),
        recollectionDraw(snapshotRecollection(rechecked), seed, ordinal),
      )
      assert.deepEqual(
        recollectionDraw(restored, seed, ordinal),
        recollectionDraw({ ...rechecked, bosses: original.bosses }, seed, ordinal),
      )
    }
  }
  assert.deepEqual(snapshotRecollection({ ...original, remainingBosses: [] }).remainingBosses, [])
  assert.equal(
    snapshotRecollection({ floors: original.floors, bosses: original.bosses }).remainingBosses,
    undefined,
  )
})
