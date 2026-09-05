import test from 'node:test'
import assert from 'node:assert/strict'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { loadExpeditionSave, decodeExpeditionSave } from '../src/persistence/variant-decoders.js'
import { EXPEDITION_RULES_REVISION } from '../src/persistence/expedition-format.js'
import { expeditionEarnings, frontierCells } from '../src/game/expedition.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { returnedToCampCopy } from '../src/ui/variant-copy.js'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import type { Camp, ExpeditionSave, VariantRecord } from '../src/types/variants.js'

const key = 'minesweeper.variants.v1.expedition'
const camp: Camp = { supplies: 321, completed: 2, upgrades: ['engineer', 'workshop'] }
const records: readonly VariantRecord[] = [
  {
    date: '2026-09-03T00:00:00.000Z',
    outcome: 'won',
    earned: 90,
    depth: 3,
    steps: 120,
    difficulty: 'relaxed',
  },
]

/** Construct a current envelope without requiring any historical gameplay implementation. */
function currentSave(): ExpeditionSave {
  return {
    version: 4,
    difficulty: 'relaxed',
    camp,
    records,
    journal: {
      departure: CURRENT_DEPARTURE,
      rulesRevision: EXPEDITION_RULES_REVISION,
      returnSupplies: 0,
      actions: [],
    },
  }
}

test('all pre-checkpoint expeditions retire with exactly one 200-supply credit and preserve camp history', () => {
  for (const version of [1, 2, 3]) {
    for (const rules of ['original', 'health-v1', 'bastion-v1', 'brood-v1', 'tactics-v2']) {
      const storage = new MemoryStorage()
      storage.setItem(
        key,
        JSON.stringify({
          version,
          camp,
          records,
          difficulty: 'relaxed',
          journal: { departure: { rules }, actions: [{ type: 'removed-action', index: 99999 }] },
        }),
      )
      const repository = new VariantRepository(storage)
      const session = new ExpeditionSession(repository, new FakeRuntime())
      assert.equal(session.run, null)
      assert.equal(repository.returnedSupplies, 200)
      assert.deepEqual(session.camp, { ...camp, supplies: 521 })
      assert.deepEqual(session.records, records)
      assert.equal(session.difficulty, 'relaxed')
      const persisted = decodeExpeditionSave(storage.getItem(key))
      assert.equal(persisted?.version, 4)
      assert.equal(persisted?.journal, null)
      for (let reload = 0; reload < 3; reload++) {
        const nextRepository = new VariantRepository(storage)
        const next = new ExpeditionSession(nextRepository, new FakeRuntime())
        assert.equal(next.camp.supplies, 521)
        assert.equal(nextRepository.returnedSupplies, null)
      }
      assert.ok(session.purchase('surveyor'))
      assert.equal(
        new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).camp.supplies,
        481,
      )
    }
  }
})

test('camp-only and settled saves receive no compensation and do not gain victory records', () => {
  for (const version of [1, 2, 3, 4]) {
    for (const journal of [null, undefined]) {
      const loaded = loadExpeditionSave(JSON.stringify({ version, camp, records, journal }))
      assert.deepEqual(loaded?.save.camp, camp)
      assert.deepEqual(loaded?.save.records, records)
      assert.equal(loaded?.returnedSupplies, null)
    }
  }
})

test('damaged pre-checkpoint journal shapes still receive retirement compensation exactly once', () => {
  for (const version of [1, 2, 3]) {
    for (const journal of [[], 7, 'damaged', false]) {
      const storage = new MemoryStorage()
      storage.setItem(key, JSON.stringify({ version, camp, records, journal }))
      const repository = new VariantRepository(storage)
      const session = new ExpeditionSession(repository, new FakeRuntime())
      assert.equal(session.run, null)
      assert.equal(repository.returnedSupplies, 200)
      assert.deepEqual(session.camp, { ...camp, supplies: 521 })
      assert.deepEqual(session.records, records)
      const restored = new VariantRepository(storage)
      assert.equal(new ExpeditionSession(restored, new FakeRuntime()).camp.supplies, 521)
      assert.equal(restored.returnedSupplies, null)
      assert.equal(decodeExpeditionSave(storage.getItem(key))?.journal, null)
    }
  }
})

test('retirement keeps large valid balances loadable without exceeding exact integer storage', () => {
  for (const supplies of [1e9, 1e12, Number.MAX_SAFE_INTEGER - 50]) {
    const loaded = loadExpeditionSave(
      JSON.stringify({ version: 3, camp: { ...camp, supplies }, records, journal: {} }),
    )!
    const expected = Math.min(Number.MAX_SAFE_INTEGER, supplies + 200)
    assert.equal(loaded.save.camp.supplies, expected)
    assert.equal(loaded.returnedSupplies, expected - supplies)
    assert.deepEqual(decodeExpeditionSave(JSON.stringify(loaded.save)), loaded.save)
  }
})

test('future rule changes extract a bounded checkpoint without decoding obsolete actions', () => {
  const storage = new MemoryStorage()
  storage.setItem(
    key,
    JSON.stringify({
      ...currentSave(),
      journal: {
        rulesRevision: 0,
        returnSupplies: 157,
        actions: [{ type: 'removed' }],
      },
    }),
  )
  const repository = new VariantRepository(storage)
  const session = new ExpeditionSession(repository, new FakeRuntime())
  assert.equal(session.run, null)
  assert.equal(repository.returnedSupplies, 157)
  assert.equal(session.camp.supplies, 478)
  assert.deepEqual(session.records, records)
  assert.equal(
    new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).camp.supplies,
    478,
  )
  for (const returnSupplies of [-1, 0.5, 10001, '200', null]) {
    const loaded = loadExpeditionSave(
      JSON.stringify({ ...currentSave(), journal: { rulesRevision: 0, returnSupplies } }),
    )
    assert.equal(loaded?.save.camp.supplies, camp.supplies)
    assert.equal(loaded?.save.journal, null)
  }
})

test('current runs restore normally and checkpoint the actual difficulty-scaled extraction amount', () => {
  const storage = new MemoryStorage()
  const runtime = new FakeRuntime()
  let session = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.ok(session.start('explorer', [], 'standard'))
  for (let step = 0; session.run?.phase === 'exploring' && step < 200; step++) {
    const run = session.run
    const index = walkingPath(run, run.exit)
      ? run.exit
      : [...frontierCells(run)].find((cell) => !run.game.cells[cell]?.mine)
    assert.notEqual(index, undefined)
    assert.ok(
      session.dispatch({ type: walkingPath(run, run.exit) ? 'move' : 'reveal', index: index! }),
    )
  }
  const run = session.run!
  assert.equal(run.phase, 'reward')
  const checkpoint = expeditionEarnings({ ...run, phase: 'retreated' })
  assert.ok(checkpoint > 0)
  const saved = decodeExpeditionSave(storage.getItem(key))!
  assert.equal(saved.journal?.returnSupplies, checkpoint)
  session = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.deepEqual(session.run, run)
  assert.equal(session.camp.supplies, 0)
  assert.ok(session.dispatch({ type: 'retreat' }))
  assert.equal(session.camp.supplies, checkpoint)
  assert.equal(decodeExpeditionSave(storage.getItem(key))?.journal, null)
  assert.equal(
    new ExpeditionSession(new VariantRepository(storage), runtime).camp.supplies,
    checkpoint,
  )
})

test('malformed current journals preserve valid permanent progress without awarding recovery credit', () => {
  const loaded = loadExpeditionSave(
    JSON.stringify({
      ...currentSave(),
      journal: {
        ...currentSave().journal,
        actions: [{ type: 'scan', row: 0 }],
      },
    }),
  )
  assert.equal(loaded?.save.journal, null)
  assert.equal(loaded?.recovered, true)
  assert.equal(loaded?.returnedSupplies, null)
  assert.deepEqual(loaded?.save.camp, camp)
  assert.deepEqual(loaded?.save.records, records)
})

test('failed storage writes cannot compound retirement credit across retries or reloads', () => {
  const memory = new MemoryStorage()
  memory.setItem(key, JSON.stringify({ version: 3, camp, records, journal: { actions: [] } }))
  let fail = true
  const storage = {
    getItem: (name: string): string | null => memory.getItem(name),
    setItem: (name: string, value: string): void => {
      if (fail) throw new Error('quota')
      memory.setItem(name, value)
    },
    removeItem: (name: string): void => memory.removeItem(name),
  }
  const repository = new VariantRepository(storage)
  const session = new ExpeditionSession(repository, new FakeRuntime())
  assert.equal(repository.available, false)
  assert.equal(session.camp.supplies, 521)
  assert.equal(
    new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).camp.supplies,
    521,
  )
  fail = false
  session.persist()
  assert.equal(
    new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).camp.supplies,
    521,
  )
  assert.equal(decodeExpeditionSave(memory.getItem(key))?.journal, null)
})

test('update-return notices include the credited amount in every supported language', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    assert.ok(returnedToCampCopy(language, 200).includes('200'))
    assert.ok(returnedToCampCopy(language, 157).includes('157'))
  }
})
