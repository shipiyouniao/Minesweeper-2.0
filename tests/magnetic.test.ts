import test from 'node:test'
import assert from 'node:assert/strict'
import { CURRENT_DEPARTURE } from './helpers.js'
import { createExpedition, actExpedition, frontierCells } from '../src/game/expedition.js'
import { enterMagnetic } from '../src/game/magnetic-battle.js'
import { blastMagnetic } from '../src/game/magnetic-blast.js'
import { battleThreat } from '../src/game/combat-build.js'
import { generateMagnetic } from '../src/game/magnetic-generation.js'
import {
  magneticForecast,
  magneticLurePath,
  magneticProjection,
} from '../src/game/magnetic-field.js'
import { solveBattle } from '../src/game/battle-arena.js'
import { encounterTier } from '../src/game/encounter-tiers.js'
import { tacticalPlan, tacticalCellAction } from '../src/game/tactical-planning.js'
import { adjacentSteps, placedBoard } from '../src/game/variant-board.js'
import { neighbors } from '../src/game/engine.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { professionSkillArea } from '../src/game/profession-skills.js'
import { tacticalCopy, tacticalPlanCopy } from '../src/ui/tactical-copy.js'
import { defeatMagnetic } from './magnetic-helpers.js'
import type { MagneticExpedition } from '../src/types/magnetic.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'

/** A known one-cell corridor with a hidden bypass that only the anchor blast opens. */
function corridor(): MagneticExpedition {
  const run = arena()
  const board = placedBoard({ width: 5, height: 3, mines: 5 }, new Set([0, 1, 2, 3, 4]), 1, 6)
  return {
    ...run,
    entrance: 6,
    player: 9,
    exit: 5,
    walls: [5, 13],
    game: {
      ...board,
      cells: board.cells.map((cell, index) => ({
        ...cell,
        visibility: index < 5 ? 'flagged' : index < 10 ? 'revealed' : 'hidden',
      })),
    },
    confirmedMines: [3, 4],
    triggeredMines: [4],
    encounter: {
      ...run.encounter,
      boss: 5,
      anchors: [
        { index: 8, calibrated: false },
        { index: 11, calibrated: false },
      ],
      forecast: { kind: 'recovery' },
    },
  }
}

test('anchor blast opens a bypass, destroys locked mines and terrain, and updates every clue', () => {
  const run = corridor()
  const lure = actExpedition(run, { type: 'interact', index: 8 })
  const escapeTurn = actExpedition(lure, { type: 'end-turn' })
  assert.deepEqual(escapeTurn.game, lure.game)
  assert.equal(escapeTurn.encounter?.boss, 5)
  const crashed = actExpedition(escapeTurn, { type: 'end-turn' })
  assert.ok(crashed.encounter?.kind === 'magnetic')
  assert.deepEqual(crashed.encounter.craters, [2, 3, 4])
  assert.equal(crashed.game.config.mines, 2)
  assert.equal(crashed.health, 5)
  assert.equal(crashed.encounter.lastDamage, 9)
  assert.equal(crashed.player, 9)
  assert.equal(crashed.encounter.boss, 8)
  assert.ok(!crashed.walls.includes(13))
  assert.ok(walkingPath(crashed, 6), 'Blast ring must reconnect both sides of the occupied anchor')
  assert.ok(walkingPath(crashed, 4), 'Destroyed mine is now walkable')
  for (const index of [2, 3, 4]) {
    assert.equal(crashed.game.cells[index]?.mine, false)
    assert.equal(crashed.game.cells[index]?.visibility, 'revealed')
    assert.ok(!crashed.confirmedMines.includes(index) && !crashed.triggeredMines.includes(index))
  }
  for (const [index, cell] of crashed.game.cells.entries())
    assert.equal(
      cell.adjacent,
      neighbors(crashed.game.config, index).filter((other) => crashed.game.cells[other]?.mine)
        .length,
    )
  assert.equal(actExpedition(crashed, { type: 'move', index: 4 }).player, 4)
  assert.deepEqual(
    actExpedition(escapeTurn, { type: 'end-turn' }),
    crashed,
    'Blast replay is deterministic',
  )
})

test('charge forecasts include overlapping blast hits and match the unmitigated resolution', () => {
  const lured = actExpedition(corridor(), { type: 'interact', index: 8 })
  assert.ok(lured.encounter?.kind === 'magnetic')
  const ready = actExpedition(lured, { type: 'end-turn' })
  assert.ok(ready.encounter?.kind === 'magnetic')

  // The route is [5, 6, 7, 8]; 7 overlaps the blast, 8 blocks it, and 9 is blast-only.
  for (const [index, expected] of [
    [6, 5],
    [7, 10],
    [8, 5],
    [9, 5],
    [10, 0],
  ] as const) {
    assert.equal(battleThreat(lured.encounter, index, lured.game.config), 0)
    assert.equal(battleThreat(ready.encounter, index, ready.game.config), expected)
    const ended = actExpedition({ ...ready, player: index }, { type: 'end-turn' })
    assert.equal(ready.health - ended.health, expected)
    assert.equal(ended.phase === 'lost', index === 7)
  }

  const protectedRun = { ...ready, player: 7, shields: 1 }
  assert.equal(actExpedition(protectedRun, { type: 'end-turn' }).health, 5)
  const braced = actExpedition({ ...ready, player: 7 }, { type: 'brace' })
  assert.equal(actExpedition(braced, { type: 'end-turn' }).health, 6)
})

test('an isolated player can reveal adjacent frontier even when the entrance is disconnected', () => {
  const run = corridor()
  const isolated = { ...run, walls: [5, 8, 13], encounter: { ...run.encounter, boss: 8 } }
  assert.equal(walkingPath(isolated, isolated.entrance), null)
  assert.equal(tacticalPlan(isolated, { type: 'reveal', index: 14 }).allowed, true)
  assert.ok(frontierCells(isolated).has(14))
  assert.equal(actExpedition(isolated, { type: 'reveal', index: 14 }).player, 14)
})

test('repeated blasts cannot detonate spent mines, and edge blasts do not wrap around the board', () => {
  const run = corridor()
  const first = blastMagnetic(run, 0)
  assert.deepEqual(first.encounter.craters, [0, 1])
  assert.equal(first.game.cells[4]?.mine, true)
  assert.equal(first.game.cells[9]?.visibility, run.game.cells[9]?.visibility)
  const repeated = blastMagnetic(first, 0)
  assert.deepEqual(repeated, first)
})

test('dense mine clusters add at most three boss damage and blast damage can defeat the player', () => {
  const run = corridor()
  const board = placedBoard(
    { width: 5, height: 3, mines: 8 },
    new Set([0, 1, 2, 3, 4, 12, 13, 14]),
    1,
    6,
  )
  const dense = {
    ...run,
    walls: [5],
    health: 4,
    game: {
      ...board,
      cells: board.cells.map((cell) => ({
        ...cell,
        visibility: cell.mine ? ('flagged' as const) : ('revealed' as const),
      })),
    },
  }
  const lured = actExpedition(dense, { type: 'interact', index: 8 })
  const crashed = actExpedition(actExpedition(lured, { type: 'end-turn' }), { type: 'end-turn' })
  assert.ok(crashed.encounter?.kind === 'magnetic')
  assert.equal(crashed.encounter.resolution?.detonatedMines.length, 6)
  assert.equal(crashed.encounter.lastDamage, 9)
  assert.equal(crashed.phase, 'lost')
  assert.equal(crashed.health, 0)
  assert.equal(crashed.game.config.mines, 2)
})

test('blast damage is bounded and nonlethal for the knight, with player defense and shields respected', () => {
  for (const bossHealth of [1, 4, 28]) {
    const run = corridor()
    const initial = { ...run, encounter: { ...run.encounter, health: bossHealth } }
    const lured = actExpedition(initial, { type: 'interact', index: 8 })
    const withdrawal = actExpedition(lured, { type: 'end-turn' })
    for (const shields of [0, 1]) {
      const braced = actExpedition({ ...withdrawal, shields }, { type: 'brace' })
      const crashed = actExpedition(braced, { type: 'end-turn' })
      assert.equal(crashed.health, shields ? 10 : 8)
      assert.equal(crashed.shields, 0)
      assert.equal(crashed.encounter?.health, Math.max(1, bossHealth - 9))
    }
    const escaped = actExpedition(withdrawal, { type: 'move', index: 6 })
    const ended = actExpedition(escaped, { type: 'end-turn' })
    assert.equal(ended.health, 5, 'Outside blast but on the charge route still takes a charge hit')
  }
})

const tiers: readonly VariantDifficulty[] = ['relaxed', 'standard', 'advanced', 'expert', 'abyss']

/** Start a real checkpoint with the free explorer, no consumables, no training and no relics. */
function arena(difficulty: VariantDifficulty = 'standard', seed = 47): MagneticExpedition {
  const run = enterMagnetic({
    ...createExpedition({ ...CURRENT_DEPARTURE, seed, difficulty }),
    floor: encounterTier(difficulty).floors[0]!,
    probes: 0,
    scans: 0,
    shields: 0,
  })
  assert.ok(run.encounter?.kind === 'magnetic')
  return { ...run, encounter: run.encounter }
}

/** Arrange known terrain only for focused mechanics; baseline acceptance always plays the hidden arena. */
function opened(initial = arena()): MagneticExpedition {
  return { ...initial, game: solveBattle(initial.game, initial.walls, initial.entrance) }
}

/** Approach a station from a public square outside the fixed incoming charge route. */
function ready(initial = opened()): MagneticExpedition {
  for (const anchor of initial.encounter.anchors) {
    const path = magneticLurePath(initial, anchor.index)
    if (!path) continue
    const player = adjacentSteps(initial.game, anchor.index).find(
      (index) =>
        !initial.walls.includes(index) &&
        initial.game.cells[index]?.visibility === 'revealed' &&
        !path.includes(index),
    )
    if (player !== undefined) return { ...initial, player }
  }
  throw new Error('Fixture has no off-route station approach')
}

/** Choose the adjacent station used by the focused ready fixture. */
function target(run: MagneticExpedition): number {
  return run.encounter.anchors.find((anchor) =>
    adjacentSteps(run.game, run.player).includes(anchor.index),
  )!.index
}

test('magnetic generation keeps exact shuffled mines, full blank expansion and connected public-solvable objectives', () => {
  const entrances = new Set<number>()
  for (const difficulty of tiers) {
    const tier = encounterTier(difficulty)
    const config = {
      ...tier.config,
      mines: Math.round(tier.config.width * tier.config.height * 0.17),
    }
    for (const seed of [0, 1, 2, 3, 4, 5, 47, 0x4d6167]) {
      const layout = generateMagnetic(config, seed)
      assert.deepEqual(generateMagnetic(config, seed), layout)
      assert.equal(layout.game.cells.filter((cell) => cell.mine).length, config.mines)
      assert.ok(
        layout.game.cells.filter((cell) => cell.visibility === 'revealed').length <
          layout.game.cells.length / 2,
      )
      entrances.add(layout.entrance)
      const solved = solveBattle(layout.game, layout.walls, layout.entrance)
      assert.ok(
        solved.cells.every(
          (cell, index) =>
            cell.mine || layout.walls.includes(index) || cell.visibility === 'revealed',
        ),
      )
      for (const [index, cell] of layout.game.cells.entries()) {
        if (cell.visibility === 'revealed' && cell.adjacent === 0)
          assert.ok(
            neighbors(config, index).every(
              (other) =>
                layout.walls.includes(other) || layout.game.cells[other]?.visibility === 'revealed',
            ),
          )
      }
      for (const anchor of layout.objectives) {
        assert.ok(layout.game.cells[anchor]!.adjacent > 0)
        assert.equal(layout.game.cells[anchor]!.visibility, 'hidden')
        const walls = [...layout.walls.filter((index) => index !== layout.boss), anchor]
        const queue = [layout.entrance]
        const seen = new Set(queue)
        for (const index of queue)
          for (const next of adjacentSteps(layout.game, index)) {
            if (seen.has(next) || walls.includes(next) || layout.game.cells[next]?.mine) continue
            seen.add(next)
            queue.push(next)
          }
        assert.ok(
          layout.game.cells.every(
            (cell, index) => cell.mine || walls.includes(index) || seen.has(index),
          ),
        )
      }
    }
  }
  assert.ok(entrances.size > 10)
})

test('the six-turn field cycle has two rotated pulses followed by a quiet turn and honors core recovery', () => {
  assert.deepEqual(
    Array.from({ length: 6 }, (_, index) => magneticForecast(index + 1, 0)),
    [
      { kind: 'field', axis: 'horizontal', polarity: 'pull' },
      { kind: 'field', axis: 'vertical', polarity: 'push' },
      { kind: 'recovery' },
      { kind: 'field', axis: 'vertical', polarity: 'pull' },
      { kind: 'field', axis: 'horizontal', polarity: 'push' },
      { kind: 'recovery' },
    ],
  )
  assert.deepEqual(magneticForecast(4, 4), { kind: 'recovery' })
})

test('public forecasts and lure plans are unchanged when covered truth is poisoned', () => {
  const run = arena()
  const poisoned = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell) =>
        cell.visibility === 'revealed'
          ? cell
          : { ...cell, mine: !cell.mine, adjacent: 8 - cell.adjacent },
      ),
    },
  }
  for (let index = 0; index < run.game.cells.length; index++)
    assert.deepEqual(magneticProjection(poisoned, index), magneticProjection(run, index))
  for (const anchor of run.encounter.anchors)
    assert.deepEqual(magneticLurePath(poisoned, anchor.index), magneticLurePath(run, anchor.index))
  const moved = adjacentSteps(run.game, run.player).find(
    (index) => tacticalPlan(run, { type: 'move', index }).allowed,
  )!
  const next = actExpedition(run, { type: 'move', index: moved })
  assert.ok(next.encounter?.kind === 'magnetic')
  assert.deepEqual(next.encounter.forecast, run.encounter.forecast)
})

test('brace reduces displacement and calibrated anchors prevent it and leave mine layouts unchanged', () => {
  const run = arena()
  const braced = actExpedition(run, { type: 'brace' })
  const ended = actExpedition(braced, { type: 'end-turn' })
  assert.ok(braced.encounter?.kind === 'magnetic')
  const projection = magneticProjection({ ...braced, encounter: braced.encounter })
  assert.equal(projection.anchored, false)
  assert.equal(projection.path.length, 2)
  assert.equal(ended.player, projection.path.at(-1))
  assert.equal(ended.health, run.health)
  assert.deepEqual(
    ended.game.cells.map((cell) => cell.mine),
    run.game.cells.map((cell) => cell.mine),
  )
  assert.equal(ended.encounter?.turn, 2)
  assert.equal(ended.encounter?.points, 3)
  const known = opened(run)
  const anchor = known.encounter.anchors[0]!
  const grounded = {
    ...known,
    player: anchor.index,
    encounter: {
      ...known.encounter,
      anchors: [{ ...anchor, calibrated: true }, known.encounter.anchors[1]!],
    },
  }
  assert.equal(magneticProjection(grounded).anchored, true)
  assert.equal(actExpedition(grounded, { type: 'end-turn' }).player, anchor.index)
  const beside = {
    ...grounded,
    player: adjacentSteps(grounded.game, anchor.index).find(
      (index) => grounded.game.cells[index]?.visibility === 'revealed',
    )!,
  }
  assert.equal(
    tacticalCellAction(beside, anchor.index).type,
    'move',
    'calibrated stations remain reachable by pointer input',
  )
  assert.equal(tacticalCellAction(grounded, anchor.index).type, 'interact')
})

test('a forced mine collision uses health and shields, locks a red mine, and stops before the hazard', () => {
  const run = opened()
  let found = false
  for (const [player, cell] of run.game.cells.entries()) {
    if (cell.visibility !== 'revealed') continue
    const staged = { ...run, player }
    const projection = magneticProjection(staged)
    const hazard = projection.path.slice(1).find((index) => run.game.cells[index]?.mine)
    if (hazard === undefined) continue
    for (const shields of [0, 1]) {
      const ended = actExpedition({ ...staged, shields }, { type: 'end-turn' })
      assert.equal(ended.health, shields ? 10 : 5)
      assert.equal(ended.shields, 0)
      assert.ok(ended.triggeredMines.includes(hazard))
      assert.ok(ended.confirmedMines.includes(hazard))
      assert.notEqual(ended.player, hazard)
      assert.equal(ended.game.cells[hazard]?.visibility, 'flagged')
      assert.equal(actExpedition(ended, { type: 'flag', index: hazard }), ended)
    }
    found = true
    break
  }
  assert.ok(found)
})

test('calibration, frozen lure, crash, movement and three-turn exposure share actual AP and damage', () => {
  const run = ready()
  const index = target(run)
  assert.equal(tacticalCellAction(run, index).type, 'interact')
  assert.equal(tacticalPlan(run, { type: 'attack' }).reason, 'magnet-armor')
  const lure = actExpedition(run, { type: 'interact', index })
  assert.ok(lure.encounter?.kind === 'magnetic' && lure.encounter.forecast.kind === 'charge')
  assert.equal(lure.encounter.points, 2)
  assert.equal(lure.encounter.event, 'disabled')
  assert.equal(tacticalPlan(lure, { type: 'interact', index }).reason, 'magnet-busy')
  const withdrawal = actExpedition(lure, { type: 'end-turn' })
  assert.equal(withdrawal.encounter?.boss, run.encounter.boss)
  assert.equal(withdrawal.health, run.health)
  assert.equal(withdrawal.encounter?.points, 3)
  const crashed = actExpedition(withdrawal, { type: 'end-turn' })
  assert.ok(crashed.encounter?.kind === 'magnetic')
  assert.equal(crashed.encounter.boss, index)
  assert.equal(
    crashed.encounter.health,
    run.encounter.health - 6 - Math.min(3, crashed.encounter.resolution!.detonatedMines.length),
  )
  assert.ok(crashed.walls.includes(index) && !crashed.walls.includes(run.encounter.boss))
  assert.equal(crashed.health, 5)
  assert.deepEqual(crashed.encounter.resolution?.bossPath, lure.encounter.forecast.path)
  assert.equal(crashed.encounter.exposedUntil - crashed.encounter.turn + 1, 3)
  assert.equal(actExpedition(crashed, { type: 'attack' }).encounter?.lastDamage, 5)
  let cooled = crashed
  for (let i = 0; i < 3; i++) cooled = actExpedition(cooled, { type: 'end-turn' })
  assert.equal(tacticalPlan(cooled, { type: 'attack' }).reason, 'magnet-armor')
})

test('blocking the announced charge destination hurts without stacking the boss on the player or opening armor', () => {
  const staged = ready()
  const index = target(staged)
  const run = { ...staged, player: index }
  const lure = actExpedition(run, { type: 'interact', index })
  const blocked = actExpedition(actExpedition(lure, { type: 'end-turn' }), { type: 'end-turn' })
  assert.ok(blocked.encounter?.kind === 'magnetic')
  assert.equal(blocked.health, 5)
  assert.equal(blocked.player, index)
  assert.equal(blocked.encounter.boss, run.encounter.boss)
  assert.equal(blocked.encounter.exposedUntil, 0)
  assert.deepEqual(blocked.walls, run.walls)
})

test('wrong calibration preserves flags and costs health and AP, without arming a lure', () => {
  const run = ready()
  const index = target(run)
  const ring = neighbors(run.game.config, index)
  const mine = ring.find((other) => run.game.cells[other]?.mine)!
  const safe = ring.find((other) => !run.game.cells[other]?.mine && !run.walls.includes(other))!
  const wrong = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, other) =>
        other === mine
          ? { ...cell, visibility: 'hidden' as const }
          : other === safe
            ? { ...cell, visibility: 'flagged' as const }
            : cell,
      ),
    },
  }
  const next = actExpedition(wrong, { type: 'interact', index })
  assert.equal(next.health, 5)
  assert.equal(next.encounter?.points, 2)
  assert.equal(next.encounter?.event, 'misfire')
  assert.deepEqual(next.game, wrong.game)
})

test('builds apply bounded calibration refunds, attack power, AP and profession scouting to the knight', () => {
  const base = ready()
  const run = {
    ...base,
    departure: {
      ...base.departure,
      profession: 'archaeologist' as const,
      equipment: ['focus-lens' as const],
      training: ['weapon-training' as const],
    },
    relics: ['breach-sigil', 'duelist-edge', 'tempered-edge', 'tactics-hourglass'] as const,
  }
  assert.ok(
    professionSkillArea(run).some((index) =>
      run.encounter.anchors.some((anchor) => anchor.index === index),
    ),
  )
  const lured = actExpedition(run, { type: 'interact', index: target(run) })
  assert.equal(lured.encounter?.points, 4)
  assert.ok(lured.floorTriggers.includes('breach-sigil'))
  const crashed = actExpedition(actExpedition(lured, { type: 'end-turn' }), { type: 'end-turn' })
  assert.equal(crashed.encounter?.points, 4)
  const hit = actExpedition(crashed, { type: 'attack' })
  assert.equal(hit.encounter?.lastDamage, 13)
})

test('free explorers beat all five difficulties through public deductions, grounding, lures and replayable strikes', () => {
  for (const difficulty of tiers)
    for (const seed of [47, 103]) {
      const run = arena(difficulty, seed)
      const actions = defeatMagnetic(run)
      const end = actions.reduce(actExpedition, run)
      assert.ok(end.phase === 'won' || end.phase === 'reward')
      assert.ok(actions.some((action) => action.type === 'reveal'))
      assert.ok(actions.some((action) => action.type === 'flag'))
      assert.ok(actions.filter((action) => action.type === 'interact').length >= 2)
      assert.equal(end.health, end.maxHealth)
      assert.equal(end.shields, 1)
      assert.deepEqual(actions.reduce(actExpedition, run), end)
    }
})

test('magnetic rules and blocked actions have authored copy in every supported language', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    const copy = tacticalCopy(language, 'magnetic')
    assert.ok(copy.name && copy.help.length >= 6)
    for (const reason of ['magnet-armor', 'magnet-route', 'magnet-busy'] as const)
      assert.ok(
        tacticalPlanCopy(language, { reason, path: [], cost: 1, allowed: false }).length > 10,
      )
  }
})
