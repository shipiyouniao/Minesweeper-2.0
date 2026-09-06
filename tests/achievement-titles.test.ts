import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceMilestones,
  claimMilestone,
  equipTitle,
  milestoneProgress,
  ownedTitles,
  MILESTONES,
  milestoneValue,
} from '../src/game/milestones.js'
import { milestoneNotices } from '../src/game/milestone-notices.js'
import { createExpedition, EMPTY_CAMP } from '../src/game/expedition.js'
import { enterBattle } from '../src/game/battle-arena.js'
import { enterMagnetic } from '../src/game/magnetic-battle.js'
import { enterClock } from '../src/game/clock-battle.js'
import { decodeExpeditionSave } from '../src/persistence/variant-decoders.js'
import { CURRENT_DEPARTURE } from './helpers.js'
import type { Camp, Expedition } from '../src/types/variants.js'

function reload(camp: Camp): Camp {
  return decodeExpeditionSave(JSON.stringify({ version: 4, camp, journal: null, records: [] }))!
    .camp
}
function killed(run: Expedition): Expedition {
  assert.ok(run.encounter)
  return { ...run, phase: 'reward', encounter: { ...run.encounter, health: 0 } }
}
test('old claimed achievements grant titles without paying currency again; title ownership survives reload', () => {
  const old = {
    ...EMPTY_CAMP,
    supplies: 87,
    milestones: {
      ...milestoneProgress(EMPTY_CAMP),
      claimed: ['veteran' as const, 'first-boss' as const],
    },
  }
  const camp = reload(old)
  assert.deepEqual(ownedTitles(camp), ['veteran'])
  assert.equal(claimMilestone(camp, 'veteran'), camp)
  assert.equal(equipTitle(camp, 'first-boss'), camp)
  assert.equal(equipTitle(camp, 'web-untouched'), camp)
  const equipped = reload(equipTitle(camp, 'veteran'))
  assert.equal(equipped.supplies, 87)
  assert.equal(milestoneProgress(equipped).title, 'veteran')
  assert.equal(milestoneProgress(reload(equipTitle(equipped, null))).title, null)
})
test('every boss has a kill mission using recorded boss history', () => {
  const camp = {
    ...EMPTY_CAMP,
    milestones: {
      ...milestoneProgress(EMPTY_CAMP),
      bossKinds: ['bastion', 'brood', 'mirror', 'magnetic', 'clock'] as const,
    },
  }
  const missions = MILESTONES.filter((entry) => entry.metric === 'bossKill')
  assert.equal(missions.length, 5)
  for (const entry of missions) assert.equal(milestoneValue(reload(camp), entry), 1)
})
test('web challenge requires full fight history and keeps a web cut disqualification through reload', () => {
  const before = createExpedition(CURRENT_DEPARTURE)
  const run = enterBattle(before, 'brood')
  assert.equal(run.encounter?.kind, 'brood')
  if (run.encounter?.kind !== 'brood') return
  assert.ok(run.encounter.webs.length)
  const start = advanceMilestones(EMPTY_CAMP, before, run)
  assert.ok(
    milestoneProgress(advanceMilestones(start, run, killed(run))).challenges?.includes(
      'web-untouched',
    ),
  )
  const cut = { ...run, encounter: { ...run.encounter, webs: run.encounter.webs.slice(1) } }
  const failed = reload(advanceMilestones(start, run, cut))
  assert.equal(
    milestoneProgress(advanceMilestones(failed, cut, killed(cut))).challenges?.includes(
      'web-untouched',
    ),
    false,
  )
  assert.equal(
    milestoneProgress(advanceMilestones(EMPTY_CAMP, run, killed(run))).challenges?.includes(
      'web-untouched',
    ),
    false,
  )
  const fresh = advanceMilestones(failed, before, run)
  assert.ok(
    milestoneProgress(advanceMilestones(fresh, run, killed(run))).challenges?.includes(
      'web-untouched',
    ),
  )
})
test('magnetic mine contact disqualifies even with unchanged health and previously triggered mine; charge explosions do not', () => {
  const before = createExpedition(CURRENT_DEPARTURE)
  const run = enterMagnetic(before)
  assert.equal(run.encounter?.kind, 'magnetic')
  if (run.encounter?.kind !== 'magnetic') return
  const mine = run.game.cells.findIndex((cell) => cell.mine)
  assert.ok(mine >= 0)
  const start = advanceMilestones(EMPTY_CAMP, before, run)
  const hit: Expedition = {
    ...run,
    encounter: {
      ...run.encounter,
      turn: run.encounter.turn + 1,
      resolution: {
        turn: run.encounter.turn,
        playerPath: [run.player],
        bossPath: [],
        blastCells: [],
        detonatedMines: [],
        impact: mine,
        outcome: 'collision',
      },
    },
  }
  const failed = reload(advanceMilestones(start, run, hit))
  assert.equal(
    milestoneProgress(advanceMilestones(failed, hit, killed(hit))).challenges?.includes(
      'field-unscathed',
    ),
    false,
  )
  const blast: Expedition = {
    ...run,
    encounter: {
      ...run.encounter,
      turn: run.encounter.turn + 1,
      resolution: {
        turn: run.encounter.turn,
        playerPath: [],
        bossPath: [],
        blastCells: [mine],
        detonatedMines: [mine],
        impact: null,
        outcome: 'overloaded',
      },
    },
  }
  const success = advanceMilestones(advanceMilestones(start, run, blast), blast, killed(blast))
  assert.ok(milestoneProgress(success).challenges?.includes('magnetic-demolition'))
  assert.ok(milestoneProgress(success).challenges?.includes('field-unscathed'))
})
test('no-hourglass and flawless challenges track the entire fight, not only the killing action', () => {
  const before = createExpedition(CURRENT_DEPARTURE)
  const clock = enterClock(before)
  assert.equal(clock.encounter?.kind, 'clock')
  if (clock.encounter?.kind !== 'clock') return
  const start = advanceMilestones(EMPTY_CAMP, before, clock)
  const used: Expedition = {
    ...clock,
    encounter: {
      ...clock.encounter,
      hourglasses: clock.encounter.hourglasses.map((item) => ({ ...item, used: true })),
    },
  }
  const failed = reload(advanceMilestones(start, clock, used))
  assert.equal(
    milestoneProgress(advanceMilestones(failed, used, killed(used))).challenges?.includes(
      'clock-no-glass',
    ),
    false,
  )
  assert.ok(
    milestoneProgress(advanceMilestones(start, clock, killed(clock))).challenges?.includes(
      'clock-no-glass',
    ),
  )
  const bastion = enterBattle(before, 'bastion')
  const initial = advanceMilestones(EMPTY_CAMP, before, bastion)
  const hurt = { ...bastion, health: bastion.health - 1 }
  const healed = { ...hurt, health: bastion.health }
  const after = advanceMilestones(advanceMilestones(initial, bastion, hurt), hurt, healed)
  assert.equal(
    milestoneProgress(advanceMilestones(after, healed, killed(healed))).challenges?.includes(
      'bastion-flawless',
    ),
    false,
  )
})
test('progress notices emit halfway and completion once, queue simultaneous goals and suppress old claims', () => {
  const progress = milestoneProgress(EMPTY_CAMP)
  const half = { ...EMPTY_CAMP, milestones: { ...progress, travel: 10 } }
  assert.deepEqual(
    milestoneNotices(EMPTY_CAMP, half).map((item) => item.entry.id),
    ['first-steps'],
  )
  assert.deepEqual(milestoneNotices(half, half), [])
  const done = { ...half, milestones: { ...progress, travel: 20, chests: 3, bosses: 1 } }
  const notices = milestoneNotices(half, done)
  assert.ok(notices.length >= 3)
  assert.equal(notices.filter((item) => item.entry.id === 'first-steps').length, 1)
  assert.equal(notices.find((item) => item.entry.id === 'first-steps')?.value, 20)
  assert.deepEqual(milestoneNotices(done, claimMilestone(done, 'first-steps')), [])
})
