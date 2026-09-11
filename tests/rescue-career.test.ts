import assert from 'node:assert/strict'
import test from 'node:test'
import {
  actExpedition,
  createExpedition,
  EMPTY_CAMP,
  allowedDeparture,
} from '../src/game/expedition.js'
import { rescueLandings } from '../src/game/rescue-skill.js'
import { professionSkillAvailability } from '../src/game/profession-skills.js'
import { placedBoard } from '../src/game/variant-board.js'
import { grantRescuer } from '../src/game/story-rewards.js'
import { decodeExpeditionSave, parseUpgrade } from '../src/persistence/variant-decoders.js'
import { campaignProgress } from '../src/game/campaign-catalog.js'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { enterChapterGuardian } from '../src/game/chapter-guardian.js'
import type { Expedition } from '../src/types/variants.js'

/** Use a cleared cross with bounded cardinal routes and no automatic exit on landing. */
function corridor(): Expedition {
  const initial = createExpedition({ ...CURRENT_DEPARTURE, profession: 'rescuer' })
  const board = placedBoard({ width: 9, height: 9, mines: 1 }, new Set([0]), 0, 40)
  return {
    ...initial,
    game: { ...board, cells: board.cells.map((cell) => ({ ...cell, visibility: 'revealed' })) },
    walls: [],
    player: 40,
    entrance: 40,
    exit: 44,
    treasures: [],
    collected: [],
    confirmedMines: [],
    surveyedCells: [],
    triggeredMines: [],
  }
}

test('rescue rope follows only cleared straight corridors, stops at hazards and never wraps rows', () => {
  const run = corridor()
  assert.deepEqual(rescueLandings(run), [22, 13, 4, 42, 43, 44, 58, 67, 76, 38, 37, 36])
  for (const visibility of ['hidden', 'flagged'] as const) {
    const blocked = {
      ...run,
      game: {
        ...run.game,
        cells: run.game.cells.map((cell, i) => (i === 41 ? { ...cell, visibility } : cell)),
      },
    }
    assert.ok(!rescueLandings(blocked).includes(42))
    const changedTruth = {
      ...blocked,
      game: {
        ...blocked.game,
        cells: blocked.game.cells.map((cell) =>
          cell.visibility === 'hidden' ? { ...cell, mine: !cell.mine } : cell,
        ),
      },
    }
    assert.deepEqual(rescueLandings(blocked), rescueLandings(changedTruth))
  }
  assert.ok(!rescueLandings({ ...run, walls: [41] }).includes(44))
  assert.ok(!rescueLandings({ ...run, player: 44 }).includes(46))
  const mined = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, i) => (i === 41 ? { ...cell, mine: true } : cell)),
    },
  }
  assert.ok(!rescueLandings(mined).includes(42))
})

test('lifeline uses one floor charge, caps shields and leaves the exit for deliberate entry', () => {
  const run = corridor()
  for (const index of [undefined, 41, 50, -1, 900])
    assert.equal(
      actExpedition(run, { type: 'skill', ...(index === undefined ? {} : { index }) }),
      run,
    )
  const after = actExpedition(run, { type: 'skill', index: 44 })
  assert.equal(after.player, 44)
  assert.equal(after.shields, 1)
  assert.equal(after.phase, 'exploring')
  assert.equal(after.steps, run.steps + 1)
  assert.equal(actExpedition(after, { type: 'skill', index: 40 }), after)
  assert.equal(actExpedition({ ...run, shields: 2 }, { type: 'skill', index: 44 }).shields, 2)
  assert.equal(professionSkillAvailability({ ...run, walls: [31, 41, 49, 39] }), 'no-corridor')
})

test('battle lifeline costs one point, cannot cross the boss and retains ordinary skill equipment effects', () => {
  const initial = corridor()
  const run = enterChapterGuardian({
    ...initial,
    floor: 3,
    departure: {
      ...initial.departure,
      campaign: 'northwest-bastion-v1',
      equipment: ['field-radio'],
    },
  })
  assert.ok(!rescueLandings(run).includes(run.encounter!.boss))
  const after = actExpedition(run, { type: 'skill', index: 42 })
  assert.equal(after.encounter!.points, run.encounter!.points - 1)
  assert.equal(after.shields, 1)
  assert.equal(after.probes, run.probes + 1)
  const exhausted = { ...run, encounter: { ...run.encounter!, points: 0 } }
  assert.equal(actExpedition(exhausted, { type: 'skill', index: 42 }), exhausted)
})

test('rescuer is a story license; cleared old saves gain it once without repaying or removing engineer', () => {
  assert.equal(parseUpgrade('rescuer'), null)
  assert.equal(allowedDeparture(EMPTY_CAMP, 'rescuer', []), false)
  const camp = { ...EMPTY_CAMP, supplies: 151, upgrades: ['engineer'] as const }
  const text = JSON.stringify({
    version: 4,
    camp,
    journal: null,
    records: [],
    campaign: {
      schemaVersion: 1,
      stages: [
        {
          ...campaignProgress(undefined, 'quarry-rescue'),
          cleared: true,
          scenes: ['rail-home', 'rail-camp'],
        },
      ],
    },
  })
  const save = decodeExpeditionSave(text)!
  assert.equal(save.camp.supplies, 151)
  assert.deepEqual(save.camp.upgrades, ['engineer'])
  assert.deepEqual(save.camp.storyProfessions, ['rescuer'])
  assert.ok(allowedDeparture(save.camp, 'rescuer', []))
  assert.equal(grantRescuer(save.camp), save.camp)
  assert.deepEqual(decodeExpeditionSave(JSON.stringify(save)), save)
})

test('rescuer intent replay preserves landing, shield and shared camp without repeating the skill', () => {
  const storage = new MemoryStorage()
  const repo = new VariantRepository(storage)
  repo.saveExpedition({ version: 4, camp: grantRescuer(EMPTY_CAMP), journal: null, records: [] })
  let session = new ExpeditionSession(repo, new FakeRuntime())
  assert.ok(session.start('rescuer', []))
  const landing = rescueLandings(session.run!)[0]
  assert.notEqual(landing, undefined)
  assert.ok(session.dispatch({ type: 'skill', index: landing! }))
  const expected = session.run
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.run, expected)
  assert.equal(session.dispatch({ type: 'skill', index: landing! }), false)
})
