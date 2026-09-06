import assert from 'node:assert/strict'
import test from 'node:test'
import {
  actExpedition,
  allowedDeparture,
  createExpedition,
  EMPTY_CAMP,
  frontierCells,
  reachableCells,
} from '../src/game/expedition.js'
import {
  claimMilestone,
  milestoneProgress,
  MILESTONES,
  ownedMilestoneRelics,
} from '../src/game/milestones.js'
import {
  currentWaymark,
  riftLandings,
  skillRoom,
  walkingNeighbors,
} from '../src/game/mobility-skills.js'
import { professionSkillAvailability } from '../src/game/profession-skills.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import { placedBoard } from '../src/game/variant-board.js'
import { enterBattle } from '../src/game/battle-arena.js'
import {
  applyDamageRelics,
  applyDiscoveryRelics,
  applyTreasureRelics,
} from '../src/game/relic-effects.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeExpeditionSave, parseUpgrade } from '../src/persistence/variant-decoders.js'
import { professionCopy, relicCopy } from '../src/ui/variant-copy.js'
import { professionSkillCopy } from '../src/ui/profession-skill-copy.js'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import type { Camp, Expedition, Profession } from '../src/types/variants.js'

function fixture(profession: Profession): Expedition {
  const game = placedBoard({ width: 5, height: 5, mines: 1 }, new Set([12]), 31, 11)
  return {
    ...createExpedition({ ...CURRENT_DEPARTURE, profession }),
    game: {
      ...game,
      phase: 'playing',
      cells: game.cells.map((cell) => ({
        ...cell,
        visibility: cell.mine ? 'flagged' : 'revealed',
      })),
    },
    player: 11,
    entrance: 11,
    exit: 24,
    walls: [],
    treasures: [13],
    collected: [],
    travelled: [11],
    confirmedMines: [12],
  }
}

test('all thirty rewards avoid old unlocks; claimed v1 milestones grant replacement relic licenses without another payment', () => {
  assert.equal(MILESTONES.filter((entry) => entry.kind === 'missions').length, 15)
  assert.equal(MILESTONES.filter((entry) => entry.kind === 'achievements').length, 15)
  const old: Camp = {
    ...EMPTY_CAMP,
    supplies: 2345,
    upgrades: ['surveyor', 'workshop', 'engineer', 'sentinel', 'archaeologist', 'battle-manual'],
    milestones: {
      ...milestoneProgress(EMPTY_CAMP),
      claimed: [
        'treasure-scout',
        'field-practice',
        'first-boss',
        'boss-slayer',
        'four-legends',
        'abyss-clear',
      ],
    },
  }
  const restored = decodeExpeditionSave(
    JSON.stringify({ version: 4, camp: old, journal: null, records: [] }),
  )!.camp
  assert.deepEqual(restored, old)
  assert.equal(ownedMilestoneRelics(restored).length, 6)
  for (const id of old.milestones!.claimed) assert.equal(claimMilestone(restored, id), restored)
  for (const entry of MILESTONES) {
    if (entry.reward?.kind === 'profession') assert.equal(parseUpgrade(entry.reward.id), null)
    assert.ok(!entry.reward || ['profession', 'equipment', 'relic'].includes(entry.reward.kind))
    if (entry.reward?.kind === 'relic')
      for (const language of ['en', 'zh', 'ja'] as const)
        assert.ok(relicCopy(language, entry.reward.id).note)
  }
})

test('new careers require their claimed license and never become purchasable upgrades', () => {
  const ready: Camp = {
    ...EMPTY_CAMP,
    milestones: { ...milestoneProgress(EMPTY_CAMP), floors: 50 },
  }
  for (const [profession, id] of [
    ['waymarker', 'deep-route'],
    ['riftwalker', 'depth-pioneer'],
  ] as const) {
    assert.equal(allowedDeparture(ready, profession, []), false)
    const camp = claimMilestone(ready, id)
    assert.ok(allowedDeparture(camp, profession, []))
    assert.deepEqual(camp.upgrades, [])
    assert.equal(parseUpgrade(profession), null)
    for (const language of ['en', 'zh', 'ja'] as const) {
      assert.ok(professionCopy(language, profession).note)
      assert.ok(professionSkillCopy(language, profession).note)
    }
  }
})

test('waymarker places then returns with two accepted actions, no repeated refund, and rejects occupied or foreign-room anchors', () => {
  const run = { ...fixture('waymarker'), relics: ['pulse-coil'] as const }
  const placed = actExpedition(run, { type: 'skill' })
  assert.equal(currentWaymark(placed), 11)
  assert.equal(placed.skillUsed, false)
  assert.ok(!placed.floorTriggers.includes('pulse-coil'))
  assert.equal(placed.steps, run.steps + 1)
  assert.equal(actExpedition(placed, { type: 'skill' }), placed)
  const moved = actExpedition(placed, { type: 'move', index: 10 })
  const blocked = { ...moved, walls: [11] }
  assert.equal(professionSkillAvailability(blocked), 'blocked-anchor')
  assert.equal(actExpedition(blocked, { type: 'skill' }), blocked)
  const returned = actExpedition(moved, { type: 'skill' })
  assert.equal(returned.player, 11)
  assert.equal(returned.skillUsed, true)
  assert.ok(returned.floorTriggers.includes('pulse-coil'))
  assert.equal(currentWaymark(returned), null)
  assert.equal(actExpedition(returned, { type: 'skill' }), returned)
  const battle = enterBattle(placed, 'bastion')
  assert.equal(currentWaymark(battle), null)
  const arenaMark = actExpedition(battle, { type: 'skill' })
  assert.equal(arenaMark.encounter!.points, battle.encounter!.points - 1)
  assert.equal(currentWaymark(arenaMark), arenaMark.player)
})

test('rift crosses a known obstacle, collects the actual landing chest, preserves clues and offers an ordinary bidirectional return path', () => {
  const run = fixture('riftwalker')
  assert.deepEqual(riftLandings(run), [13])
  for (const index of [undefined, -1, 12, 24]) {
    assert.equal(
      actExpedition(run, index === undefined ? { type: 'skill' } : { type: 'skill', index }),
      run,
    )
  }
  const crossed = actExpedition(run, { type: 'skill', index: 13 })
  assert.equal(crossed.player, 13)
  assert.equal(crossed.skillUsed, true)
  assert.equal(crossed.steps, run.steps + 1)
  assert.deepEqual(crossed.collected, [13])
  assert.ok(crossed.loot > run.loot)
  assert.deepEqual(crossed.game, run.game)
  assert.deepEqual(crossed.walls, run.walls)
  assert.deepEqual(walkingPath(crossed, 11), [13, 11])
  assert.ok(reachableCells(crossed).has(11))
  const returned = actExpedition(crossed, { type: 'move', index: 11 })
  assert.equal(returned.player, 11)
  assert.equal(actExpedition(returned, { type: 'move', index: 13 }).loot, crossed.loot)
  assert.equal(actExpedition(crossed, { type: 'skill', index: 11 }), crossed)
  const foreign = { ...crossed, rift: { ...crossed.rift!, room: 'another-room' } }
  assert.ok(!walkingNeighbors(foreign, 13).includes(11))
  const hidden = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, index) =>
        index === 13 ? { ...cell, visibility: 'hidden' as const } : cell,
      ),
    },
  }
  assert.deepEqual(riftLandings(hidden), [])
  assert.deepEqual(
    riftLandings({ ...run, confirmedMines: [] }),
    [],
    'Guessed flags cannot create a passage',
  )
})

test('rift and return skills respect boss bodies, action points and guarded floor completion', () => {
  const arena = enterBattle(fixture('riftwalker'), 'bastion')
  const run: Expedition = {
    ...fixture('riftwalker'),
    phase: 'boss',
    encounter: { ...arena.encounter!, boss: 24, points: 1 },
  }
  const crossed = actExpedition(run, { type: 'skill', index: 13 })
  assert.equal(crossed.encounter!.points, 0)
  assert.equal(crossed.phase, 'boss')
  assert.equal(crossed.encounter!.health, run.encounter!.health)
  assert.equal(actExpedition(crossed, { type: 'move', index: 11 }), crossed)
  const blockedPortal = { ...crossed, encounter: { ...crossed.encounter!, boss: 12 } }
  assert.ok(
    !walkingNeighbors(blockedPortal, 13).includes(11),
    'A moving boss can obstruct an existing portal',
  )
  assert.equal(
    actExpedition(
      { ...run, encounter: { ...run.encounter!, points: 0 } },
      { type: 'skill', index: 13 },
    ).player,
    11,
  )
  for (const boss of [12, 13])
    assert.deepEqual(riftLandings({ ...run, encounter: { ...run.encounter!, boss } }), [])
  const atExit = actExpedition({ ...fixture('riftwalker'), exit: 13 }, { type: 'skill', index: 13 })
  assert.equal(atExit.phase, 'exploring', 'Landing on stairs still requires explicit entry')
})

test('all eight exclusive relics and both new careers survive future-departure reload while old departure pools stay frozen', () => {
  let camp: Camp = {
    ...EMPTY_CAMP,
    milestones: {
      ...milestoneProgress(EMPTY_CAMP),
      travel: 2000,
      chests: 250,
      skills: 250,
      floors: 200,
      bosses: 20,
      wins: 3,
      abyssWins: 5,
      bossKinds: ['bastion', 'brood', 'mirror', 'magnetic'],
      relics: [
        'lantern',
        'lens',
        'aegis',
        'purse',
        'compass',
        'salvage',
        'trail-heart',
        'survey-token',
      ],
    },
  }
  for (const entry of MILESTONES) camp = claimMilestone(camp, entry.id)
  assert.equal(ownedMilestoneRelics(camp).length, 8)
  assert.deepEqual(camp.upgrades, [])
  const storage = new MemoryStorage()
  new VariantRepository(storage).saveExpedition({ version: 4, camp, journal: null, records: [] })
  const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.ok(session.start('riftwalker', []))
  assert.equal(session.run!.departure.milestoneRelics!.length, 8)
  assert.deepEqual(
    new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).run,
    session.run,
  )
  const key = 'minesweeper.variants.v1.expedition'
  const raw = JSON.parse(storage.getItem(key)!)
  raw.journal.departure.profession = 'explorer'
  raw.journal.departure.milestoneRelics = ['trail-heart', 'survey-token']
  storage.setItem(key, JSON.stringify(raw))
  const old = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(old.run!.departure.milestoneRelics, ['trail-heart', 'survey-token'])
})

test('new defensive and information relics have distinct finite triggers and preserve revive precedence', () => {
  const run: Expedition = {
    ...fixture('explorer'),
    health: 8,
    shields: 0,
    relics: ['last-bastion', 'abyss-hourglass', 'second-wind'],
  }
  const shielded = applyDamageRelics(run, { ...run, health: 2 }, null)
  assert.equal(shielded.shields, 2)
  assert.ok(shielded.runTriggers.includes('last-bastion'))
  assert.equal(applyDamageRelics(shielded, { ...shielded, health: 1, shields: 0 }, null).shields, 0)
  const revived = applyDamageRelics(run, { ...run, health: 0 }, null)
  assert.equal(revived.health, 5)
  assert.ok(!revived.runTriggers.includes('abyss-hourglass'))
  const again = applyDamageRelics(revived, { ...revived, health: 0 }, null)
  assert.equal(again.health, 3)
  assert.ok(again.runTriggers.includes('abyss-hourglass'))
  assert.equal(applyDamageRelics(again, { ...again, health: 0 }, null).health, 0)
  const base: Expedition = {
    ...fixture('explorer'),
    health: 5,
    relics: ['hunter-seal', 'fault-map', 'chest-beacon'],
    confirmedMines: [],
    treasures: [10, 13],
  }
  const discovered = applyDiscoveryRelics(
    base,
    { ...base, confirmedMines: [0, 1, 2, 3, 4, 5, 6, 12] },
    { type: 'probe', index: 12 },
  )
  assert.equal(discovered.health, 7)
  assert.ok(discovered.floorTriggers.includes('fault-map'))
  assert.equal(
    applyDiscoveryRelics(
      discovered,
      { ...discovered, confirmedMines: [...discovered.confirmedMines, 9] },
      { type: 'probe', index: 9 },
    ).health,
    7,
  )
  const chest = applyTreasureRelics(base, { ...base, collected: [10] })
  assert.ok(chest.floorTriggers.includes('chest-beacon'))
  assert.deepEqual(chest.collected, [10])
})

test('real accepted new-career journals replay anchors and targeted rifts without losing ownership or recounting progression', () => {
  for (const profession of ['waymarker', 'riftwalker'] as const) {
    const storage = new MemoryStorage()
    const ready = { ...EMPTY_CAMP, milestones: { ...milestoneProgress(EMPTY_CAMP), floors: 50 } }
    const camp = claimMilestone(ready, profession === 'waymarker' ? 'deep-route' : 'depth-pioneer')
    new VariantRepository(storage).saveExpedition({ version: 4, camp, journal: null, records: [] })
    const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.ok(session.start(profession, []))
    if (profession === 'waymarker') {
      assert.ok(session.dispatch({ type: 'skill' }))
      const marked = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
      assert.deepEqual(marked.run, session.run)
      const target = [...reachableCells(session.run!)].find(
        (index) => index !== session.run!.player,
      )!
      assert.ok(session.dispatch({ type: 'move', index: target }))
      assert.ok(session.dispatch({ type: 'skill' }))
    } else {
      // Explore safely using real intents, then select a public confirmed obstacle and landing.
      for (let attempts = 0; attempts < 400; attempts++) {
        const run = session.run!
        const hidden = [...frontierCells(run)].find(
          (index) => index !== run.exit && !run.game.cells[index]?.mine,
        )
        if (hidden === undefined) break
        assert.ok(session.dispatch({ type: 'reveal', index: hidden }))
      }
      let found = false
      for (const player of reachableCells(session.run!)) {
        const run = session.run!
        const possible = riftLandings({
          ...run,
          player,
          confirmedMines: run.game.cells.flatMap((cell, index) => (cell.mine ? [index] : [])),
        })
        if (!possible.length) continue
        if (player !== run.player) assert.ok(session.dispatch({ type: 'move', index: player }))
        const index = possible[0]!
        assert.ok(session.dispatch({ type: 'probe', index: (player + index) / 2 }))
        assert.ok(session.dispatch({ type: 'skill', index }))
        found = true
        break
      }
      assert.ok(found, 'Seed provides an actually playable rift')
    }
    const restored = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.deepEqual(restored.run, session.run)
    assert.deepEqual(restored.camp, session.camp)
    assert.equal(milestoneProgress(session.camp).skills, 1)
    const key = 'minesweeper.variants.v1.expedition'
    const raw = JSON.parse(storage.getItem(key)!)
    raw.camp = EMPTY_CAMP
    storage.setItem(key, JSON.stringify(raw))
    assert.equal(new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).run, null)
    assert.ok(skillRoom(session.run!))
  }
})
