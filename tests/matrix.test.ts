import type { Expedition } from '../src/types/variants.js'
import assert from 'node:assert/strict'
import test from 'node:test'
import { CURRENT_DEPARTURE } from './helpers.js'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { enterMatrix } from '../src/game/matrix-battle.js'
import {
  activePrism,
  matrixKnowledge,
  matrixLine,
  matrixLineTargets,
} from '../src/game/matrix-logic.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { deduceSurvey } from '../src/game/survey-logic.js'
import { tacticalCellAction, tacticalPlan } from '../src/game/tactical-planning.js'
import { revealDungeon } from '../src/game/dungeon-reveal.js'
import { combatStats } from '../src/game/combat-build.js'
import { professionSkillArea } from '../src/game/profession-skills.js'
import { frontierCells } from '../src/game/expedition.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { milestoneProgress } from '../src/game/milestones.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'
import { defeatMatrix } from './matrix-helpers.js'
import type { MatrixExpedition } from '../src/types/matrix.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'

/** Create an unupgraded room through its real encounter entry. */
function room(seed = 6, difficulty: VariantDifficulty = 'standard'): MatrixExpedition {
  const run = enterMatrix(
    createExpedition({ ...CURRENT_DEPARTURE, seed, difficulty, equipment: [] }),
  )
  assert.ok(run.encounter?.kind === 'matrix')
  return { ...run, encounter: run.encounter }
}

test('Matrix generation is deterministic, connected, exact-density and publicly solvable on all five tiers', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const)
    for (let seed = 0; seed < 15; seed++) {
      const run = room(seed, difficulty)
      assert.deepEqual(room(seed, difficulty), run)
      assert.equal(run.game.cells.filter((cell) => cell.mine).length, run.game.config.mines)
      const reached = new Set([run.player]),
        queue = [run.player]
      for (const index of queue)
        for (const next of adjacentSteps(run.game, index))
          if (!run.walls.includes(next) && !run.game.cells[next]!.mine && !reached.has(next)) {
            reached.add(next)
            queue.push(next)
          }
      run.game.cells.forEach((cell, index) =>
        assert.ok(cell.mine || run.walls.includes(index) || reached.has(index)),
      )
      run.encounter.prisms.forEach((prism) => {
        assert.ok(reached.has(prism.index))
        assert.ok(matrixLine(run, prism.axis, prism.line).total! > 0)
      })
      const solved = deduceSurvey(
        run.game.config,
        run.encounter.rows,
        run.encounter.columns,
        run.game.cells.map((_, index) => matrixKnowledge(run, index)),
      )
      assert.equal(solved.contradiction, false)
      solved.cells.forEach((fact, index) =>
        assert.equal(fact, run.game.cells[index]!.mine ? 'mine' : 'safe'),
      )
    }
})

test('Matrix line status, quick-opening and calibration eligibility never read hidden identities', () => {
  const run = room()
  const prism = activePrism(run)
  const secret = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell) => ({ ...cell, mine: !cell.mine, adjacent: 8 })),
    },
  }
  assert.deepEqual(
    matrixLine(run, prism.axis, prism.line),
    matrixLine(secret, prism.axis, prism.line),
  )
  assert.deepEqual(
    matrixLineTargets(run, prism.axis, prism.line),
    matrixLineTargets(secret, prism.axis, prism.line),
  )
  assert.equal(tacticalPlan(run, { type: 'attack' }).reason, 'matrix-shield')
  const adjacent = {
    ...run,
    player: adjacentSteps(run.game, prism.index).find((index) =>
      run.surveyedCells.includes(index),
    )!,
  }
  assert.equal(
    tacticalPlan(adjacent, { type: 'interact', index: prism.index }).reason,
    'matrix-line',
  )
})

test('Matrix excavation never floods zero clues and invalid axis actions do nothing', () => {
  const run = room()
  const zero = run.game.cells.findIndex(
    (cell, index) =>
      !cell.mine &&
      cell.adjacent === 0 &&
      cell.visibility === 'hidden' &&
      !run.walls.includes(index),
  )
  assert.ok(zero >= 0)
  const next = revealDungeon(run, zero)
  assert.equal(next.cells.filter((cell, index) => cell !== run.game.cells[index]).length, 1)
  for (const index of [-1, 0.5, 200, NaN])
    assert.equal(actExpedition(run, { type: 'matrix-row', index }), run)
  const ordinary = createExpedition(CURRENT_DEPARTURE)
  assert.equal(actExpedition(ordinary, { type: 'matrix-row', index: 0 }), ordinary)
})

test('A public-only, unupgraded strategy wins all three Matrix circuits across every tier', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    for (const seed of [6, 18, 55]) {
      const initial = room(seed, difficulty)
      const actions = defeatMatrix(initial)
      const won = actions.reduce(actExpedition, initial as Expedition)
      assert.ok(won.encounter?.kind === 'matrix')
      assert.equal(won.encounter.phase, 3)
      assert.ok(won.encounter.reflections >= 3)
      assert.equal(won.encounter.health, 0)
      assert.equal(won.phase, 'reward')
    }
  }
})

test('Frozen beams use shared damage, defense, shields and brace; calibration uses build AP rewards once', () => {
  const initial = room()
  let ready = initial
  for (const action of defeatMatrix(initial)) {
    if (action.type === 'interact') break
    const next = actExpedition(ready, action)
    assert.ok(next.encounter?.kind === 'matrix')
    ready = { ...next, encounter: next.encounter }
  }
  const prism = activePrism(ready)
  const build = {
    ...ready,
    departure: { ...ready.departure, equipment: ['focus-lens', 'steel-blade'] as const },
    relics: ['breach-sigil', 'tempered-edge'] as const,
  }
  const armed = actExpedition(build, { type: 'interact', index: prism.index })
  assert.ok(armed.encounter?.kind === 'matrix')
  assert.equal(armed.encounter.points, Math.min(5, ready.encounter.points + 1))
  assert.equal(combatStats(armed).attack, 10)
  assert.equal(actExpedition(armed, { type: 'interact', index: prism.index }), armed)
  assert.equal(armed.encounter.health, ready.encounter.health)
  assert.ok(armed.encounter.intent.targets.includes(prism.index))
  for (const [defense, shield, braced, expected] of [
    [false, 0, false, 4],
    [true, 0, false, 3],
    [false, 1, false, 0],
    [false, 0, true, 1],
  ] as const) {
    const positioned: MatrixExpedition = {
      ...armed,
      player: prism.index,
      health: 10,
      shields: shield,
      departure: { ...armed.departure, equipment: defense ? (['plated-vest'] as const) : [] },
      encounter: { ...armed.encounter, braced },
    }
    const targets: readonly number[] = [...positioned.encounter.intent.targets]
    const result = actExpedition(positioned, { type: 'end-turn' })
    assert.equal(result.health, 10 - expected)
    assert.deepEqual(positioned.encounter.intent.targets, targets)
    assert.ok(result.encounter?.kind === 'matrix')
    assert.equal(result.encounter.reflections, 1)
    assert.equal(result.encounter.exposedUntil - result.encounter.turn + 1, 4)
  }
  const exposed = {
    ...ready,
    encounter: { ...ready.encounter, exposedUntil: ready.encounter.turn + 3 },
  }
  const titled = {
    ...exposed,
    departure: { ...exposed.departure, title: 'matrix-precise' as const },
  }
  assert.equal(combatStats(titled).attack, combatStats(exposed).attack + 1)
})

test('Matrix profession scouting targets the active prism and remote line deductions leave removable notes', () => {
  const initial = room()
  const archaeologist = {
    ...initial,
    departure: { ...initial.departure, profession: 'archaeologist' as const },
  }
  assert.ok(professionSkillArea(archaeologist).includes(activePrism(initial).index))
  const solved = deduceSurvey(
    initial.game.config,
    initial.encounter.rows,
    initial.encounter.columns,
    initial.game.cells.map((_, index) => matrixKnowledge(initial, index)),
  )
  const flagged = solved.cells.reduce(
    (run, fact, index) => (fact === 'mine' ? actExpedition(run, { type: 'flag', index }) : run),
    initial as Expedition,
  )
  let noted = flagged
  for (let index = 0; index < initial.game.config.height && !noted.game.safeMarks.length; index++)
    noted = actExpedition(
      { ...flagged, encounter: { ...initial.encounter, points: 0 } },
      { type: 'matrix-row', index },
    )
  assert.ok(noted.game.safeMarks.length)
  const index = noted.game.safeMarks[0]!
  const cancelled = actExpedition(noted, { type: 'mark-safe', index })
  assert.ok(!cancelled.game.safeMarks.includes(index))
})

test('Matrix accepted journals replay circuits and settle the new boss mission once', () => {
  const storage = new MemoryStorage(),
    runtime = new FakeRuntime()
  runtime.seed = 55
  let session = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.ok(session.start('explorer', [], 'relaxed'))
  for (let count = 0; session.run?.phase !== 'boss' && count < 1000; count++) {
    const run = session.run!
    if (run.phase === 'reward')
      assert.ok(session.dispatch({ type: 'relic', relic: run.offers[0]! }))
    else if (walkingPath(run, run.exit))
      assert.ok(session.dispatch({ type: 'move', index: run.exit }))
    else
      assert.ok(
        session.dispatch({
          type: 'reveal',
          index: [...frontierCells(run)].find((index) => !run.game.cells[index]!.mine)!,
        }),
      )
  }
  assert.equal(session.run?.encounter?.kind, 'matrix')
  for (const action of defeatMatrix(session.run!)) {
    assert.ok(session.dispatch(action))
    if (action.type === 'interact') {
      const run: Expedition | null = session.run
      session = new ExpeditionSession(new VariantRepository(storage), runtime)
      assert.deepEqual(session.run, run)
    }
  }
  assert.equal(session.run?.phase, 'won')
  const restored = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.deepEqual(restored.camp, session.camp)
  assert.deepEqual(milestoneProgress(restored.camp).bossKinds, ['matrix'])
  assert.equal(milestoneProgress(restored.camp).bosses, 1)
})

test('Unavailable prism interactions retain normal mouse and touch movement', () => {
  const initial = room()
  const prism = activePrism(initial)
  const player = adjacentSteps(initial.game, prism.index).find(
    (index) =>
      initial.game.cells[index]!.visibility === 'revealed' && !initial.walls.includes(index),
  )!
  for (const state of ['unsolved', 'armed', 'exposed', 'resting'] as const) {
    const run: MatrixExpedition = {
      ...initial,
      player,
      game: {
        ...initial.game,
        cells: initial.game.cells.map((cell, index) =>
          index === prism.index ? { ...cell, visibility: 'revealed' } : cell,
        ),
      },
      encounter: {
        ...initial.encounter,
        armed: state === 'armed',
        exposedUntil: state === 'exposed' ? 10 : 0,
        beam: state === 'resting' ? [] : initial.encounter.beam,
      },
    }
    assert.equal(tacticalPlan(run, { type: 'interact', index: prism.index }).allowed, false)
    assert.equal(tacticalPlan(run, { type: 'move', index: prism.index }).allowed, true)
    const action = tacticalCellAction(run, prism.index)
    assert.deepEqual(action, { type: 'move', index: prism.index })
    assert.equal(actExpedition(run, action).player, prism.index)
  }
})

test('Both Matrix header actions recharge owned Sonar once per safe batch, not per opened cell', () => {
  const initial = room()
  for (const type of ['matrix-row', 'matrix-column'] as const) {
    const before: MatrixExpedition = {
      ...initial,
      departure: { ...initial.departure, equipment: ['sonar'] },
      sonar: { ...initial.sonar, charges: 0, progress: 11 },
    }
    const index = Math.floor(
      (type === 'matrix-row' ? before.game.config.height : before.game.config.width) / 2,
    )
    const after = actExpedition(before, { type, index })
    assert.ok(
      after.game.cells.some(
        (cell, index) =>
          cell.visibility === 'revealed' && before.game.cells[index]!.visibility === 'hidden',
      ),
    )
    assert.equal(after.sonar.charges, 1)
    assert.equal(after.sonar.progress, 0)
    assert.equal(after.sonar.loanProgress, 0)
    const noPoints = { ...before, encounter: { ...before.encounter, points: 0 } }
    assert.deepEqual(actExpedition(noPoints, { type, index }).sonar, before.sonar)
  }
})
