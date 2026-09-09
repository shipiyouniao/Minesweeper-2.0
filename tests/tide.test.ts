import assert from 'node:assert/strict'
import test from 'node:test'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import { actExpedition, createExpedition, frontierCells } from '../src/game/expedition.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { riftLandings, walkingNeighbors } from '../src/game/mobility-skills.js'
import { enterTide, advanceTide, strikeTide } from '../src/game/tide-battle.js'
import { anchorArea, permuteTide, shuffleTide } from '../src/game/tide-shuffle.js'
import { neighbors } from '../src/game/engine.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { defeatTide } from './tide-helpers.js'
import type { TideExpedition } from '../src/types/tide.js'
import type { Expedition } from '../src/types/variants.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'

/** A normal generated arena, with no health or equipment advantage. */
function room(seed = 7, difficulty: VariantDifficulty = 'standard'): TideExpedition {
  const run = enterTide(createExpedition({ ...CURRENT_DEPARTURE, seed, difficulty, equipment: [] }))
  assert.ok(run.encounter?.kind === 'tide')
  return { ...run, encounter: run.encounter }
}

test('A paid rift survives a tide even when unrelated endpoint arithmetic equals the boss', () => {
  const initial = room(0)
  const run: TideExpedition = {
    ...initial,
    player: 71,
    departure: { ...initial.departure, profession: 'riftwalker' },
    game: {
      ...initial.game,
      cells: initial.game.cells.map((cell, index) => ({
        ...cell,
        visibility: cell.mine ? 'flagged' : initial.walls.includes(index) ? 'hidden' : 'revealed',
      })),
    },
    confirmedMines: initial.game.cells.flatMap((cell, index) => (cell.mine ? [index] : [])),
  }
  assert.ok(riftLandings(run).includes(93))
  const opened = actExpedition(run, { type: 'skill', index: 93 })
  assert.ok(opened.encounter?.kind === 'tide')
  const permutation = run.game.cells.map((_, index) =>
    index === 71 ? 77 : index === 77 ? 71 : index,
  )
  const shifted = permuteTide({ ...opened, encounter: opened.encounter }, permutation)
  assert.equal(shifted.encounter.boss, 85)
  assert.equal((shifted.rift!.from + shifted.rift!.to) / 2, shifted.encounter.boss)
  assert.ok(walkingNeighbors(shifted, 77).includes(93))
  assert.ok(walkingNeighbors(shifted, 93).includes(77))
})

test('Tide permutations preserve complete tiles, mistakes, discoveries, mobility and resources', () => {
  const initial = room()
  const mine = initial.game.cells.findIndex((cell) => cell.mine)
  const safe = initial.game.cells.findIndex(
    (cell, index) => !cell.mine && !initial.walls.includes(index) && cell.visibility === 'hidden',
  )
  const run: TideExpedition = {
    ...initial,
    confirmedMines: [mine],
    triggeredMines: [mine],
    surveyedCells: [mine, safe],
    travelled: [initial.player, safe],
    waymark: { index: safe, room: 'test' },
    rift: { from: safe, to: mine, room: 'test' },
    game: {
      ...initial.game,
      safeMarks: [safe],
      cells: initial.game.cells.map((cell, index) =>
        index === mine || index === safe ? { ...cell, visibility: 'flagged' } : cell,
      ),
    },
  }
  const permutation = run.game.cells.map((_, index) => run.game.cells.length - index - 1)
  const next = permuteTide(run, permutation)
  for (const [from, to] of permutation.entries()) {
    assert.equal(next.game.cells[to]!.mine, run.game.cells[from]!.mine)
    assert.equal(next.game.cells[to]!.visibility, run.game.cells[from]!.visibility)
    assert.equal(
      next.game.cells[to]!.adjacent,
      neighbors(next.game.config, to).filter((index) => next.game.cells[index]!.mine).length,
    )
  }
  assert.deepEqual(next.game.safeMarks, [permutation[safe]])
  assert.deepEqual(next.confirmedMines, [permutation[mine]])
  assert.deepEqual(next.triggeredMines, [permutation[mine]])
  assert.deepEqual(next.surveyedCells, [permutation[mine], permutation[safe]])
  assert.equal(next.waymark?.index, permutation[safe])
  assert.equal(next.rift?.from, permutation[safe])
  assert.equal(next.game.cells[permutation[safe]!]!.visibility, 'flagged')
  assert.equal(next.health, run.health)
  assert.equal(next.loot, run.loot)
})

test('Generated tides keep exact quotas, fixed footprints, connected paths and deterministic replay', () => {
  let moving = 0
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    for (let seed = 0; seed < 5; seed++) {
      const initial = room(seed, difficulty)
      const run = {
        ...initial,
        encounter: { ...initial.encounter, anchors: [initial.player], turn: 3 },
      }
      const next = shuffleTide(run)
      assert.deepEqual(next, shuffleTide(run))
      const p = next.encounter.permutation
      assert.equal(new Set(p).size, run.game.cells.length)
      assert.equal(next.game.cells.filter((cell) => cell.mine).length, run.game.config.mines)
      for (const index of [
        run.player,
        run.encounter.boss,
        ...anchorArea(run.game.config, run.player),
      ])
        assert.equal(p[index], index)
      moving += Number(p.some((to, from) => to !== from))
      const found = new Set([next.player]),
        queue = [next.player]
      for (const index of queue)
        for (const other of adjacentSteps(next.game, index)) {
          if (found.has(other) || next.walls.includes(other) || next.game.cells[other]!.mine)
            continue
          found.add(other)
          queue.push(other)
        }
      next.game.cells.forEach((cell, index) =>
        assert.ok(cell.mine || next.walls.includes(index) || found.has(index)),
      )
    }
  }
  assert.ok(moving >= 23, `${moving}/25 tides changed the layout`)
})

test('Walls and their orthogonal mine borders stay fixed through successive tides', () => {
  const initial = room(13)
  const walls = initial.walls.filter((index) => index !== initial.encounter.boss)
  const borderMines = initial.game.cells.flatMap((cell, index) =>
    cell.mine && walls.some((wall) => adjacentSteps(initial.game, wall).includes(index))
      ? [index]
      : [],
  )
  assert.ok(walls.length > 1, 'Exercise a wall cluster at the board edge')
  assert.ok(borderMines.length > 1, 'Exercise the mines bordering that cluster')

  let run = initial
  let moving = 0
  for (const turn of [3, 6, 9]) {
    run = shuffleTide({ ...run, encounter: { ...run.encounter, turn } })
    assert.deepEqual(run.walls, initial.walls)
    for (const index of [...walls, ...borderMines]) {
      assert.equal(run.encounter.permutation[index], index)
      assert.equal(run.game.cells[index]!.mine, initial.game.cells[index]!.mine)
      assert.equal(run.game.cells[index]!.visibility, initial.game.cells[index]!.visibility)
    }
    assert.deepEqual(run.confirmedMines, initial.confirmedMines)
    moving += Number(run.encounter.permutation.some((to, from) => to !== from))
  }
  assert.equal(moving, 3, 'Fixed borders must not stop the rest of the floor from moving')
})

test('Anchors cost a point, reject remote or covered targets, and expire after exactly three end turns', () => {
  const run = room()
  const anchored = actExpedition(run, { type: 'anchor', index: run.player })
  assert.equal(anchored.encounter?.points, run.encounter.points - 1)
  assert.equal(actExpedition(anchored, { type: 'anchor', index: run.player }), anchored)
  assert.equal(tacticalPlan(run, { type: 'anchor', index: run.encounter.core }).allowed, false)
  let next = anchored
  for (let turn = 0; turn < 3; turn++) {
    assert.ok(next.encounter?.kind === 'tide')
    // Isolate tide timing from combat injuries; actual public play is tested separately.
    next = advanceTide({
      ...next,
      encounter: { ...next.encounter, intent: { ...next.encounter.intent, targets: [] } },
    })
    assert.ok(next.encounter?.kind === 'tide')
    assert.equal(next.encounter.cycle, Number(turn === 2))
  }
  assert.ok(next.encounter?.kind === 'tide')
  assert.deepEqual(next.encounter.anchors, [])
})

test('Anchored revealed core breaks the shield after the frozen attack, never before it', () => {
  const initial = room()
  const run: TideExpedition = {
    ...initial,
    health: 1,
    shields: 0,
    game: {
      ...initial.game,
      cells: initial.game.cells.map((cell, index) =>
        index === initial.encounter.core ? { ...cell, visibility: 'revealed' } : cell,
      ),
    },
    encounter: {
      ...initial.encounter,
      turn: 3,
      anchors: [initial.encounter.core],
      intent: { kind: 'row', targets: [initial.player], damage: 4 },
    },
  }
  const lost = advanceTide(run)
  assert.equal(lost.phase, 'lost')
  assert.equal(lost.encounter.cycle, 0)
  assert.equal(lost.encounter.exposed, false)
  const next = advanceTide({ ...run, health: 10 })
  assert.equal(next.health, 6)
  assert.equal(next.encounter.exposed, true)
  assert.equal(next.encounter.event, 'tide-broken')
  assert.equal(next.encounter.core, run.encounter.core)
})

test('An unupgraded public-clue explorer wins ten seeds at every difficulty', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    for (let seed = 0; seed < 10; seed++) {
      const run = room(seed, difficulty)
      const transcript = defeatTide(run)
      const replayed = transcript.reduce(actExpedition, run)
      assert.ok(replayed.phase === 'reward' || replayed.phase === 'won')
      assert.equal(replayed.encounter?.health, 0)
    }
  }
})

test('Accepted anchors and tides restore through the real journal and settle the new boss once', () => {
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
  assert.equal(session.run?.encounter?.kind, 'tide')
  for (const action of defeatTide(session.run!)) {
    assert.ok(session.dispatch(action))
    if (action.type === 'anchor' || action.type === 'end-turn') {
      const expected: Expedition | null = session.run
      session = new ExpeditionSession(new VariantRepository(storage), runtime)
      assert.deepEqual(session.run, expected)
    }
  }
  assert.equal(session.run?.phase, 'won')
  const restored = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.deepEqual(restored.camp, session.camp)
  assert.deepEqual(restored.camp.milestones?.bossKinds, ['tide'])
})

test('Countercurrent rewards objective builds once while attack damage cannot skip a shield section', () => {
  const initial = room()
  const run: TideExpedition = {
    ...initial,
    departure: { ...initial.departure, equipment: ['focus-lens'] },
    relics: ['breach-sigil', 'reserve-watch'],
    game: {
      ...initial.game,
      cells: initial.game.cells.map((cell, index) =>
        index === initial.encounter.core ? { ...cell, visibility: 'revealed' } : cell,
      ),
    },
    encounter: {
      ...initial.encounter,
      turn: 3,
      anchors: [initial.encounter.core],
      intent: { kind: 'row', targets: [], damage: 4 },
    },
  }
  const next = actExpedition(run, { type: 'end-turn' })
  assert.equal(next.encounter?.points, 5)
  assert.ok(next.encounter?.turnTriggers.includes('focus-lens'))
  assert.ok(next.encounter?.kind === 'tide')
  assert.equal(
    strikeTide({ ...next, encounter: next.encounter }, 1000).encounter.health,
    Math.ceil(next.encounter.maxHealth / 2),
  )
  const repeated = actExpedition(next, { type: 'end-turn' })
  assert.equal(repeated.encounter?.points, 3)
  assert.equal(repeated.encounter?.event === 'tide-broken', false)
})
