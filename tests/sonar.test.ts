import test from 'node:test'
import assert from 'node:assert/strict'
import {
  actSonar,
  compareSonar,
  createSonar,
  sonarRegion,
  sonarCharges,
  sonarObscured,
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
        assert.deepEqual(
          scanned.game.cells.filter((_, index) => index !== center),
          state.game.cells.filter((_, index) => index !== center),
        )
        assert.equal(
          scanned.game.cells[center]?.visibility,
          state.game.cells[center]?.mine ? 'flagged' : 'revealed',
        )
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
  assert.equal(scanned.game.cells[safe]?.visibility, 'revealed')
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
    version: 2,
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
    version: 2,
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

test('obscured clues require a scan and cannot be probed through chord acceptance', () => {
  const run = actSonar(createSonar(31), { type: 'reveal', index: 0 })
  const index = run.game.cells.findIndex((_, index) => sonarObscured(run, index))
  assert.ok(index >= 0)
  assert.equal(actSonar(run, { type: 'chord', index }), run)
  assert.equal(actSonar(run, { type: 'reveal', index }), run)
  const scanned = actSonar(run, { type: 'scan', index })
  assert.equal(sonarObscured(scanned, index), false)
  assert.deepEqual(scanned.game, run.game)
  assert.ok(
    sonarRegion(run.game.config, index)
      .filter((cell) => cell !== index)
      .every((cell) => !sonarObscured(scanned, cell)),
  )
})

test('four new safe excavation actions recharge one pulse; floods, flags and repeats cannot farm credits', () => {
  let run = actSonar(createSonar(31, 'expert'), { type: 'reveal', index: 0 })
  assert.equal(run.excavations, 1)
  assert.equal(sonarCharges(run), 3)
  assert.equal(actSonar(run, { type: 'reveal', index: 0 }), run)
  const hidden = run.game.cells.findIndex((cell) => cell.visibility === 'hidden')
  const marked = actSonar(run, { type: 'flag', index: hidden })
  assert.equal(marked.excavations, 1)
  for (let count = 0; count < 3; count++) {
    const index = run.game.cells.findIndex((cell) => !cell.mine && cell.visibility === 'hidden')
    run = actSonar(run, { type: 'reveal', index })
  }
  assert.equal(run.excavations, 4)
  assert.equal(sonarCharges(run), 4)
  for (const index of [0, 1, 2, 3]) run = actSonar(run, { type: 'scan', index })
  assert.equal(run.readings.length, 4)
  assert.equal(sonarCharges(run), 0)
  assert.equal(actSonar(run, { type: 'scan', index: 4 }), run)
})

test('scanning confirms mines without damage, locks gold flags and never recharges itself', () => {
  const state = actSonar(createSonar(31), { type: 'reveal', index: 0 })
  const index = state.game.cells.findIndex((cell) => cell.mine)
  const scanned = actSonar(state, { type: 'scan', index })
  assert.equal(scanned.game.phase, 'playing')
  assert.equal(scanned.game.exploded, null)
  assert.equal(scanned.game.cells[index]?.visibility, 'flagged')
  assert.equal(scanned.excavations, state.excavations)
  for (const type of ['flag', 'mark-safe', 'reveal'] as const)
    assert.equal(actSonar(scanned, { type, index }), scanned)
})

test('a center scan opens only one square and can finish the last safe square', () => {
  const state = actSonar(createSonar(31), { type: 'reveal', index: 0 })
  const index = state.game.cells.findIndex((cell) => !cell.mine && cell.visibility === 'hidden')
  const almost = {
    ...state,
    game: {
      ...state.game,
      cells: state.game.cells.map((cell, i) =>
        !cell.mine && i !== index ? { ...cell, visibility: 'revealed' as const } : cell,
      ),
    },
  }
  const won = actSonar(almost, { type: 'scan', index })
  assert.equal(won.game.phase, 'won')
  assert.equal(won.excavations, almost.excavations)
})

test('regional scans keep neighbors covered and make their clues readable when excavated later', () => {
  const run = actSonar(createSonar(31, 'expert'), { type: 'reveal', index: 0 })
  const center = run.game.cells.findIndex(
    (cell, index) =>
      cell.visibility === 'hidden' &&
      !cell.mine &&
      sonarRegion(run.game.config, index).some(
        (other) =>
          other !== index &&
          run.game.cells[other]?.visibility === 'hidden' &&
          !run.game.cells[other]?.mine &&
          run.game.cells[other]!.adjacent > 0,
      ),
  )
  assert.ok(center >= 0)
  const scanned = actSonar(run, { type: 'scan', index: center })
  assert.equal(scanned.game.cells[center]?.visibility, 'revealed')
  for (const index of sonarRegion(run.game.config, center)) {
    if (index !== center)
      assert.equal(scanned.game.cells[index]?.visibility, run.game.cells[index]?.visibility)
    if (!scanned.game.cells[index]?.mine) {
      const opened = {
        ...scanned,
        game: {
          ...scanned.game,
          cells: scanned.game.cells.map((cell, other) =>
            other === index ? { ...cell, visibility: 'revealed' as const } : cell,
          ),
        },
      }
      assert.equal(sonarObscured(opened, index), false)
    }
  }
})
