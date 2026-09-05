import { EXPEDITION_RULES_REVISION } from '../src/persistence/expedition-format.js'
import { solveBattle } from '../src/game/battle-arena.js'
import { CURRENT_DEPARTURE } from './helpers.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createExpedition,
  actExpedition,
  frontierCells,
  EMPTY_CAMP,
  buyUpgrade,
} from '../src/game/expedition.js'
import { enterBattle } from '../src/game/battle-arena.js'
import { recordTravel } from '../src/game/exploration-relics.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { inspectArea, probeArea } from '../src/game/dungeon-discovery.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { RELIC_PACKS, relicPool, ownedRelicPacks } from '../src/game/relic-packs.js'
import { UPGRADES, upgradeCost } from '../src/game/camp-progression.js'
import { expansionRelicCopy, relicPackCopy } from '../src/ui/relic-expansion-copy.js'
import { tacticalEventCopy } from '../src/ui/tactical-copy.js'
import { applyTreasureRelics } from '../src/game/relic-effects.js'
import {
  decodeExpeditionSave,
  parseRelic,
  parseUpgrade,
} from '../src/persistence/variant-decoders.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { MemoryStorage, FakeRuntime } from './helpers.js'
import { defeatBattle as defeatBastion } from './battle-helpers.js'
import type { Departure, Expedition, ExpeditionAction, Relic } from '../src/types/variants.js'

const departure: Departure = {
  ...CURRENT_DEPARTURE,
  seed: 42,
  difficulty: 'abyss',
  profession: 'explorer',
  equipment: [],
  archive: true,
  packs: RELIC_PACKS.map((pack) => pack.id),
}

/** Supply an owned build to an isolated arena rule test, without altering terrain or intentions. */
function arena(relics: readonly Relic[] = []): Expedition {
  return enterTestBastion({ ...createExpedition(departure), floor: 4, relics })
}

/** Position a rule fixture adjacent to a public mechanism and retain the original mine layout. */
function calibratedArena(relics: readonly Relic[]): Expedition {
  const run = arena(relics)
  assert.ok(run.encounter?.kind === 'bastion')
  const pylon = run.encounter!.pylons[0]!.index
  return { ...inspectArea(run, probeArea(run.game.config, pylon)), player: pylon }
}

test('six themes add twelve distinct choices with a stepped price table and complete locale coverage', () => {
  assert.equal(UPGRADES.length, 26)
  assert.equal(RELIC_PACKS.length, 10)
  assert.equal(
    UPGRADES.reduce((total, id) => total + upgradeCost(id), 0),
    39800,
  )
  assert.equal(relicPool(departure).length, 26)
  assert.equal(new Set(relicPool(departure)).size, 26)
  assert.deepEqual(
    RELIC_PACKS.slice(4).map((pack) => upgradeCost(pack.id)),
    [350, 650, 1500, 2200, 3200, 4500],
  )
  let camp = { ...EMPTY_CAMP, supplies: 12400 }
  for (const pack of RELIC_PACKS.slice(4)) {
    assert.equal(parseUpgrade(pack.id), pack.id)
    camp = buyUpgrade(camp, pack.id)
    for (const language of ['en', 'zh', 'ja'] as const) {
      assert.ok(relicPackCopy(language, pack.id).note.length > 10)
      for (const relic of pack.relics) {
        assert.equal(parseRelic(relic), relic)
        assert.ok(expansionRelicCopy(language, relic).note.length > 10)
      }
    }
  }
  assert.equal(camp.supplies, 0)
  assert.equal(ownedRelicPacks(camp).length, 6)
  assert.equal(buyUpgrade(camp, 'cartographer-charts'), camp)
})

test('owned theme subsets keep their deterministic catalog pool and order', () => {
  const subset = { ...departure, packs: RELIC_PACKS.slice(0, 4).map((pack) => pack.id) }
  assert.deepEqual(relicPool(subset), [
    'lantern',
    'lens',
    'aegis',
    'purse',
    'compass',
    'salvage',
    'field-notes',
    'rangefinder',
    'reactive-shell',
    'rescue-ribbon',
    'field-dressing',
    'second-wind',
    'supply-cache',
    'cache-guard',
  ])
  assert.deepEqual(relicPool({ ...subset, packs: [] }), [
    'lantern',
    'lens',
    'aegis',
    'purse',
    'compass',
    'salvage',
  ])
})

test('travel thread counts unique safe squares, preserves room totals and never rewards backtracking', () => {
  const run = arena(['trail-thread'])
  const target = run.game.cells.findIndex((_, index) => walkingPath(run, index)?.length === 13)
  const path = walkingPath(run, target)!
  assert.equal(path.length, 13)
  const travelled = recordTravel({ ...run, scans: 0 }, path)
  assert.equal(travelled.scans, 1)
  assert.equal(recordTravel(travelled, [...path].reverse()).scans, 1)
  const again = enterTestBastion(travelled)
  assert.equal(again.priorTravel, 12)
  assert.equal(recordTravel(again, [again.player]).scans, 1)
  assert.equal(recordTravel({ ...run, scans: 4 }, path).scans, 4)
})

test('landmark lens surveys the collected chest, locks hazards and does not claim another chest', () => {
  const run = { ...createExpedition(departure), relics: ['landmark-lens'] as readonly Relic[] }
  const chest = run.treasures[0]!
  const result = applyTreasureRelics(run, { ...run, collected: [chest] })
  const expected = inspectArea(run, probeArea(run.game.config, chest))
  assert.deepEqual(result.confirmedMines, expected.confirmedMines)
  assert.deepEqual(result.surveyedCells, expected.surveyedCells)
  assert.ok(result.floorTriggers.includes('landmark-lens'))
  assert.equal(result.loot, run.loot)
  const second = applyTreasureRelics(result, { ...result, collected: run.treasures })
  assert.deepEqual(second.surveyedCells, result.surveyedCells)
})

test('one walk surveys the first physical chest even when treasure storage has the reverse order', () => {
  const initial = createExpedition(departure)
  const target = initial.game.cells.findIndex(
    (_, index) => index !== initial.exit && walkingPath(initial, index)?.length === 5,
  )
  const path = walkingPath(initial, target)!
  const first = path[1]!
  const run: Expedition = {
    ...initial,
    relics: ['landmark-lens'],
    // Store the destination first to distinguish generator order from travel order.
    treasures: [target, first],
  }
  const expected = inspectArea(run, probeArea(run.game.config, first))
  const moved = actExpedition(run, { type: 'move', index: target })
  assert.deepEqual(moved.collected, [first, target])
  assert.deepEqual(moved.confirmedMines, expected.confirmedMines)
  assert.deepEqual(moved.surveyedCells, expected.surveyedCells)
  assert.equal(moved.floorTriggers.filter((id) => id === 'landmark-lens').length, 1)
  const returned = actExpedition(moved, { type: 'move', index: initial.player })
  assert.deepEqual(returned.collected, moved.collected)
  assert.deepEqual(returned.surveyedCells, moved.surveyedCells)
  assert.equal(returned.loot, moved.loot)
})

test('probe recycling requires a paid discovery with no fresh mine and pays only once', () => {
  const run = {
    ...createExpedition(departure),
    probes: 2,
    relics: ['probe-recycler'] as readonly Relic[],
  }
  const targets = run.game.cells.flatMap((_, index) => {
    const area = probeArea(run.game.config, index)
    return area.every((other) => !run.game.cells[other]?.mine) && inspectArea(run, area) !== run
      ? [index]
      : []
  })
  assert.ok(targets.length > 0)
  const action: ExpeditionAction = { type: 'probe', index: targets[0]! }
  const used = actExpedition(run, action)
  assert.equal(used.probes, 2)
  assert.ok(used.floorTriggers.includes('probe-recycler'))
  assert.equal(actExpedition(used, action), used)
  assert.equal(actExpedition(run, { type: 'probe', index: -1 }), run)
  const fresh = targets.find(
    (index) => inspectArea(used, probeArea(run.game.config, index)) !== used,
  )!
  assert.ok(fresh >= 0)
  assert.equal(actExpedition(used, { type: 'probe', index: fresh }).probes, 1)
})

test('scanner conversion uses pre-action inventory, stacks once and respects caps', () => {
  const run = { ...arena(['spare-coil', 'emergency-gears']), probes: 0, scans: 2 }
  assert.ok(run.encounter?.kind === 'bastion')
  const row = Math.floor(run.encounter!.pylons[0]!.index / run.game.config.width) - 1
  // Choose a seeded arena row with at least two fresh mines.
  const target =
    Array.from({ length: run.game.config.height }, (_, index) => index).find(
      (index) =>
        run.game.cells.filter(
          (cell, i) => Math.floor(i / run.game.config.width) === index && cell.mine,
        ).length >= 2,
    ) ?? row
  const result = actExpedition(run, { type: 'sweep', row: target })
  assert.equal(result.probes, 3)
  assert.equal(result.scans, 1)
  assert.equal(result.encounter!.points, 2)
  assert.equal(
    result.floorTriggers.filter((id) => id === 'spare-coil' || id === 'emergency-gears').length,
    2,
  )
  assert.equal(actExpedition(result, { type: 'sweep', row: target }), result)
  assert.equal(actExpedition({ ...run, probes: 4 }, { type: 'sweep', row: target }).probes, 4)
})

test('skill capacitor rewards a successful career skill without refreshing it', () => {
  const run = {
    ...createExpedition({ ...departure, profession: 'alchemist' }),
    relics: ['skill-capacitor'] as readonly Relic[],
    probes: 2,
    scans: 0,
  }
  const result = actExpedition(run, { type: 'skill' })
  assert.equal(result.scans, 2)
  assert.equal(result.probes, 3)
  assert.equal(result.skillUsed, true)
  assert.equal(actExpedition(result, { type: 'skill' }), result)
  const empty = { ...run, probes: 0, scans: 0, shields: 0 }
  assert.equal(actExpedition(empty, { type: 'skill' }), empty)
})

test('marching boots preview the discount, spend it only on a long walk and reset on end-turn', () => {
  const run = arena(['marching-boots'])
  const destination = run.player - 4
  const plan = tacticalPlan(run, { type: 'move', index: destination })
  assert.equal(plan.path.length, 5)
  assert.equal(plan.cost, 3)
  assert.equal(plan.allowed, true)
  assert.deepEqual(run.encounter!.turnTriggers, [])
  assert.equal(
    tacticalPlan({ ...run, relics: [] }, { type: 'move', index: destination }).allowed,
    false,
  )
  const walked = actExpedition(run, { type: 'move', index: destination })
  assert.equal(walked.encounter!.points, 0)
  assert.deepEqual(walked.encounter!.turnTriggers, ['marching-boots'])
  assert.equal(actExpedition(walked, { type: 'move', index: run.player }), walked)
  const single = actExpedition(run, { type: 'move', index: run.player - 1 })
  assert.deepEqual(single.encounter!.turnTriggers, [])
  const next = actExpedition(walked, { type: 'end-turn' })
  assert.deepEqual(next.encounter!.turnTriggers, [])
  assert.equal(tacticalPlan(next, { type: 'move', index: run.player }).cost, 3)
})

test('shelter cloak requires ending outside the warning and grants one shield per floor', () => {
  const run = arena(['shelter-cloak'])
  const stationary = actExpedition(run, { type: 'end-turn' })
  assert.equal(stationary.shields, 0)
  const escaped = actExpedition(run, { type: 'move', index: run.player - run.game.config.width })
  const protectedRun = actExpedition(escaped, { type: 'end-turn' })
  assert.equal(protectedRun.health, 10)
  assert.equal(protectedRun.shields, 1)
  assert.ok(protectedRun.floorTriggers.includes('shelter-cloak'))
  const safe = { ...protectedRun, player: protectedRun.player - 1 }
  assert.equal(actExpedition(safe, { type: 'end-turn' }).shields, 1)
})

test('breach sigil refunds only a correct first calibration, including a last-point action', () => {
  const run = calibratedArena(['breach-sigil'])
  assert.ok(run.encounter?.kind === 'bastion')
  const ready = { ...run, encounter: { ...run.encounter!, points: 1 } }
  const action: ExpeditionAction = { type: 'interact', index: run.encounter!.pylons[0]!.index }
  const result = actExpedition(ready, action)
  assert.equal(result.encounter!.points, 1)
  assert.ok(result.floorTriggers.includes('breach-sigil'))
  assert.equal(actExpedition(result, action), result)
  const spent = { ...ready, floorTriggers: ['breach-sigil'] as readonly Relic[] }
  assert.equal(actExpedition(spent, action).encounter!.points, 0)
})

test('duelist edge cannot bypass armor, improves the first strike and reports actual damage', () => {
  const run = arena(['duelist-edge'])
  assert.ok(run.encounter?.kind === 'bastion')
  assert.equal(actExpedition(run, { type: 'attack' }), run)
  const ready = {
    ...run,
    player: run.encounter!.boss + 1,
    encounter: {
      ...run.encounter!,
      pylons: run.encounter!.pylons.map((p) => ({ ...p, active: false })),
      exposedUntil: 999,
    },
  }
  const first = actExpedition(ready, { type: 'attack' })
  assert.equal(first.encounter!.health, run.encounter!.health - 9)
  assert.equal(first.encounter!.lastDamage, 9)
  for (const language of ['en', 'zh', 'ja'] as const)
    assert.ok(tacticalEventCopy(language, first.encounter!).includes('9'))
  const second = actExpedition(
    { ...first, encounter: { ...first.encounter!, points: 3 } },
    { type: 'attack' },
  )
  assert.equal(second.encounter!.health, first.encounter!.health - 5)
  assert.equal(second.encounter!.lastDamage, 5)
})

test('reserve watch carries one spare point once and AP display shows the bonus', () => {
  const run = arena(['reserve-watch'])
  const next = actExpedition(run, { type: 'end-turn' })
  assert.equal(next.encounter!.points, 4)
  assert.equal(actExpedition({ ...next, shields: 2 }, { type: 'end-turn' }).encounter!.points, 3)
  const spent = actExpedition(
    { ...run, encounter: { ...run.encounter!, points: 0 } },
    { type: 'end-turn' },
  )
  assert.equal(spent.encounter!.points, 3)
  assert.ok(!spent.floorTriggers.includes('reserve-watch'))
})

test('second hand pays only after surviving the third turn and cannot revive a dead explorer', () => {
  const run = arena(['second-hand'])
  const ready = {
    ...run,
    probes: 0,
    scans: 0,
    encounter: { ...run.encounter!, turn: 3, braced: true },
  }
  const paid = actExpedition(ready, { type: 'end-turn' })
  assert.equal(paid.probes, 1)
  assert.equal(paid.scans, 1)
  assert.ok(paid.floorTriggers.includes('second-hand'))
  const again = actExpedition(
    { ...paid, encounter: { ...paid.encounter!, turn: 3, braced: true } },
    { type: 'end-turn' },
  )
  assert.equal(again.probes, 1)
  const fatal = actExpedition(
    { ...ready, health: 1, encounter: { ...ready.encounter, braced: false } },
    { type: 'end-turn' },
  )
  assert.equal(fatal.phase, 'lost')
  assert.equal(fatal.probes, 0)
})

test('new themes persist ownership and replay real reward choices through a complete boss battle', () => {
  const storage = new MemoryStorage()
  let run = createExpedition(departure)
  const actions: ExpeditionAction[] = []
  for (let step = 0; step < 2000 && run.floor < 5; step++) {
    if (run.phase === 'boss') {
      for (const action of defeatBastion(run)) {
        actions.push(action)
        run = actExpedition(run, action)
      }
      continue
    }
    const action: ExpeditionAction =
      run.phase === 'reward'
        ? {
            type: 'relic',
            relic:
              run.offers.find((id) =>
                RELIC_PACKS.slice(4).some((p) => p.relics.some((r) => r === id)),
              ) ?? run.offers[0]!,
          }
        : {
            type: run.game.cells[run.exit]?.visibility === 'revealed' ? 'move' : 'reveal',
            index:
              run.game.cells[run.exit]?.visibility === 'revealed'
                ? run.exit
                : [...frontierCells(run)].find((i) => !run.game.cells[i]?.mine)!,
          }
    const next = actExpedition(run, action)
    assert.notEqual(next, run)
    actions.push(action)
    run = next
  }
  assert.equal(run.floor, 5)
  assert.ok(
    run.relics.some((id) => RELIC_PACKS.slice(4).some((p) => p.relics.some((r) => r === id))),
  )
  const save = {
    version: 4,
    camp: { supplies: 123, completed: 8, upgrades: UPGRADES },
    records: [],
    journal: { rulesRevision: EXPEDITION_RULES_REVISION, returnSupplies: 0, departure, actions },
  }
  assert.ok(decodeExpeditionSave(JSON.stringify(save)))
  storage.setItem('minesweeper.variants.v1.expedition', JSON.stringify(save))
  const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.run, run)
  assert.equal(session.camp.supplies, 123)
  assert.equal(session.dispatch({ type: 'retreat' }), true)
  const bank = session.camp.supplies
  const restored = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(restored.camp.supplies, bank)
  assert.equal(restored.run, null)
})

/** Construct the current guardian for relic interaction scenarios. */
function enterTestBastion(run: Expedition): Expedition {
  const battle = enterBattle(run, 'bastion')
  return { ...battle, game: solveBattle(battle.game, battle.walls, battle.entrance) }
}
