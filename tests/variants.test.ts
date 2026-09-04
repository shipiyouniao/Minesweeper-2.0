import assert from 'node:assert/strict'
import test from 'node:test'
import { actTwin, createTwin } from '../src/game/twin.js'
import {
  actExpedition,
  allowedDeparture,
  buyUpgrade,
  createExpedition,
  EMPTY_CAMP,
  expeditionEarnings,
  frontierCells,
  reachableCells,
} from '../src/game/expedition.js'
import { neighbors } from '../src/game/engine.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { TwinSession } from '../src/application/twin-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeExpeditionSave, decodeTwinSave } from '../src/persistence/variant-decoders.js'
import { parseVariantCommand } from '../src/ui/variant-input.js'
import { variantCopy, relicCopy } from '../src/ui/variant-copy.js'
import type { Departure, Expedition, ExpeditionAction, Relic } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

const departure: Departure = { seed: 31, profession: 'explorer', equipment: [], archive: false }

/** Test oracle extends the route through safe frontier cells; production never uses this solver. */
function reachExit(initial: Expedition): Expedition {
  let run = initial
  for (let step = 0; step < 81 && !reachableCells(run).has(run.exit); step++) {
    const index = [...frontierCells(run)].find((candidate) => !run.game.cells[candidate]?.mine)
    assert.notEqual(index, undefined, 'a safe frontier must remain on the guaranteed route')
    run = actExpedition(run, { type: 'reveal', index: index ?? -1 })
  }
  assert.ok(reachableCells(run).has(run.exit))
  return run
}

/** Drive the same safe route through the application so persistence and settlement are exercised. */
function clearSessionFloor(session: ExpeditionSession): void {
  for (let step = 0; step < 81; step++) {
    const run = session.run
    assert.ok(run)
    if (reachableCells(run).has(run.exit)) break
    const index = [...frontierCells(run)].find((candidate) => !run.game.cells[candidate]?.mine)
    assert.ok(session.dispatch({ type: 'reveal', index: index ?? -1 }))
  }
  if (session.run?.phase === 'exploring')
    assert.ok(session.dispatch({ type: 'move', index: session.run.exit }))
}

test('twin placement has exact disjoint mine counts, safe openings and truthful clues across seeds', () => {
  for (let seed = 0; seed < 100; seed++) {
    const index = seed % 81
    const twin = actTwin(createTwin(seed), { side: seed % 2 ? 'a' : 'b', type: 'reveal', index })
    assert.deepEqual(
      twin,
      actTwin(createTwin(seed), { side: seed % 2 ? 'a' : 'b', type: 'reveal', index }),
    )
    for (const board of [twin.a, twin.b]) {
      assert.equal(board.cells.filter((cell) => cell.mine).length, 12)
      for (const safe of [index, ...neighbors(board.config, index)])
        assert.equal(board.cells[safe]?.mine, false)
      for (const [cellIndex, cell] of board.cells.entries()) {
        assert.equal(
          cell.adjacent,
          neighbors(board.config, cellIndex).filter((other) => board.cells[other]?.mine).length,
        )
        assert.equal(
          cell.mine && twin.a.cells[cellIndex]?.mine && twin.b.cells[cellIndex]?.mine,
          false,
        )
      }
    }
  }
})

test('twin flags remain hypotheses and one completed side does not end the other', () => {
  let twin = actTwin(createTwin(31), { side: 'a', type: 'reveal', index: 40 })
  const hidden = twin.a.cells.findIndex((cell) => cell.visibility === 'hidden')
  const partner = twin.b
  twin = actTwin(twin, { side: 'a', type: 'flag', index: hidden })
  assert.equal(twin.b, partner)
  twin = actTwin(twin, { side: 'a', type: 'flag', index: hidden })
  for (const [index, cell] of twin.a.cells.entries())
    if (!cell.mine) twin = actTwin(twin, { side: 'a', type: 'reveal', index })
  assert.equal(twin.a.phase, 'won')
  assert.equal(twin.phase, 'playing')
  for (const [index, cell] of twin.b.cells.entries())
    if (!cell.mine) twin = actTwin(twin, { side: 'b', type: 'reveal', index })
  assert.equal(twin.phase, 'won')
  assert.equal(actTwin(twin, { side: 'b', type: 'flag', index: 0 }), twin)
})

test('a mine hit on either twin board ends the pair and preserves the other board state', () => {
  for (const side of ['a', 'b'] as const) {
    const twin = actTwin(createTwin(42), { side, type: 'reveal', index: 40 })
    const index = twin[side].cells.findIndex((cell) => cell.mine)
    const lost = actTwin(twin, { side, type: 'reveal', index })
    assert.equal(lost.phase, 'lost')
    assert.equal(lost[side === 'a' ? 'b' : 'a'], twin[side === 'a' ? 'b' : 'a'])
  }
})

test('twin rejects pre-opening flags and out-of-range or fractional coordinates', () => {
  const twin = createTwin(1)
  assert.equal(actTwin(twin, { side: 'b', type: 'flag', index: 2 }), twin)
  for (const index of [-1, 81, 1.5, NaN])
    assert.equal(actTwin(twin, { side: 'a', type: 'reveal', index }), twin)
})

test('every expedition floor has an orthogonal safe route and exact shuffled mine count', () => {
  for (let seed = 0; seed < 80; seed++) {
    let run = createExpedition({ ...departure, seed })
    for (let floor = 1; floor <= 5; floor++) {
      assert.equal(run.game.cells.filter((cell) => cell.mine).length, 13 + floor * 2)
      assert.ok(run.treasures.every((index) => !run.game.cells[index]?.mine))
      assert.equal(run.game.cells[run.exit]?.mine, false)
      run = reachExit(run)
      run = actExpedition(run, { type: 'move', index: run.exit })
      if (floor < 5) {
        const relic = run.offers[0]
        assert.ok(relic)
        assert.ok(!run.relics.includes(relic))
        run = actExpedition(run, { type: 'relic', relic })
      }
    }
    assert.equal(run.phase, 'won')
    assert.equal(run.relics.length, 4)
  }
})

test('expedition rejects remote reveals and premature exits; probes consume one charge', () => {
  const run = createExpedition(departure)
  assert.equal(actExpedition(run, { type: 'reveal', index: run.exit }), run)
  assert.equal(actExpedition(run, { type: 'move', index: run.exit }), run)
  const probed = actExpedition(run, { type: 'probe', index: probeTarget(run) })
  assert.equal(probed.probes, run.probes - 1)
  assert.equal(probed.steps, run.steps + 1)
  assert.equal(probed.phase, 'exploring')
})

test('row scans cannot be repeated or forged and leave the mine layout unchanged', () => {
  const run = createExpedition(departure)
  const scanned = actExpedition(run, { type: 'scan', row: 4 })
  assert.deepEqual(scanned.scannedRows, [4])
  assert.equal(scanned.game, run.game)
  assert.equal(scanned.scans, 0)
  for (const row of [4, 5, -1, 9, 1.5])
    assert.equal(actExpedition(scanned, { type: 'scan', row }), scanned)
})

test('shield flags a real frontier mine once without modifying clues or inventing a safe route', () => {
  let run = createExpedition({ ...departure, profession: 'engineer' })
  let mine = [...frontierCells(run)].find((index) => run.game.cells[index]?.mine)
  for (let step = 0; step < 81 && mine === undefined; step++) {
    const safe = [...frontierCells(run)].find((index) => !run.game.cells[index]?.mine)
    run = actExpedition(run, { type: 'reveal', index: safe ?? -1 })
    mine = [...frontierCells(run)].find((index) => run.game.cells[index]?.mine)
  }
  assert.notEqual(mine, undefined)
  const protectedRun = actExpedition(run, { type: 'reveal', index: mine ?? -1 })
  assert.equal(protectedRun.phase, 'exploring')
  assert.equal(protectedRun.shields, 0)
  assert.equal(protectedRun.game.cells[mine ?? -1]?.visibility, 'flagged')
  assert.deepEqual(
    protectedRun.game.cells.map((cell) => [cell.mine, cell.adjacent]),
    run.game.cells.map((cell) => [cell.mine, cell.adjacent]),
  )
  assert.ok(protectedRun.confirmedMines.includes(mine ?? -1))
  assert.equal(actExpedition(protectedRun, { type: 'flag', index: mine ?? -1 }), protectedRun)
  const lost = actExpedition({ ...run, shields: 0 }, { type: 'reveal', index: mine ?? -1 })
  assert.equal(lost.phase, 'lost')
  assert.equal(expeditionEarnings(lost), Math.floor(lost.loot / 2))
})

test('revealed treasure waits for a physical visit and cannot pay twice', () => {
  const initial = createExpedition(departure)
  const safe = initial.game.cells.map((cell, index) =>
    !cell.mine && !initial.walls.includes(index)
      ? { ...cell, visibility: 'revealed' as const }
      : cell,
  )
  const run = { ...initial, game: { ...initial.game, cells: safe } }
  const target = run.treasures[0]
  assert.ok(target !== undefined)
  const visited = actExpedition(run, { type: 'move', index: target })
  assert.equal(run.collected.length, 0)
  assert.equal(visited.player, target)
  assert.ok(visited.collected.includes(target))
  assert.equal(visited.loot, visited.collected.length * 6)
  assert.equal(actExpedition(visited, { type: 'move', index: target }), visited)
  assert.equal(run.phase, 'exploring', 'revealing stairs alone must not end a floor')
  const reward = actExpedition(run, { type: 'move', index: run.exit })
  assert.equal(reward.player, run.exit)
  assert.equal(reward.phase, 'reward')
  assert.equal(reward.loot, 12 + reward.collected.length * 6)
  assert.equal(actExpedition(reward, { type: 'move', index: reward.exit }), reward)
})

test('camp purchases and departure loadouts enforce ownership, costs and three-point budget', () => {
  const camp = { ...EMPTY_CAMP, supplies: 100 }
  assert.equal(allowedDeparture(camp, 'surveyor', []), false)
  assert.equal(allowedDeparture(camp, 'explorer', ['probe']), false)
  const upgraded = buyUpgrade(buyUpgrade(camp, 'workshop'), 'surveyor')
  assert.equal(upgraded.supplies, 50)
  assert.equal(buyUpgrade(upgraded, 'workshop'), upgraded)
  assert.equal(allowedDeparture(upgraded, 'surveyor', ['probe', 'guard']), true)
  assert.equal(allowedDeparture(upgraded, 'surveyor', ['probe', 'guard', 'scanner']), false)
  assert.equal(allowedDeparture(upgraded, 'surveyor', ['probe', 'probe']), false)
  assert.equal(buyUpgrade(EMPTY_CAMP, 'engineer'), EMPTY_CAMP)
})

test('relic choices are deterministic, unowned and limited to the unlocked catalog', () => {
  const reward = reachReward(createExpedition(departure))
  assert.equal(reward.offers.length, 3)
  assert.equal(new Set(reward.offers).size, 3)
  assert.ok(!reward.offers.includes('compass'))
  assert.equal(actExpedition(reward, { type: 'relic', relic: 'compass' }), reward)
  const relic = reward.offers[0]
  assert.ok(relic)
  const next = actExpedition(reward, { type: 'relic', relic })
  assert.equal(next.floor, 2)
  assert.equal(next.loot, reward.loot)
  assert.deepEqual(next.relics, [relic])
})

test('expedition restores between floors and settles victory exactly once across reload', () => {
  const storage = new MemoryStorage()
  const runtime = new FakeRuntime()
  let session = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.ok(session.start('explorer', []))
  for (let floor = 1; floor <= 5; floor++) {
    clearSessionFloor(session)
    if (floor < 5) {
      const expected = session.run
      session = new ExpeditionSession(new VariantRepository(storage), runtime)
      assert.deepEqual(session.run, expected)
      const relic = session.run?.offers[0]
      assert.ok(relic)
      assert.ok(session.dispatch({ type: 'relic', relic }))
    }
  }
  assert.equal(session.run?.phase, 'won')
  assert.equal(session.camp.completed, 1)
  assert.equal(session.records.length, 1)
  const supplies = session.camp.supplies
  assert.ok(supplies >= 90)
  assert.equal(session.dispatch({ type: 'retreat' }), false)
  assert.ok(session.returnToCamp())
  const restored = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.equal(restored.run, null)
  assert.equal(restored.camp.supplies, supplies)
  assert.equal(restored.records.length, 1)
})

test('extraction settles all collected loot and death uses the advertised salvage fraction', () => {
  const session = new ExpeditionSession(
    new VariantRepository(new MemoryStorage()),
    new FakeRuntime(),
  )
  session.start('explorer', [])
  clearSessionFloor(session)
  const loot = session.run?.loot ?? 0
  assert.ok(session.dispatch({ type: 'retreat' }))
  assert.equal(session.camp.supplies, loot)
  assert.equal(session.camp.completed, 0)
  const run = createExpedition(departure)
  assert.equal(expeditionEarnings({ ...run, loot: 11, phase: 'lost', relics: ['salvage'] }), 8)
})

test('twin restores both boards, stores one result and does not contaminate classic or camp slots', () => {
  const storage = new MemoryStorage()
  storage.setItem('minesweeper.v3.session.easy', 'classic sentinel')
  const runtime = new FakeRuntime()
  const expedition = new ExpeditionSession(new VariantRepository(storage), runtime)
  expedition.start('explorer', [])
  const campSave = storage.getItem('minesweeper.variants.v1.expedition')
  let session = new TwinSession(new VariantRepository(storage), runtime)
  session.dispatch({ side: 'b', type: 'reveal', index: 40 })
  const expected = session.state
  session = new TwinSession(new VariantRepository(storage), runtime)
  assert.deepEqual(session.state, expected)
  const index = session.state.a.cells.findIndex((cell) => cell.mine)
  assert.ok(session.dispatch({ side: 'a', type: 'reveal', index }))
  session = new TwinSession(new VariantRepository(storage), runtime)
  assert.equal(session.state.phase, 'lost')
  assert.equal(session.records.length, 1)
  assert.equal(session.dispatch({ side: 'a', type: 'reveal', index }), false)
  assert.equal(storage.getItem('minesweeper.v3.session.easy'), 'classic sentinel')
  assert.equal(storage.getItem('minesweeper.variants.v1.expedition'), campSave)
})

test('decoders reject malformed shapes and replay rejects illegal histories while retaining camp', () => {
  for (const value of ['{}', 'null', '[]', '{"version":2}', '{bad', '{"version":1,"seed":1e999}']) {
    assert.equal(decodeExpeditionSave(value), null)
    assert.equal(decodeTwinSave(value), null)
  }
  const storage = new MemoryStorage()
  storage.setItem(
    'minesweeper.variants.v1.expedition',
    JSON.stringify({
      version: 3,
      camp: { ...EMPTY_CAMP, supplies: 25 },
      records: [],
      journal: { departure, actions: [{ type: 'move', index: createExpedition(departure).exit }] },
    }),
  )
  const repository = new VariantRepository(storage)
  const session = new ExpeditionSession(repository, new FakeRuntime())
  assert.equal(session.run, null)
  assert.equal(session.camp.supplies, 25)
  assert.equal(repository.recovered, true)
  storage.setItem(
    'minesweeper.variants.v1.twin',
    JSON.stringify({ version: 1, seed: 31, records: [], settled: true, actions: [] }),
  )
  assert.equal(new TwinSession(repository, new FakeRuntime()).state.phase, 'ready')
})

test('storage failures keep both modes playable and observable without throwing', () => {
  const storage = {
    getItem(): string | null {
      throw new Error('blocked')
    },
    setItem(): void {
      throw new Error('quota')
    },
    removeItem(): void {},
  }
  const repository = new VariantRepository(storage)
  const session = new ExpeditionSession(repository, new FakeRuntime())
  assert.ok(session.start('explorer', []))
  assert.ok(session.dispatch({ type: 'probe', index: probeTarget(session.run!) }))
  assert.equal(repository.available, false)
  assert.ok(
    new TwinSession(repository, new FakeRuntime()).dispatch({
      side: 'a',
      type: 'reveal',
      index: 0,
    }),
  )
})

test('special-mode input decodes finite commands and all supported locales describe relics', () => {
  assert.deepEqual(parseVariantCommand('profession:engineer'), {
    type: 'profession',
    value: 'engineer',
  })
  for (const value of ['profession:admin', 'probe:extra', 'upgrade:currency', 'relic:cheat', ''])
    assert.equal(parseVariantCommand(value), null)
  const relics: readonly Relic[] = ['lantern', 'lens', 'aegis', 'purse', 'compass', 'salvage']
  for (const language of ['en', 'zh', 'ja'] as const) {
    assert.ok(Object.values(variantCopy(language)).every((value) => value.length > 0))
    for (const relic of relics) assert.ok(relicCopy(language, relic).note.length > 0)
  }
})

test('expedition replay reproduces tool charges and invalid extra actions cannot mint rewards', () => {
  const storage = new MemoryStorage()
  const runtime = new FakeRuntime()
  const session = new ExpeditionSession(new VariantRepository(storage), runtime)
  session.start('explorer', [])
  const actions: readonly ExpeditionAction[] = [
    { type: 'probe', index: probeTarget(session.run!) },
    { type: 'scan', row: 3 },
  ]
  for (const action of actions) assert.ok(session.dispatch(action))
  const restored = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.deepEqual(restored.run, session.run)
  assert.equal(restored.dispatch({ type: 'scan', row: 3 }), false)
})

test('each relic applies its advertised effect and charge caps on floor entry', () => {
  const reward = reachReward(createExpedition({ ...departure, archive: true }))
  const relics: readonly Relic[] = ['lantern', 'lens', 'aegis', 'purse', 'compass', 'salvage']

  for (const relic of relics) {
    const offered = { ...reward, offers: [relic], probes: 4, scans: 4, shields: 2 }
    const next = actExpedition(offered, { type: 'relic', relic })
    assert.equal(next.floor, 2)
    assert.equal(next.probes, 4)
    assert.equal(next.scans, 4)
    assert.equal(next.shields, 2)
    assert.ok(next.relics.includes(relic))
    if (relic === 'compass') assert.equal(next.game.cells[next.exit]?.visibility, 'revealed')
    if (relic === 'salvage')
      assert.equal(expeditionEarnings({ ...next, phase: 'lost', loot: 11 }), 8)
  }

  const purse = actExpedition({ ...reward, offers: ['purse'] }, { type: 'relic', relic: 'purse' })
  const collected = reachExit(purse)
  assert.equal(
    collected.loot - reward.loot,
    collected.collected.length * 9 + (collected.phase === 'reward' ? 12 : 0),
  )
  const lantern = actExpedition(
    { ...reward, offers: ['lantern'], probes: 0 },
    { type: 'relic', relic: 'lantern' },
  )
  assert.equal(lantern.probes, 1)
  const lens = actExpedition(
    { ...reward, offers: ['lens'], scans: 0 },
    { type: 'relic', relic: 'lens' },
  )
  assert.equal(lens.scans, 1)
  const aegis = actExpedition(
    { ...reward, offers: ['aegis'], shields: 0 },
    { type: 'relic', relic: 'aegis' },
  )
  assert.equal(aegis.shields, 1)
})

test('command parser rejects extra payload fragments rather than accepting a prefix', () => {
  assert.equal(parseVariantCommand('profession:engineer:extra'), null)
  assert.equal(parseVariantCommand('relic:lantern:extra'), null)
})

/** Select an undiscovered cell for deterministic tool fixtures. */
function probeTarget(run: Expedition): number {
  const target = run.game.cells.findIndex(
    (cell, index) => cell.visibility === 'hidden' && !run.walls.includes(index),
  )
  assert.notEqual(target, undefined)
  return target
}

/** Reach the current stairs without assuming either landmark has a fixed coordinate. */
function reachReward(initial: Expedition): Expedition {
  const run = reachExit(initial)
  return actExpedition(run, { type: 'move', index: run.exit })
}
