import test from 'node:test'
import assert from 'node:assert/strict'
import { createExpedition, actExpedition, frontierCells } from '../src/game/expedition.js'
import { bastionTier, enterBastion, isBastionFloor } from '../src/game/bastion-arena.js'
import { tacticalPlan, tacticalCellAction } from '../src/game/tactical-planning.js'
import { neighbors } from '../src/game/engine.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { VARIANT_TIERS } from '../src/game/variant-difficulty.js'
import { professionSkillAvailability } from '../src/game/profession-skills.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { decodeExpeditionSave } from '../src/persistence/variant-decoders.js'
import { campProgressTemplate } from '../src/ui/camp-progress-template.js'
import { MemoryStorage, FakeRuntime } from './helpers.js'
import { deduceBastionMines } from './bastion-helpers.js'
import { defeatEncounter } from './encounter-helpers.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'

/** Enter the first authored encounter while retaining production departure rules. */
function arena(difficulty: VariantDifficulty = 'standard', seed = 42): Expedition {
  return enterBastion({
    ...createExpedition({
      seed,
      difficulty,
      rules: 'relics-v1',
      encounters: 'bastion-v1',
      professions: 'skills-v1',
      rewards: 'difficulty-v1',
      packs: [],
      profession: 'explorer',
      equipment: [],
      archive: false,
    }),
    floor: bastionTier(difficulty).floors[0]!,
  })
}

test('all arena sizes have exact shuffled mines, correct clues, public deductions and connected safe terrain', () => {
  for (const tier of VARIANT_TIERS)
    for (let seed = 0; seed < 32; seed++) {
      const run = arena(tier.id, seed)
      assert.deepEqual(run, arena(tier.id, seed))
      const mines = deduceBastionMines(run)
      assert.equal(run.game.cells.filter((cell) => cell.mine).length, 4)
      const reached = new Set([run.player])
      const queue = [run.player]
      for (const index of queue)
        for (const other of adjacentSteps(run.game, index)) {
          if (!reached.has(other) && !run.walls.includes(other) && !run.game.cells[other]?.mine) {
            reached.add(other)
            queue.push(other)
          }
        }
      for (const [index, cell] of run.game.cells.entries()) {
        assert.equal(cell.mine, mines.has(index))
        if (cell.mine)
          assert.equal(cell.visibility, 'hidden', 'blank expansion never reveals a mine')
        assert.equal(
          cell.adjacent,
          neighbors(run.game.config, index).filter((other) => mines.has(other)).length,
        )
        if (!cell.mine && !run.walls.includes(index)) assert.ok(reached.has(index))
        if (cell.visibility === 'revealed' && cell.adjacent === 0 && !run.walls.includes(index))
          for (const other of neighbors(run.game.config, index))
            if (!run.walls.includes(other))
              assert.equal(run.game.cells[other]?.visibility, 'revealed')
      }
    }
})

test('a free explorer can defeat every tier from public clues with no tools, skills or relics', () => {
  for (const tier of VARIANT_TIERS)
    for (let seed = 0; seed < 8; seed++) {
      const run = arena(tier.id, seed)
      const actions = defeatEncounter({ ...run, probes: 0, scans: 0, shields: 0, health: 1 })
      const result = actions.reduce(actExpedition, {
        ...run,
        probes: 0,
        scans: 0,
        shields: 0,
        health: 1,
      })
      assert.equal(result.health, result.maxHealth)
      assert.equal(result.shields, 1)
      assert.equal(result.loot, run.loot + 12)
      assert.equal(result.encounter?.health, 0)
      assert.equal(result.skillUsed, false)
    }
})

test('movement previews charge distance, cannot overdraw AP, and never auto-resolve intent', () => {
  const run = arena()
  const nearby = adjacentSteps(run.game, run.player).find((index) => !run.walls.includes(index))!
  const moved = actExpedition(run, { type: 'move', index: nearby })
  assert.equal(moved.encounter?.points, 2)
  assert.deepEqual(moved.encounter?.intent, run.encounter?.intent)
  assert.equal(moved.encounter?.turn, 1)
  const far = run.game.cells.findIndex(
    (cell, index) =>
      cell.visibility === 'revealed' &&
      tacticalPlan(run, { type: 'move', index }).reason === 'points',
  )
  assert.ok(far >= 0)
  assert.equal(actExpedition(run, { type: 'move', index: far }), run)
  assert.equal(actExpedition(run, { type: 'move', index: run.player }), run)
  assert.equal(tacticalCellAction(run, run.encounter!.boss).type, 'attack')
  assert.equal(actExpedition(run, { type: 'attack' }), run)
})

test('end turn applies frozen warnings through shields, brace, health and one-time revival', () => {
  const run = arena()
  const hit = actExpedition({ ...run, shields: 1 }, { type: 'end-turn' })
  assert.equal(hit.shields, 0)
  assert.equal(hit.health, 2)
  assert.equal(hit.encounter?.intent.kind, 'column')
  const braced = actExpedition(run, { type: 'brace' })
  assert.equal(actExpedition(braced, { type: 'brace' }), braced)
  assert.equal(actExpedition(braced, { type: 'end-turn' }).health, 2)
  const lethal = { ...run, health: 1, shields: 0 }
  assert.equal(actExpedition(lethal, { type: 'end-turn' }).phase, 'lost')
  const revived = actExpedition({ ...lethal, relics: ['second-wind'] }, { type: 'end-turn' })
  assert.equal(revived.health, 1)
  assert.deepEqual(revived.runTriggers, ['second-wind'])
  assert.equal(actExpedition(revived, { type: 'end-turn' }).phase, 'lost')
  const ribbon = actExpedition({ ...run, relics: ['rescue-ribbon'] }, { type: 'end-turn' })
  assert.equal(ribbon.shields, 1)
  const moved = actExpedition(run, { type: 'move', index: run.player + run.game.config.width })
  assert.notEqual(moved, run)
  assert.equal(actExpedition(moved, { type: 'end-turn' }).health, 2)
})

test('wrong calibration costs AP and health; correct calibration locks mines without changing clues', () => {
  const base = arena()
  assert.ok(base.encounter?.kind === 'bastion')
  const pylon = base.encounter!.pylons[0]!
  const player = pylon.index - base.game.config.width
  let run: Expedition = {
    ...base,
    player,
    game: {
      ...base.game,
      cells: base.game.cells.map((cell, index) =>
        index === player ? { ...cell, visibility: 'revealed' as const } : cell,
      ),
    },
  }
  const wrong = neighbors(run.game.config, pylon.index)
    .filter((index) => !run.game.cells[index]?.mine && index !== player)
    .slice(0, 2)
  run = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, index) =>
        wrong.includes(index) ? { ...cell, visibility: 'hidden' } : cell,
      ),
    },
  }
  for (const index of wrong) run = actExpedition(run, { type: 'flag', index })
  const failed = actExpedition(run, { type: 'interact', index: pylon.index })
  assert.ok(failed.encounter?.kind === 'bastion')
  assert.equal(failed.health, 1)
  assert.equal(failed.encounter?.points, 2)
  assert.ok(failed.encounter?.pylons[0]?.active)
  assert.deepEqual(failed.confirmedMines, [])
  for (const index of wrong) run = actExpedition(run, { type: 'flag', index })
  const mines = neighbors(run.game.config, pylon.index).filter(
    (index) => run.game.cells[index]?.mine,
  )
  for (const index of mines) run = actExpedition(run, { type: 'flag', index })
  const calibrated = actExpedition(run, { type: 'interact', index: pylon.index })
  assert.ok(calibrated.encounter?.kind === 'bastion')
  assert.equal(calibrated.encounter?.pylons[0]?.active, false)
  assert.deepEqual(
    calibrated.game.cells.map((cell) => [cell.mine, cell.adjacent]),
    run.game.cells.map((cell) => [cell.mine, cell.adjacent]),
  )
  for (const index of mines)
    assert.equal(actExpedition(calibrated, { type: 'flag', index }), calibrated)
})

test('arena entry preserves floor skill and relic claims and uses active pylons for excavation', () => {
  const base = arena()
  const run = enterBastion({
    ...base,
    skillUsed: true,
    floorTriggers: ['field-notes'],
    runTriggers: ['second-wind'],
  })
  assert.equal(professionSkillAvailability(run), 'used')
  assert.deepEqual(run.floorTriggers, ['field-notes'])
  assert.deepEqual(run.runTriggers, ['second-wind'])
  const archaeologist = {
    ...base,
    departure: { ...base.departure, profession: 'archaeologist' as const },
  }
  const excavated = actExpedition(archaeologist, { type: 'skill' })
  assert.equal(excavated.encounter?.points, 2)
  assert.ok(excavated.confirmedMines.length >= 2)
  assert.equal(excavated.loot, base.loot)
  assert.equal(excavated.game.phase, 'playing')
})

test('new sessions replay arena coordinates, combat and settlement; old journals never gain bosses', () => {
  for (const difficulty of ['relaxed', 'abyss'] as const) {
    const storage = new MemoryStorage()
    let repository = new VariantRepository(storage)
    let session = new ExpeditionSession(repository, new FakeRuntime())
    assert.ok(session.start('explorer', [], difficulty))
    for (let count = 0; count < 3000 && session.run?.phase !== 'boss'; count++) {
      const run = session.run!
      const action: ExpeditionAction =
        run.phase === 'reward'
          ? run.offers[0]
            ? { type: 'relic', relic: run.offers[0] }
            : { type: 'descend' }
          : run.game.cells[run.exit]?.visibility === 'revealed'
            ? { type: 'move', index: run.exit }
            : {
                type: 'reveal',
                index: [...frontierCells(run)].find((index) => !run.game.cells[index]?.mine)!,
              }
      assert.ok(session.dispatch(action))
    }
    assert.equal(session.run?.phase, 'boss')
    const before = session.run!
    for (const action of defeatEncounter(before)) {
      assert.ok(session.dispatch(action))
      if (session.run?.phase !== 'boss') continue
      const expected: Expedition = session.run
      repository = new VariantRepository(storage)
      session = new ExpeditionSession(repository, new FakeRuntime())
      assert.deepEqual(session.run, expected)
      assert.equal(repository.recovered, false)
    }
    if (session.run?.phase === 'reward') assert.ok(session.dispatch({ type: 'retreat' }))
    const supplies = session.camp.supplies
    assert.ok(supplies > 0)
    session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
    assert.equal(session.run, null)
    assert.equal(session.camp.supplies, supplies)
    const { encounters, ...old } = before.departure
    assert.equal(encounters, 'tactics-v2')
    assert.equal(isBastionFloor({ ...before, departure: old }), false)
    const invalid = {
      version: 3,
      camp: session.camp,
      records: [],
      journal: { departure: { ...old, encounters: 'future' }, actions: [] },
    }
    assert.equal(decodeExpeditionSave(JSON.stringify(invalid)), null)
  }
})

test('camp progress keeps prices and savings without theoretical play-count copy', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    const html = campProgressTemplate(language, { supplies: 0, upgrades: [], completed: 0 })
    assert.ok(html.includes('<progress'))
    assert.doesNotMatch(html, /theoretical|至少还需|理論上限/)
  }
})

test('combat preserves discovery thresholds and rejects empty or over-budget tool actions', () => {
  const base = arena()
  const run: Expedition = {
    ...base,
    probes: 1,
    relics: ['field-notes'],
    encounter: { ...base.encounter!, priorDiscoveries: 2 },
  }
  const mine = [...deduceBastionMines(run)][0]!
  const probed = actExpedition(run, { type: 'probe', index: mine })
  assert.equal(probed.probes, 1, 'the third floor discovery refunds a probe across room entry')
  assert.deepEqual(probed.floorTriggers, ['field-notes'])
  assert.equal(probed.encounter?.points, 2)
  assert.equal(actExpedition(probed, { type: 'probe', index: mine }), probed)
  const empty: Expedition = { ...base, encounter: { ...base.encounter!, points: 0 } }
  assert.equal(actExpedition(empty, { type: 'probe', index: mine }), empty)
  assert.equal(actExpedition(empty, { type: 'skill' }), empty)
  const flagged = actExpedition(empty, { type: 'flag', index: mine })
  assert.notEqual(flagged, empty)
  assert.equal(flagged.encounter?.points, 0)
  assert.equal(flagged.encounter?.turn, 1)
})
