import assert from 'node:assert/strict'
import test from 'node:test'
import { solveFinale } from './finale-helpers.js'
import { CONTROL_FLOORS, BLOCKADE_FLOORS } from '../src/game/chapter-layout.js'
import { authoredPowerLayout } from '../src/game/authored-power-layout.js'
import {
  guardianLayout,
  GUARDIAN_PYLONS,
  enterChapterGuardian,
} from '../src/game/chapter-guardian.js'
import { neighbors } from '../src/game/engine.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { solveBattle } from '../src/game/battle-arena.js'
import { createExpedition, actExpedition } from '../src/game/expedition.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { combatStats } from '../src/game/combat-build.js'
import { CURRENT_DEPARTURE } from './helpers.js'

test('both final stages have complete accepted public-clue solutions with the starting profession', () => {
  for (const id of ['tower-control', 'northwest-bastion'] as const) {
    const { run, actions } = solveFinale(id)
    assert.equal(run.phase, 'won')
    assert.equal(run.floor, 3)
    assert.ok(run.health > 0)
    assert.equal(
      actions.some((action) => ['probe', 'sweep', 'sonar', 'skill'].includes(action.type)),
      false,
    )
    if (id === 'northwest-bastion') {
      assert.ok(actions.some((action) => action.type === 'attack'))
      assert.ok(actions.some((action) => action.type === 'end-turn'))
      assert.ok(
        run.encounter!.turn <= 45,
        'The first guardian must not become a long walking exercise',
      )
    }
  }
})

test('five new authored exploration rooms retain connected safe terrain and meaningful mine density', () => {
  for (const content of [...CONTROL_FLOORS, ...BLOCKADE_FLOORS]) {
    const run = authoredPowerLayout(content)
    const solid = run.walls.filter((index) => !run.power.doors.some((door) => door.index === index))
    assert.ok(run.game.config.width >= 17)
    assert.ok(run.game.config.mines / (run.game.cells.length - solid.length) >= 0.2)
    const seen = new Set([run.entrance]),
      queue = [run.entrance]
    for (const index of queue)
      for (const other of adjacentSteps(run.game, index)) {
        if (seen.has(other) || solid.includes(other) || run.game.cells[other]!.mine) continue
        seen.add(other)
        queue.push(other)
      }
    for (const [index, cell] of run.game.cells.entries()) {
      assert.equal(
        cell.adjacent,
        neighbors(run.game.config, index).filter((other) => run.game.cells[other]!.mine).length,
      )
      if (!solid.includes(index) && !cell.mine) assert.ok(seen.has(index))
    }
    for (const control of [...run.power.junctions, ...run.power.receivers]) {
      assert.equal(run.game.cells[control.index]!.mine, false)
      assert.ok(run.game.cells[control.index]!.adjacent > 0)
    }
  }
})

test('the damaged guardian announces a frozen player-centered cross that requires leaving both lines', () => {
  const { actions } = solveFinale('northwest-bastion')
  let run = createExpedition({ ...CURRENT_DEPARTURE, seed: 0, campaign: 'northwest-bastion-v1' })
  let pursuitTurns = 0
  let movedUnderForecast = false
  for (const action of actions) {
    const previous = run
    run = actExpedition(run, action)
    const boss = run.encounter
    if (
      action.type === 'end-turn' &&
      boss?.kind === 'bastion' &&
      boss.turn % 3 === 0 &&
      boss.health <= boss.maxHealth / 2
    ) {
      pursuitTurns++
      assert.equal(boss.intent.kind, 'cross')
      assert.ok(boss.intent.targets.includes(previous.player))
      // A single orthogonal step remains on one arm: reserve movement or absorb a braced hit.
      for (const cell of adjacentSteps(run.game, previous.player))
        if (!run.walls.includes(cell)) assert.ok(boss.intent.targets.includes(cell))
      assert.ok(
        boss.intent.targets.every(
          (cell) =>
            Math.floor(cell / run.game.config.width) ===
              Math.floor(previous.player / run.game.config.width) ||
            cell % run.game.config.width === previous.player % run.game.config.width,
        ),
      )
    }
    if (
      previous.encounter?.kind === 'bastion' &&
      previous.encounter.health <= 20 &&
      previous.player !== run.player
    ) {
      assert.deepEqual(boss?.intent, previous.encounter.intent)
      movedUnderForecast = true
    }
  }
  assert.ok(pursuitTurns > 0)
  assert.ok(movedUnderForecast)
  assert.equal(run.phase, 'won')
  assert.ok(run.health > 0)
})

test('the authored guardian requires both regional deductions and retains shared combat builds', () => {
  const layout = guardianLayout()
  assert.equal(layout.game.config.mines, 26)
  assert.ok(layout.game.cells.filter((cell) => cell.visibility === 'revealed').length <= 20)
  const solved = solveBattle(layout.game, layout.walls, layout.entrance)
  for (const index of GUARDIAN_PYLONS) assert.equal(solved.cells[index]!.visibility, 'revealed')
  const base = {
    ...createExpedition({
      ...CURRENT_DEPARTURE,
      seed: 0,
      campaign: 'northwest-bastion-v1' as const,
    }),
    ...layout,
    floor: 3,
    player: layout.entrance,
  }
  const battle = enterChapterGuardian(base)
  assert.equal(tacticalPlan(battle, { type: 'attack' }).reason, 'armor')
  assert.equal(actExpedition(battle, { type: 'attack' }), battle)
  const equipped = enterChapterGuardian({
    ...base,
    departure: { ...base.departure, equipment: ['field-boots', 'focus-lens'] },
    relics: ['tactics-hourglass', 'tempered-edge'],
  })
  assert.equal(equipped.encounter!.points, combatStats(equipped).actions)
  assert.equal(equipped.encounter!.points, 4)
  assert.equal(actExpedition(equipped, { type: 'end-turn' }).encounter!.points, 5)
  assert.equal(battle.encounter!.points, 3)
  assert.equal(combatStats(equipped).attack, combatStats(battle).attack + 3)
  assert.equal(enterChapterGuardian({ ...base, departure: CURRENT_DEPARTURE }).encounter, null)
})

test('entering the chapter guardian grants the shared title entry effect exactly once', () => {
  const { actions } = solveFinale('northwest-bastion')
  for (const title of ['mirror-flawless', 'four-legends'] as const) {
    let run = createExpedition({
      ...CURRENT_DEPARTURE,
      seed: 0,
      title,
      campaign: 'northwest-bastion-v1',
    })
    for (const action of actions) {
      if (run.floor === 2 && run.phase === 'reward') {
        const injured = { ...run, shields: 0, health: 6 }
        const entered = actExpedition(injured, action)
        assert.equal(entered.phase, 'boss')
        assert.equal(entered.floor, 3)
        assert.equal(
          entered.shields,
          Number(title === 'mirror-flawless') +
            Number(action.type === 'relic' && action.relic === 'aegis'),
        )
        assert.equal(entered.health, title === 'four-legends' ? 8 : 6)
        assert.equal(
          actExpedition(entered, action),
          entered,
          'Repeating a relic selection cannot replay entry bonuses',
        )
        break
      }
      run = actExpedition(run, action)
    }
    assert.equal(run.floor, 2)
    assert.equal(run.phase, 'reward')
  }
})
