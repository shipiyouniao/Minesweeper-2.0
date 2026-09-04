import { defeatEncounter } from './encounter-helpers.js'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import {
  VARIANT_TIERS,
  expeditionConfig,
  expeditionFloors,
  addVariantRecord,
} from '../src/game/variant-difficulty.js'
import { actTwin, createTwin } from '../src/game/twin.js'
import {
  createExpedition,
  actExpedition,
  frontierCells,
  reachableCells,
} from '../src/game/expedition.js'
import { generateDungeon } from '../src/game/dungeon-generator.js'
import { connectedFloor } from '../src/game/dungeon-path.js'
import { neighbors } from '../src/game/engine.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { TwinSession } from '../src/application/twin-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeExpeditionSave, decodeTwinSave } from '../src/persistence/variant-decoders.js'
import { difficultyCopy } from '../src/ui/variant-copy.js'
import { parseVariantCommand } from '../src/ui/variant-input.js'
import type { Departure, VariantRecord } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

test('historical generators match the released layout fingerprint', () => {
  // Captured from e314f814: both opening rules, every old floor density and paired openings.
  const hash = createHash('sha256')
  for (let seed = 0; seed < 100; seed++) {
    for (const mode of ['compact', 'flood'] as const)
      for (const mines of [15, 17, 19, 21, 23])
        hash.update(JSON.stringify(generateDungeon(seed, mines, mode)))

    hash.update(
      JSON.stringify(actTwin(createTwin(seed), { side: 'a', type: 'reveal', index: seed % 81 })),
    )
  }

  assert.equal(
    hash.digest('hex'),
    '6ebf91e10ef136c23f40b19959f92f832a4f2e2b2487e002c0f8afb5d0a30b2b',
  )
})

test('all five tiers produce exact disjoint Twin mines and safe openings, including the last cell', () => {
  assert.equal(VARIANT_TIERS.length, 5)
  for (const tier of VARIANT_TIERS) {
    for (let seed = 0; seed < 12; seed++) {
      const index = tier.twin.width * tier.twin.height - 1 - seed
      const twin = actTwin(createTwin(seed, tier.id), { side: 'b', type: 'reveal', index })
      assert.deepEqual(twin.a.config, tier.twin)
      for (const board of [twin.a, twin.b]) {
        assert.equal(board.cells.filter((cell) => cell.mine).length, tier.twin.mines)
        for (const safe of [index, ...neighbors(board.config, index)])
          assert.equal(board.cells[safe]?.mine, false)
      }
      assert.ok(
        twin.a.cells.every((cell, position) => !(cell.mine && twin.b.cells[position]?.mine)),
      )
      assert.equal(actTwin(twin, { side: 'a', type: 'flag', index: twin.a.cells.length }), twin)
    }
  }
})

test('every tier and floor preserves exact mine counts, connected landmarks and complete blank openings', () => {
  for (const tier of VARIANT_TIERS) {
    const departure: Departure = {
      rules: 'difficulty-v1',
      difficulty: tier.id,
      seed: 0,
      profession: 'explorer',
      equipment: [],
      archive: false,
    }
    for (let floor = 1; floor <= tier.floors; floor++) {
      const config = expeditionConfig(departure, floor)
      for (let seed = 0; seed < 8; seed++) {
        const layout = generateDungeon(seed, config.mines, 'flood', config.width, config.height)
        assert.equal(layout.game.cells.filter((cell) => cell.mine).length, config.mines)
        const connected = connectedFloor(layout.game, layout.entrance)
        assert.ok(connected.has(layout.exit))
        assert.ok(layout.treasures.every((index) => connected.has(index)))
        for (const [index, cell] of layout.game.cells.entries()) {
          if (!cell.mine) assert.equal(connected.has(index), !layout.walls.includes(index))
          assert.equal(
            cell.adjacent,
            neighbors(config, index).filter((other) => layout.game.cells[other]?.mine).length,
          )
          if (cell.visibility === 'revealed' && cell.adjacent === 0)
            for (const other of neighbors(config, index))
              if (!layout.walls.includes(other))
                assert.equal(layout.game.cells[other]?.visibility, 'revealed')
        }
      }
    }
  }
})

test('all configured floors are completable and replayable after the relic pool is exhausted', () => {
  for (const tier of VARIANT_TIERS) {
    const storage = new MemoryStorage()
    const runtime = new FakeRuntime()
    let session = new ExpeditionSession(new VariantRepository(storage), runtime)
    session.start('explorer', [], tier.id)
    for (let floor = 1; floor <= tier.floors; floor++) {
      assert.equal(session.run?.floor, floor)
      assert.equal(session.run?.game.config.width, tier.size)
      for (let step = 0; step < tier.size * tier.size; step++) {
        const run = session.run
        assert.ok(run)
        if (run.phase !== 'exploring' || reachableCells(run).has(run.exit)) break
        const index = [...frontierCells(run)].find((candidate) => !run.game.cells[candidate]?.mine)
        assert.notEqual(index, undefined)
        assert.ok(session.dispatch({ type: 'reveal', index: index ?? -1 }))
      }
      assert.ok(session.run)
      if (session.run.phase === 'exploring')
        assert.ok(session.dispatch({ type: 'move', index: session.run.exit }))
      if (session.run?.phase === 'boss')
        for (const action of defeatEncounter(session.run)) assert.ok(session.dispatch(action))
      if (floor < tier.floors) {
        const before = session.run
        session = new ExpeditionSession(new VariantRepository(storage), runtime)
        assert.deepEqual(session.run, before)
        const relic = session.run?.offers[0]
        if (relic) {
          assert.equal(session.dispatch({ type: 'descend' }), false)
          assert.ok(session.dispatch({ type: 'relic', relic }))
        } else assert.ok(session.dispatch({ type: 'descend' }))
      }
    }
    assert.equal(session.run?.phase, 'won')
    assert.equal(session.records[0]?.difficulty, tier.id)
    const restored = new ExpeditionSession(new VariantRepository(storage), runtime)
    assert.equal(restored.run, null)
    assert.equal(restored.camp.supplies, session.camp.supplies)
    assert.equal(restored.difficulty, tier.id)
    assert.equal(restored.records.length, 1)
  }
})

test('large-board tool targets and Twin final-row actions survive reload; bounds follow the saved tier', () => {
  for (const tier of VARIANT_TIERS) {
    const storage = new MemoryStorage()
    const runtime = new FakeRuntime()
    const repository = new VariantRepository(storage)
    const twin = new TwinSession(repository, runtime)
    twin.restart(tier.id)
    assert.ok(
      twin.dispatch({ side: 'b', type: 'reveal', index: tier.twin.width * tier.twin.height - 1 }),
    )
    assert.deepEqual(new TwinSession(repository, runtime).state, twin.state)
    const session = new ExpeditionSession(repository, runtime)
    session.start('explorer', [], tier.id)
    session.dispatch({ type: 'sweep', row: tier.size - 1 })
    session.dispatch({ type: 'probe', index: tier.size * tier.size - 1 })
    assert.deepEqual(new ExpeditionSession(repository, runtime).run, session.run)
    assert.equal(session.dispatch({ type: 'sweep', row: tier.size }), false)
    const badTwin = {
      version: 1,
      rules: 'difficulty-v1',
      difficulty: tier.id,
      seed: 1,
      settled: false,
      records: [],
      actions: [{ side: 'a', type: 'reveal', index: tier.twin.width * tier.twin.height }],
    }
    assert.equal(decodeTwinSave(JSON.stringify(badTwin)), null)
    const departure = {
      rules: 'difficulty-v1',
      difficulty: tier.id,
      seed: 1,
      profession: 'explorer',
      equipment: [],
      archive: false,
    }
    const badRun = {
      version: 3,
      camp: session.camp,
      records: [],
      journal: { departure, actions: [{ type: 'sweep', row: tier.size }] },
    }
    assert.equal(decodeExpeditionSave(JSON.stringify(badRun)), null)
    assert.equal(
      decodeExpeditionSave(
        JSON.stringify({
          ...badRun,
          journal: { departure: { ...departure, difficulty: 'invalid' }, actions: [] },
        }),
      ),
      null,
    )
  }
})

test('historical journals retain their 9 by 9 layouts and remain distinct from new difficulty rules', () => {
  for (const rules of ['original', 'scouting'] as const) {
    const storage = new MemoryStorage()
    const departure: Departure = {
      rules,
      seed: 31,
      profession: 'explorer',
      equipment: [],
      archive: false,
    }
    const run = createExpedition(departure)
    storage.setItem(
      'minesweeper.variants.v1.expedition',
      JSON.stringify({
        version: 3,
        camp: { supplies: 9, upgrades: [], completed: 0 },
        journal: { departure, actions: [{ type: 'scan', row: 8 }] },
        records: [],
      }),
    )
    const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.deepEqual(session.run, actExpedition(run, { type: 'scan', row: 8 }))
    assert.equal(expeditionFloors(departure), 5)
    assert.equal(session.run?.game.config.width, 9)
    session.selectDifficulty('abyss')
    assert.equal(session.run?.departure.difficulty, undefined)
  }
  const storage = new MemoryStorage()
  storage.setItem(
    'minesweeper.variants.v1.twin',
    JSON.stringify({
      version: 1,
      seed: 31,
      actions: [{ side: 'a', type: 'reveal', index: 40 }],
      records: [],
      settled: false,
    }),
  )
  assert.deepEqual(
    new TwinSession(new VariantRepository(storage), new FakeRuntime()).state,
    actTwin(createTwin(31), { side: 'a', type: 'reveal', index: 40 }),
  )
})

test('results retain ten entries per difficulty without evicting other tiers or historical results', () => {
  const old: VariantRecord = { date: '2026-09-03', outcome: 'lost', steps: 2, depth: 0, earned: 0 }
  let records = [old]
  for (const tier of VARIANT_TIERS)
    for (let count = 0; count < 12; count++)
      records = addVariantRecord(records, { ...old, difficulty: tier.id })
  assert.equal(records.length, 51)
  for (const tier of VARIANT_TIERS)
    assert.equal(records.filter((record) => record.difficulty === tier.id).length, 10)
  assert.equal(records.filter((record) => !record.difficulty).length, 1)
  assert.ok(
    decodeTwinSave(JSON.stringify({ version: 1, seed: 1, actions: [], settled: false, records })),
  )
  assert.equal(difficultyCopy('en'), 'Original rules')
})

test('difficulty controls decode and translate every finite choice', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    assert.equal(new Set(VARIANT_TIERS.map((tier) => difficultyCopy(language, tier.id))).size, 5)
  }
  assert.deepEqual(parseVariantCommand('difficulty:abyss'), { type: 'difficulty', value: 'abyss' })
  assert.equal(parseVariantCommand('difficulty:custom'), null)
  assert.equal(parseVariantCommand('difficulty:abyss:extra'), null)
})
