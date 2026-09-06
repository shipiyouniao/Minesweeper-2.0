import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MILESTONES,
  advanceMilestones,
  claimMilestone,
  milestoneProgress,
  milestoneValue,
  ownedMilestoneRelics,
} from '../src/game/milestones.js'
import {
  actExpedition,
  allowedDeparture,
  createExpedition,
  EMPTY_CAMP,
  frontierCells,
  reachableCells,
} from '../src/game/expedition.js'
import { relicPool } from '../src/game/relic-packs.js'
import { applyDiscoveryRelics, applyTreasureRelics } from '../src/game/relic-effects.js'
import { useProfessionSkill } from '../src/game/profession-skills.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeExpeditionSave } from '../src/persistence/variant-decoders.js'
import { EXPEDITION_RULES_REVISION } from '../src/persistence/expedition-format.js'
import { milestoneCopy } from '../src/ui/milestone-copy.js'
import { equipmentCopy, relicCopy } from '../src/ui/variant-copy.js'
import { parseVariantCommand } from '../src/ui/variant-input.js'
import { defeatEncounter } from './encounter-helpers.js'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import type { Camp, Expedition } from '../src/types/variants.js'

const key = 'minesweeper.variants.v1.expedition'

test('accepted travel counts new cells only; flags, backtracking and rejected actions cannot advance missions', () => {
  const run = createExpedition(CURRENT_DEPARTURE)
  const target = [...reachableCells(run)].find((index) => index !== run.player)!
  const moved = actExpedition(run, { type: 'move', index: target })
  const camp = advanceMilestones(EMPTY_CAMP, run, moved)
  assert.ok(milestoneProgress(camp).travel > 0)
  const returned = actExpedition(moved, { type: 'move', index: run.player })
  assert.equal(
    milestoneProgress(advanceMilestones(camp, moved, returned)).travel,
    milestoneProgress(camp).travel,
  )
  const hidden = [...frontierCells(returned)][0]!
  const flagged = actExpedition(returned, { type: 'flag', index: hidden })
  assert.deepEqual(
    milestoneProgress(advanceMilestones(camp, returned, flagged)),
    milestoneProgress(camp),
  )
  assert.equal(advanceMilestones(camp, run, run), camp)
})

test('missions persist with accepted actions and reload never recounts the journal', () => {
  const storage = new MemoryStorage()
  const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.ok(session.start('explorer', []))
  const run = session.run!
  const target = [...reachableCells(run)].find((index) => index !== run.player)!
  assert.ok(session.dispatch({ type: 'move', index: target }))
  const saved = session.camp
  assert.ok(milestoneProgress(saved).travel > 0)
  assert.equal(session.claim('first-steps'), false, 'Claims cannot change an active departure')
  assert.equal(session.dispatch({ type: 'move', index: -1 }), false)
  for (let attempt = 0; attempt < 3; attempt++) {
    const restored = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.deepEqual(restored.camp, saved)
    assert.deepEqual(restored.run, session.run)
  }
  assert.ok(session.dispatch({ type: 'retreat' }))
  assert.ok(session.returnToCamp())
  assert.deepEqual(milestoneProgress(session.camp), milestoneProgress(saved))
})

test('claims grant finite supplies and actual unlocks exactly once, including across reload', () => {
  const camp: Camp = {
    ...EMPTY_CAMP,
    upgrades: ['surveyor'],
    milestones: { ...milestoneProgress(EMPTY_CAMP), travel: 20, chests: 3, floors: 5, wins: 3 },
  }
  const storage = new MemoryStorage()
  new VariantRepository(storage).saveExpedition({ version: 4, camp, journal: null, records: [] })
  let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(session.claim('first-boss'), false)
  assert.ok(session.claim('treasure-scout'))
  assert.equal(session.camp.supplies, 250)
  assert.deepEqual(session.camp.upgrades, ['surveyor'])
  assert.equal(session.claim('treasure-scout'), false)
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(session.claim('treasure-scout'), false)
  assert.equal(session.camp.supplies, 250)
  assert.ok(session.claim('floor-runner'))
  assert.ok(session.claim('veteran'))
  assert.deepEqual(ownedMilestoneRelics(session.camp), ['trail-heart'])
  assert.ok(!allowedDeparture(EMPTY_CAMP, 'explorer', ['field-radio']))
  assert.ok(!allowedDeparture({ ...session.camp, upgrades: [] }, 'explorer', ['field-radio']))
  assert.ok(
    allowedDeparture({ ...session.camp, upgrades: ['workshop'] }, 'explorer', ['field-radio']),
  )
})

test('old camps retain money and ownership; only recorded victories are backfilled; malformed counters retain valid claims', () => {
  const old = {
    version: 4,
    camp: { supplies: 1234, upgrades: ['surveyor'], completed: 3 },
    journal: null,
    records: [],
  }
  const decoded = decodeExpeditionSave(JSON.stringify(old))!
  assert.deepEqual(decoded.camp, old.camp)
  assert.equal(milestoneProgress(decoded.camp).wins, 3)
  assert.equal(milestoneProgress(decoded.camp).bosses, 0)
  assert.ok(claimMilestone(decoded.camp, 'veteran').supplies > 1234)
  const damaged = decodeExpeditionSave(
    JSON.stringify({
      ...old,
      camp: {
        ...old.camp,
        milestones: {
          travel: -1,
          floors: 'five',
          claimed: ['veteran', 'veteran', 'invented'],
          bossKinds: ['bastion', 'bastion', 'fake'],
          relics: ['lantern', 'lantern', 'fake'],
        },
      },
    }),
  )!
  assert.equal(damaged.camp.supplies, 1234)
  assert.deepEqual(milestoneProgress(damaged.camp).claimed, ['veteran'])
  assert.equal(claimMilestone(damaged.camp, 'veteran'), damaged.camp)
  assert.deepEqual(milestoneProgress(damaged.camp).bossKinds, ['bastion'])
  assert.deepEqual(milestoneProgress(damaged.camp).relics, ['lantern'])
})

test('exclusive relics enter future offer pools only after claiming and departure ownership is verified', () => {
  const camp = claimMilestone({ ...EMPTY_CAMP, completed: 3 }, 'veteran')
  const storage = new MemoryStorage()
  new VariantRepository(storage).saveExpedition({ version: 4, camp, journal: null, records: [] })
  const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  session.start('explorer', [])
  assert.ok(relicPool(session.run!.departure).includes('trail-heart'))
  assert.ok(!relicPool(CURRENT_DEPARTURE).includes('trail-heart'))
  assert.deepEqual(
    new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).run,
    session.run,
  )
  const save = JSON.parse(storage.getItem(key)!)
  save.camp = EMPTY_CAMP
  storage.setItem(key, JSON.stringify(save))
  assert.equal(new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).run, null)
})

test('reward equipment and relics apply bounded effects and cannot react twice to the same event', () => {
  const run = createExpedition({
    ...CURRENT_DEPARTURE,
    profession: 'engineer',
    equipment: ['field-radio'],
  })
  const used = useProfessionSkill(run)
  assert.equal(used.probes, run.probes + 1)
  assert.equal(used.scans, run.scans - 1)
  assert.equal(useProfessionSkill(used), used)
  const relicRun: Expedition = {
    ...run,
    shields: 0,
    relics: ['trail-heart', 'survey-token'],
    probes: 3,
    scans: 3,
  }
  const chest = applyTreasureRelics(relicRun, { ...relicRun, collected: [10] })
  assert.equal(chest.shields, 1)
  assert.equal(applyTreasureRelics(chest, { ...chest, collected: [10, 11] }).shields, 1)
  const discovery = applyDiscoveryRelics(
    relicRun,
    { ...relicRun, confirmedMines: [1, 2, 3, 4, 5] },
    { type: 'probe', index: 5 },
  )
  assert.equal(discovery.probes, 4)
  assert.equal(discovery.scans, 4)
  const repeated = applyDiscoveryRelics(
    discovery,
    { ...discovery, confirmedMines: [1, 2, 3, 4, 5, 6], probes: 2 },
    { type: 'probe', index: 6 },
  )
  assert.equal(repeated.probes, 2)
})

test('a complete accepted expedition records each floor, boss and victory once and retains settlement on reload', () => {
  const storage = new MemoryStorage()
  const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.ok(session.start('explorer', [], 'relaxed'))
  for (let count = 0; session.run?.phase !== 'won' && count < 1000; count++) {
    const run = session.run!
    if (run.phase === 'boss') {
      for (const action of defeatEncounter(run)) assert.ok(session.dispatch(action))
    } else if (run.phase === 'reward')
      assert.ok(session.dispatch({ type: 'relic', relic: run.offers[0]! }))
    else {
      const index = reachableCells(run).has(run.exit)
        ? run.exit
        : [...frontierCells(run)].find((index) => !run.game.cells[index]?.mine)!
      assert.ok(
        session.dispatch({
          type: run.game.cells[index]?.visibility === 'revealed' ? 'move' : 'reveal',
          index,
        }),
      )
    }
  }
  assert.equal(session.run?.phase, 'won')
  const progress = milestoneProgress(session.camp)
  assert.equal(progress.floors, 3)
  assert.equal(progress.bosses, 1)
  assert.equal(progress.bossKinds.length, 1)
  assert.equal(progress.wins, 1)
  assert.equal(progress.abyssWins, 0)
  assert.ok(progress.relics.length > 0)
  const restored = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(restored.camp, session.camp)
  assert.ok(restored.claim('first-boss'))
  assert.ok(restored.camp.upgrades.includes('engineer'))
})

test('milestone IDs, translations and command boundaries remain finite and complete', () => {
  assert.equal(new Set(MILESTONES.map((item) => item.id)).size, 10)
  for (const language of ['en', 'zh', 'ja'] as const) {
    for (const entry of MILESTONES) {
      assert.ok(milestoneCopy(language, entry.id).name)
      assert.ok(milestoneCopy(language, entry.id).note.trim())
      assert.ok(parseVariantCommand(`claim-milestone:${entry.id}`))
      assert.equal(milestoneValue(EMPTY_CAMP, entry), 0)
    }
    assert.ok(equipmentCopy(language, 'field-radio').note)
    assert.ok(relicCopy(language, 'trail-heart').note)
    assert.ok(relicCopy(language, 'survey-token').note)
  }
  for (const command of [
    'claim-milestone',
    'claim-milestone:fake',
    'claim-milestone:abc:1',
    'camp-page:route',
  ])
    assert.equal(parseVariantCommand(command), null)
  assert.equal(
    decodeExpeditionSave(
      JSON.stringify({
        version: 4,
        camp: EMPTY_CAMP,
        journal: {
          rulesRevision: EXPEDITION_RULES_REVISION,
          returnSupplies: 0,
          departure: { ...CURRENT_DEPARTURE, milestoneRelics: ['fake'] },
          actions: [],
        },
        records: [],
      }),
    )?.journal,
    null,
  )
})
