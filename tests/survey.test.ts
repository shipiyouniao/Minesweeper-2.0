import test from 'node:test'
import assert from 'node:assert/strict'
import {
  actSurvey,
  createSurvey,
  surveyLine,
  surveyKnowledge,
  surveyChordTargets,
  SURVEY_ACTION_LIMIT,
  SURVEY_PRESETS,
} from '../src/game/survey.js'
import {
  deduceSurvey,
  deduceSurveyLine,
  surveyRuns,
  surveyIndices,
} from '../src/game/survey-logic.js'
import { surveyPractice } from '../src/game/survey-practice.js'
import { SurveySession } from '../src/application/survey-session.js'
import {
  SurveyRepository,
  SURVEY_STORAGE_KEY,
  rankSurveyRecords,
} from '../src/persistence/survey-repository.js'
import type { SurveyKnowledge, SurveyRecord, SurveySave } from '../src/types/survey.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'
import { solveSurvey } from './survey-helpers.js'

test('Survey run inference agrees with independent exhaustive placements, including empty and inconsistent lines', () => {
  for (let length = 1; length <= 8; length++) {
    for (let mask = 0; mask < 1 << length; mask++) {
      const actual = Array.from({ length }, (_, index) => Boolean(mask & (1 << index)))
      const runs = surveyRuns(actual)
      const known: SurveyKnowledge[] = actual.map((mine, index) =>
        index % 3 === 0 ? (mine ? 'mine' : 'safe') : 'unresolved',
      )
      const candidates = Array.from({ length: 1 << length }, (_, candidate) =>
        Array.from({ length }, (_, index) => Boolean(candidate & (1 << index))),
      ).filter(
        (candidate) =>
          JSON.stringify(surveyRuns(candidate)) === JSON.stringify(runs) &&
          candidate.every(
            (mine, index) => known[index] === 'unresolved' || mine === (known[index] === 'mine'),
          ),
      )
      const result = deduceSurveyLine(runs, known)
      assert.equal(result.contradiction, false)
      assert.deepEqual(
        result.cells,
        known.map((_, index) =>
          candidates.every((candidate) => candidate[index])
            ? 'mine'
            : candidates.every((candidate) => !candidate[index])
              ? 'safe'
              : 'unresolved',
        ),
      )
    }
  }
  assert.equal(deduceSurveyLine([2, 1], ['mine', 'safe', 'mine', 'mine']).contradiction, true)
  assert.deepEqual(deduceSurveyLine([], ['unresolved', 'unresolved']).cells, ['safe', 'safe'])
})

test('Every sampled Survey has exact shuffled density, ordered clues and a complete public deduction path', () => {
  for (const difficulty of ['easy', 'medium', 'expert'] as const) {
    for (let seed = 0; seed < 100; seed++) {
      const state = createSurvey(seed, difficulty)
      assert.deepEqual(createSurvey(seed, difficulty), state)
      assert.equal(
        state.game.cells.filter((cell) => cell.mine).length,
        SURVEY_PRESETS[difficulty].mines,
      )
      assert.ok(state.game.cells.every((cell) => cell.adjacent === 0))
      for (const axis of ['row', 'column'] as const) {
        const clues = axis === 'row' ? state.rows : state.columns
        for (const [line, runs] of clues.entries())
          assert.deepEqual(
            runs,
            surveyRuns(
              surveyIndices(state.game.config, axis, line).map(
                (index) => state.game.cells[index]!.mine,
              ),
            ),
          )
      }
      assert.ok(
        state.game.cells.filter((cell) => cell.visibility === 'revealed').length <
          state.game.cells.length / 5,
      )
      const result = deduceSurvey(
        state.game.config,
        state.rows,
        state.columns,
        state.game.cells.map(surveyKnowledge),
      )
      assert.equal(result.contradiction, false)
      assert.ok(!result.cells.includes('unresolved'))
      assert.equal(solveSurvey(state).game.phase, 'won')
    }
  }
})

test('Survey opens one safe square, has no Classic zero flood and can lose on the first wrong deduction', () => {
  const state = surveyPractice()
  const open = actSurvey(state, { type: 'reveal', index: 0 })
  assert.equal(open.game.cells.filter((cell) => cell.visibility === 'revealed').length, 1)
  assert.equal(open.game.phase, 'playing')
  const lost = actSurvey(state, { type: 'reveal', index: 2 })
  assert.equal(lost.game.phase, 'lost')
  assert.equal(lost.game.exploded, 2)
  assert.equal(actSurvey(lost, { type: 'flag', index: 3 }), lost)
})

test('Header quick-open acts on exactly its row or column and does not consume a repeated action', () => {
  let row = surveyPractice()
  for (const index of [1, 2, 3]) row = actSurvey(row, { type: 'flag', index })
  row = actSurvey(row, { type: 'mark-safe', index: 5 })
  const openedRow = actSurvey(row, { type: 'chord-line', axis: 'row', index: 0 })
  assert.deepEqual(
    openedRow.game.cells.flatMap((cell, index) => (cell.visibility === 'revealed' ? [index] : [])),
    [0, 4],
  )
  assert.deepEqual(openedRow.game.safeMarks, [5])
  assert.equal(openedRow.moves, row.moves + 1)
  assert.equal(actSurvey(openedRow, { type: 'chord-line', axis: 'row', index: 0 }), openedRow)

  let column = surveyPractice()
  for (const index of [2, 22]) column = actSurvey(column, { type: 'flag', index })
  const openedColumn = actSurvey(column, { type: 'chord-line', axis: 'column', index: 2 })
  assert.deepEqual(
    openedColumn.game.cells.flatMap((cell, index) =>
      cell.visibility === 'revealed' ? [index] : [],
    ),
    [7, 12, 17],
  )
  for (const axis of ['row', 'column'] as const)
    for (const index of [-1, 0.5, NaN, 5, 25])
      assert.equal(actSurvey(column, { type: 'chord-line', axis, index }), column)
})

test('Header quick-open retains safe-note risk and does not bypass incomplete or contradictory runs', () => {
  const state = surveyPractice()
  assert.equal(actSurvey(state, { type: 'chord-line', axis: 'row', index: 0 }), state)
  let conflict = state
  for (const index of [0, 2, 4]) conflict = actSurvey(conflict, { type: 'flag', index })
  assert.equal(actSurvey(conflict, { type: 'chord-line', axis: 'row', index: 0 }), conflict)
  const noted = actSurvey(state, { type: 'mark-safe', index: 12 })
  assert.equal(
    actSurvey(noted, { type: 'chord-line', axis: 'row', index: 2 }).game.cells[12]?.visibility,
    'revealed',
  )
  const mistaken = actSurvey(state, { type: 'mark-safe', index: 2 })
  assert.equal(
    actSurvey(mistaken, { type: 'chord-line', axis: 'column', index: 2 }).game.phase,
    'lost',
  )
})

test('Header actions replay atomically in current saves and reject malformed axis-specific coordinates', () => {
  const storage = new MemoryStorage()
  const runtime = new FakeRuntime()
  const session = new SurveySession(new SurveyRepository(storage), runtime)
  const width = session.state.game.config.width
  for (const [index, cell] of session.state.game.cells.entries())
    if (index < width && cell.mine) session.dispatch({ type: 'flag', index })
  assert.equal(session.dispatch({ type: 'chord-line', axis: 'row', index: 0 }), true)
  const restored = new SurveySession(new SurveyRepository(storage), runtime)
  assert.deepEqual(restored.state, session.state)
  assert.equal(restored.dispatch({ type: 'chord-line', axis: 'row', index: 0 }), false)

  for (const action of [
    { type: 'chord-line', axis: 'diagonal', index: 0 },
    { type: 'chord-line', axis: 'row', index: 10 },
    { type: 'chord-line', axis: 'column', index: 12 },
    { type: 'chord-line', index: 0 },
  ]) {
    storage.setItem(
      SURVEY_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        seed: 31,
        difficulty: 'medium',
        actions: [action],
        settled: false,
        records: [],
      }),
    )
    const repository = new SurveyRepository(storage)
    assert.equal(repository.load(), null)
    assert.equal(repository.recovered, true)
  }
})

test('Survey line summaries and quick-open targets depend only on published runs and visible annotations', () => {
  let state = surveyPractice()
  for (const index of [1, 2, 3]) state = actSurvey(state, { type: 'flag', index })
  const changedWorld = {
    ...state,
    game: {
      ...state.game,
      cells: state.game.cells.map((cell) => ({ ...cell, mine: !cell.mine, adjacent: 8 })),
    },
  }
  for (const axis of ['row', 'column'] as const)
    for (let line = 0; line < 5; line++)
      assert.deepEqual(surveyLine(state, axis, line), surveyLine(changedWorld, axis, line))
  assert.deepEqual(surveyChordTargets(state, 2), [0, 4])
  assert.deepEqual(surveyChordTargets(changedWorld, 2), [0, 4])
  const cleared = actSurvey(state, { type: 'chord', index: 2 })
  assert.equal(surveyLine(cleared, 'row', 0).complete, true)
  assert.equal(cleared.game.cells[5]?.visibility, 'hidden')
})

test('Equal flag totals with incorrect run spacing conflict and cannot quick-open a line', () => {
  let state = surveyPractice()
  for (const index of [0, 2, 4]) state = actSurvey(state, { type: 'flag', index })
  assert.equal(surveyLine(state, 'row', 0).total, 3)
  assert.equal(surveyLine(state, 'row', 0).conflict, true)
  assert.deepEqual(surveyChordTargets(state, 2), [])
  assert.equal(actSurvey(state, { type: 'chord', index: 2 }), state)
})

test('Safe notes are cancellable hypotheses; quick-open trusts them and a mistaken note can lose', () => {
  let state = surveyPractice()
  state = actSurvey(state, { type: 'mark-safe', index: 1 })
  assert.equal(surveyLine(state, 'row', 0).conflict, false)
  const clear = actSurvey(state, { type: 'mark-safe', index: 1 })
  assert.deepEqual(clear.game.safeMarks, [])
  const lost = actSurvey(state, { type: 'chord', index: 0 })
  assert.equal(lost.game.phase, 'lost')
  assert.equal(lost.game.exploded, 1)
})

test('A plausible but wrong run of flags can still cause a mine hit when quick-opening', () => {
  let state = surveyPractice()
  for (const index of [0, 1, 2]) state = actSurvey(state, { type: 'flag', index })
  assert.equal(surveyLine(state, 'row', 0).conflict, false)
  const lost = actSurvey(state, { type: 'chord', index: 2 })
  assert.equal(lost.game.phase, 'lost')
  assert.equal(lost.game.exploded, 3)
})

test('Survey rejects off-board and empty operations without spending journal moves', () => {
  const state = surveyPractice()
  for (const index of [-1, 0.5, NaN, Infinity, 25])
    assert.equal(actSurvey(state, { type: 'reveal', index }), state)
  assert.equal(actSurvey(state, { type: 'chord', index: 0 }), state)
  assert.equal(surveyLine(state, 'row', -1).total, null)
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
  const index = session.state.game.cells.findIndex((cell) => cell.visibility === 'hidden')
  session.dispatch({ type: 'flag', index })
  session.dispatch({ type: 'mark-safe', index })
  const restored = new SurveySession(new SurveyRepository(storage), new FakeRuntime())
  assert.deepEqual(restored.state, session.state)
  assert.equal(storage.data.size, 4)
  assert.equal([...storage.data.values()].filter((value) => value === 'keep').length, 3)
})

test('Survey terminal settlement records one win across reload and retains records after restart', () => {
  const storage = new MemoryStorage()
  const runtime = new FakeRuntime()
  const session = new SurveySession(new SurveyRepository(storage), runtime)
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

test('Survey retires old rules and their incomparable scores; malformed current journals retain valid wins', () => {
  const record: SurveyRecord = {
    id: 'one',
    date: '2026-09-08T00:00:00.000Z',
    difficulty: 'easy',
    moves: 30,
  }
  const valid: SurveySave = {
    version: 2,
    difficulty: 'easy',
    seed: 31,
    actions: [],
    settled: false,
    records: [record],
  }
  const invalid = [
    { ...valid, version: 1 },
    { ...valid, version: 9 },
    { ...valid, seed: -1 },
    { ...valid, settled: true },
    { ...valid, difficulty: 'custom' },
    { ...valid, actions: [{ type: 'scan', index: 0 }] },
    { ...valid, actions: [{ type: 'reveal', index: 64 }] },
  ]
  for (const save of invalid) {
    const storage = new MemoryStorage()
    storage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(save))
    const repository = new SurveyRepository(storage)
    const session = new SurveySession(repository, new FakeRuntime())
    assert.equal(repository.recovered, true)
    assert.equal(session.state.moves, 0)
    assert.deepEqual(session.records, save.version === 2 ? [record] : [])
  }
})

test('Survey contains storage errors and bounds journals and per-preset rankings', () => {
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
  assert.equal(repository.available, false)
  assert.equal(session.state.moves, 0)
  const storage = new MemoryStorage()
  const index = createSurvey(31).game.cells.findIndex((cell) => cell.visibility === 'hidden')
  storage.setItem(
    SURVEY_STORAGE_KEY,
    JSON.stringify({
      version: 2,
      difficulty: 'easy',
      seed: 31,
      settled: false,
      actions: Array.from({ length: SURVEY_ACTION_LIMIT }, () => ({ type: 'flag', index })),
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
  assert.equal(rankSurveyRecords(records).length, 20)
})
