import assert from 'node:assert/strict'
import test from 'node:test'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

test('a scanner confirms exactly one row, locks every mine and leaves movement and clues unchanged', () => {
  for (let seed = 0; seed < 20; seed++) {
    const run = createExpedition({ seed, profession: 'surveyor', equipment: [], archive: false })
    for (let row = 0; row < 9; row++) {
      const result = actExpedition(run, { type: 'sweep', row })
      const indices = Array.from({ length: 9 }, (_, column) => row * 9 + column)
      if (
        indices.every(
          (index) => run.walls.includes(index) || run.game.cells[index]?.visibility === 'revealed',
        )
      ) {
        assert.equal(result, run, 'a fully known row costs no charge')
        continue
      }
      const mines = indices.filter((index) => run.game.cells[index]?.mine)
      assert.deepEqual(result.confirmedMines, mines)
      assert.deepEqual(result.scannedRows, [row])
      assert.equal(result.scans, run.scans - 1)
      assert.equal(result.probes, run.probes)
      assert.equal(result.player, run.player)
      assert.equal(result.loot, run.loot)
      assert.deepEqual(result.collected, run.collected)
      assert.equal(result.steps, run.steps + 1)
      for (const [index, cell] of result.game.cells.entries()) {
        assert.equal(cell.mine, run.game.cells[index]?.mine)
        assert.equal(cell.adjacent, run.game.cells[index]?.adjacent)
        if (!indices.includes(index) || run.walls.includes(index)) {
          assert.deepEqual(cell, run.game.cells[index])
          assert.equal(result.surveyedCells.includes(index), false)
        } else {
          assert.ok(result.surveyedCells.includes(index))
          if (cell.mine) {
            assert.equal(cell.visibility, 'flagged')
            assert.equal(actExpedition(result, { type: 'flag', index }), result)
          } else assert.equal(cell.visibility, run.game.cells[index]?.visibility)
        }
      }
      assert.equal(actExpedition(result, { type: 'sweep', row }), result)
    }
    for (const row of [-1, 9, NaN, 1.5])
      assert.equal(actExpedition(run, { type: 'sweep', row }), run)
    const empty = { ...run, scans: 0 }
    assert.equal(actExpedition(empty, { type: 'sweep', row: 4 }), empty)
  }
})

test('scanner corrects false flags and shares probe knowledge without charging for known areas', () => {
  let run = createExpedition({ seed: 31, profession: 'explorer', equipment: [], archive: false })
  const safe = run.game.cells.findIndex(
    (cell, index) => !cell.mine && cell.visibility === 'hidden' && !run.walls.includes(index),
  )
  run = actExpedition(run, { type: 'flag', index: safe })
  run = actExpedition(run, { type: 'sweep', row: Math.floor(safe / 9) })
  assert.equal(run.game.cells[safe]?.visibility, 'hidden')
  assert.ok(run.surveyedCells.includes(safe))

  let probed = { ...createExpedition(run.departure), probes: 3 }
  for (const index of [37, 40, 43]) probed = actExpedition(probed, { type: 'probe', index })
  assert.equal(actExpedition(probed, { type: 'sweep', row: 4 }), probed)
  const scanned = actExpedition(probed, { type: 'sweep', row: 2 })
  assert.equal(scanned.scans, probed.scans - 1)
  assert.ok(scanned.confirmedMines.length >= probed.confirmedMines.length)
})

test('old count scans and later flag toggles restore before a new confirming scan upgrades the row', () => {
  const storage = new MemoryStorage()
  const departure = { seed: 31, profession: 'surveyor', equipment: [], archive: false } as const
  const initial = createExpedition({ ...departure, rules: 'original' })
  const mine = initial.game.cells.findIndex((cell) => cell.mine)
  const row = Math.floor(mine / 9)
  const camp = { supplies: 73, completed: 1, upgrades: ['surveyor'] }
  storage.setItem(
    'minesweeper.variants.v1.expedition',
    JSON.stringify({
      version: 3,
      camp,
      records: [],
      journal: {
        departure,
        actions: [
          { type: 'scan', row },
          { type: 'flag', index: mine },
          { type: 'flag', index: mine },
        ],
      },
    }),
  )
  const repository = new VariantRepository(storage)
  const runtime = new FakeRuntime()
  const session = new ExpeditionSession(repository, runtime)
  assert.equal(repository.recovered, false)
  assert.equal(repository.migrated, false)
  assert.deepEqual(session.camp, camp)
  assert.equal(session.run?.steps, 3)
  assert.equal(session.run?.game.cells[mine]?.visibility, 'hidden')
  assert.deepEqual(session.run?.confirmedMines, [])
  assert.ok(session.dispatch({ type: 'sweep', row }))
  assert.equal(session.run?.game.cells[mine]?.visibility, 'flagged')
  assert.equal(session.dispatch({ type: 'flag', index: mine }), false)
  const restored = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.deepEqual(restored.run, session.run)
  assert.deepEqual(restored.camp, camp)
})
