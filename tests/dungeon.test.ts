import assert from 'node:assert/strict'
import test from 'node:test'
import {
  actExpedition,
  createExpedition,
  EMPTY_CAMP,
  frontierCells,
} from '../src/game/expedition.js'
import { approachPath, walkingPath } from '../src/game/dungeon-path.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import type { Expedition } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

/** Independent coordinate oracle builds four-direction floor distances without production helpers. */
function distances(run: Expedition, start: number, revealed: boolean): Map<number, number> {
  const result = new Map([[start, 0]])
  const pending = [start]
  for (const index of pending) {
    const x = index % 9
    const y = Math.floor(index / 9)
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const nx = x + (dx ?? 0)
      const ny = y + (dy ?? 0)
      if (nx < 0 || nx > 8 || ny < 0 || ny > 8) continue
      const next = ny * 9 + nx
      const cell = run.game.cells[next]
      if (result.has(next) || !cell || cell.mine || run.walls.includes(next)) continue
      if (revealed && cell.visibility !== 'revealed') continue
      result.set(next, (result.get(index) ?? 0) + 1)
      pending.push(next)
    }
  }
  return result
}

/** Expose floor truth only in fixtures so path and reward properties can be tested independently. */
function openFloor(run: Expedition): Expedition {
  return {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, index) =>
        !cell.mine && !run.walls.includes(index) ? { ...cell, visibility: 'revealed' } : cell,
      ),
    },
  }
}

test('all retained safe cells and treasures are connected; isolated pockets are inert walls on every floor', () => {
  let wallsSeen = 0
  for (let seed = 0; seed < 120; seed++) {
    let run = createExpedition({ seed, profession: 'explorer', equipment: [], archive: false })
    for (let floor = 1; floor <= 5; floor++) {
      const connected = distances(run, 0, false)
      for (const [index, cell] of run.game.cells.entries()) {
        if (!cell.mine && !run.walls.includes(index)) assert.ok(connected.has(index))
        if (cell.mine)
          assert.ok(
            [...connected.keys()].some(
              (neighbor) =>
                Math.abs((index % 9) - (neighbor % 9)) +
                  Math.abs(Math.floor(index / 9) - Math.floor(neighbor / 9)) ===
                1,
            ),
            'every retained hazard can be approached from safe floor',
          )
      }
      assert.ok(connected.has(run.exit))
      assert.ok(run.treasures.every((index) => connected.has(index)))
      wallsSeen += run.walls.length
      for (const index of run.walls) {
        assert.equal(run.game.cells[index]?.mine, false)
        assert.equal(run.game.cells[index]?.visibility, 'hidden')
        assert.equal(frontierCells(run).has(index), false)
        for (const type of ['flag', 'reveal', 'move'] as const)
          assert.equal(actExpedition(run, { type, index }), run)
      }
      const reward = actExpedition(openFloor(run), { type: 'move', index: run.exit })
      if (floor < 5) {
        const relic = reward.offers[0]
        assert.ok(relic)
        run = actExpedition(reward, { type: 'relic', relic })
      } else assert.equal(reward.phase, 'won')
    }
  }
  assert.ok(wallsSeen > 0, 'the fixture must exercise actual disconnected pockets')
})

test('walking chooses shortest revealed routes and cannot cross unknown, flagged or wall cells', () => {
  for (let seed = 0; seed < 30; seed++) {
    const run = createExpedition({ seed, profession: 'explorer', equipment: [], archive: false })
    const expected = distances(run, run.player, true)
    for (let target = 0; target < 81; target++) {
      const path = walkingPath(run, target)
      if (!expected.has(target)) assert.equal(path, null)
      else {
        assert.ok(path)
        assert.equal(path.length - 1, expected.get(target))
        assert.equal(path[0], run.player)
        assert.equal(path.at(-1), target)
        for (let step = 1; step < path.length; step++) {
          const from: number = path[step - 1] ?? -1
          const to: number = path[step] ?? -1
          assert.equal(
            Math.abs((from % 9) - (to % 9)) + Math.abs(Math.floor(from / 9) - Math.floor(to / 9)),
            1,
          )
          assert.equal(run.game.cells[to]?.visibility, 'revealed')
        }
      }
    }
    const frontier = [...frontierCells(run)][0]
    assert.ok(frontier !== undefined)
    assert.ok(approachPath(run, frontier))
    const flagged = actExpedition(run, { type: 'flag', index: frontier })
    assert.equal(approachPath(flagged, frontier), null)
    for (const target of [-1, 81, NaN, 1.5]) assert.equal(walkingPath(run, target), null)
  }
})

test('targeted probes reveal in the requested row without moving, collecting, or charging invalid targets', () => {
  const run = createExpedition({ seed: 31, profession: 'explorer', equipment: [], archive: false })
  for (let row = -1; row <= 9; row++) {
    const eligible = [...frontierCells(run)].filter(
      (index) => Math.floor(index / 9) === row && !run.game.cells[index]?.mine,
    )
    const next = actExpedition(run, { type: 'probe', row })
    if (!eligible.length) assert.equal(next, run)
    else {
      assert.equal(next.probes, run.probes - 1)
      assert.equal(next.player, run.player)
      assert.equal(next.loot, run.loot)
      assert.deepEqual(next.collected, run.collected)
      assert.ok(eligible.some((index) => next.game.cells[index]?.visibility === 'revealed'))
      assert.ok(next.walls.every((index) => next.game.cells[index]?.visibility === 'hidden'))
    }
  }
})

test('v1 migration preserves camp and results but never replays an obsolete dungeon layout', () => {
  const storage = new MemoryStorage()
  const camp = { ...EMPTY_CAMP, supplies: 123, upgrades: ['workshop'], completed: 2 }
  const records = [
    { date: '2026-09-01T00:00:00Z', outcome: 'won', steps: 30, depth: 5, earned: 90 },
  ]
  storage.setItem(
    'minesweeper.variants.v1.expedition',
    JSON.stringify({
      version: 1,
      camp,
      records,
      journal: { departure: { seed: 31 }, actions: [{ type: 'descend' }] },
    }),
  )
  const repository = new VariantRepository(storage)
  const session = new ExpeditionSession(repository, new FakeRuntime())
  assert.equal(session.run, null)
  assert.equal(repository.migrated, true)
  assert.deepEqual(session.camp, camp)
  assert.deepEqual(session.records, records)
  session.persist()
  const nextRepository = new VariantRepository(storage)
  const restored = new ExpeditionSession(nextRepository, new FakeRuntime())
  assert.deepEqual(restored.camp, camp)
  assert.equal(nextRepository.migrated, false)
})

test('a saved physical movement restores the same position and terrain', () => {
  const storage = new MemoryStorage()
  const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  session.start('explorer', [])
  const run = session.run
  assert.ok(run)
  const target = [...distances(run, 0, true).keys()].at(-1)
  assert.ok(target !== undefined && target !== 0)
  assert.ok(session.dispatch({ type: 'move', index: target }))
  const restored = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(restored.run?.player, target)
  assert.deepEqual(restored.run, session.run)
})
