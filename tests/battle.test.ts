import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createExpedition,
  actExpedition,
  allowedDeparture,
  buyUpgrade,
  UPGRADES,
} from '../src/game/expedition.js'
import { enterBattle, generateBattle, solveBattle } from '../src/game/battle-arena.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import {
  combatStats,
  COMBAT_PURCHASES,
  COMBAT_TRAINING,
  damageExpedition,
  incomingCombatDamage,
  ownedCombatTraining,
} from '../src/game/combat-build.js'
import { encounterTier } from '../src/game/encounter-tiers.js'
import { tacticalPlan, tacticalCellAction } from '../src/game/tactical-planning.js'
import { neighbors } from '../src/game/engine.js'
import { forecastBrood, advanceBrood, broodIntent } from '../src/game/brood-turns.js'
import { relicPool } from '../src/game/relic-packs.js'
import { decodeExpeditionSave } from '../src/persistence/variant-decoders.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { combatPurchaseCopy, combatRelicCopy } from '../src/ui/combat-build-copy.js'
import { defeatBattle } from './battle-helpers.js'
import { MemoryStorage, FakeRuntime } from './helpers.js'
import type { Camp, Departure, Expedition, Equipment, Relic } from '../src/types/variants.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'
import type { EncounterKind } from '../src/types/tactical.js'

const departure: Departure = {
  seed: 43,
  profession: 'explorer',
  difficulty: 'standard',
  equipment: [],
  archive: false,
  rules: 'relics-v1',
  professions: 'skills-v1',
  encounters: 'tactics-v2',
  rewards: 'difficulty-v1',
  packs: [],
  training: [],
  battleRelics: false,
}
const tiers: readonly VariantDifficulty[] = ['relaxed', 'standard', 'advanced', 'expert', 'abyss']

/** Construct an actual zero-tool encounter with optionally selected build choices. */
function arena(
  kind: EncounterKind,
  difficulty: VariantDifficulty = 'standard',
  seed = 43,
  equipment: readonly Equipment[] = [],
  relics: readonly Relic[] = [],
): Expedition {
  return enterBattle(
    {
      ...createExpedition({ ...departure, difficulty, seed, equipment }),
      floor: encounterTier(difficulty).floors[0]!,
      probes: 0,
      scans: 0,
      shields: 0,
      relics,
    },
    kind,
  )
}

test('shuffled battle layouts have meaningful hidden objectives and fully deducible connected floor', () => {
  const entrances = new Set<number>()
  const nests = new Set<string>()
  for (const difficulty of tiers)
    for (let seed = 0; seed < 20; seed++) {
      const run = arena(seed % 2 ? 'brood' : 'bastion', difficulty, seed)
      const { game, walls, encounter } = run
      assert.ok(encounter)
      assert.equal(game.cells.filter((cell) => cell.mine).length, game.config.mines)
      assert.ok(game.config.mines >= 17)
      assert.ok(
        game.cells.filter((cell) => cell.visibility === 'revealed').length < game.cells.length / 2,
      )
      const objectives =
        encounter.kind === 'brood' ? encounter.nests : encounter.pylons.map((entry) => entry.index)
      assert.ok(
        objectives.every(
          (index) =>
            game.cells[index]?.visibility === 'hidden' &&
            !game.cells[index]?.mine &&
            game.cells[index]!.adjacent > 0,
        ),
      )
      const solved = solveBattle(game, walls, run.entrance)
      assert.ok(
        solved.cells.every(
          (cell, index) => cell.mine || walls.includes(index) || cell.visibility === 'revealed',
        ),
      )
      entrances.add(run.entrance)
      nests.add(objectives.join(','))
    }
  assert.ok(entrances.size > 10)
  assert.ok(nests.size > 40)
})

test('the independent fallback sequence supports each tier and objective count', () => {
  for (const difficulty of tiers)
    for (const count of [2, 3]) {
      const tier = encounterTier(difficulty)
      const config = {
        ...tier.config,
        mines: Math.round(tier.config.width * tier.config.height * 0.17),
      }
      assert.equal(generateBattle(config, 0x51afe, count).objectives.length, count)
    }
})

test('deduction is unchanged if all covered mine bits and covered clue numbers are poisoned', () => {
  const run = arena('bastion')
  const poisoned = {
    ...run.game,
    cells: run.game.cells.map((cell) =>
      cell.visibility === 'revealed'
        ? cell
        : { ...cell, mine: !cell.mine, adjacent: 8 - cell.adjacent },
    ),
  }
  assert.deepEqual(deduceMines(poisoned, run.walls), deduceMines(run.game, run.walls))
})

test('both revised encounters require their mine objectives even with a complete offensive build', () => {
  for (const kind of ['bastion', 'brood'] as const) {
    const run = arena(kind, 'abyss', 43, ['steel-blade'], ['tempered-edge', 'tactics-hourglass'])
    assert.equal(tacticalPlan(run, { type: 'attack' }).allowed, false)
    assert.equal(actExpedition(run, { type: 'attack' }), run)
    assert.ok(run.encounter)
    const index =
      run.encounter.kind === 'brood' ? run.encounter.nests[0]! : run.encounter.pylons[0]!.index
    assert.equal(tacticalCellAction(run, index).type, 'reveal')
    assert.equal(tacticalPlan(run, { type: 'interact', index }).allowed, false)
  }
})

test('baseline explorers win every tier through public deduction, defense and accepted actions', () => {
  for (const difficulty of tiers)
    for (const kind of ['bastion', 'brood'] as const) {
      const run = arena(kind, difficulty)
      const actions = defeatBattle(run)
      const end = actions.reduce(actExpedition, run)
      assert.ok(end.phase === 'won' || end.phase === 'reward')
      assert.ok(actions.some((action) => action.type === 'flag'))
      assert.ok(actions.some((action) => action.type === 'reveal'))
      assert.ok(actions.some((action) => action.type === 'interact'))
      assert.deepEqual(actions.reduce(actExpedition, run), end)
    }
})

test('offense, armor and mobility builds remain distinct and complete real battles', () => {
  for (const kind of ['bastion', 'brood'] as const)
    for (const equipment of ['steel-blade', 'plated-vest', 'field-boots'] as const) {
      const run = arena(
        kind,
        'standard',
        43,
        [equipment, 'medical-kit'],
        equipment === 'steel-blade'
          ? ['tempered-edge']
          : equipment === 'plated-vest'
            ? ['layered-armor']
            : ['tactics-hourglass'],
      )
      const trained = {
        ...run,
        health: run.health + 1,
        maxHealth: run.maxHealth + 1,
        departure: { ...run.departure, training: COMBAT_TRAINING },
      }
      const result = defeatBattle(trained).reduce(actExpedition, trained)
      assert.ok(result.phase === 'won' || result.phase === 'reward')
    }
})

test('destroyed nests stop healing and all replenishment after existing creatures are cleared', () => {
  let run = arena('brood')
  const transcript = defeatBattle(run)
  for (const action of transcript) {
    run = actExpedition(run, action)
    if (run.encounter?.kind === 'brood' && run.encounter.nests.length === 0) break
  }
  assert.ok(run.encounter?.kind === 'brood')
  assert.equal(run.encounter.destroyedNests?.length, 3)
  run = { ...run, encounter: { ...run.encounter, eggs: [], hatchlings: [], orders: [] } }
  const health = run.encounter!.health
  for (let turn = 0; turn < 12; turn++) run = advanceBrood(run)
  assert.ok(run.encounter?.kind === 'brood')
  assert.equal(run.encounter.health, health)
  assert.equal(run.encounter.eggs.length + run.encounter.hatchlings.length, 0)
})

test('queen reinforcement cannot displace the player, overlap creatures, or appear on hidden clues', () => {
  let run = arena('brood')
  assert.ok(run.encounter?.kind === 'brood')
  run = {
    ...run,
    game: solveBattle(run.game, run.walls, run.entrance),
    encounter: { ...run.encounter, turn: 3 },
  }
  for (let turn = 0; turn < 15; turn++) {
    run = advanceBrood(run)
    assert.ok(run.encounter?.kind === 'brood')
    const occupied = [...run.encounter.hatchlings, ...run.encounter.eggs.map((egg) => egg.index)]
    assert.equal(new Set(occupied).size, occupied.length)
    assert.ok(occupied.length <= 3)
    assert.ok(
      occupied.every(
        (index) =>
          index !== run.player &&
          !run.walls.includes(index) &&
          run.game.cells[index]?.visibility === 'revealed',
      ),
    )
  }
})

test('attack forecasts stay frozen during movement', () => {
  let run = arena('brood')
  assert.ok(run.encounter?.kind === 'brood')
  run = forecastBrood({ ...run, encounter: { ...run.encounter, turn: 3 } })
  const intent = run.encounter?.intent
  const move = neighbors(run.game.config, run.player).find(
    (index) => tacticalPlan(run, { type: 'move', index }).allowed,
  )
  assert.notEqual(move, undefined)
  const moved = actExpedition(run, { type: 'move', index: move! })
  assert.deepEqual(moved.encounter?.intent, intent)
})

test('small finite training, limited equipment and run relics derive bounded stats', () => {
  const baseline = arena('bastion')
  const trained = { ...baseline, departure: { ...baseline.departure, training: COMBAT_TRAINING } }
  assert.deepEqual(combatStats(baseline), { attack: 5, defense: 0, actions: 3 })
  assert.deepEqual(combatStats(trained), { attack: 6, defense: 0, actions: 3 })
  assert.equal(createExpedition(trained.departure).maxHealth, 11)
  const build = arena(
    'bastion',
    'standard',
    43,
    ['field-boots'],
    ['tempered-edge', 'layered-armor', 'tactics-hourglass'],
  )
  assert.deepEqual(combatStats(build), { attack: 8, defense: 1, actions: 4 })
  assert.ok(build.encounter)
  assert.equal(combatStats({ ...build, encounter: { ...build.encounter, turn: 2 } }).actions, 5)
  assert.equal(
    incomingCombatDamage({ ...build, encounter: { ...build.encounter, braced: true } }, 3),
    1,
  )
  assert.equal(damageExpedition({ ...build, shields: 1 }, 7).health, 8)
})

test('the catalog contains 24 distinct gameplay choices plus two one-time trainings', () => {
  assert.equal(UPGRADES.length, 26)
  assert.equal(
    UPGRADES.filter((item) => !COMBAT_TRAINING.some((training) => training === item)).length,
    24,
  )
  let camp: Camp = { supplies: 100000, upgrades: [...UPGRADES], completed: 0 }
  assert.ok(allowedDeparture(camp, 'explorer', ['steel-blade', 'medical-kit']))
  assert.equal(allowedDeparture(camp, 'explorer', ['steel-blade', 'plated-vest']), false)
  assert.equal(
    allowedDeparture({ ...camp, upgrades: ['workshop'] }, 'explorer', ['steel-blade']),
    false,
  )
  assert.equal(buyUpgrade(camp, 'weapon-training'), camp)
  camp = { ...camp, upgrades: [] }
  for (const item of COMBAT_PURCHASES) camp = buyUpgrade(camp, item)
  assert.deepEqual(ownedCombatTraining(camp), COMBAT_TRAINING)
  for (const language of ['en', 'zh', 'ja'] as const) {
    for (const item of COMBAT_PURCHASES)
      assert.ok(combatPurchaseCopy(language, item).note.length > 5)
    for (const relic of ['tempered-edge', 'layered-armor', 'tactics-hourglass'] as const)
      assert.ok(combatRelicCopy(language, relic).name)
  }
})

test('training and combat licenses are snapshotted and validated without rewriting historical journals', () => {
  const camp = { supplies: 42, completed: 0, upgrades: [...UPGRADES] }
  const save = {
    version: 3,
    camp,
    journal: {
      departure: { ...departure, training: COMBAT_TRAINING, battleRelics: true },
      actions: [],
    },
    records: [],
  }
  assert.ok(decodeExpeditionSave(JSON.stringify(save)))
  for (const training of [['weapon-training', 'weapon-training'], ['unlimited'], [10]])
    assert.equal(
      decodeExpeditionSave(
        JSON.stringify({
          ...save,
          journal: { departure: { ...save.journal.departure, training }, actions: [] },
        }),
      ),
      null,
    )
  assert.equal(
    decodeExpeditionSave(
      JSON.stringify({
        ...save,
        journal: { departure: { ...save.journal.departure, encounters: 'brood-v1' }, actions: [] },
      }),
    ),
    null,
  )
  const storage = new MemoryStorage()
  storage.setItem(
    'minesweeper.variants.v1.expedition',
    JSON.stringify({ ...save, camp: { ...camp, upgrades: [] } }),
  )
  assert.equal(new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).run, null)
  assert.equal(
    relicPool({ ...departure, battleRelics: true }).length,
    relicPool(departure).length + 3,
  )
})

test('regional defenses preserve the current forecast and bound refunds and repeated interaction', () => {
  let run = arena('bastion', 'standard', 43, ['focus-lens'], ['breach-sigil'])
  assert.ok(run.encounter?.kind === 'bastion')
  const first = run.encounter.pylons[0]!.index
  run = {
    ...run,
    player: first,
    game: solveBattle(run.game, run.walls, run.entrance),
    encounter: { ...run.encounter, points: 5 },
  }
  const forecast = run.encounter!.intent
  const next = actExpedition(run, { type: 'interact', index: first })
  assert.ok(next.encounter?.kind === 'bastion')
  assert.equal(next.encounter.points, 5)
  assert.deepEqual(next.encounter.intent, forecast)
  assert.equal(next.encounter.mechanisms?.[0]?.active, false)
  assert.equal(actExpedition(next, { type: 'interact', index: first }), next)
  const ended = actExpedition(next, { type: 'end-turn' })
  assert.equal(ended.encounter?.intent.damage, 3)
  assert.equal(ended.encounter?.points, 3)
})

test('an incorrect calibrated flag pattern costs health and AP without earning an equipment refund', () => {
  let run = arena('brood', 'standard', 43, ['focus-lens', 'clearing-hook'])
  assert.ok(run.encounter?.kind === 'brood')
  const index = run.encounter.nests[0]!
  const solved = solveBattle(run.game, run.walls, run.entrance)
  const ring = neighbors(run.game.config, index)
  const mine = ring.find((other) => solved.cells[other]?.mine)!
  const safe = ring.find((other) => !solved.cells[other]?.mine && !run.walls.includes(other))!
  run = {
    ...run,
    player: index,
    game: {
      ...solved,
      cells: solved.cells.map((cell, other) =>
        other === mine
          ? { ...cell, visibility: 'hidden' }
          : other === safe
            ? { ...cell, visibility: 'flagged' }
            : cell,
      ),
    },
  }
  const next = actExpedition(run, { type: 'interact', index })
  assert.equal(next.health, 5)
  assert.equal(next.encounter?.points, 2)
  assert.equal(next.encounter?.event, 'misfire')
  assert.equal(next.encounter?.turnTriggers.length, 0)
})

test('clearing cancels the defeated source and refunds at most one action per turn', () => {
  let run = arena('brood', 'standard', 43, ['clearing-hook'])
  assert.ok(run.encounter?.kind === 'brood')
  const index = neighbors(run.game.config, run.player).find(
    (other) =>
      tacticalPlan(run, { type: 'move', index: other }).allowed &&
      Math.abs(other - run.player) === 1,
  )!
  run = {
    ...run,
    encounter: broodIntent({
      ...run.encounter,
      webs: [],
      eggs: [],
      hatchlings: [index],
      orders: [{ from: index, to: index, targets: [run.player] }],
      queenTargets: [],
    }),
  }
  const next = actExpedition(run, { type: 'interact', index })
  assert.ok(next.encounter?.kind === 'brood')
  assert.equal(next.encounter.points, 3)
  assert.deepEqual(next.encounter.intent.targets, [])
  assert.ok(next.encounter.turnTriggers.includes('clearing-hook'))
  assert.equal(actExpedition(next, { type: 'interact', index }), next)
  const another = { ...next, encounter: { ...next.encounter, webs: [index] } }
  assert.equal(actExpedition(another, { type: 'interact', index }).encounter?.points, 2)
})

test('overlapping queen and hatchling attacks add damage before armor, brace and shields', () => {
  let run = arena('brood')
  assert.ok(run.encounter?.kind === 'brood')
  const index = run.player + 1
  run = {
    ...run,
    encounter: broodIntent({
      ...run.encounter,
      hatchlings: [index],
      orders: [{ from: index, to: index, targets: [run.player] }],
      queenTargets: [run.player],
    }),
  }
  assert.equal(actExpedition(run, { type: 'end-turn' }).health, 2)
  const defended = {
    ...run,
    departure: { ...run.departure, equipment: ['plated-vest' as const] },
    encounter: { ...run.encounter!, braced: true },
    shields: 1,
  }
  assert.equal(actExpedition(defended, { type: 'end-turn' }).health, 10)
  assert.equal(actExpedition(defended, { type: 'end-turn' }).shields, 0)
})
