import test from 'node:test'
import assert from 'node:assert/strict'
import {
  actSurvey,
  createSurvey,
  surveyLine,
  SURVEY_ACTION_LIMIT,
  SURVEY_PRESETS,
} from '../src/game/survey.js'
import { neighbors } from '../src/game/engine.js'
import { SurveySession } from '../src/application/survey-session.js'
import {
  SurveyRepository,
  SURVEY_STORAGE_KEY,
  rankSurveyRecords,
} from '../src/persistence/survey-repository.js'
import type { SurveyRecord, SurveySave } from '../src/types/survey.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'
import { solveSurvey } from './survey-helpers.js'

test('Survey publishes exact immutable row/column totals only after seeded safe generation', () => {
  for (const difficulty of ['easy', 'medium', 'expert'] as const) {
    for (let seed = 0; seed < 100; seed++) {
      const empty = createSurvey(seed, difficulty)
      assert.deepEqual(empty.rows, [])
      assert.equal(surveyLine(empty, 'row', 0).total, null)
      const first = seed % empty.game.cells.length
      const state = actSurvey(empty, { type: 'reveal', index: first })
      assert.deepEqual(actSurvey(empty, { type: 'reveal', index: first }), state)
      assert.equal(
        state.rows.reduce((a, b) => a + b),
        state.game.config.mines,
      )
      assert.equal(
        state.columns.reduce((a, b) => a + b),
        state.game.config.mines,
      )
      assert.equal(state.game.cells[first]?.adjacent, 0)
      for (const index of [first, ...neighbors(state.game.config, first)])
        assert.equal(state.game.cells[index]?.visibility, 'revealed')
      for (let row = 0; row < state.game.config.height; row++)
        assert.equal(
          state.rows[row],
          state.game.cells.filter(
            (cell, index) => cell.mine && Math.floor(index / state.game.config.width) === row,
          ).length,
        )
      for (let column = 0; column < state.game.config.width; column++)
        assert.equal(
          state.columns[column],
          state.game.cells.filter(
            (cell, index) => cell.mine && index % state.game.config.width === column,
          ).length,
        )
      const annotated = actSurvey(state, {
        type: 'flag',
        index: state.game.cells.findIndex((cell) => cell.visibility === 'hidden'),
      })
      assert.equal(annotated.rows, state.rows)
      assert.equal(annotated.columns, state.columns)
    }
  }
})

test('Survey hypotheses cannot change totals or leak hidden identities through line summaries', () => {
  let state = actSurvey(createSurvey(31), { type: 'reveal', index: 0 })
  const index = state.game.cells.findIndex((cell) => !cell.mine && cell.visibility === 'hidden')
  state = actSurvey(state, { type: 'flag', index })
  const row = Math.floor(index / state.game.config.width)
  assert.equal(surveyLine(state, 'row', row).flags, 1)
  const falseWorld = {
    ...state,
    game: {
      ...state.game,
      cells: state.game.cells.map((cell) =>
        cell.visibility === 'revealed' ? cell : { ...cell, mine: !cell.mine, adjacent: 8 },
      ),
    },
  }
  for (let line = 0; line < state.game.config.height; line++)
    assert.deepEqual(surveyLine(state, 'row', line), surveyLine(falseWorld, 'row', line))
  const noted = actSurvey(state, { type: 'mark-safe', index })
  assert.equal(surveyLine(noted, 'row', row).flags, 0)
  assert.equal(noted.rows, state.rows)
  assert.ok(noted.game.safeMarks.includes(index))
})

test('Survey preserves pre-opening flags and rejects invalid or empty operations', () => {
  const empty = actSurvey(createSurvey(31), { type: 'flag', index: 63 })
  assert.equal(surveyLine(empty, 'row', 7).flags, 1)
  assert.equal(surveyLine(empty, 'row', 7).total, null)
  const state = actSurvey(empty, { type: 'reveal', index: 0 })
  assert.equal(state.game.cells[63]?.visibility, 'flagged')
  for (const index of [-1, 0.5, NaN, Infinity, 64]) {
    assert.equal(actSurvey(state, { type: 'reveal', index }), state)
    assert.deepEqual(surveyLine(state, 'row', index), { total: null, flags: 0, covered: 0 })
  }
  assert.equal(actSurvey(state, { type: 'chord', index: 0 }), state)
})

test('Survey quick-open trusts player notes and can lose to an incorrect safe hypothesis', () => {
  let state = actSurvey(createSurvey(31), { type: 'reveal', index: 0 })
  const open = state.game.cells.findIndex(
    (cell, index) =>
      cell.visibility === 'revealed' &&
      neighbors(state.game.config, index).some((other) => state.game.cells[other]?.mine),
  )
  const mine = neighbors(state.game.config, open).find((index) => state.game.cells[index]?.mine)!
  state = actSurvey(state, { type: 'mark-safe', index: mine })
  const ended = actSurvey(state, { type: 'chord', index: open })
  assert.equal(ended.game.phase, 'lost')
  assert.equal(ended.game.exploded, mine)
  assert.equal(actSurvey(ended, { type: 'flag', index: mine }), ended)
})

test('Survey journal restores exact progress and never touches another mode namespace', () => {
  const storage = new MemoryStorage()
  for (const key of [
    'minesweeper.sonar.v1',
    'minesweeper.variants.v1.twin',
    'minesweeper.variants.v1.expedition',
  ])
    storage.setItem(key, 'keep')
  const session = new SurveySession(new SurveyRepository(storage), new FakeRuntime())
  session.dispatch({ type: 'flag', index: 63 })
  session.dispatch({ type: 'reveal', index: 0 })
  session.dispatch({ type: 'mark-safe', index: 63 })
  const restored = new SurveySession(new SurveyRepository(storage), new FakeRuntime())
  assert.deepEqual(restored.state, session.state)
  assert.equal(storage.data.size, 4)
  assert.equal([...storage.data.values()].filter((value) => value === 'keep').length, 3)
})

test('Survey terminal settlement records one win across reload and retains records after restart', () => {
  const storage = new MemoryStorage()
  const runtime = new FakeRuntime()
  const session = new SurveySession(new SurveyRepository(storage), runtime)
  session.dispatch({ type: 'reveal', index: 0 })
  for (const [index, cell] of session.state.game.cells.entries())
    if (!cell.mine) session.dispatch({ type: 'reveal', index })
  assert.equal(session.state.game.phase, 'won')
  assert.equal(session.records.length, 1)
  assert.equal(runtime.ids, 1)
  const restored = new SurveySession(new SurveyRepository(storage), runtime)
  assert.deepEqual(restored.state, session.state)
  assert.equal(restored.dispatch({ type: 'reveal', index: 0 }), false)
  restored.restart('expert')
  assert.deepEqual(restored.state.game.config, SURVEY_PRESETS.expert)
  assert.equal(restored.records.length, 1)
})

test('Survey retains valid records while retiring malformed, incompatible or impossible journals', () => {
  const record: SurveyRecord = {
    id: 'one',
    date: '2026-09-08T00:00:00.000Z',
    difficulty: 'easy',
    moves: 30,
  }
  const valid: SurveySave = {
    version: 1,
    difficulty: 'easy',
    seed: 31,
    actions: [],
    settled: false,
    records: [record],
  }
  const invalid = [
    { ...valid, version: 9 },
    { ...valid, seed: -1 },
    { ...valid, settled: true },
    { ...valid, difficulty: 'custom' },
    { ...valid, actions: [{ type: 'scan', index: 0 }] },
    { ...valid, actions: [{ type: 'reveal', index: 64 }] },
    { ...valid, actions: [{ type: 'chord', index: 0 }] },
  ]
  for (const save of invalid) {
    const storage = new MemoryStorage()
    storage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(save))
    const repository = new SurveyRepository(storage)
    const session = new SurveySession(repository, new FakeRuntime())
    assert.equal(repository.recovered, true)
    assert.equal(session.state.game.phase, 'ready')
    assert.deepEqual(session.records, [record])
  }
})

test('Survey handles unavailable storage and bounds journals and per-preset rankings', () => {
  const repository = new SurveyRepository({
    getItem() {
      throw new Error('blocked')
    },
    setItem() {
      throw new Error('quota')
    },
    removeItem() {},
  })
  const session = new SurveySession(repository, new FakeRuntime())
  assert.equal(session.dispatch({ type: 'reveal', index: 0 }), true)
  assert.equal(repository.available, false)
  const storage = new MemoryStorage()
  storage.setItem(
    SURVEY_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      difficulty: 'easy',
      seed: 31,
      settled: false,
      actions: Array.from({ length: SURVEY_ACTION_LIMIT }, () => ({ type: 'flag', index: 63 })),
      records: [],
    }),
  )
  const limited = new SurveySession(new SurveyRepository(storage), new FakeRuntime())
  assert.equal(limited.atMoveLimit, true)
  assert.equal(limited.dispatch({ type: 'reveal', index: 0 }), false)
  limited.restart()
  assert.equal(limited.atMoveLimit, false)
  const records = Array.from({ length: 35 }, (_, index): SurveyRecord => ({
    id: String(index),
    date: '2026-09-08',
    difficulty: index % 2 ? 'easy' : 'expert',
    moves: 35 - index,
  }))
  const ranked = rankSurveyRecords(records)
  assert.equal(ranked.length, 20)
  assert.equal(ranked[0]?.moves, 2)
})

test('Survey public-line deductions stay sound across the preset corpus and add useful information', () => {
  let improved = 0
  for (const difficulty of ['easy', 'medium', 'expert'] as const) {
    for (let seed = 0; seed < 60; seed++) {
      const start = actSurvey(createSurvey(seed, difficulty), { type: 'reveal', index: 0 })
      const local = solveSurvey(start, false)
      const survey = solveSurvey(start, true)
      assert.notEqual(survey.game.phase, 'lost')
      for (const cell of survey.game.cells)
        if (cell.visibility === 'flagged') assert.equal(cell.mine, true)
      if (
        survey.game.cells.filter((cell) => cell.visibility === 'revealed').length >
        local.game.cells.filter((cell) => cell.visibility === 'revealed').length
      )
        improved++
    }
  }
  assert.ok(
    improved > 30,
    'line information should change the outcome on a meaningful part of the corpus',
  )
})
