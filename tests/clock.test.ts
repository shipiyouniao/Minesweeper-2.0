import test from 'node:test'
import { milestoneProgress } from '../src/game/milestones.js'
import type { Expedition } from '../src/types/variants.js'
import assert from 'node:assert/strict'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { createExpedition, actExpedition, frontierCells } from '../src/game/expedition.js'
import { enterClock } from '../src/game/clock-battle.js'
import { forecastClock, clockEscapeExists, clockIntent } from '../src/game/clock-forecast.js'
import { generateClock } from '../src/game/clock-generation.js'
import { encounterTier } from '../src/game/encounter-tiers.js'
import { solveBattle } from '../src/game/battle-arena.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { neighbors } from '../src/game/engine.js'
import { tacticalPlan, tacticalCellAction } from '../src/game/tactical-planning.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { battleThreat } from '../src/game/combat-build.js'
import { clockCopy, clockDeadline } from '../src/ui/clock-copy.js'
import { tacticalCopy } from '../src/ui/tactical-copy.js'
import { defeatClock } from './clock-helpers.js'
import type { ClockExpedition } from '../src/types/clock.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'

function arena(seed = 4, difficulty: VariantDifficulty = 'relaxed'): ClockExpedition {
  const run = enterClock(
    createExpedition({
      ...CURRENT_DEPARTURE,
      seed,
      difficulty,
      profession: 'explorer',
      equipment: [],
    }),
  )
  assert.ok(run.encounter?.kind === 'clock')
  return { ...run, encounter: run.encounter }
}

test('clock arenas have exact mines, truthful clues, deducible connected floor and central bypass', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    const tier = encounterTier(difficulty)
    const config = {
      ...tier.config,
      mines: Math.round(tier.config.width * tier.config.height * 0.17),
    }
    for (let seed = 0; seed < 12; seed++) {
      const layout = generateClock(config, seed)
      assert.equal(layout.game.cells.filter((cell) => cell.mine).length, config.mines)
      assert.ok(
        neighbors(config, layout.boss).every(
          (index) => !layout.walls.includes(index) && !layout.game.cells[index]!.mine,
        ),
      )
      const solved = solveBattle(layout.game, layout.walls, layout.entrance)
      for (const [index, cell] of solved.cells.entries()) {
        assert.equal(
          cell.adjacent,
          neighbors(config, index).filter((other) => solved.cells[other]!.mine).length,
        )
        if (!cell.mine && !layout.walls.includes(index)) assert.equal(cell.visibility, 'revealed')
      }
      assert.equal(layout.objectives.length, 3)
    }
  }
})

test('clock deadlines give two full turns, remain frozen across movement and preserve clues', () => {
  const run = arena()
  assert.equal(run.encounter.spells[0]?.resolvesOn, 2)
  assert.ok(clockEscapeExists(run))
  const next = actExpedition(run, { type: 'end-turn' })
  assert.equal(next.health, run.health)
  assert.deepEqual(next.game, run.game)
  assert.ok(next.encounter?.kind === 'clock')
  assert.deepEqual(next.encounter.spells, run.encounter.spells)
  const hit = actExpedition(next, { type: 'end-turn' })
  assert.equal(hit.health, run.health - 3)
  assert.deepEqual(hit.game, run.game)
  assert.deepEqual(actExpedition(next, { type: 'end-turn' }), hit)
})

test('hourglass redirects the earliest deadline for one AP once, stays walkable and grants recovery', () => {
  const initial = arena()
  const index = initial.encounter.hourglasses[0]!.index
  const run: ClockExpedition = {
    ...initial,
    game: solveBattle(initial.game, initial.walls, initial.entrance),
    player: index,
    encounter: {
      ...initial.encounter,
      turn: 2,
      spells: [{ id: 1, shape: 'cross', targets: [index], resolvesOn: 2, redirected: false }],
    },
  }
  const before = clockIntent(run)
  assert.deepEqual(tacticalCellAction(before, index), { type: 'interact', index })
  const next = actExpedition(before, { type: 'interact', index })
  assert.ok(next.encounter?.kind === 'clock')
  assert.equal(next.encounter.points, 2)
  assert.equal(next.encounter.spells[0]?.resolvesOn, 2)
  assert.equal(battleThreat(next.encounter, index, next.game.config), 0)
  assert.ok(walkingPath(next, index))
  assert.equal(actExpedition(next, { type: 'interact', index }), next)
  const end = actExpedition(next, { type: 'end-turn' })
  assert.ok(end.encounter?.kind === 'clock')
  assert.equal(end.encounter.health, run.encounter.health - 6)
  assert.equal(end.health, run.health)
  assert.equal(end.encounter.recoveryUntil, 3)
  assert.equal(end.encounter.spells.length, 0)
  assert.deepEqual(end.game, run.game)
  const empty = { ...before, encounter: { ...before.encounter, points: 0 } }
  assert.equal(actExpedition(empty, { type: 'interact', index }), empty)
})

test('echo records first accepted strike only, follows retreat, and settles once without skill refunds', () => {
  const initial = arena()
  const player = adjacentSteps(initial.game, initial.encounter.boss)[0]!
  const run: ClockExpedition = {
    ...initial,
    player,
    game: solveBattle(initial.game, initial.walls, initial.entrance),
    encounter: { ...initial.encounter, points: 5, spells: [], echo: { index: player, damage: 0 } },
  }
  const struck = actExpedition(run, { type: 'attack' })
  assert.ok(struck.encounter?.kind === 'clock')
  assert.equal(struck.encounter.echo.damage, 2)
  const twice = actExpedition(struck, { type: 'attack' })
  assert.ok(twice.encounter?.kind === 'clock')
  assert.equal(twice.encounter.echo.damage, 2)
  const landing = adjacentSteps(twice.game, player).find((index) => walkingPath(twice, index))!
  const moved = actExpedition(twice, { type: 'move', index: landing })
  const ended = actExpedition(moved, { type: 'end-turn' })
  assert.ok(ended.encounter?.kind === 'clock')
  assert.equal(ended.encounter.health, run.encounter.health - 12)
  assert.equal(ended.encounter.echo.index, landing)
  assert.equal(ended.encounter.echo.damage, 0)
  assert.equal(ended.encounter.resolution?.echoDamage, 2)
  assert.equal(ended.skillUsed, run.skillUsed)
})

test('half-health overlapping forecasts have an escape; a sealed known square never gets a new forced hit', () => {
  const initial = arena()
  const run = forecastClock({
    ...initial,
    encounter: { ...initial.encounter, health: 1, spells: [], nextSpell: 1 },
  })
  assert.ok(clockEscapeExists(run))
  assert.ok(run.encounter.spells.some((spell) => spell.shape === 'line'))
  const isolated = {
    ...initial,
    game: {
      ...initial.game,
      cells: initial.game.cells.map((cell, index) => ({
        ...cell,
        visibility: index === initial.player ? ('revealed' as const) : ('hidden' as const),
      })),
    },
    encounter: { ...initial.encounter, spells: [] },
  }
  assert.equal(forecastClock(isolated).encounter.spells.length, 0)
  assert.equal(tacticalPlan(initial, { type: 'attack' }).allowed, false)
})

test('clock defeat cancels echo; surviving echo kills settle victory exactly once', () => {
  const initial = arena()
  const run: ClockExpedition = {
    ...initial,
    health: 1,
    encounter: {
      ...initial.encounter,
      health: 2,
      turn: 2,
      echo: { index: initial.player, damage: 2 },
    },
  }
  const dead = actExpedition(clockIntent(run), { type: 'end-turn' })
  assert.equal(dead.phase, 'lost')
  assert.equal(dead.encounter?.health, 2)
  const won = actExpedition(
    { ...run, encounter: { ...run.encounter, spells: [] } },
    { type: 'end-turn' },
  )
  assert.equal(won.phase, 'reward')
  assert.equal(won.health, won.maxHealth)
  assert.equal(actExpedition(won, { type: 'end-turn' }), won)
})

test('clock instructions describe all mechanics and explicit deadlines in every language', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    const copy = clockCopy(language, tacticalCopy(language))
    assert.equal(copy.help.length, 5)
    assert.ok(copy.help.every((line) => line.length > 20))
    assert.notEqual(clockDeadline(language, 1), clockDeadline(language, 2))
  }
})

test('starting profession defeats clock across all tiers using only public clues and ordinary actions', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    for (const seed of [4, 19]) {
      const run = arena(seed, difficulty)
      const actions = defeatClock(run)
      const result = actions.reduce(
        actExpedition,
        run as import('../src/types/variants.js').Expedition,
      )
      assert.ok(result.phase === 'reward' || result.phase === 'won')
    }
  }
})

test('real clock journals replay every turn and retain exactly one boss-family milestone after victory', () => {
  const storage = new MemoryStorage(),
    runtime = new FakeRuntime()
  runtime.seed = 59
  let session = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.ok(session.start('explorer', [], 'relaxed'))
  for (let count = 0; session.run?.phase !== 'boss' && count < 1000; count++) {
    const run = session.run!
    if (run.phase === 'reward')
      assert.ok(session.dispatch({ type: 'relic', relic: run.offers[0]! }))
    else if (walkingPath(run, run.exit))
      assert.ok(session.dispatch({ type: 'move', index: run.exit }))
    else {
      const index = [...frontierCells(run)].find((index) => !run.game.cells[index]?.mine)!
      assert.ok(session.dispatch({ type: 'reveal', index }))
    }
  }
  assert.equal(session.run?.encounter?.kind, 'clock')
  for (const action of defeatClock(session.run!)) {
    assert.ok(session.dispatch(action))
    if (action.type === 'end-turn' && session.run?.phase === 'boss') {
      const before: Expedition = session.run
      session = new ExpeditionSession(new VariantRepository(storage), runtime)
      assert.deepEqual(session.run, before)
    }
  }
  assert.equal(session.run?.phase, 'won')
  const restored = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.deepEqual(restored.camp, session.camp)
  assert.equal(milestoneProgress(restored.camp).bosses, 1)
  assert.deepEqual(milestoneProgress(restored.camp).bossKinds, ['clock'])
})
