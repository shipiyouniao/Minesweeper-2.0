import assert from 'node:assert/strict'
import test from 'node:test'
import { solveObservatory, RIDGE_DEPARTURE } from './observatory-helpers.js'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { OBSERVATORY_FLOORS, observatoryLayout } from '../src/game/observatory-layout.js'
import { feedPowered } from '../src/game/floor-power.js'
import { neighbors } from '../src/game/engine.js'
import { adjacentSteps } from '../src/game/variant-board.js'

test('three authored observatory floors solve without guesses, tool use or damage', () => {
  const solved = solveObservatory()
  assert.equal(solved.run.phase, 'won')
  assert.ok(solved.actions.some((action) => action.type === 'flag'))
  assert.equal(
    solved.actions.some((action) => action.type === 'probe' || action.type === 'sweep'),
    false,
  )
})

test('authored circuits use safe, unique controls and truthful clues on connected terrain', () => {
  for (const [index, content] of OBSERVATORY_FLOORS.entries()) {
    const run = observatoryLayout(index + 1)
    assert.ok(content.rows.every((row) => row.length === run.game.config.width))
    const devices = [...run.power.junctions, ...run.power.doors, ...run.power.receivers]
    assert.equal(new Set(devices.map((entry) => entry.index)).size, devices.length)
    for (const entry of devices) {
      assert.equal(run.game.cells[entry.index]?.mine, false)
      assert.notEqual(content.rows.join('')[entry.index], '#')
    }
    const solid = new Set(
      run.walls.filter((at) => !run.power.doors.some((entry) => entry.index === at)),
    )
    const seen = new Set([run.entrance]),
      queue = [run.entrance]
    for (let cursor = 0; cursor < queue.length; cursor++)
      for (const next of adjacentSteps(run.game, queue[cursor]!))
        if (!seen.has(next) && !solid.has(next) && !run.game.cells[next]!.mine) {
          seen.add(next)
          queue.push(next)
        }
    for (const [at, cell] of run.game.cells.entries()) {
      if (solid.has(at) || cell.mine) continue
      assert.ok(seen.has(at), `floor ${index + 1}: inaccessible safe cell ${at}`)
      assert.equal(
        cell.adjacent,
        neighbors(run.game.config, at).filter((other) => run.game.cells[other]!.mine).length,
      )
    }
  }
})

test('unrevealed devices and closed doors reject remote operations', () => {
  const run = createExpedition(RIDGE_DEPARTURE)
  assert.equal(actExpedition(run, { type: 'interact', index: 24 }), run)
  assert.equal(actExpedition(run, { type: 'move', index: 46 }), run)
  assert.equal(actExpedition(run, { type: 'reveal', index: 46 }), run)
  assert.equal(actExpedition(run, { type: 'flag', index: 46 }), run)
})

test('rerouting closes the old branch, preserves readings and never changes hazards', () => {
  const { actions } = solveObservatory()
  let run = createExpedition(RIDGE_DEPARTURE)
  for (const action of actions) {
    const before = run
    run = actExpedition(run, action)
    if (before.floor !== run.floor) continue
    assert.deepEqual(
      run.game.cells.map((cell) => [cell.mine, cell.adjacent]),
      before.game.cells.map((cell) => [cell.mine, cell.adjacent]),
    )
    assert.equal(run.walls.includes(run.player), false)
    for (const reading of before.power!.receivers.filter((entry) => entry.recorded))
      assert.equal(
        run.power!.receivers.find((entry) => entry.index === reading.index)?.recorded,
        true,
      )
    for (const door of run.power!.doors)
      assert.equal(run.walls.includes(door.index), !feedPowered(run.power!, door.input))
  }
})
