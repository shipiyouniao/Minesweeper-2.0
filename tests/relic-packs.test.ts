import { CURRENT_DEPARTURE } from './helpers.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  actExpedition,
  createExpedition,
  frontierCells,
  buyUpgrade,
  EMPTY_CAMP,
} from '../src/game/expedition.js'
import { applyTreasureRelics } from '../src/game/relic-effects.js'
import { RELIC_PACKS, ownedRelicPacks, relicPool } from '../src/game/relic-packs.js'
import { probeArea } from '../src/game/dungeon-discovery.js'

import { expansionRelicCopy, relicPackCopy } from '../src/ui/relic-expansion-copy.js'

import type { Departure, Expedition, ExpeditionAction, Relic } from '../src/types/variants.js'

const departure: Departure = {
  ...CURRENT_DEPARTURE,
  difficulty: 'standard',
  seed: 42,
  profession: 'explorer',
  equipment: [],
  archive: true,
  packs: RELIC_PACKS.slice(0, 4).map((pack) => pack.id),
}

/** Reach the next mine through legal frontier exploration without fabricating terrain. */
function hitMine(initial: Expedition): Expedition {
  let run = initial
  for (let step = 0; step < run.game.cells.length; step++) {
    const frontier = [...frontierCells(run)]
    const mine = frontier.find((index) => run.game.cells[index]?.mine)
    if (mine !== undefined) return actExpedition(run, { type: 'reveal', index: mine })
    const safe = frontier.find((index) => index !== run.exit)
    assert.notEqual(safe, undefined)
    run = actExpedition(run, { type: 'reveal', index: safe! })
  }
  throw new Error('No reachable mine in fixture')
}

/** Finish a real floor through safe frontier inputs to test reset and carry behavior. */
function finishFloor(initial: Expedition): Expedition {
  let run = initial
  for (let step = 0; step < run.game.cells.length * 2 && run.phase === 'exploring'; step++) {
    const safe = [...frontierCells(run)].find((index) => !run.game.cells[index]?.mine)
    run =
      safe === undefined
        ? actExpedition(run, { type: 'move', index: run.exit })
        : actExpedition(run, { type: 'reveal', index: safe })
  }
  assert.equal(run.phase, 'reward')
  return run
}

test('theme purchases preserve old ownership and add affordable intermediate choices', () => {
  let camp = { ...EMPTY_CAMP, supplies: 1750 }
  for (const pack of RELIC_PACKS.slice(0, 4)) camp = buyUpgrade(camp, pack.id)
  assert.equal(camp.supplies, 0)
  assert.deepEqual(ownedRelicPacks(camp), departure.packs)
  assert.equal(buyUpgrade(camp, 'survey-notes'), camp)
  assert.deepEqual(
    ownedRelicPacks({ ...camp, upgrades: [...camp.upgrades].reverse() }),
    departure.packs,
  )
  assert.equal(relicPool(departure).length, 14)
  assert.equal(new Set(relicPool(departure)).size, 14)
  assert.equal(relicPool({ ...departure, packs: [] }).length, 6)
})

test('survey reactions reward fresh information once and cannot be farmed by repeated probing', () => {
  const run = {
    ...createExpedition(departure),
    relics: ['field-notes', 'rangefinder'] as readonly Relic[],
    probes: 2,
    scans: 0,
  }
  const target = run.game.cells.findIndex(
    (_, index) =>
      probeArea(run.game.config, index).filter((other) => run.game.cells[other]?.mine).length >= 3,
  )
  assert.ok(target >= 0)
  const discovered = actExpedition(run, { type: 'probe', index: target })
  assert.equal(discovered.probes, 2)
  assert.equal(discovered.scans, 1)
  assert.deepEqual(discovered.floorTriggers, ['field-notes', 'rangefinder'])
  assert.equal(actExpedition(discovered, { type: 'probe', index: target }), discovered)
  assert.equal(
    actExpedition(discovered, { type: 'flag', index: discovered.confirmedMines[0]! }),
    discovered,
  )
  const capped = actExpedition({ ...run, probes: 4, scans: 4 }, { type: 'probe', index: target })
  assert.equal(capped.probes, 4)
  assert.equal(capped.scans, 4)
  assert.equal(run.confirmedMines.length, 0)
})

test('shield reconnaissance keeps mines locked and the rescue ribbon grants only one shield per run', () => {
  const shielded = hitMine({
    ...createExpedition(departure),
    relics: ['reactive-shell'],
    shields: 1,
  })
  assert.ok(shielded.floorTriggers.includes('reactive-shell'))
  assert.ok(shielded.surveyedCells.length > 0)
  assert.equal(shielded.health, 10)
  assert.equal(shielded.shields, 0)
  for (const index of shielded.confirmedMines) {
    assert.ok(shielded.game.cells[index]?.mine)
    assert.equal(shielded.game.cells[index]?.visibility, 'flagged')
  }
  const rescued = hitMine({ ...createExpedition(departure), relics: ['rescue-ribbon'] })
  assert.equal(rescued.health, 5)
  assert.equal(rescued.shields, 1)
  assert.deepEqual(rescued.runTriggers, ['rescue-ribbon'])
  const consumed = hitMine(rescued)
  assert.equal(consumed.shields, 0)
  assert.equal(hitMine(consumed).phase, 'lost')
})

test('second wind prevents one loss without exposing the board and survives floor transitions as spent', () => {
  const revived = hitMine({
    ...createExpedition(departure),
    health: 1,
    relics: ['second-wind', 'rescue-ribbon'],
  })
  assert.equal(revived.health, 5)
  assert.equal(revived.shields, 0)
  assert.equal(revived.phase, 'exploring')
  assert.notEqual(revived.game.phase, 'lost')
  assert.deepEqual(revived.runTriggers, ['second-wind'])
  assert.ok(!revived.game.cells[revived.player]?.mine)
  const reward = finishFloor(revived)
  const next = actExpedition(reward, { type: 'relic', relic: reward.offers[0]! })
  assert.equal(next.floor, 2)
  assert.deepEqual(next.runTriggers, ['second-wind'])
  assert.deepEqual(next.floorTriggers, [])
  const fatal = hitMine({ ...next, health: 1, shields: 0 })
  assert.equal(fatal.phase, 'lost')
})

test('chest effects grant healing, scans and full-clear protection once per floor with caps', () => {
  const before = {
    ...createExpedition(departure),
    health: 1,
    scans: 0,
    relics: ['field-dressing', 'supply-cache', 'cache-guard'] as readonly Relic[],
  }
  const first = applyTreasureRelics(before, { ...before, collected: [before.treasures[0]!] })
  assert.equal(first.health, 6)
  assert.equal(first.scans, 1)
  assert.equal(first.shields, 0)
  assert.equal(applyTreasureRelics(first, first), first)
  const third = applyTreasureRelics(first, { ...first, health: 1, collected: before.treasures })
  assert.equal(third.health, 1)
  assert.equal(third.scans, 1)
  assert.equal(third.shields, 1)
  const capped = applyTreasureRelics(before, {
    ...before,
    scans: 4,
    shields: 2,
    health: 10,
    collected: before.treasures,
  })
  assert.equal(capped.scans, 4)
  assert.equal(capped.shields, 2)
  assert.equal(capped.health, 10)
  assert.equal(third.loot, before.loot)
})

test('new offers and reaction counters replay deterministically after acquiring an expansion relic', () => {
  const initial = createExpedition(departure)
  let run = initial
  const actions: ExpeditionAction[] = []
  for (let step = 0; step < 1000 && run.floor < 3; step++) {
    const action =
      run.phase === 'reward'
        ? {
            type: 'relic' as const,
            relic:
              run.offers.find(
                (relic) =>
                  !['lantern', 'lens', 'aegis', 'purse', 'compass', 'salvage'].includes(relic),
              ) ?? run.offers[0]!,
          }
        : (() => {
            const safe = [...frontierCells(run)].find((index) => !run.game.cells[index]?.mine)
            return safe === undefined
              ? { type: 'move' as const, index: run.exit }
              : { type: 'reveal' as const, index: safe }
          })()
    const next = actExpedition(run, action)
    assert.notEqual(next, run)
    actions.push(action)
    run = next
  }
  assert.equal(run.floor, 3)
  const replayed = actions.reduce(actExpedition, initial)
  assert.deepEqual(replayed, run)
  assert.ok(
    run.relics.some(
      (relic) => !['lantern', 'lens', 'aegis', 'purse', 'compass', 'salvage'].includes(relic),
    ),
  )
})

test('every new theme and effect has concise descriptions in all locales', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    for (const pack of RELIC_PACKS) assert.ok(relicPackCopy(language, pack.id).note.length > 10)
    for (const relic of [
      'field-notes',
      'rangefinder',
      'reactive-shell',
      'rescue-ribbon',
      'field-dressing',
      'second-wind',
      'supply-cache',
      'cache-guard',
    ] as const)
      assert.ok(expansionRelicCopy(language, relic).note.length > 10)
  }
})
