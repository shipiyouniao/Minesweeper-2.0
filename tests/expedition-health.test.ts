import { test } from 'node:test'
import assert from 'node:assert/strict'
import { damageVitality, healVitality } from '../src/game/vitality.js'
import { actExpedition, createExpedition, frontierCells } from '../src/game/expedition.js'
import {
  expeditionConfig,
  expeditionFloors,
  VARIANT_TIERS,
} from '../src/game/variant-difficulty.js'
import { approachPath, walkingPath } from '../src/game/dungeon-path.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeExpeditionSave, decodeTwinSave } from '../src/persistence/variant-decoders.js'
import { cueForVitality, notesForCue } from '../src/audio/cues.js'
import { vitalityTemplate } from '../src/ui/vitality-template.js'
import type { Departure, Expedition, ExpeditionAction } from '../src/types/variants.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

const departure: Departure = {
  rules: 'health-v1',
  difficulty: 'standard',
  seed: 31,
  profession: 'explorer',
  equipment: [],
  archive: false,
}
const saveKey = 'minesweeper.variants.v1.expedition'

/** Reveal a reachable mine if present, otherwise extend the safe frontier without exiting. */
function hazardAction(run: Expedition): ExpeditionAction {
  const frontier = [...frontierCells(run)].filter((index) => index !== run.exit)
  const index = frontier.find((candidate) => run.game.cells[candidate]?.mine) ?? frontier[0]
  assert.notEqual(index, undefined, 'a hazard must be reachable in this fixture')

  return { type: 'reveal', index: index ?? -1 }
}

/** Exercise an actual hazard through legal exploration rather than mutating the layout. */
function hitMine(initial: Expedition): Expedition {
  let run = initial
  for (let step = 0; step < run.game.cells.length; step++) {
    const next = actExpedition(run, hazardAction(run))
    if (next.health !== run.health || next.shields !== run.shields) return next
    assert.equal(next.phase, 'exploring')
    run = next
  }

  throw new Error('No hazard reached')
}

/** Reach the stairs by a legal safe route and commit the one-time floor reward. */
function clearFloor(initial: Expedition): Expedition {
  let run = initial
  for (let step = 0; step < run.game.cells.length && run.phase === 'exploring'; step++) {
    if (walkingPath(run, run.exit)) return actExpedition(run, { type: 'move', index: run.exit })
    const index = [...frontierCells(run)].find((candidate) => !run.game.cells[candidate]?.mine)
    assert.notEqual(index, undefined)
    run = actExpedition(run, { type: 'reveal', index: index ?? -1 })
  }

  assert.notEqual(run.phase, 'exploring')
  return run
}

test('damage spends shields first, spills into HP, and cannot underflow or resurrect', () => {
  const initial = { health: 2, maxHealth: 2, shields: 2 }
  assert.deepEqual(damageVitality(initial, 1), { health: 2, maxHealth: 2, shields: 1 })
  assert.deepEqual(damageVitality(initial, 3), { health: 1, maxHealth: 2, shields: 0 })
  const dead = damageVitality(initial, 100)
  assert.deepEqual(dead, { health: 0, maxHealth: 2, shields: 0 })
  assert.equal(damageVitality(dead, 1), dead)
  assert.equal(healVitality(dead, 100), dead)
  for (const invalid of [0, -1, 0.5, NaN, Infinity, Number.MAX_VALUE]) {
    assert.equal(damageVitality(initial, invalid), initial)
    assert.equal(healVitality({ ...initial, health: 1 }, invalid).health, 1)
  }
  assert.deepEqual(initial, { health: 2, maxHealth: 2, shields: 2 })
})

test('healing caps at the current maximum and preserves shields', () => {
  const wounded = { health: 1, maxHealth: 3, shields: 1 }
  assert.deepEqual(healVitality(wounded, 1), { health: 2, maxHealth: 3, shields: 1 })
  const healed = healVitality(wounded, 100)
  assert.deepEqual(healed, { health: 3, maxHealth: 3, shields: 1 })
  assert.equal(healVitality(healed, 1), healed)
})

test('all five health departures preserve difficulty geometry and floor counts', () => {
  for (const tier of VARIANT_TIERS) {
    const current: Departure = { ...departure, difficulty: tier.id }
    const previous: Departure = { ...current, rules: 'difficulty-v1' }
    assert.equal(expeditionFloors(current), tier.floors)
    for (let floor = 1; floor <= tier.floors; floor++)
      assert.deepEqual(expeditionConfig(current, floor), expeditionConfig(previous, floor))
    assert.deepEqual(createExpedition(current).game, createExpedition(previous).game)
    assert.equal(createExpedition(current).health, 2)
  }
})

test('surviving mines spend shields then HP and keep truthful locked flags and a safe player', () => {
  let run = createExpedition({ ...departure, profession: 'engineer' })
  const terrain = run.game.cells.map((cell) => [cell.mine, cell.adjacent])
  run = hitMine(run)
  assert.equal(run.health, 2)
  assert.equal(run.shields, 0)
  run = hitMine(run)
  assert.equal(run.health, 1)
  assert.equal(run.phase, 'exploring')
  assert.equal(run.confirmedMines.length, 2)
  assert.equal(run.game.cells[run.player]?.mine, false)
  assert.equal(run.game.cells[run.player]?.visibility, 'revealed')
  assert.deepEqual(
    run.game.cells.map((cell) => [cell.mine, cell.adjacent]),
    terrain,
  )

  for (const index of run.confirmedMines) {
    assert.equal(run.game.cells[index]?.visibility, 'flagged')
    assert.equal(approachPath(run, index), null)
    for (const type of ['flag', 'reveal', 'move'] as const)
      assert.equal(actExpedition(run, { type, index }), run)
  }
  const dead = hitMine(run)
  assert.equal(dead.health, 0)
  assert.equal(dead.phase, 'lost')
  assert.equal(dead.game.phase, 'lost')
  assert.equal(actExpedition(dead, { type: 'retreat' }), dead)
})

test('each exit heals once, then health carries through relic and empty-catalog descent', () => {
  let run = hitMine(createExpedition(departure))
  assert.equal(run.health, 1)
  const reward = clearFloor(run)
  assert.equal(reward.health, 2)
  assert.equal(reward.phase, 'reward')
  assert.equal(actExpedition(reward, { type: 'move', index: reward.exit }), reward)
  const relic = reward.offers[0]
  assert.ok(relic)
  run = actExpedition(reward, { type: 'relic', relic })
  assert.equal(run.health, 2)
  assert.equal(run.maxHealth, 2)

  // Reward fixtures also guard against an accidental full heal during floor construction.
  const woundedReward: Expedition = { ...reward, health: 1, offers: [] }
  const descended = actExpedition(woundedReward, { type: 'descend' })
  assert.equal(descended.health, 1)
  assert.equal(descended.floor, 2)
  assert.equal(
    actExpedition({ ...woundedReward, offers: [relic] }, { type: 'relic', relic }).health,
    1,
  )
  assert.equal(actExpedition(woundedReward, { type: 'retreat' }).health, 1)
  assert.equal(clearFloor(createExpedition(departure)).health, 2)
  const final = clearFloor({ ...hitMine(createExpedition(departure)), floor: 5 })
  assert.equal(final.phase, 'won')
  assert.equal(final.health, 2)
})

test('all historical rules keep one-hit death, shield behavior, and no exit healing', () => {
  for (const rules of [undefined, 'original', 'scouting', 'difficulty-v1'] as const) {
    const old: Departure = {
      seed: departure.seed,
      profession: 'explorer',
      equipment: [],
      archive: false,
      ...(rules ? { rules } : {}),
      ...(rules === 'difficulty-v1' ? { difficulty: 'standard' as const } : {}),
    }
    const run = createExpedition(old)
    assert.equal(run.health, 1)
    assert.equal(run.maxHealth, 1)
    assert.equal(hitMine(run).phase, 'lost')
    const shielded = hitMine(createExpedition({ ...old, profession: 'engineer' }))
    assert.equal(shielded.health, 1)
    assert.equal(shielded.shields, 0)
    assert.equal(shielded.phase, 'exploring')
    assert.equal(clearFloor({ ...run, maxHealth: 2 }).health, 1)
  }
})

test('journal replay restores damage and locks, then settles death exactly once', () => {
  const storage = new MemoryStorage()
  const runtime = new FakeRuntime()
  let session = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.ok(session.start('explorer', []))
  assert.equal(session.run?.departure.rules, 'relics-v1')
  for (let step = 0; step < 121 && session.run?.health === 10; step++)
    assert.ok(session.dispatch(hazardAction(session.run)))
  assert.equal(session.run?.health, 5)
  const expected = session.run
  session = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.deepEqual(session.run, expected)
  for (let step = 0; step < 121 && session.run?.phase === 'exploring'; step++)
    assert.ok(session.dispatch(hazardAction(session.run)))
  assert.equal(session.run?.health, 0)
  assert.equal(session.records.length, 1)
  const supplies = session.camp.supplies
  assert.equal(session.dispatch({ type: 'retreat' }), false)
  session = new ExpeditionSession(new VariantRepository(storage), runtime)
  assert.equal(session.run, null)
  assert.equal(session.records.length, 1)
  assert.equal(session.records[0]?.outcome, 'lost')
  assert.equal(session.camp.supplies, supplies)
})

test('health journals require a tier and reconstruct resources instead of trusting snapshots', () => {
  const storage = new MemoryStorage()
  const save = {
    version: 3,
    camp: { supplies: 9, upgrades: [], completed: 0 },
    records: [],
    journal: { departure, actions: [], health: 999, shields: 999 },
  }
  storage.setItem(saveKey, JSON.stringify(save))
  const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.equal(session.run?.health, 2)
  assert.equal(session.run?.shields, 0)
  for (const difficulty of [undefined, 'custom', 9])
    assert.equal(
      decodeExpeditionSave(
        JSON.stringify({
          ...save,
          journal: {
            departure: { ...departure, difficulty },
            actions: [],
          },
        }),
      ),
      null,
    )
  assert.equal(
    decodeTwinSave(
      JSON.stringify({
        version: 1,
        seed: 31,
        rules: 'health-v1',
        difficulty: 'standard',
        actions: [],
        records: [],
        settled: false,
      }),
    ),
    null,
  )
})

test('exit recovery replays once and carries into the next floor after refresh', () => {
  const storage = new MemoryStorage()
  let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  session.start('explorer', [])
  for (let step = 0; step < 121 && session.run?.health === 10; step++)
    session.dispatch(hazardAction(session.run))
  assert.equal(session.run?.health, 5)

  for (let step = 0; step < 121; step++) {
    const run = session.run
    assert.ok(run)
    if (run.phase !== 'exploring') break
    const index = [...frontierCells(run)].find((candidate) => !run.game.cells[candidate]?.mine)
    assert.ok(
      session.dispatch(
        walkingPath(run, run.exit)
          ? { type: 'move', index: run.exit }
          : { type: 'reveal', index: index ?? -1 },
      ),
    )
  }
  assert.equal(session.run?.phase, 'reward')
  assert.equal(session.run?.health, 10)
  const reward = session.run
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.run, reward)
  assert.equal(session.dispatch({ type: 'move', index: reward.exit }), false)
  const relic = reward.offers[0]
  assert.ok(relic)
  assert.ok(session.dispatch({ type: 'relic', relic }))
  const next = session.run
  session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.deepEqual(session.run, next)
  assert.equal(session.run?.floor, 2)
  assert.equal(session.run?.health, 10)
})

test('historical shield-hit journals resume without converting to the health rules', () => {
  for (const rules of ['original', 'scouting', 'difficulty-v1'] as const) {
    const storage = new MemoryStorage()
    storage.setItem(
      saveKey,
      JSON.stringify({
        version: 3,
        camp: { supplies: 9, upgrades: ['engineer'], completed: 0 },
        records: [],
        journal: {
          departure: {
            rules,
            seed: 31,
            profession: 'engineer',
            equipment: [],
            archive: false,
            ...(rules === 'difficulty-v1' ? { difficulty: 'standard' } : {}),
          },
          actions: [],
        },
      }),
    )
    let session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    for (let step = 0; step < 121 && session.run?.shields === 1; step++)
      assert.ok(session.dispatch(hazardAction(session.run)))
    assert.equal(session.run?.health, 1)
    assert.equal(session.run?.shields, 0)
    const expected = session.run
    session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.deepEqual(session.run, expected)
    assert.equal(session.run?.departure.rules, rules)
    for (let step = 0; step < 121 && session.run?.phase === 'exploring'; step++)
      session.dispatch(hazardAction(session.run))
    assert.equal(session.run?.health, 0)
    assert.equal(session.records[0]?.outcome, 'lost')
  }
})

test('resource cues describe only visible changes and use distinct bounded sound plans', () => {
  const before = { health: 2, maxHealth: 2, shields: 1 }
  assert.equal(cueForVitality(before, before), null)
  assert.equal(cueForVitality(before, damageVitality(before, 1)), 'shield')
  const wounded = damageVitality(before, 2)
  assert.equal(cueForVitality(before, wounded), 'damage')
  assert.equal(cueForVitality(wounded, healVitality(wounded, 1)), 'heal')
  assert.equal(cueForVitality(wounded, damageVitality(wounded, 1)), 'loss')
  assert.notDeepEqual(notesForCue('damage'), notesForCue('shield'))
  assert.notDeepEqual(notesForCue('heal'), notesForCue('shield'))
})

test('health markup exposes HP and shields together and distinguishes historical rules in every locale', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    const markup = vitalityTemplate(language, { health: 2, maxHealth: 2, shields: 1 }, false)
    assert.ok(markup.includes('2/2<span class="vitality-shields"> (+1)</span>'))
    assert.ok(markup.includes('max="2" value="2"'))
    assert.notEqual(
      markup,
      vitalityTemplate(language, { health: 2, maxHealth: 2, shields: 1 }, true),
    )
    const dead = vitalityTemplate(language, { health: 0, maxHealth: 2, shields: 0 }, false)
    assert.ok(dead.includes('max="2" value="0"'))
    assert.ok(!dead.includes('(+0)'))
  }
})
