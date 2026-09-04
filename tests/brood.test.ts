import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createExpedition,
  actExpedition,
  frontierCells,
  EMPTY_CAMP,
} from '../src/game/expedition.js'
import { enterBrood } from '../src/game/brood-arena.js'
import { enterEncounter, hasEncounters } from '../src/game/encounter-roster.js'
import { encounterTier } from '../src/game/encounter-tiers.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { neighbors } from '../src/game/engine.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { tacticalPlan, tacticalCellAction } from '../src/game/tactical-planning.js'
import { professionSkillAvailability } from '../src/game/profession-skills.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeExpeditionSave } from '../src/persistence/variant-decoders.js'
import { tacticalCopy, tacticalEventCopy } from '../src/ui/tactical-copy.js'
import { bossSprite } from '../src/ui/tactical-sprites.js'
import { broodCellLabel } from '../src/ui/brood-copy.js'
import { defeatBrood, broodApproach } from './brood-helpers.js'
import { MemoryStorage, FakeRuntime } from './helpers.js'
import type { Departure, Expedition, ExpeditionAction } from '../src/types/variants.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'

const tiers: readonly VariantDifficulty[] = ['relaxed', 'standard', 'advanced', 'expert', 'abyss']
const departure: Departure = {
  seed: 43,
  difficulty: 'standard',
  rules: 'relics-v1',
  encounters: 'brood-v1',
  professions: 'skills-v1',
  rewards: 'difficulty-v1',
  profession: 'explorer',
  equipment: [],
  archive: false,
  packs: [],
}

/** Supply a fresh, unpaid queen arena for deterministic rule and fairness checks. */
function arena(seed = 43, difficulty: VariantDifficulty = 'standard'): Expedition {
  return enterBrood({
    ...createExpedition({ ...departure, seed, difficulty }),
    floor: encounterTier(difficulty).floors[0]!,
    probes: 0,
    scans: 0,
    shields: 0,
  })
}

/** Advance one protected turn using only legal player inputs. */
function protectedTurn(run: Expedition): Expedition {
  return actExpedition(actExpedition(run, { type: 'brace' }), { type: 'end-turn' })
}

test('queen terrain preserves truthful clues, zero floods, connected safe floor and open approach lanes', () => {
  for (const difficulty of tiers)
    for (let seed = 0; seed < 32; seed++) {
      const run = arena(seed, difficulty)
      assert.ok(run.encounter?.kind === 'brood')
      assert.equal(run.game.cells.filter((cell) => cell.mine).length, 4)
      assert.equal(run.encounter.maxHealth, encounterTier(difficulty).health + 2)
      assert.ok(broodApproach(run).length > 1)
      const connected = new Set([run.player])
      const queue = [run.player]
      for (const index of queue)
        for (const other of adjacentSteps(run.game, index)) {
          if (!connected.has(other) && !run.walls.includes(other) && !run.game.cells[other]?.mine) {
            connected.add(other)
            queue.push(other)
          }
        }
      for (const [index, cell] of run.game.cells.entries()) {
        assert.equal(
          cell.adjacent,
          neighbors(run.game.config, index).filter((i) => run.game.cells[i]?.mine).length,
        )
        if (!cell.mine && !run.walls.includes(index)) assert.ok(connected.has(index))
        if (cell.visibility === 'revealed' && cell.adjacent === 0 && !run.walls.includes(index))
          for (const other of neighbors(run.game.config, index))
            if (!run.walls.includes(other))
              assert.equal(run.game.cells[other]?.visibility, 'revealed')
      }
      for (const index of [...run.encounter.webs, ...run.encounter.nests]) {
        assert.equal(run.game.cells[index]?.visibility, 'revealed')
        assert.equal(run.game.cells[index]?.mine, false)
        assert.equal(run.walls.includes(index), false)
      }
    }
})

test('every tier supports a free-profession victory with zero equipment, relics or information tools', () => {
  for (const difficulty of tiers)
    for (let seed = 0; seed < 8; seed++) {
      const run = arena(seed, difficulty)
      const actions = defeatBrood(run)
      const final = actions.reduce(actExpedition, run)
      assert.ok(final.phase === 'reward' || final.phase === 'won')
      assert.equal(final.health, 2)
      assert.equal(final.shields, 1)
      assert.equal(final.loot - run.loot, 12)
      assert.deepEqual(
        final.game.cells.map((cell) => [cell.mine, cell.adjacent]),
        run.game.cells.map((cell) => [cell.mine, cell.adjacent]),
      )
    }
})

test('roster alternates new checkpoints while historical guardian-only departures retain their boss', () => {
  for (const difficulty of tiers)
    for (const seed of [42, 43]) {
      const floors = encounterTier(difficulty).floors
      for (const [ordinal, floor] of floors.entries()) {
        const run = { ...createExpedition({ ...departure, seed, difficulty }), floor }
        assert.equal(
          enterEncounter(run).encounter?.kind,
          (seed + ordinal) % 2 ? 'brood' : 'bastion',
        )
        assert.equal(
          enterEncounter({ ...run, departure: { ...run.departure, encounters: 'bastion-v1' } })
            .encounter?.kind,
          'bastion',
        )
      }
    }
  const { encounters, ...historical } = departure
  assert.equal(encounters, 'brood-v1')
  assert.equal(hasEncounters(historical), false)
})

test('webs block public routes, clear adjacent for one AP, and preserve the minefield', () => {
  const initial = arena()
  assert.ok(initial.encounter?.kind === 'brood')
  const web = initial.encounter.webs[0]!
  const player = adjacentSteps(initial.game, web).find((i) => walkingPath(initial, i))!
  const run = { ...initial, player, relics: ['breach-sigil'] as const }
  assert.equal(walkingPath(run, web), null)
  assert.equal(tacticalPlan(run, { type: 'move', index: web }).allowed, false)
  const action = tacticalCellAction(run, web)
  assert.equal(action.type, 'interact')
  const cleared = actExpedition(run, action)
  assert.equal(cleared.encounter?.points, 2)
  assert.equal(cleared.encounter?.event, 'web-cut')
  assert.equal(cleared.floorTriggers.includes('breach-sigil'), false)
  assert.ok(walkingPath(cleared, web))
  assert.deepEqual(cleared.game, run.game)
  assert.equal(actExpedition(cleared, action), cleared)
  assert.equal(actExpedition(initial, action), initial)
  const empty = { ...run, encounter: { ...run.encounter!, points: 0 } }
  assert.equal(actExpedition(empty, action), empty)
})

test('eggs tick on end-turn only, crushing prevents hatching, and newly hatched creatures do not attack', () => {
  let run = arena()
  assert.ok(run.encounter?.kind === 'brood')
  const egg = run.encounter.eggs[0]!
  const player = adjacentSteps(run.game, egg.index).find((i) => walkingPath(run, i))!
  run = { ...run, player }
  const cleared = actExpedition(run, { type: 'interact', index: egg.index })
  assert.ok(cleared.encounter?.kind === 'brood')
  assert.equal(cleared.encounter.eggs.length, 1)
  assert.equal(cleared.encounter.eggs[0]?.turns, 2)
  const first = actExpedition(cleared, { type: 'end-turn' })
  assert.ok(first.encounter?.kind === 'brood')
  assert.equal(first.encounter.eggs[0]?.turns, 1)
  const second = actExpedition(first, { type: 'end-turn' })
  assert.ok(second.encounter?.kind === 'brood')
  assert.equal(second.encounter.hatchlings.length, 1)
  assert.equal(second.health, 2)
  assert.ok(!second.encounter.hatchlings.includes(egg.index))
  assert.equal(second.encounter.turn, 3)
})

test('swarm orders remain frozen on movement and interception removes only the defeated source warning', () => {
  const initial = protectedTurn(protectedTurn(arena()))
  assert.ok(initial.encounter?.kind === 'brood')
  const source = initial.encounter.hatchlings[0]!
  const player = adjacentSteps(initial.game, source).find((i) => walkingPath(initial, i))!
  const run = { ...initial, player }
  const cleared = actExpedition(run, { type: 'interact', index: source })
  assert.ok(cleared.encounter?.kind === 'brood')
  assert.deepEqual(cleared.encounter.orders, initial.encounter.orders)
  const remaining = [
    ...new Set([
      ...initial.encounter.queenTargets,
      ...initial.encounter.orders
        .filter((order) => order.from !== source)
        .flatMap((order) => order.targets),
    ]),
  ]
  assert.deepEqual(cleared.encounter.intent.targets, remaining)
  assert.equal(cleared.encounter.hatchlings.includes(source), false)
  const destination = adjacentSteps(cleared.game, cleared.player).find((i) =>
    walkingPath(cleared, i),
  )!
  const moved = actExpedition(cleared, { type: 'move', index: destination })
  assert.deepEqual(moved.encounter?.intent, cleared.encounter.intent)
  assert.deepEqual(
    moved.encounter?.kind === 'brood' ? moved.encounter.orders : [],
    cleared.encounter.orders,
  )
})

test('swarm damage is one per turn, brace blocks the aggregate, and lethal hits still use survival relics', () => {
  const run = protectedTurn(protectedTurn(arena()))
  assert.ok(run.encounter?.kind === 'brood')
  assert.ok(run.encounter.intent.targets.includes(run.player))
  assert.equal(actExpedition(run, { type: 'end-turn' }).health, 1)
  assert.equal(protectedTurn(run).health, 2)
  const dead = actExpedition({ ...run, health: 1 }, { type: 'end-turn' })
  assert.equal(dead.phase, 'lost')
  const revived = actExpedition(
    { ...run, health: 1, relics: ['second-wind'] },
    { type: 'end-turn' },
  )
  assert.equal(revived.phase, 'boss')
  assert.equal(revived.health, 1)
  assert.ok(revived.runTriggers.includes('second-wind'))
})

test('reinforcements stay bounded and never overlap the player, another creature, a web or a mine', () => {
  let run = arena()
  for (let turn = 0; turn < 24; turn++) {
    run = protectedTurn(run)
    assert.ok(run.encounter?.kind === 'brood')
    const creatures = [...run.encounter.hatchlings, ...run.encounter.eggs.map((egg) => egg.index)]
    assert.ok(creatures.length <= 3)
    assert.equal(new Set(creatures).size, creatures.length)
    for (const index of creatures) {
      assert.notEqual(index, run.player)
      assert.ok(!run.encounter.webs.includes(index))
      assert.ok(!run.walls.includes(index))
      assert.equal(run.game.cells[index]?.mine, false)
    }
  }
})

test('walking onto an announced hatchling destination causes the warned hit without overlapping the pawn', () => {
  const run = protectedTurn(protectedTurn(arena()))
  assert.ok(run.encounter?.kind === 'brood')
  const order = run.encounter.orders.find((entry) => entry.to !== entry.from)!
  assert.ok(order)
  const arrived = { ...run, player: order.to }
  const next = actExpedition(arrived, { type: 'end-turn' })
  assert.ok(next.encounter?.kind === 'brood')
  assert.equal(next.health, 1)
  assert.ok(!next.encounter.hatchlings.includes(next.player))
  assert.ok(next.encounter.hatchlings.includes(order.from))
})

test('queen skill and combat relic reactions retain their limits without using armor-only effects', () => {
  const initial = arena()
  const run = {
    ...initial,
    departure: { ...initial.departure, profession: 'archaeologist' as const },
    relics: ['skill-capacitor', 'reserve-watch', 'second-hand', 'duelist-edge'] as const,
  }
  assert.equal(professionSkillAvailability(run), 'ready')
  const skilled = actExpedition(run, { type: 'skill' })
  assert.equal(skilled.scans, 1)
  assert.equal(skilled.skillUsed, true)
  assert.equal(actExpedition(skilled, { type: 'skill' }), skilled)
  const reserved = actExpedition(skilled, { type: 'end-turn' })
  assert.equal(reserved.encounter?.points, 4)
  const third = protectedTurn(protectedTurn(reserved))
  assert.ok(third.floorTriggers.includes('second-hand'))
  assert.equal(third.probes, 1)
  const adjacent = {
    ...third,
    player:
      third.encounter!.boss +
      third.game.config.width * (third.encounter!.boss < third.game.cells.length / 2 ? 1 : -1),
  }
  const struck = actExpedition(adjacent, { type: 'attack' })
  assert.equal(struck.encounter?.lastDamage, 4)
})

test('queen UI uses its own sprites, rules, countdowns and complete three-language copy', () => {
  const run = arena()
  assert.ok(run.encounter?.kind === 'brood')
  assert.equal(bossSprite(run.encounter), 'brood-queen')
  assert.equal(bossSprite({ ...run.encounter, health: 0 }), 'brood-defeated')
  for (const language of ['en', 'zh', 'ja'] as const) {
    const copy = tacticalCopy(language, 'brood')
    assert.equal(copy.help.length, 5)
    assert.doesNotMatch(copy.help.join(' '), /pylon|校准|調整/)
    assert.ok(broodCellLabel(language, run.encounter, run.encounter.eggs[0]!.index).includes('2'))
    for (const event of ['web-cut', 'egg-crushed', 'hatchling-cleared'] as const)
      assert.notEqual(tacticalEventCopy(language, { ...run.encounter, event }), copy.hint)
  }
})

test('real queen journals replay every combat action and settle exactly once', () => {
  const actions: ExpeditionAction[] = []
  let run = createExpedition(departure)
  while (run.phase !== 'boss') {
    const action: ExpeditionAction =
      run.phase === 'reward'
        ? { type: 'relic', relic: run.offers[0]! }
        : walkingPath(run, run.exit)
          ? { type: 'move', index: run.exit }
          : {
              type: 'reveal',
              index: [...frontierCells(run)].find((index) => !run.game.cells[index]?.mine)!,
            }
    const next = actExpedition(run, action)
    assert.notEqual(next, run)
    actions.push(action)
    run = next
  }
  assert.equal(run.encounter?.kind, 'brood')
  const storage = new MemoryStorage()
  storage.setItem(
    'minesweeper.variants.v1.expedition',
    JSON.stringify({ version: 3, camp: EMPTY_CAMP, records: [], journal: { departure, actions } }),
  )
  let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.run, run)
  for (const action of defeatBrood(run)) {
    assert.ok(session.dispatch(action))
    const expected: Expedition | null = session.run
    session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.deepEqual(session.run, expected)
  }
  assert.ok(session.dispatch({ type: 'retreat' }))
  const supplies = session.camp.supplies
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(session.run, null)
  assert.equal(session.camp.supplies, supplies)
  assert.ok(supplies > 0)
  const malformed = {
    version: 3,
    camp: EMPTY_CAMP,
    records: [],
    journal: { departure: { ...departure, professions: undefined }, actions: [] },
  }
  assert.equal(decodeExpeditionSave(JSON.stringify(malformed)), null)
})
