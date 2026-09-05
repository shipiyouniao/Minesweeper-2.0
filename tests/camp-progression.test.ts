import { defeatEncounter } from './encounter-helpers.js'
import { CURRENT_DEPARTURE } from './helpers.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  campFunding,
  maximumExpeditionSupplies,
  maximumRunSupplies,
  maximumDifficultySupplies,
  upgradeCost,
  UPGRADES,
} from '../src/game/camp-progression.js'
import {
  actExpedition,
  createExpedition,
  frontierCells,
  expeditionEarnings,
  EMPTY_CAMP,
  buyUpgrade,
} from '../src/game/expedition.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { VARIANT_TIERS } from '../src/game/variant-difficulty.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { campProgressTemplate } from '../src/ui/camp-progress-template.js'
import type { Expedition } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

/** Collect reachable treasures through legal safe exploration, leaving the stairs for last. */
function clearWithTreasures(initial: Expedition): Expedition {
  let run = initial
  for (let step = 0; step < run.game.cells.length; step++) {
    const index = [...frontierCells(run)].find(
      (candidate) => candidate !== run.exit && !run.game.cells[candidate]?.mine,
    )
    if (index === undefined) break
    run = actExpedition(run, { type: 'reveal', index })
  }
  for (const index of run.treasures) {
    if (!run.collected.includes(index) && walkingPath(run, index))
      run = actExpedition(run, { type: 'move', index })
  }
  run = actExpedition(run, {
    type: walkingPath(run, run.exit) ? 'move' : 'reveal',
    index: run.exit,
  })
  if (run.phase === 'boss')
    for (const action of defeatEncounter(run)) run = actExpedition(run, action)
  return run
}

test('prices offer two early professions, a middle milestone and a long-term archive goal', () => {
  assert.equal(maximumRunSupplies(), 2200)
  assert.deepEqual(
    VARIANT_TIERS.map((tier) => maximumExpeditionSupplies(tier.floors)),
    [138, 216, 294, 372, 489],
  )
  assert.deepEqual(
    UPGRADES.slice(0, 17).map(upgradeCost),
    [40, 60, 100, 250, 350, 450, 500, 650, 900, 900, 1200, 1500, 1800, 2200, 3200, 4500, 7500],
  )
  assert.deepEqual(VARIANT_TIERS.map(maximumDifficultySupplies), [276, 540, 882, 1302, 2200])
  const earlyCost = upgradeCost('surveyor') + upgradeCost('engineer')
  assert.equal(earlyCost, 100)
  // Even a three-floor win without a purse can afford both roles after collecting its chests.
  assert.ok(earlyCost <= 3 * (3 * 6 + 12) + 30)
  // Even ten Abyss wins that skip every optional chest can afford the most expensive item.
  const abyssMinimum = Math.floor((12 * 12 + 30) * 4.5)
  assert.equal(Math.ceil(upgradeCost('archive') / abyssMinimum), 10)
  assert.equal(Math.ceil(upgradeCost('archive') / maximumRunSupplies()), 4)
})

test('funding goals advance after purchases and report exact remaining money and optimistic runs', () => {
  assert.deepEqual(campFunding(EMPTY_CAMP), {
    upgrade: 'surveyor',
    stage: 'early',
    price: 40,
    saved: 0,
    remaining: 40,
    percent: 0,
    minimumRuns: 1,
  })
  for (const percent of [25, 50, 75]) {
    const funding = campFunding({ ...EMPTY_CAMP, supplies: (percent / 100) * 40 })
    assert.equal(funding?.percent, percent)
    assert.equal(funding?.remaining, 40 - (percent / 100) * 40)
  }
  const almost = { ...EMPTY_CAMP, supplies: 39 }
  assert.equal(buyUpgrade(almost, 'surveyor'), almost)
  assert.equal(campFunding(almost)?.minimumRuns, 1)
  const ready = { ...EMPTY_CAMP, supplies: 100 }
  assert.equal(campFunding(ready)?.percent, 100)
  assert.equal(campFunding(ready)?.minimumRuns, 0)
  const bought = buyUpgrade(ready, 'surveyor')
  assert.equal(bought.supplies, 60)
  assert.equal(campFunding(bought)?.upgrade, 'engineer')
  assert.equal(buyUpgrade(bought, 'surveyor'), bought)
  const both = buyUpgrade(bought, 'engineer')
  assert.equal(both.supplies, 0)
  assert.deepEqual(both.upgrades, ['surveyor', 'engineer'])
  assert.equal(campFunding(both)?.upgrade, 'survey-notes')
  assert.equal(campFunding(both)?.stage, 'early')
  let themed = { ...both, supplies: 1750 }
  for (const pack of [
    'survey-notes',
    'guardian-crests',
    'survival-charms',
    'prospector-seals',
  ] as const)
    themed = buyUpgrade(themed, pack)
  assert.equal(themed.supplies, 0)
  assert.equal(campFunding(themed)?.upgrade, 'cartographer-charts')
  themed = buyUpgrade({ ...themed, supplies: 350 }, 'cartographer-charts')
  assert.equal(campFunding(themed)?.upgrade, 'archaeologist')
  assert.equal(campFunding(themed)?.stage, 'middle')
  themed = buyUpgrade({ ...themed, supplies: 1350 }, 'archaeologist')
  themed = buyUpgrade(themed, 'alchemist')
  assert.equal(campFunding(themed)?.upgrade, 'salvager-kit')
  themed = buyUpgrade({ ...themed, supplies: 650 }, 'salvager-kit')
  assert.equal(campFunding(themed)?.upgrade, 'workshop')
  let workshop = buyUpgrade({ ...themed, supplies: 1200 }, 'workshop')
  assert.equal(campFunding(workshop)?.upgrade, 'mechanist-gears')
  workshop = buyUpgrade({ ...workshop, supplies: 1500 }, 'mechanist-gears')
  assert.equal(campFunding(workshop)?.upgrade, 'sentinel')
  assert.equal(campFunding(workshop)?.stage, 'late')
  assert.equal(campFunding(workshop)?.minimumRuns, 1)
  let sentinel = buyUpgrade({ ...workshop, supplies: 1800 }, 'sentinel')
  assert.equal(campFunding(sentinel)?.upgrade, 'wayfarer-tokens')
  for (const pack of ['wayfarer-tokens', 'duelist-marks', 'chronologist-dials'] as const)
    sentinel = buyUpgrade({ ...sentinel, supplies: upgradeCost(pack) }, pack)
  assert.equal(campFunding(sentinel)?.upgrade, 'archive')
  assert.equal(campFunding(sentinel)?.minimumRuns, 4)
  assert.equal(campFunding({ ...EMPTY_CAMP, upgrades: UPGRADES }), null)
})

test('new full expeditions pay increasing difficulty rewards within the published ceilings', () => {
  let previous = 0
  for (const tier of VARIANT_TIERS) {
    let run = createExpedition({
      ...CURRENT_DEPARTURE,
      packs: [],
      difficulty: tier.id,
      seed: 0,
      profession: 'explorer',
      equipment: [],
      archive: false,
    })
    for (let floor = 1; floor <= tier.floors; floor++) {
      run = clearWithTreasures(run)
      assert.ok(run.phase === 'reward' || run.phase === 'won')
      if (run.phase === 'won') break
      const relic = run.offers.includes('purse') ? 'purse' : run.offers[0]
      run = actExpedition(run, relic ? { type: 'relic', relic } : { type: 'descend' })
    }
    assert.equal(run.phase, 'won')
    const earned = expeditionEarnings(run)
    assert.ok(earned > previous)
    assert.ok(earned <= maximumDifficultySupplies(tier))
    previous = earned
  }
})

test('existing money and unlocks survive reload, with new purchases settled at the current price', () => {
  const storage = new MemoryStorage()
  storage.setItem(
    'minesweeper.variants.v1.expedition',
    JSON.stringify({
      version: 4,
      camp: { supplies: 1500, upgrades: ['engineer'], completed: 7 },
      journal: null,
      records: [],
    }),
  )
  let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.camp, { supplies: 1500, upgrades: ['engineer'], completed: 7 })
  assert.equal(session.purchase('engineer'), false)
  assert.equal(session.purchase('workshop'), true)
  assert.equal(session.camp.supplies, 300)
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.camp, {
    supplies: 300,
    upgrades: ['engineer', 'workshop'],
    completed: 7,
  })
  assert.ok(session.start('engineer', ['guard']))
  assert.equal(session.purchase('surveyor'), false)
  const restored = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(restored.run, session.run)
})

test('funding UI distinguishes saving, ready and fully owned states in all locales', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    const saving = campProgressTemplate(language, { ...EMPTY_CAMP, supplies: 10 })
    assert.ok(saving.includes('max="40" value="10"'))
    assert.ok(saving.includes('25%'))
    const ready = campProgressTemplate(language, { ...EMPTY_CAMP, supplies: 40 })
    assert.ok(ready.includes('max="40" value="40"'))
    assert.ok(!ready.includes('undefined'))
    const complete = campProgressTemplate(language, { ...EMPTY_CAMP, upgrades: UPGRADES })
    assert.ok(!complete.includes('<progress'))
    assert.ok(complete.length > 30)
  }
})
