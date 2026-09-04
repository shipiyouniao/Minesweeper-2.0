import assert from 'node:assert/strict'
import test from 'node:test'
import { actExpedition, createExpedition, frontierCells } from '../src/game/expedition.js'
import { neighbors } from '../src/game/engine.js'
import { probeArea } from '../src/game/dungeon-probe.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import type { Expedition } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

/** A test oracle follows visible zero clues before looking for an all-unknown-neighbors mine clue. */
function deducibleMine(run: Expedition): boolean {
  const visible = new Set(
    run.game.cells.flatMap((cell, index) => (cell.visibility === 'revealed' ? [index] : [])),
  )
  for (let round = 0; round < 81; round++) {
    const before = visible.size
    for (const index of [...visible]) {
      const clue = run.game.cells[index]?.adjacent ?? 0
      const covered = neighbors(run.game.config, index).filter(
        (other) => !visible.has(other) && !run.walls.includes(other),
      )
      if (clue > 0 && covered.length === clue) {
        assert.ok(
          covered.every((other) => run.game.cells[other]?.mine),
          'the deduction must be truthful',
        )
        return true
      }
      if (clue === 0) for (const other of covered) visible.add(other)
    }
    if (visible.size === before) break
  }
  return false
}

test('entrances and stairs vary, with compact nonrectangular openings and useful clue deductions', () => {
  const entrances = new Set<number>()
  const exits = new Set<number>()
  const directions = new Set<string>()
  for (let seed = 0; seed < 200; seed++) {
    const run = createExpedition({ seed, profession: 'explorer', equipment: [], archive: false })
    entrances.add(run.entrance)
    exits.add(run.exit)
    directions.add(
      `${Math.sign((run.exit % 9) - (run.entrance % 9))},${Math.sign(Math.floor(run.exit / 9) - Math.floor(run.entrance / 9))}`,
    )
    assert.equal(run.player, run.entrance)
    assert.ok(run.entrance % 9 > 0 && run.entrance % 9 < 8)
    assert.ok(Math.floor(run.entrance / 9) > 0 && Math.floor(run.entrance / 9) < 8)
    const opened = run.game.cells.flatMap((cell, index) =>
      cell.visibility === 'revealed' ? [index] : [],
    )
    const width =
      Math.max(...opened.map((index) => index % 9)) -
      Math.min(...opened.map((index) => index % 9)) +
      1
    const height =
      Math.max(...opened.map((index) => Math.floor(index / 9))) -
      Math.min(...opened.map((index) => Math.floor(index / 9))) +
      1
    assert.equal(opened.length, 7)
    assert.ok(opened.length < width * height)
    assert.ok(opened.filter((index) => (run.game.cells[index]?.adjacent ?? 0) > 0).length >= 2)
    assert.ok(deducibleMine(run))
    assert.equal(run.game.cells[run.exit]?.visibility, 'hidden')
    assert.deepEqual(createExpedition(run.departure), run)
  }
  assert.ok(entrances.size >= 40)
  assert.ok(exits.size >= 20)
  for (const direction of ['-1,-1', '-1,1', '1,-1', '1,1']) assert.ok(directions.has(direction))
})

test('area probes clip correctly, mark every mine and safe tile, and never teleport or change clues', () => {
  const run = createExpedition({ seed: 31, profession: 'explorer', equipment: [], archive: false })
  for (let center = 0; center < 81; center++) {
    const area = run.game.cells.flatMap((_, index) =>
      Math.abs((index % 9) - (center % 9)) <= 1 &&
      Math.abs(Math.floor(index / 9) - Math.floor(center / 9)) <= 1
        ? [index]
        : [],
    )
    assert.deepEqual(
      [...probeArea(run.game.config, center)].sort((a, b) => a - b),
      area,
    )
    const result = actExpedition(run, { type: 'probe', index: center })
    if (
      area.every(
        (index) => run.walls.includes(index) || run.game.cells[index]?.visibility === 'revealed',
      )
    ) {
      assert.equal(result, run)
      continue
    }
    const mines = area.filter((index) => run.game.cells[index]?.mine)
    assert.deepEqual(
      [...result.confirmedMines].sort((a, b) => a - b),
      mines,
    )
    assert.equal(result.probeReport?.mines, mines.length)
    assert.equal(result.probes, run.probes - 1)
    assert.equal(result.player, run.player)
    assert.equal(result.loot, run.loot)
    assert.equal(result.phase, 'exploring')
    for (const index of area) {
      if (run.walls.includes(index)) continue
      assert.ok(result.probedCells.includes(index))
      if (run.game.cells[index]?.mine) {
        assert.equal(result.game.cells[index]?.visibility, 'flagged')
        assert.equal(actExpedition(result, { type: 'flag', index }), result)
      }
    }
    assert.deepEqual(
      result.game.cells.map((cell) => [cell.mine, cell.adjacent]),
      run.game.cells.map((cell) => [cell.mine, cell.adjacent]),
    )
    assert.equal(actExpedition(result, { type: 'probe', index: center }), result)
  }
  for (const index of [-1, 81, NaN, 2.5])
    assert.equal(actExpedition(run, { type: 'probe', index }), run)
})

test('probe corrects false flags and upgrades true guesses; ordinary flags still toggle', () => {
  let run = createExpedition({ seed: 9, profession: 'explorer', equipment: [], archive: false })
  const safe = run.game.cells.findIndex(
    (cell, index) => !cell.mine && cell.visibility === 'hidden' && !run.walls.includes(index),
  )
  const mine = run.game.cells.findIndex((cell) => cell.mine)
  const flagged = actExpedition(run, { type: 'flag', index: safe })
  assert.equal(
    actExpedition(flagged, { type: 'flag', index: safe }).game.cells[safe]?.visibility,
    'hidden',
  )
  run = actExpedition(flagged, { type: 'flag', index: mine })
  run = actExpedition(run, { type: 'probe', index: safe })
  assert.equal(run.game.cells[safe]?.visibility, 'hidden')
  assert.ok(run.probedCells.includes(safe))
  run = actExpedition(run, { type: 'probe', index: mine })
  assert.ok(run.confirmedMines.includes(mine))
  assert.equal(actExpedition(run, { type: 'flag', index: mine }), run)
})

test('shield and probe confirmations survive replay and all flag commands remain locked', () => {
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  const runtime = new FakeRuntime()
  storage.setItem(
    'minesweeper.variants.v1.expedition',
    JSON.stringify({
      version: 3,
      camp: { supplies: 0, completed: 0, upgrades: ['engineer'] },
      records: [],
      journal: null,
    }),
  )
  const session = new ExpeditionSession(repository, runtime)
  session.start('engineer', [])
  const initial = session.run
  assert.ok(initial)
  let mine = [...frontierCells(initial)].find((index) => initial.game.cells[index]?.mine)
  for (let step = 0; mine === undefined && step < 81; step++) {
    const run = session.run
    assert.ok(run)
    const safe = [...frontierCells(run)].find((index) => !run.game.cells[index]?.mine)
    assert.ok(safe !== undefined)
    session.dispatch({ type: 'reveal', index: safe })
    const next = session.run
    assert.ok(next)
    mine = [...frontierCells(next)].find((index) => next.game.cells[index]?.mine)
  }
  assert.ok(mine !== undefined)
  assert.ok(session.dispatch({ type: 'reveal', index: mine }))
  assert.ok(session.run?.confirmedMines.includes(mine))
  const probe = session.run?.game.cells.findIndex((cell, index) => cell.mine && index !== mine)
  assert.ok(probe !== undefined && probe >= 0)
  assert.ok(session.dispatch({ type: 'probe', index: probe }))
  const restored = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.deepEqual(restored.run, session.run)
  for (const index of restored.run?.confirmedMines ?? [])
    assert.equal(restored.dispatch({ type: 'flag', index }), false)
})
