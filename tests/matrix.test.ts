import assert from 'node:assert/strict'
import test from 'node:test'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import { actExpedition, createExpedition, frontierCells } from '../src/game/expedition.js'
import { enterMatrix } from '../src/game/matrix-battle.js'
import { activeRegion, crystalKnowledge, matrixCharge } from '../src/game/matrix-logic.js'
import { solveBattle } from '../src/game/battle-arena.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { deduceSurvey } from '../src/game/survey-logic.js'
import { tacticalCellAction, tacticalPlan } from '../src/game/tactical-planning.js'
import { revealDungeon } from '../src/game/dungeon-reveal.js'
import { combatStats } from '../src/game/combat-build.js'
import { professionSkillArea } from '../src/game/profession-skills.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { milestoneProgress } from '../src/game/milestones.js'
import { defeatMatrix } from './matrix-helpers.js'
import type { Expedition } from '../src/types/variants.js'
import type { MatrixExpedition } from '../src/types/matrix.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'
import { tacticalHint, tacticalEventCopy } from '../src/ui/tactical-copy.js'
import { message } from '../src/i18n.js'
import { parseVariantCommand } from '../src/ui/variant-input.js'

/** Enter a real generated arena with an unupgraded explorer. */
function room(seed = 6, difficulty: VariantDifficulty = 'standard'): MatrixExpedition {
  const run = enterMatrix(
    createExpedition({ ...CURRENT_DEPARTURE, seed, difficulty, equipment: [] }),
  )
  assert.ok(run.encounter?.kind === 'matrix')
  return { ...run, encounter: run.encounter }
}

/** Isolate extraction rules on revealed terrain; replay tests below use only accepted travel. */
function beside(run: MatrixExpedition, index: number): MatrixExpedition {
  return {
    ...run,
    player: index,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, other) =>
        other === index ? { ...cell, visibility: 'revealed' } : cell,
      ),
    },
    encounter: { ...run.encounter, points: 3 },
  }
}

test('Matrix generates varied connected exact-quota terrain and two independently deducible local puzzles on all tiers', () => {
  const signatures = new Set<string>()
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const)
    for (let seed = 0; seed < 12; seed++) {
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
      const solved = solveBattle(run.game, run.walls, run.entrance)
      for (const region of run.encounter.regions) {
        assert.equal(region.indices.length, 9)
        assert.ok(region.crystals.length === 3 || region.crystals.length === 4)
        const deduction = deduceSurvey(
          { width: 3, height: 3, mines: 0 },
          region.rows,
          region.columns,
          region.indices.map(() => 'unresolved'),
        )
        assert.equal(deduction.contradiction, false)
        region.indices.forEach((index, local) =>
          assert.equal(deduction.cells[local], region.crystals.includes(index) ? 'mine' : 'safe'),
        )
        for (const index of region.crystals) {
          assert.ok(reached.has(index))
          assert.equal(solved.cells[index]!.visibility, 'revealed')
          assert.equal(run.game.cells[index]!.mine, false)
        }
      }
      assert.ok(
        run.encounter.regions[0].indices.every(
          (index) => !run.encounter.regions[1].indices.includes(index),
        ),
      )
      assert.ok(
        adjacentSteps(run.game, run.encounter.boss).some(
          (index) => !run.walls.includes(index) && solved.cells[index]!.visibility === 'revealed',
        ),
      )
      if (difficulty === 'standard')
        signatures.add(
          JSON.stringify([
            run.entrance,
            run.encounter.boss,
            run.encounter.regions.map((region) => region.indices),
          ]),
        )
    }
  assert.ok(signatures.size >= 10)
})

test('Ordinary zero flood and tools reveal mine information without extracting or exposing crystals', () => {
  let run = room()
  const region = activeRegion(run)
  const crystal = region.crystals[0]!
  run = beside(run, crystal)
  const inspected = actExpedition({ ...run, probes: 2 }, { type: 'probe', index: crystal })
  assert.ok(inspected.encounter?.kind === 'matrix')
  assert.equal(inspected.encounter.collected.length, 0)
  assert.equal(
    crystalKnowledge({ ...inspected, encounter: inspected.encounter }, crystal),
    'unresolved',
  )
  const zero = run.game.cells.findIndex(
    (cell, index) => !cell.mine && cell.adjacent === 0 && !run.walls.includes(index),
  )
  assert.ok(zero >= 0)
  const hidden: MatrixExpedition = {
    ...run,
    game: { ...run.game, cells: run.game.cells.map((cell) => ({ ...cell, visibility: 'hidden' })) },
  }
  const opened = revealDungeon(hidden, zero)
  assert.ok(opened.cells.filter((cell) => cell.visibility === 'revealed').length > 1)
  assert.deepEqual(hidden.encounter.collected, [])
  const archaeology = {
    ...run,
    departure: { ...run.departure, profession: 'archaeologist' as const },
  }
  assert.ok(professionSkillArea(archaeology).includes(region.indices[4]!))
})

test('Hypotheses are free, cancellable and never certify hidden crystals or charge a shield', () => {
  const run = room(),
    index = activeRegion(run).crystals[0]!
  const noted = actExpedition(run, { type: 'mark-crystal', index })
  assert.ok(noted.encounter?.kind === 'matrix')
  assert.equal(noted.encounter.points, run.encounter.points)
  assert.equal(noted.encounter.exposed, false)
  assert.deepEqual(noted.encounter.collected, [])
  assert.deepEqual(actExpedition(noted, { type: 'mark-crystal', index }).encounter, {
    ...run.encounter,
    event: 'acted',
  })
  const secret: MatrixExpedition = {
    ...run,
    encounter: {
      ...run.encounter,
      regions: [{ ...activeRegion(run), crystals: [] }, run.encounter.regions[1]],
    },
  }
  for (const target of activeRegion(run).indices) {
    assert.equal(crystalKnowledge(secret, target), crystalKnowledge(run, target))
    assert.deepEqual(
      tacticalPlan(secret, { type: 'attune', index: target }),
      tacticalPlan(run, { type: 'attune', index: target }),
    )
  }
})

test('Attunement needs revealed safe local terrain and adjacency; invalid and repeated attempts cost nothing', () => {
  const initial = room(),
    region = activeRegion(initial),
    crystal = region.crystals[0]!
  for (const index of [-1, 0.5, NaN, 10000])
    assert.equal(actExpedition(initial, { type: 'attune', index }), initial)
  const covered = {
    ...initial,
    player: crystal,
    game: {
      ...initial.game,
      cells: initial.game.cells.map((cell, index) =>
        index === crystal ? { ...cell, visibility: 'hidden' as const } : cell,
      ),
    },
  }
  assert.equal(tacticalPlan(covered, { type: 'attune', index: crystal }).reason, 'matrix-ground')
  const ready = beside(initial, crystal)
  const distant = {
    ...ready,
    player: ready.game.cells.findIndex(
      (_, index) => index !== crystal && !adjacentSteps(ready.game, crystal).includes(index),
    ),
  }
  assert.equal(tacticalPlan(distant, { type: 'attune', index: crystal }).reason, 'adjacent')
  const depleted = { ...ready, encounter: { ...ready.encounter, points: 0 } }
  assert.equal(actExpedition(depleted, { type: 'attune', index: crystal }), depleted)
  const collected = actExpedition(ready, { type: 'attune', index: crystal })
  assert.equal(collected.encounter!.points, 2)
  assert.equal(actExpedition(collected, { type: 'attune', index: crystal }), collected)
  assert.deepEqual(tacticalCellAction(ready, crystal), { type: 'move', index: crystal })
  const empty = region.indices.find(
    (index) =>
      !region.crystals.includes(index) &&
      !initial.walls.includes(index) &&
      !initial.game.cells[index]!.mine,
  )!
  assert.ok(empty >= 0)
  const missed = actExpedition(beside(initial, empty), { type: 'attune', index: empty })
  assert.ok(missed.encounter?.kind === 'matrix')
  assert.equal(missed.health, initial.health)
  assert.equal(missed.encounter.points, 2)
  assert.deepEqual(missed.encounter.empty, [empty])
  assert.equal(actExpedition(missed, { type: 'attune', index: empty }), missed)
  for (const language of ['zh', 'en', 'ja'] as const)
    assert.equal(
      tacticalEventCopy(language, missed.encounter),
      message(language, 'matrix.empty-event'),
    )
})

test('Two extractions immediately break a permanent shield on quiet turns and use bounded build rewards', () => {
  const initial = room(),
    crystals = activeRegion(initial).crystals
  const first = actExpedition(beside(initial, crystals[0]!), {
    type: 'attune',
    index: crystals[0]!,
  })
  assert.ok(first.encounter?.kind === 'matrix')
  const ready = beside(
    {
      ...first,
      encounter: {
        ...first.encounter,
        turn: 3,
        intent: { ...first.encounter.intent, targets: [] },
      },
    },
    crystals[1]!,
  )
  const build: MatrixExpedition = {
    ...ready,
    departure: { ...ready.departure, equipment: ['focus-lens', 'steel-blade'] },
    relics: ['breach-sigil', 'tempered-edge'],
  }
  const noted = actExpedition(build, { type: 'mark-crystal', index: crystals[2]! })
  const second = actExpedition(noted, { type: 'attune', index: crystals[1]! })
  assert.ok(second.encounter?.kind === 'matrix')
  assert.equal(second.encounter.points, 4)
  assert.equal(second.encounter.exposed, true)
  assert.equal(second.encounter.health, initial.encounter.health)
  assert.equal(matrixCharge({ ...second, encounter: second.encounter }), 2)
  assert.equal(second.encounter.collected.length, 2)
  assert.deepEqual(second.encounter.notes, [])
  assert.equal(actExpedition(second, { type: 'attune', index: crystals[2]! }), second)
  let waited = second
  for (let turn = 0; turn < 6; turn++) {
    waited = actExpedition({ ...waited, health: 100 }, { type: 'end-turn' })
    assert.ok(waited.encounter?.kind === 'matrix' && waited.encounter.exposed)
  }
  const titled = { ...second, departure: { ...second.departure, title: 'matrix-precise' as const } }
  assert.equal(combatStats(titled).attack, combatStats(second).attack + 1)
})

test('Half-health clamps burst damage and activates only the second local region after resolving the turn', () => {
  const initial = room()
  const player = adjacentSteps(initial.game, initial.encounter.boss).find(
    (index) => !initial.walls.includes(index) && !initial.game.cells[index]!.mine,
  )!
  const exposed: MatrixExpedition = {
    ...beside(initial, player),
    relics: ['tempered-edge', 'duelist-edge'],
    encounter: {
      ...initial.encounter,
      exposed: true,
      points: 5,
      health: 16,
      notes: [activeRegion(initial).indices[0]!],
    },
  }
  const hit = actExpedition(exposed, { type: 'attack' })
  assert.ok(hit.encounter?.kind === 'matrix')
  assert.equal(hit.encounter.health, 15)
  assert.equal(hit.encounter.phase, 1)
  assert.equal(tacticalPlan(hit, { type: 'attack' }).reason, 'matrix-phase')
  const next = actExpedition(hit, { type: 'end-turn' })
  assert.ok(next.encounter?.kind === 'matrix')
  assert.equal(next.encounter.phase, 2)
  assert.equal(next.encounter.exposed, false)
  assert.deepEqual(next.game, hit.game)
  assert.deepEqual(
    activeRegion({ ...next, encounter: next.encounter }),
    initial.encounter.regions[1],
  )
  for (const language of ['zh', 'en', 'ja'] as const)
    assert.equal(tacticalHint(language, hit), message(language, 'matrix.phase'))
})

test('Frozen forecasts use defense, shields and brace without changing during a player action', () => {
  const initial = room()
  for (const [defense, shields, braced, expected] of [
    [false, 0, false, 4],
    [true, 0, false, 3],
    [false, 1, false, 0],
    [false, 0, true, 1],
  ] as const) {
    const run: MatrixExpedition = {
      ...initial,
      health: 10,
      shields,
      departure: { ...initial.departure, equipment: defense ? ['plated-vest'] : [] },
      encounter: {
        ...initial.encounter,
        braced,
        intent: { kind: 'row', targets: [initial.player], damage: 4 },
      },
    }
    const marked = actExpedition(run, {
      type: 'mark-crystal',
      index: activeRegion(run).crystals[0]!,
    })
    assert.deepEqual(marked.encounter!.intent, run.encounter.intent)
    assert.equal(actExpedition(run, { type: 'end-turn' }).health, 10 - expected)
  }
})

test('Public-only unupgraded play wins both bands without clearing every crystal, across five tiers', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    const initial = room(55, difficulty)
    const actions = defeatMatrix(initial)
    const won = actions.reduce(actExpedition, initial as Expedition)
    assert.ok(won.encounter?.kind === 'matrix')
    assert.equal(won.encounter.phase, 2)
    assert.equal(won.encounter.collected.length, 4)
    assert.equal(won.encounter.empty.length, 0)
    assert.equal(won.encounter.health, 0)
    assert.equal(won.phase, 'reward')
  }
})

test('Mouse, touch and keyboard commands parse finite observation and extraction actions', () => {
  assert.deepEqual(parseVariantCommand('observe'), { type: 'observe' })
  assert.deepEqual(parseVariantCommand('attune'), { type: 'attune' })
  for (const type of ['matrix-pick', 'mark-crystal', 'attune-cell'] as const) {
    assert.deepEqual(parseVariantCommand(type + ':12'), { type, value: 12 })
    assert.equal(parseVariantCommand(type + ':NaN'), null)
    assert.equal(parseVariantCommand(type + ':-1'), null)
  }
  assert.equal(parseVariantCommand('matrix-row:0'), null)
})

test('Accepted extraction journals replay and settle Matrix achievements once', () => {
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
    if (action.type === 'attune') {
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
