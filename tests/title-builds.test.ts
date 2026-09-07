import assert from 'node:assert/strict'
import test from 'node:test'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import {
  createExpedition,
  actExpedition,
  reachableCells,
  frontierCells,
  EMPTY_CAMP,
} from '../src/game/expedition.js'
import { combatStats, incomingCombatDamage, damageExpedition } from '../src/game/combat-build.js'
import { enterEncounter } from '../src/game/encounter-roster.js'
import { enterBattle } from '../src/game/battle-arena.js'
import { enterMagnetic } from '../src/game/magnetic-battle.js'
import {
  MILESTONES,
  milestoneProgress,
  ownedTitles,
  claimMilestone,
} from '../src/game/milestones.js'
import { TITLES, parseTitle } from '../src/game/title-effects.js'
import { UPGRADES, upgradeCost, maximumDifficultySupplies } from '../src/game/camp-progression.js'
import { variantTier } from '../src/game/variant-difficulty.js'
import { titleEffectCopy } from '../src/ui/title-copy.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { EXPEDITION_RULES_REVISION } from '../src/persistence/expedition-format.js'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import type { Camp, Expedition } from '../src/types/variants.js'
import type { TitleId } from '../src/types/titles.js'

const key = 'minesweeper.variants.v1.expedition'

/** Seed all achievement licenses without inventing an active run or claiming currency. */
function titledCamp(title: TitleId | null): Camp {
  return {
    ...EMPTY_CAMP,
    supplies: 8765,
    milestones: { ...milestoneProgress(EMPTY_CAMP), title, claimed: [...TITLES] },
  }
}

/** Build one concrete current-rule explorer for conditional rule tests. */
function expedition(title: TitleId | null): Expedition {
  return createExpedition({
    ...CURRENT_DEPARTURE,
    title,
    difficulty: 'expert',
    archive: true,
    battleRelics: true,
  })
}

/** Follow safe frontiers to exercise the real exit, offer generation and boss-entry boundary. */
function leaveRoom(initial: Expedition): Expedition {
  let run = initial
  for (let step = 0; run.phase === 'exploring' && step < 1000; step++) {
    const index = reachableCells(run).has(run.exit)
      ? run.exit
      : [...frontierCells(run)].find((index) => !run.game.cells[index]!.mine)
    assert.notEqual(index, undefined)
    const next = actExpedition(run, {
      type: run.game.cells[index!]!.visibility === 'revealed' ? 'move' : 'reveal',
      index: index!,
    })
    assert.notEqual(next, run)
    run = next
  }
  assert.notEqual(run.phase, 'exploring')
  return run
}

test('all 24 achievement titles have finite identities, complete copy and no currency on equip', () => {
  assert.deepEqual(
    new Set(TITLES),
    new Set(MILESTONES.filter((entry) => entry.kind === 'achievements').map((entry) => entry.id)),
  )
  assert.equal(TITLES.length, 24)
  assert.equal(parseTitle('first-boss'), null)
  assert.equal(parseTitle('invented'), null)
  const storage = new MemoryStorage()
  const repository = new VariantRepository(storage)
  repository.saveExpedition({ version: 4, camp: titledCamp(null), journal: null, records: [] })
  const session = new ExpeditionSession(repository, new FakeRuntime())
  for (const title of TITLES) {
    for (const language of ['en', 'zh', 'ja'] as const)
      assert.ok(titleEffectCopy(language, title).length > 8)
    assert.ok(session.equipTitle(title))
    assert.equal(session.camp.supplies, 8765)
    assert.ok(session.start('explorer', []))
    assert.equal(session.run!.departure.title, title)
    assert.deepEqual(
      new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).run,
      session.run,
    )
    assert.ok(session.dispatch({ type: 'retreat' }))
    assert.ok(session.returnToCamp())
  }
})

test('departure freezes one owned title across camp switches, refresh and the next run', () => {
  const storage = new MemoryStorage()
  new VariantRepository(storage).saveExpedition({
    version: 4,
    camp: titledCamp('veteran'),
    journal: null,
    records: [],
  })
  let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  session.start('explorer', [])
  assert.equal(session.run!.health, 11)
  assert.ok(session.equipTitle('field-unscathed'))
  const before = session.run
  assert.equal(before!.departure.title, 'veteran')
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.run, before)
  session.dispatch({ type: 'retreat' })
  session.returnToCamp()
  session.start('explorer', [])
  assert.equal(session.run!.health, 10)
  assert.equal(session.run!.probes, 3)
  assert.equal(session.run!.departure.title, 'field-unscathed')

  const saved = JSON.parse(storage.getItem(key)!)
  saved.camp.milestones.claimed = []
  storage.setItem(key, JSON.stringify(saved))
  assert.equal(new ExpeditionSession(new VariantRepository(storage), new FakeRuntime()).run, null)
})

test('revision eight retires once with checkpointed funds while keeping title licenses and old money', () => {
  const storage = new MemoryStorage()
  const camp = titledCamp('veteran')
  storage.setItem(
    key,
    JSON.stringify({
      version: 4,
      camp,
      records: [],
      journal: { rulesRevision: 8, returnSupplies: 217, departure: {}, actions: [] },
    }),
  )
  let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(session.run, null)
  assert.equal(session.camp.supplies, 8982)
  assert.deepEqual(ownedTitles(session.camp), [...TITLES])
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(session.camp.supplies, 8982)
  session.start('explorer', [])
  assert.equal(session.run!.health, 11)
  assert.equal(JSON.parse(storage.getItem(key)!).journal.rulesRevision, EXPEDITION_RULES_REVISION)
  for (const value of ['first-boss', 'fake', undefined, 17]) {
    const save = JSON.parse(storage.getItem(key)!)
    save.journal.departure.title = value
    const isolated = new MemoryStorage()
    isolated.setItem(key, JSON.stringify(save))
    assert.equal(
      new ExpeditionSession(new VariantRepository(isolated), new FakeRuntime()).run,
      null,
    )
  }
})

test('starting resources are capped and late endurance grows at floors four and seven only', () => {
  assert.equal(expedition('veteran').maxHealth, 11)
  assert.equal(expedition('field-unscathed').probes, 3)
  assert.equal(expedition('depth-pioneer').scans, 2)
  assert.equal(
    createExpedition({ ...CURRENT_DEPARTURE, title: 'field-unscathed', equipment: ['probe'] })
      .probes,
    4,
  )
  let run = expedition('depth-legend')
  for (let floor = 1; floor < 9; floor++) {
    // Reward-state fixtures isolate accepted descent without simulating unrelated guardians.
    run = actExpedition({ ...run, floor, phase: 'reward', offers: [] }, { type: 'descend' })
    const expected = 10 + Number(run.floor >= 4) + Number(run.floor >= 7)
    assert.equal(run.maxHealth, expected)
    assert.equal(run.health, expected)
    assert.equal(actExpedition(run, { type: 'descend' }), run)
  }
})

test('conditional attacks and armor enter real combat stats while mine damage remains five', () => {
  const baseline = enterBattle(expedition(null), 'bastion')
  assert.ok(baseline.encounter)
  const slayer: Expedition = {
    ...baseline,
    departure: { ...baseline.departure, title: 'boss-slayer' },
    encounter: { ...baseline.encounter, health: baseline.encounter.maxHealth / 2 },
  }
  assert.equal(combatStats(slayer).attack, 6)
  assert.equal(
    combatStats({
      ...slayer,
      encounter: { ...slayer.encounter!, health: slayer.encounter!.maxHealth },
    }).attack,
    5,
  )
  const wounded = {
    ...baseline,
    departure: { ...baseline.departure, title: 'abyss-clear' as const },
    health: 5,
  }
  assert.equal(combatStats(wounded).attack, 6)
  assert.equal(combatStats({ ...wounded, health: 6 }).attack, 5)
  const braced = actExpedition(
    { ...baseline, departure: { ...baseline.departure, title: 'bastion-flawless' } },
    { type: 'brace' },
  )
  assert.equal(combatStats(braced).defense, 1)
  assert.equal(incomingCombatDamage(braced, 5), 1)
  assert.equal(
    combatStats({ ...braced, encounter: { ...braced.encounter!, braced: false } }).defense,
    0,
  )
  const survivor = {
    ...baseline,
    departure: { ...baseline.departure, title: 'abyss-veteran' as const },
    health: 3,
  }
  assert.equal(combatStats(survivor).defense, 1)
  assert.equal(combatStats({ ...survivor, health: 4 }).defense, 0)
  assert.equal(damageExpedition({ ...braced, shields: 0 }, 5).health, braced.health - 5)
})

test('specialist titles require their own boss condition', () => {
  const brood = enterBattle(expedition('brood-nest-spared'), 'brood')
  assert.equal(brood.encounter?.kind, 'brood')
  if (brood.encounter?.kind !== 'brood') return
  assert.equal(combatStats(brood).attack, 7)
  assert.equal(combatStats({ ...brood, encounter: { ...brood.encounter, nests: [] } }).attack, 5)
  assert.equal(combatStats(enterBattle(expedition('web-untouched'), 'brood')).defense, 1)
  assert.equal(combatStats(enterBattle(expedition('web-untouched'), 'bastion')).defense, 0)
  const magnetic = enterMagnetic(expedition('magnetic-demolition'))
  assert.equal(magnetic.encounter?.kind, 'magnetic')
  if (magnetic.encounter?.kind !== 'magnetic') return
  assert.equal(combatStats(magnetic).attack, 5)
  assert.equal(
    combatStats({
      ...magnetic,
      encounter: { ...magnetic.encounter, exposedUntil: magnetic.encounter.turn },
    }).attack,
    7,
  )
})

test('all five arena constructors and turn resolvers honor bounded title action budgets', () => {
  for (let seed = 0; seed < 5; seed++) {
    const first = enterEncounter({
      ...expedition('world-walker'),
      floor: 3,
      departure: { ...CURRENT_DEPARTURE, title: 'world-walker', seed },
    })
    assert.equal(first.encounter!.points, 4)
    assert.equal(combatStats(first).actions, 4)
    const second = actExpedition({ ...first, shields: 2 }, { type: 'end-turn' })
    assert.equal(second.encounter!.points, 3)
    const clock = {
      ...second,
      departure: { ...second.departure, title: 'clock-no-glass' as const },
      shields: 2,
    }
    const third = actExpedition(clock, { type: 'end-turn' })
    assert.equal(third.encounter!.turn, 3)
    assert.equal(third.encounter!.points, 4)
    const stacked = {
      ...third,
      relics: ['tactics-hourglass' as const],
      departure: { ...third.departure, equipment: ['field-boots' as const] },
      encounter: { ...third.encounter!, turn: 6 },
    }
    assert.equal(combatStats(stacked).actions, 5)
  }
})

test('entry titles activate through deliberate stairs once, with bounded shields and healing', () => {
  for (const title of ['mirror-flawless', 'four-legends'] as const) {
    const before = { ...expedition(title), floor: 3, health: 3, shields: 0 }
    const entered = leaveRoom(before)
    assert.equal(entered.phase, 'boss')
    assert.equal(entered.shields, title === 'mirror-flawless' ? 1 : 0)
    assert.equal(entered.health, title === 'four-legends' ? 5 : 3)
    const waited = actExpedition(entered, { type: 'brace' })
    assert.equal(waited.health, entered.health)
    assert.equal(waited.shields, entered.shields)
  }
})

test('relic choice titles apply at distinct build stages and keep a single selection', () => {
  const relics = ['lantern', 'lens', 'aegis'] as const
  for (const title of ['relic-curator', 'relic-museum'] as const) {
    const early = leaveRoom(expedition(title))
    const late = leaveRoom({ ...expedition(title), relics })
    assert.equal(early.offers.length, title === 'relic-curator' ? 4 : 3)
    assert.equal(late.offers.length, title === 'relic-museum' ? 4 : 3)
    const chosen = actExpedition(early, { type: 'relic', relic: early.offers[0]! })
    assert.equal(chosen.relics.length, 1)
    const archaeologist = leaveRoom(
      createExpedition({ ...CURRENT_DEPARTURE, title, profession: 'archaeologist', archive: true }),
    )
    assert.equal(archaeologist.offers.length, title === 'relic-curator' ? 5 : 4)
  }
})

test('physical treasure rewards are finite across walking, room changes and floor descent', () => {
  for (const title of ['long-road', 'treasure-vault', 'treasure-legend'] as const) {
    let run: Expedition = { ...expedition(title), health: 6, probes: 0, scans: 0 }
    const targets = [...reachableCells(run)]
      .filter((index) => index !== run.player && index !== run.exit)
      .slice(0, 3)
    assert.equal(targets.length, 3)
    run = { ...run, treasures: targets }
    for (const index of targets) run = actExpedition(run, { type: 'move', index })
    assert.equal(run.titleProgress.chests, 3)
    assert.equal(run.probes, title === 'treasure-vault' ? 2 : 0)
    assert.equal(run.scans, title === 'treasure-legend' ? 1 : 0)
    assert.equal(run.health, title === 'long-road' ? 7 : 6)
    const repeated = actExpedition(run, { type: 'move', index: targets[0]! })
    assert.equal(repeated.probes, run.probes)
    assert.equal(repeated.scans, run.scans)
    assert.equal(repeated.health, run.health)
    const arena = enterBattle(run, 'bastion')
    assert.deepEqual(arena.titleProgress, run.titleProgress)
    const next = actExpedition({ ...run, phase: 'reward', offers: [] }, { type: 'descend' })
    assert.deepEqual(next.titleProgress, { chests: 3, floorChest: false })
  }
})

test('skill titles require completed once-per-floor skills and refunds happen after AP spending', () => {
  const departure = {
    ...CURRENT_DEPARTURE,
    title: 'skill-master' as const,
    profession: 'engineer' as const,
  }
  const run = { ...createExpedition(departure), health: 6, shields: 0 }
  const used = actExpedition(run, { type: 'skill' })
  assert.equal(used.health, 7)
  assert.equal(actExpedition(used, { type: 'skill' }), used)
  const denied = { ...run, scans: 0 }
  assert.equal(actExpedition(denied, { type: 'skill' }), denied)
  const battle = enterBattle(createExpedition({ ...departure, title: 'skill-legend' }), 'bastion')
  const cast = actExpedition(battle, { type: 'skill' })
  assert.ok(cast.skillUsed)
  assert.equal(cast.encounter!.points, battle.encounter!.points)
  assert.equal(actExpedition(cast, { type: 'skill' }), cast)
})

test('authored goal budget supports stepped unlocks without funding the shop after two Expert runs', () => {
  const sum = (kind: 'missions' | 'achievements'): number =>
    MILESTONES.filter((entry) => entry.kind === kind).reduce(
      (total, entry) => total + entry.supplies,
      0,
    )
  assert.equal(sum('missions'), 2290)
  assert.equal(sum('achievements'), 9950)
  assert.ok(MILESTONES.every((entry) => entry.supplies > 0 && entry.supplies <= 800))
  const shop = UPGRADES.reduce((total, item) => total + upgradeCost(item), 0)
  assert.equal(shop, 41400)
  assert.ok(
    sum('missions') + sum('achievements') + 2 * maximumDifficultySupplies(variantTier('expert')) <
      shop / 2,
  )
  assert.ok(132 >= upgradeCost('surveyor') + upgradeCost('engineer'))
  const claimed = titledCamp('veteran')
  assert.equal(claimMilestone(claimed, 'veteran'), claimed)
})

test('accepted chest and skill histories replay their title effects without granting extra resources', () => {
  for (const title of ['treasure-vault', 'treasure-legend', 'long-road', 'skill-master'] as const) {
    const storage = new MemoryStorage()
    new VariantRepository(storage).saveExpedition({
      version: 4,
      camp: { ...titledCamp(title), upgrades: ['engineer'] },
      journal: null,
      records: [],
    })
    let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    session.start('engineer', [], 'expert')
    assert.ok(session.dispatch({ type: 'skill' }))
    for (let step = 0; session.run!.phase === 'exploring' && step < 1000; step++) {
      const run = session.run!
      const reachable = reachableCells(run)
      const chest = run.treasures.find(
        (index) => !run.collected.includes(index) && reachable.has(index),
      )
      const index =
        chest ??
        (reachable.has(run.exit)
          ? run.exit
          : [...frontierCells(run)].find((index) => !run.game.cells[index]!.mine))
      assert.notEqual(index, undefined)
      assert.ok(
        session.dispatch({
          type: run.game.cells[index!]!.visibility === 'revealed' ? 'move' : 'reveal',
          index: index!,
        }),
      )
    }
    assert.equal(session.run!.phase, 'reward')
    assert.ok(session.run!.titleProgress.chests > 0)
    assert.ok(session.dispatch({ type: 'relic', relic: session.run!.offers[0]! }))
    const state = session.run
    const camp = session.camp
    for (let reload = 0; reload < 3; reload++) {
      session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
      assert.deepEqual(session.run, state)
      assert.deepEqual(session.camp, camp)
    }
  }
})
