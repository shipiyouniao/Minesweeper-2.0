import { CURRENT_DEPARTURE } from './helpers.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createExpedition, frontierCells } from '../src/game/expedition.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { difficultyRewardPercent, expeditionReward } from '../src/game/expedition-rewards.js'
import { VARIANT_TIERS } from '../src/game/variant-difficulty.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'

import type { Departure } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

const departure: Departure = {
  ...CURRENT_DEPARTURE,
  packs: [],
  difficulty: 'relaxed',
  seed: 0,
  profession: 'explorer',
  equipment: [],
  archive: false,
}

test('difficulty scales wins, extraction and retained defeat loot without paying unfinished runs', () => {
  assert.deepEqual(
    VARIANT_TIERS.map((tier) => difficultyRewardPercent(tier.id)),
    [200, 250, 300, 350, 450],
  )
  for (const tier of VARIANT_TIERS) {
    const run = { ...createExpedition({ ...departure, difficulty: tier.id }), loot: 11 }
    const percent = difficultyRewardPercent(tier.id)
    for (const [phase, base] of [
      ['won', 41],
      ['retreated', 11],
      ['lost', 5],
      ['reward', 0],
      ['exploring', 0],
    ] as const) {
      const total = Math.floor((base * percent) / 100)
      assert.deepEqual(expeditionReward({ ...run, phase }), {
        base,
        bonus: total - base,
        total,
        percent,
      })
    }
    assert.equal(expeditionReward({ ...run, phase: 'lost', relics: ['salvage'] }).base, 8)
  }
})

test('session recovery keeps the captured reward rate and banks the bonus exactly once', () => {
  const storage = new MemoryStorage()
  let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.ok(session.start('explorer', [], 'abyss'))
  for (let step = 0; step < 400 && session.run?.phase === 'exploring'; step++) {
    const run = session.run
    if (walkingPath(run, run.exit)) session.dispatch({ type: 'move', index: run.exit })
    else {
      const index = [...frontierCells(run)].find((candidate) => !run.game.cells[candidate]?.mine)
      assert.notEqual(index, undefined)
      session.dispatch({ type: 'reveal', index: index! })
    }
  }
  assert.equal(session.run?.phase, 'reward')
  const expected = session.run
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.run, expected)
  assert.ok(session.run)
  const amount = expeditionReward({ ...session.run, phase: 'retreated' }).total
  assert.ok(amount > session.run.loot)
  assert.ok(session.dispatch({ type: 'retreat' }))
  assert.equal(session.camp.supplies, amount)
  assert.equal(session.records[0]?.earned, amount)
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(session.run, null)
  assert.equal(session.camp.supplies, amount)
  assert.equal(session.records.length, 1)
})
