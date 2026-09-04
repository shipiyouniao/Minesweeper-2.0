import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  actExpedition,
  allowedDeparture,
  buyUpgrade,
  createExpedition,
  EMPTY_CAMP,
  frontierCells,
} from '../src/game/expedition.js'
import { UPGRADES, upgradeCost } from '../src/game/camp-progression.js'
import { PROFESSIONS } from '../src/game/professions.js'
import { professionSkillArea, professionSkillAvailability } from '../src/game/profession-skills.js'
import { inspectArea } from '../src/game/dungeon-discovery.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeExpeditionSave } from '../src/persistence/variant-decoders.js'
import { professionSkillCopy, professionSkillStatus } from '../src/ui/profession-skill-copy.js'
import { professionSprite, professionSkillSprite } from '../src/ui/profession-presentation.js'
import { parseVariantCommand } from '../src/ui/variant-input.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'
import type { Departure, Expedition, Profession } from '../src/types/variants.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'

/** Use real shuffled layouts and current revision markers throughout the skill fixtures. */
function start(
  profession: Profession,
  difficulty: VariantDifficulty = 'standard',
  seed = 42,
): Expedition {
  return createExpedition({
    rules: 'relics-v1',
    professions: 'skills-v1',
    rewards: 'difficulty-v1',
    packs: [],
    difficulty,
    seed,
    profession,
    equipment: [],
    archive: false,
  })
}

/** Expand the actual frontier until the pawn has useful information in its skill footprint. */
function approachSkill(initial: Expedition): Expedition {
  let run = initial
  for (let step = 0; step < run.game.cells.length; step++) {
    if (professionSkillAvailability(run) === 'ready') return run
    const index = [...frontierCells(run)].find(
      (cell) => cell !== run.exit && !run.game.cells[cell]?.mine,
    )
    assert.notEqual(index, undefined)
    run = actExpedition(run, { type: 'reveal', index: index! })
  }
  throw new Error('Fixture did not expose a useful skill position')
}

/** Reach stairs via legal safe inputs to exercise real reward and floor-reset transitions. */
function clearFloor(initial: Expedition): Expedition {
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

test('three new careers are affordable sidegrades and purchases remain permanent and unique', () => {
  assert.equal(PROFESSIONS.length, 6)
  assert.equal(UPGRADES.length, 11)
  let camp = { ...EMPTY_CAMP, supplies: 3150 }
  for (const profession of ['archaeologist', 'alchemist', 'sentinel'] as const) {
    assert.equal(allowedDeparture(camp, profession, []), false)
    camp = buyUpgrade(camp, profession)
    assert.equal(allowedDeparture(camp, profession, []), true)
    assert.equal(buyUpgrade(camp, profession), camp)
  }
  assert.equal(camp.supplies, 0)
  assert.deepEqual(
    ['archaeologist', 'alchemist', 'sentinel'].map(
      (id) => parseVariantCommand(`profession:${id}`)?.type,
    ),
    ['profession', 'profession', 'profession'],
  )
  assert.deepEqual(
    [upgradeCost('archaeologist'), upgradeCost('alchemist'), upgradeCost('sentinel')],
    [450, 900, 1800],
  )
  assert.deepEqual(
    [450, 900, 1800].map((cost) => Math.ceil(cost / 375)),
    [2, 3, 5],
  )
  assert.equal(Math.max(...UPGRADES.map(upgradeCost)), 7500)
})

test('new allocations trade tools for protection without wasting a guard at the shield cap', () => {
  for (const entry of PROFESSIONS) {
    const run = start(entry)
    assert.ok(run.probes <= 2 && run.scans <= 2 && run.shields <= 2)
    assert.equal(run.health, 2)
  }
  const camp = { ...EMPTY_CAMP, upgrades: UPGRADES }
  assert.deepEqual(
    PROFESSIONS.map((profession) => {
      const run = start(profession)
      return [run.probes, run.scans, run.shields]
    }),
    [
      [2, 1, 0],
      [1, 2, 0],
      [1, 1, 1],
      [1, 0, 0],
      [0, 0, 2],
      [1, 0, 1],
    ],
  )
  assert.equal(allowedDeparture(camp, 'alchemist', ['guard']), false)
  assert.equal(allowedDeparture(camp, 'alchemist', ['probe', 'scanner']), true)
  assert.equal(allowedDeparture(camp, 'engineer', ['guard']), true)
  assert.equal(allowedDeparture(camp, 'explorer', ['probe', 'scanner', 'guard']), false)
})

test('all six skills work on every tier and repeated activation never spends another resource', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    for (const entry of PROFESSIONS) {
      const before = approachSkill(start(entry, difficulty))
      const after = actExpedition(before, { type: 'skill' })
      assert.notEqual(after, before, `${difficulty}/${entry}`)
      assert.equal(after.skillUsed, true)
      assert.equal(after.steps, before.steps + 1)
      assert.equal(after.player, before.player)
      assert.equal(after.loot, before.loot)
      assert.deepEqual(after.collected, before.collected)
      assert.deepEqual(
        after.game.cells.map((cell) => [cell.mine, cell.adjacent]),
        before.game.cells.map((cell) => [cell.mine, cell.adjacent]),
      )
      assert.equal(actExpedition(after, { type: 'skill' }), after)
    }
  }
})

test('scouting confirms hazards, clears false flags and keeps safe clues covered', () => {
  for (const profession of ['explorer', 'surveyor', 'sentinel'] as const) {
    const initial = approachSkill(start(profession))
    const area = professionSkillArea(initial)
    const safe = area.find(
      (index) =>
        !initial.walls.includes(index) &&
        !initial.game.cells[index]?.mine &&
        initial.game.cells[index]?.visibility === 'hidden',
    )
    const before =
      safe === undefined ? initial : actExpedition(initial, { type: 'flag', index: safe })
    const after = actExpedition(before, { type: 'skill' })
    for (const index of area) {
      if (before.walls.includes(index)) continue
      if (before.game.cells[index]?.mine) {
        assert.ok(after.confirmedMines.includes(index))
        assert.equal(actExpedition(after, { type: 'flag', index }), after)
        assert.equal(actExpedition(after, { type: 'move', index }), after)
      } else if (before.game.cells[index]?.visibility !== 'revealed') {
        assert.ok(after.surveyedCells.includes(index))
        assert.equal(after.game.cells[index]?.visibility, 'hidden')
      }
    }
  }
})

test('column and square footprints clip at edges and follow the pawn rather than an input cursor', () => {
  const run = start('sentinel')
  for (const player of [0, 10, 110, 120, 60]) {
    const moved = { ...run, player }
    const area = professionSkillArea(moved)
    assert.equal(area.length, player === 60 ? 25 : 9)
    assert.ok(area.every((index) => Math.abs((index % 11) - (player % 11)) <= 2))
    assert.ok(
      area.every((index) => Math.abs(Math.floor(index / 11) - Math.floor(player / 11)) <= 2),
    )
    const column = professionSkillArea({
      ...moved,
      departure: { ...moved.departure, profession: 'surveyor' },
    })
    assert.equal(column.length, 11)
    assert.ok(column.every((index) => index % 11 === player % 11))
  }
})

test('repair and transmutation reject empty inputs and capped outputs without spending the skill', () => {
  const engineer = start('engineer')
  const repaired = actExpedition(engineer, { type: 'skill' })
  assert.deepEqual([repaired.probes, repaired.scans, repaired.shields], [1, 0, 2])
  const alchemist = start('alchemist')
  const converted = actExpedition(alchemist, { type: 'skill' })
  assert.deepEqual([converted.probes, converted.scans, converted.shields], [1, 1, 1])
  for (const run of [
    { ...engineer, scans: 0 },
    { ...engineer, shields: 2 },
    { ...alchemist, shields: 0 },
    { ...alchemist, probes: 4 },
    { ...alchemist, scans: 4 },
    { ...start('sentinel'), shields: 0 },
  ]) {
    assert.equal(professionSkillAvailability(run), 'resources')
    assert.equal(actExpedition(run, { type: 'skill' }), run)
    assert.equal(run.skillUsed, false)
  }
})

test('redundant reconnaissance consumes neither its once-per-floor charge nor a shield', () => {
  for (const profession of ['explorer', 'surveyor', 'sentinel'] as const) {
    const initial = approachSkill(start(profession))
    const surveyed = inspectArea(initial, professionSkillArea(initial))
    assert.equal(professionSkillAvailability(surveyed), 'no-information')
    assert.equal(actExpedition(surveyed, { type: 'skill' }), surveyed)
  }
})

test('excavation scouts a chest without granting loot and provides four distinct reward options', () => {
  const before = start('archaeologist')
  const area = professionSkillArea(before)
  const after = actExpedition(before, { type: 'skill' })
  assert.equal(after.player, before.player)
  assert.equal(after.loot, 0)
  assert.deepEqual(after.collected, [])
  for (const index of area) {
    if (before.walls.includes(index)) continue
    assert.equal(
      after.game.cells[index]?.visibility,
      before.game.cells[index]?.mine ? 'flagged' : 'revealed',
    )
  }
  const reward = clearFloor(after)
  assert.equal(reward.offers.length, 4)
  assert.equal(new Set(reward.offers).size, 4)
  assert.equal(actExpedition(reward, { type: 'skill' }), reward)
  const next = actExpedition(reward, { type: 'relic', relic: reward.offers[0]! })
  assert.equal(next.floor, 2)
  assert.equal(next.skillUsed, false)
  assert.equal(clearFloor(next).offers.length, 3)
})

test('excavation targets the nearest remaining chest deterministically and disables after collection', () => {
  const before = start('archaeologist')
  const width = before.game.config.width
  const distance = (index: number): number =>
    Math.abs((index % width) - (before.player % width)) +
    Math.abs(Math.floor(index / width) - Math.floor(before.player / width))
  const sorted = [...before.treasures].sort((a, b) => distance(a) - distance(b) || a - b)
  assert.ok(professionSkillArea(before).includes(sorted[0]!))
  const remaining = { ...before, collected: [sorted[0]!] }
  assert.ok(professionSkillArea(remaining).includes(sorted[1]!))
  const exhausted = { ...before, collected: before.treasures }
  assert.equal(actExpedition(exhausted, { type: 'skill' }), exhausted)
})

test('availability contains no hidden mine-value oracle and skills cannot run in terminal phases', () => {
  for (const entry of PROFESSIONS) {
    const run = approachSkill(start(entry))
    const inverted = {
      ...run,
      game: { ...run.game, cells: run.game.cells.map((cell) => ({ ...cell, mine: !cell.mine })) },
    }
    assert.equal(professionSkillAvailability(inverted), professionSkillAvailability(run))
    for (const phase of ['won', 'lost', 'retreated', 'reward'] as const) {
      const inactive = { ...run, phase }
      assert.equal(actExpedition(inactive, { type: 'skill' }), inactive)
    }
  }
})

test('skill discovery can trigger Field notes once without pretending to be a paid probe', () => {
  const initial = start('surveyor')
  const column = initial.game.cells.findIndex(
    (_, index) =>
      initial.game.cells.filter((cell, other) => other % 11 === index % 11 && cell.mine).length >=
      3,
  )
  assert.ok(column >= 0)
  const run: Expedition = {
    ...initial,
    player: column,
    relics: ['field-notes', 'rangefinder'],
    probes: 0,
    scans: 0,
  }
  const result = actExpedition(run, { type: 'skill' })
  assert.equal(result.probes, 1)
  assert.equal(result.scans, 0)
  assert.deepEqual(result.floorTriggers, ['field-notes'])
})

test('new career journals restore skill expenditure and settlement remains atomic', () => {
  for (const entry of PROFESSIONS) {
    const storage = new MemoryStorage()
    storage.setItem(
      'minesweeper.variants.v1.expedition',
      JSON.stringify({
        version: 3,
        camp: { supplies: 27, upgrades: UPGRADES, completed: 2 },
        journal: null,
        records: [],
      }),
    )
    let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.equal(session.start(entry, []), true)
    assert.equal(session.run?.departure.professions, 'skills-v1')
    for (let step = 0; step < 300; step++) {
      const run: Expedition | null = session.run
      assert.ok(run)
      if (professionSkillAvailability(run) === 'ready') break
      const index: number | undefined = [...frontierCells(run)].find(
        (cell) => cell !== run.exit && !run.game.cells[cell]?.mine,
      )
      assert.notEqual(index, undefined)
      assert.equal(session.dispatch({ type: 'reveal', index: index! }), true)
    }
    assert.equal(session.dispatch({ type: 'skill' }), true)
    const expected = session.run
    session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.deepEqual(session.run, expected)
    assert.equal(session.dispatch({ type: 'skill' }), false)
    session.dispatch({ type: 'retreat' })
    const bank = session.camp.supplies
    session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.equal(session.run, null)
    assert.equal(session.camp.supplies, bank)
  }
})

test('historical journals retain three-role offers and reject new skill actions during replay', () => {
  const current = start('explorer').departure
  const old: Departure = {
    rules: 'relics-v1',
    rewards: 'difficulty-v1',
    packs: [],
    difficulty: 'standard',
    seed: 42,
    profession: 'explorer',
    equipment: [],
    archive: false,
  }
  const run = createExpedition(old)
  assert.equal(professionSkillAvailability(run), 'legacy')
  assert.equal(actExpedition(run, { type: 'skill' }), run)
  assert.equal(clearFloor(run).offers.length, 3)
  const save = {
    version: 3,
    camp: { ...EMPTY_CAMP, upgrades: UPGRADES },
    journal: { departure: old, actions: [] },
    records: [],
  }
  assert.ok(decodeExpeditionSave(JSON.stringify(save)))
  for (const departure of [
    { ...old, professions: 'future' },
    { ...old, profession: 'archaeologist' },
    { ...current, rules: 'health-v1', packs: undefined },
  ]) {
    assert.equal(
      decodeExpeditionSave(JSON.stringify({ ...save, journal: { departure, actions: [] } })),
      null,
    )
  }
  const storage = new MemoryStorage()
  storage.setItem(
    'minesweeper.variants.v1.expedition',
    JSON.stringify({ ...save, journal: { departure: old, actions: [{ type: 'skill' }] } }),
  )
  const repository = new VariantRepository(storage)
  assert.equal(new ExpeditionSession(repository, new FakeRuntime()).run, null)
  assert.equal(repository.recovered, true)
})

test('new career ownership is checked during replay and repeated saved skills invalidate the journal', () => {
  for (const authorized of [true, false]) {
    const storage = new MemoryStorage()
    storage.setItem(
      'minesweeper.variants.v1.expedition',
      JSON.stringify({
        version: 3,
        camp: { supplies: 99, upgrades: authorized ? ['alchemist'] : [], completed: 0 },
        journal: {
          departure: start('alchemist').departure,
          actions: authorized ? [{ type: 'skill' }, { type: 'skill' }] : [],
        },
        records: [],
      }),
    )
    const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.equal(session.run, null)
    assert.equal(session.camp.supplies, 99)
  }
})

test('all careers have distinct pawn and skill artwork, translated copy and finite commands', () => {
  assert.equal(new Set(PROFESSIONS.map((entry) => professionSprite(entry))).size, 6)
  assert.equal(new Set(PROFESSIONS.map((entry) => professionSkillSprite(entry))).size, 6)
  assert.deepEqual(parseVariantCommand('skill'), { type: 'skill' })
  assert.equal(parseVariantCommand('skill:arbitrary'), null)
  for (const language of ['en', 'zh', 'ja'] as const) {
    for (const entry of PROFESSIONS) {
      const copy = professionSkillCopy(language, entry)
      assert.ok(copy.name.length > 0 && copy.note.length > 10)
    }
    for (const status of [
      'ready',
      'used',
      'legacy',
      'inactive',
      'no-information',
      'resources',
    ] as const) {
      assert.ok(professionSkillStatus(language, status).length > 0)
    }
  }
})
