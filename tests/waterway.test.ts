import assert from 'node:assert/strict'
import test from 'node:test'
import { solveWaterway, WATERWAY_DEPARTURE } from './waterway-helpers.js'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { WATERWAY_FLOORS, waterwayLayout } from '../src/game/waterway-layout.js'
import { feedPowered } from '../src/game/floor-power.js'
import { neighbors } from '../src/game/engine.js'
import { adjacentSteps } from '../src/game/variant-board.js'

test('three authored waterway floors solve without guesses, tool use or damage', () => {
  const solved = solveWaterway()
  assert.equal(solved.run.phase, 'won')
  assert.ok(solved.actions.some((action) => action.type === 'flag'))
  assert.equal(
    solved.actions.some((action) => action.type === 'probe' || action.type === 'sweep'),
    false,
  )
})

test('authored circuits use safe, unique controls and truthful clues on connected terrain', () => {
  for (const [index, content] of WATERWAY_FLOORS.entries()) {
    const run = waterwayLayout(index + 1)
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

test('rerouting closes the old branch, preserves readings and never changes hazards', () => {
  const { actions } = solveWaterway()
  let run = createExpedition(WATERWAY_DEPARTURE)
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

test('larger chambers retain mine density and require sustained public-clue excavation', () => {
  const plan = solveWaterway()
  let run = createExpedition(WATERWAY_DEPARTURE)
  const manual = [0, 0, 0]
  const inspect = (): void => {
    const walls = run.walls.filter((at) => !run.power!.doors.some((door) => door.index === at))
    const playable = run.game.cells.length - walls.length
    const initial = run.game.cells.filter((cell) => cell.visibility === 'revealed').length
    assert.ok(
      run.game.config.mines / playable >= 0.2,
      'At least one fifth of playable terrain contains mines',
    )
    assert.ok(
      initial / playable <= 0.18,
      'The starting flood must not solve a large part of the chamber',
    )
    assert.deepEqual(
      [run.game.config.width, run.game.config.height],
      [
        [15, 15],
        [17, 17],
        [19, 17],
      ][run.floor - 1],
    )
    for (const device of [...run.power!.junctions, ...run.power!.receivers])
      assert.ok(
        run.game.cells[device.index]!.adjacent >= 1,
        'Devices require nearby mine deduction',
      )
  }
  inspect()
  for (const action of plan.actions) {
    if (action.type === 'reveal') manual[run.floor - 1]!++
    const before = run
    run = actExpedition(run, action)
    if (before.floor !== run.floor) inspect()
  }
  for (const [floor, minimum] of [45, 65, 80].entries()) assert.ok(manual[floor]! >= minimum)
})
