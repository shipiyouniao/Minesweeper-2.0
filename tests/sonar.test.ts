import test from 'node:test'
import assert from 'node:assert/strict'
import {
  actSonar,
  compareSonar,
  createSonar,
  sonarRegion,
  SONAR_ACTION_LIMIT,
} from '../src/game/sonar.js'
import { SonarSession } from '../src/application/sonar-session.js'
import {
  SonarRepository,
  SONAR_STORAGE_KEY,
  rankSonarRecords,
} from '../src/persistence/sonar-repository.js'
import type { SonarAction, SonarRecord, SonarSave } from '../src/types/sonar.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

test('Sonar clips each scan by coordinate geometry and reports fixed physical totals', () => {
  for (const difficulty of ['easy', 'medium', 'expert'] as const) {
    for (let seed = 0; seed < 40; seed++) {
      const state = actSonar(createSonar(seed, difficulty), { type: 'reveal', index: 0 })
      const { width, height } = state.game.config
      for (const center of [0, width - 1, width * height - 1, width + 1]) {
        const expected = state.game.cells.flatMap((cell, index) =>
          Math.abs((index % width) - (center % width)) <= 1 &&
          Math.abs(Math.floor(index / width) - Math.floor(center / width)) <= 1
            ? [{ index, mine: cell.mine }]
            : [],
        )
        assert.deepEqual(
          sonarRegion(state.game.config, center),
          expected.map((cell) => cell.index),
        )
        const scanned = actSonar(state, { type: 'scan', index: center })
        assert.equal(scanned.readings[0]?.mines, expected.filter((cell) => cell.mine).length)
        assert.equal(scanned.game, state.game, 'measuring must not mutate any cells')
        assert.equal(scanned.moves, state.moves)
      }
    }
  }
})

test('Sonar requires generation, rejects invalid/repeated targets and spends at most three charges', () => {
  let state = createSonar(31)
  assert.equal(actSonar(state, { type: 'scan', index: 1 }), state)
  state = actSonar(state, { type: 'reveal', index: 0 })
  for (const index of [-1, 0.5, Infinity, NaN, state.game.cells.length])
    assert.equal(actSonar(state, { type: 'scan', index }), state)
  for (const index of [0, 1, 2]) {
    const next = actSonar(state, { type: 'scan', index })
    assert.equal(next.readings.length, state.readings.length + 1)
    assert.equal(actSonar(next, { type: 'scan', index }), next)
    state = next
  }
  assert.equal(actSonar(state, { type: 'scan', index: 3 }), state)
  assert.equal(state.readings[0]?.mines, 0, 'a zero-total observation remains a real paid reading')
})

test('wrong flags and safe notes do not affect scan truth or become certified by a reading', () => {
  let state = actSonar(createSonar(31), { type: 'reveal', index: 0 })
  const mine = state.game.cells.findIndex((cell) => cell.mine)
  const safe = state.game.cells.findIndex((cell) => !cell.mine && cell.visibility === 'hidden')
  state = actSonar(state, { type: 'flag', index: safe })
  state = actSonar(state, { type: 'mark-safe', index: mine })
  const scanned = actSonar(state, { type: 'scan', index: safe })
  assert.equal(scanned.game, state.game)
  assert.equal(scanned.game.cells[safe]?.visibility, 'flagged')
  assert.ok(scanned.game.safeMarks.includes(mine))
  assert.equal(
    scanned.readings[0]?.mines,
    sonarRegion(state.game.config, safe).filter((index) => state.game.cells[index]?.mine).length,
  )
})

test('overlap cancellation uses only published totals and partitions both regions exactly', () => {
  const state = actSonar(createSonar(17), { type: 'reveal', index: 0 })
  const left = { center: 10, mines: 3 }
  const right = { center: 11, mines: 2 }
  const result = compareSonar(state.game.config, left, right)
  assert.equal(result.common.length, 6)
  assert.equal(result.leftOnly.length, 3)
  assert.equal(result.rightOnly.length, 3)
  assert.equal(result.difference, 1)
  assert.deepEqual(
    new Set([...result.common, ...result.leftOnly]),
    new Set(sonarRegion(state.game.config, left.center)),
  )
  const reverse = compareSonar(state.game.config, right, left)
  assert.equal(reverse.difference, -1)
  assert.deepEqual(reverse.leftOnly, result.rightOnly)
  assert.equal(compareSonar(state.game.config, left, { center: 80, mines: 1 }).common.length, 0)
})

test('opening, annotations and scans replay deterministically in an isolated namespace', () => {
  const storage = new MemoryStorage()
  storage.setItem('minesweeper.variants.v1.twin', 'untouched twin')
  storage.setItem('minesweeper.variants.v1.expedition', 'untouched expedition')
  const session = new SonarSession(new SonarRepository(storage), new FakeRuntime())
  const actions: SonarAction[] = [
    { type: 'reveal', index: 0 },
    { type: 'scan', index: 20 },
    { type: 'scan', index: 21 },
  ]
  for (const action of actions) assert.equal(session.dispatch(action), true)
  const before = storage.getItem(SONAR_STORAGE_KEY)
  assert.equal(session.dispatch({ type: 'scan', index: 20 }), false)
  assert.equal(storage.getItem(SONAR_STORAGE_KEY), before)
  const restored = new SonarSession(new SonarRepository(storage), new FakeRuntime())
  assert.deepEqual(restored.state, session.state)
  assert.equal(storage.getItem('minesweeper.variants.v1.twin'), 'untouched twin')
  assert.equal(storage.getItem('minesweeper.variants.v1.expedition'), 'untouched expedition')
})

test('one completed puzzle records one ranked result through reload, difficulty changes and repeated input', () => {
  const storage = new MemoryStorage()
  const runtime = new FakeRuntime()
  const session = new SonarSession(new SonarRepository(storage), runtime)
  session.dispatch({ type: 'reveal', index: 0 })
  session.dispatch({ type: 'scan', index: 40 })
  for (const [index, cell] of session.state.game.cells.entries())
    if (!cell.mine) session.dispatch({ type: 'reveal', index })
  assert.equal(session.state.game.phase, 'won')
  assert.equal(session.records.length, 1)
  assert.equal(runtime.ids, 1)
  const recovered = new SonarSession(new SonarRepository(storage), runtime)
  assert.deepEqual(recovered.state, session.state)
  assert.equal(recovered.dispatch({ type: 'scan', index: 0 }), false)
  assert.equal(recovered.records.length, 1)
  recovered.restart('expert')
  assert.equal(recovered.state.difficulty, 'expert')
  assert.equal(recovered.state.game.config.mines, 99)
  assert.equal(recovered.records.length, 1)
  assert.equal(recovered.state.readings.length, 0)
})

test('terminal loss rejects all further scans and does not enter win rankings', () => {
  const storage = new MemoryStorage()
  const session = new SonarSession(new SonarRepository(storage), new FakeRuntime())
  session.dispatch({ type: 'reveal', index: 0 })
  session.dispatch({
    type: 'reveal',
    index: session.state.game.cells.findIndex((cell) => cell.mine),
  })
  assert.equal(session.state.game.phase, 'lost')
  assert.equal(session.dispatch({ type: 'scan', index: 10 }), false)
  assert.equal(session.records.length, 0)
  assert.equal(
    new SonarSession(new SonarRepository(storage), new FakeRuntime()).state.game.phase,
    'lost',
  )
})

test('malformed and impossible journals reset once while retaining separately valid records', () => {
  const record: SonarRecord = {
    id: 'old-win',
    date: '2026-09-07T00:00:00Z',
    difficulty: 'easy',
    moves: 20,
    scans: 2,
  }
  const base: SonarSave = {
    version: 1,
    difficulty: 'easy',
    seed: 31,
    actions: [],
    settled: false,
    records: [record],
  }
  for (const invalid of [
    { ...base, actions: [{ type: 'scan', index: 10 }] },
    { ...base, actions: [{ type: 'reveal', index: -1 }] },
    { ...base, settled: true },
    { ...base, version: 99 },
    { ...base, seed: 1.5 },
  ]) {
    const storage = new MemoryStorage()
    storage.setItem(SONAR_STORAGE_KEY, JSON.stringify(invalid))
    const repository = new SonarRepository(storage)
    const recovered = new SonarSession(repository, new FakeRuntime())
    assert.equal(repository.recovered, true)
    assert.equal(recovered.state.game.phase, 'ready')
    assert.deepEqual(recovered.records, [record])
    const clean = new SonarRepository(storage)
    new SonarSession(clean, new FakeRuntime())
    assert.equal(clean.recovered, false)
  }
})

test('win ordering uses moves before scans and keeps ten records in every difficulty', () => {
  const records: SonarRecord[] = []
  for (const difficulty of ['easy', 'medium', 'expert'] as const)
    for (let index = 0; index < 15; index++)
      records.push({
        id: `${difficulty}-${index}`,
        date: '2026-09-07T00:00:00Z',
        difficulty,
        moves: 20 + Math.floor(index / 3),
        scans: 2 - (index % 3),
      })
  const ranked = rankSonarRecords(records)
  assert.equal(ranked.length, 30)
  for (const difficulty of ['easy', 'medium', 'expert'] as const) {
    const wins = ranked.filter((record) => record.difficulty === difficulty)
    assert.equal(wins.length, 10)
    assert.deepEqual(
      wins.slice(0, 3).map((record) => [record.moves, record.scans]),
      [
        [20, 0],
        [20, 1],
        [20, 2],
      ],
    )
  }
})

test('unavailable browser storage still permits in-memory scan and board play', () => {
  const repository = new SonarRepository({
    getItem() {
      throw new Error('private')
    },
    setItem() {
      throw new Error('quota')
    },
    removeItem() {},
  })
  const session = new SonarSession(repository, new FakeRuntime())
  assert.equal(repository.available, false)
  assert.equal(session.dispatch({ type: 'reveal', index: 0 }), true)
  assert.equal(session.dispatch({ type: 'scan', index: 40 }), true)
  assert.equal(session.state.readings.length, 1)
})

test('bounded journals stop accepting input but retain a working restart', () => {
  const storage = new MemoryStorage()
  const save: SonarSave = {
    version: 1,
    difficulty: 'easy',
    seed: 31,
    settled: false,
    records: [],
    actions: Array.from({ length: SONAR_ACTION_LIMIT }, () => ({ type: 'flag', index: 0 })),
  }
  storage.setItem(SONAR_STORAGE_KEY, JSON.stringify(save))
  const session = new SonarSession(new SonarRepository(storage), new FakeRuntime())
  assert.equal(session.atMoveLimit, true)
  assert.equal(session.dispatch({ type: 'reveal', index: 0 }), false)
  session.restart()
  assert.equal(session.atMoveLimit, false)
  assert.equal(session.dispatch({ type: 'reveal', index: 0 }), true)
})
