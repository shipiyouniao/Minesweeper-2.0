import test from 'node:test'
import assert from 'node:assert/strict'
import { CURRENT_DEPARTURE } from './helpers.js'
import { createExpedition, actExpedition } from '../src/game/expedition.js'
import { enterMirror, forecastMirror } from '../src/game/mirror-battle.js'
import { generateMirror, solveMirror } from '../src/game/mirror-generation.js'
import { roomDiscoveries, roomTravel } from '../src/game/mirror-state.js'
import { enterEncounter } from '../src/game/encounter-roster.js'
import { encounterTier } from '../src/game/encounter-tiers.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { neighbors } from '../src/game/engine.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { combatStats } from '../src/game/combat-build.js'
import { professionSkillArea, professionSkillAvailability } from '../src/game/profession-skills.js'
import { loadExpeditionSave } from '../src/persistence/variant-decoders.js'
import { EXPEDITION_RULES_REVISION } from '../src/persistence/expedition-format.js'
import { tacticalCopy, tacticalPlanCopy } from '../src/ui/tactical-copy.js'
import { defeatMirror, mirrorKnowledge } from './mirror-helpers.js'
import type { Expedition } from '../src/types/variants.js'
import type { MirrorExpedition } from '../src/types/mirror.js'
import type { VariantDifficulty } from '../src/types/variant-difficulty.js'

const tiers: readonly VariantDifficulty[] = ['relaxed', 'standard', 'advanced', 'expert', 'abyss']

/** Enter an actual authored checkpoint with a base explorer and no tools or shields. */
function arena(difficulty: VariantDifficulty = 'standard', seed = 44): MirrorExpedition {
  const run = enterMirror({
    ...createExpedition({ ...CURRENT_DEPARTURE, difficulty, seed }),
    floor: encounterTier(difficulty).floors[0]!,
    probes: 0,
    scans: 0,
    shields: 0,
  })
  assert.ok(run.encounter?.kind === 'mirror')
  return { ...run, encounter: run.encounter }
}

/** Arrange a calibrated objective for focused rule tests; full-game acceptance uses public play. */
function calibrated(run: MirrorExpedition): MirrorExpedition {
  const index = run.encounter[run.encounter.active].seal.index
  return {
    ...run,
    player: index,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, other) => ({
        ...cell,
        visibility: cell.mine ? 'flagged' : run.walls.includes(other) ? 'hidden' : 'revealed',
      })),
    },
  }
}

/** Arrange both disabled seals and a public adjacent attack position without changing stats. */
function exposed(run: MirrorExpedition): MirrorExpedition {
  const next = calibrated(run)
  const player = adjacentSteps(next.game, next.encounter.boss).find(
    (index) => next.game.cells[index]?.visibility === 'revealed',
  )!
  return {
    ...next,
    player,
    encounter: {
      ...next.encounter,
      dawn: { ...next.encounter.dawn, seal: { ...next.encounter.dawn.seal, active: false } },
      dusk: { ...next.encounter.dusk, seal: { ...next.encounter.dusk.seal, active: false } },
    },
  }
}

test('mirror layouts have exact disjoint mines, full zero expansion and connected deducible floors', () => {
  const entrances = new Set<number>()
  for (const difficulty of tiers) {
    const tier = encounterTier(difficulty)
    const config = {
      ...tier.config,
      mines: Math.round(tier.config.width * tier.config.height * 0.17),
    }
    for (const seed of [...Array.from({ length: 10 }, (_, index) => index), 0x71a51]) {
      const layout = generateMirror(config, seed)
      entrances.add(layout.entrance)
      assert.deepEqual(generateMirror(config, seed), layout)
      const solved = solveMirror(layout)
      assert.ok(
        layout.dawn.game.cells.every(
          (cell, index) => !cell.mine || !layout.dusk.game.cells[index]!.mine,
        ),
      )
      for (const side of ['dawn', 'dusk'] as const) {
        const room = layout[side]
        assert.equal(room.game.cells.filter((cell) => cell.mine).length, config.mines)
        assert.ok(
          room.game.cells.filter((cell) => cell.visibility === 'revealed').length <
            room.game.cells.length / 2,
        )
        assert.ok(
          solved[side].cells.every(
            (cell, index) =>
              cell.mine || room.walls.includes(index) || cell.visibility === 'revealed',
          ),
        )
        for (const [index, cell] of room.game.cells.entries()) {
          if (cell.visibility !== 'revealed' || cell.adjacent !== 0) continue
          assert.ok(
            neighbors(config, index).every(
              (other) =>
                room.walls.includes(other) || room.game.cells[other]!.visibility === 'revealed',
            ),
          )
        }
      }
      assert.ok(layout.dawn.game.cells[layout.dawnSeal]!.adjacent > 0)
      assert.ok(layout.dusk.game.cells[layout.duskSeal]!.adjacent > 0)
      assert.equal(layout.dawn.game.cells[layout.dawnSeal]!.visibility, 'hidden')
      assert.equal(layout.dusk.game.cells[layout.duskSeal]!.visibility, 'hidden')
    }
  }
  assert.ok(entrances.size > 10)
})

test('a base explorer wins mirror checkpoints in all five tiers with public deductions and replayable actions', () => {
  for (const difficulty of tiers) {
    const run = arena(difficulty)
    const actions = defeatMirror(run)
    const won = actions.reduce<Expedition>(actExpedition, run)
    assert.ok(won.phase === 'won' || won.phase === 'reward')
    assert.equal(won.encounter?.health, 0)
    assert.equal(won.health, won.maxHealth)
    for (const type of ['shift', 'reveal', 'flag', 'interact', 'attack', 'end-turn'])
      assert.ok(actions.some((action) => action.type === type))
    assert.deepEqual(actions.reduce<Expedition>(actExpedition, run), won)
  }
})

test('mirror public deduction cannot read covered mine bits or covered numbers', () => {
  const run = arena()
  const poisoned = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell) =>
        cell.visibility === 'revealed'
          ? cell
          : { ...cell, mine: !cell.mine, adjacent: 8 - cell.adjacent },
      ),
    },
    encounter: {
      ...run.encounter,
      other: {
        ...run.encounter.other,
        game: {
          ...run.encounter.other.game,
          cells: run.encounter.other.game.cells.map((cell) =>
            cell.visibility === 'revealed'
              ? cell
              : { ...cell, mine: !cell.mine, adjacent: 8 - cell.adjacent },
          ),
        },
      },
    },
  }
  assert.deepEqual(mirrorKnowledge(poisoned), mirrorKnowledge(run))
})

test('the seeded four-boss rotation reaches every family and never repeats adjacent checkpoints', () => {
  const kinds = [44, 45, 46, 47].map(
    (seed) =>
      enterEncounter({
        ...createExpedition({ ...CURRENT_DEPARTURE, seed }),
        floor: 3,
      }).encounter?.kind,
  )
  assert.deepEqual(kinds, ['bastion', 'brood', 'mirror', 'magnetic'])
  const run = createExpedition({ ...CURRENT_DEPARTURE, seed: 46, difficulty: 'abyss' })
  assert.deepEqual(
    encounterTier('abyss').floors.map((floor) => enterEncounter({ ...run, floor }).encounter?.kind),
    ['mirror', 'magnetic', 'bastion'],
  )
})

test('shift costs one AP and preserves both positions, resources, forecasts and spent build effects', () => {
  const initial = arena()
  const run = {
    ...initial,
    probes: 2,
    scans: 1,
    health: 7,
    shields: 1,
    skillUsed: true,
    relics: ['field-notes', 'trail-thread'] as const,
    floorTriggers: ['field-notes'] as const,
    travelled: [initial.entrance, ...adjacentSteps(initial.game, initial.entrance)],
  }
  const shifted = actExpedition(run, { type: 'shift' })
  assert.ok(shifted.encounter?.kind === 'mirror')
  assert.equal(shifted.encounter.active, 'dusk')
  assert.equal(shifted.encounter.points, 2)
  assert.equal(shifted.encounter.turn, 1)
  assert.deepEqual(shifted.encounter.intent, run.encounter.otherIntent)
  assert.equal(roomTravel(shifted), roomTravel(run))
  const back = actExpedition(shifted, { type: 'shift' })
  assert.ok(back.encounter?.kind === 'mirror')
  assert.deepEqual(back.game, run.game)
  assert.deepEqual(back.travelled, run.travelled)
  assert.equal(back.player, run.player)
  for (const field of ['probes', 'scans', 'health', 'shields', 'skillUsed', 'loot'] as const)
    assert.equal(back[field], run[field])
  assert.deepEqual(back.floorTriggers, run.floorTriggers)
  assert.equal(roomDiscoveries(back), roomDiscoveries(run))
})

test('confirmed mines survey the opposite cell while ordinary flags never grant free information', () => {
  const run = { ...arena(), probes: 2 }
  const mine = run.game.cells.findIndex((cell) => cell.mine)
  const flagged = actExpedition(run, { type: 'flag', index: mine })
  assert.ok(flagged.encounter?.kind === 'mirror')
  assert.ok(!flagged.encounter.other.surveyedCells.includes(mine))
  const scanned = actExpedition(flagged, { type: 'probe', index: mine })
  assert.ok(scanned.encounter?.kind === 'mirror')
  assert.ok(scanned.confirmedMines.includes(mine))
  assert.ok(scanned.encounter.other.surveyedCells.includes(mine))
  assert.equal(actExpedition(scanned, { type: 'flag', index: mine }), scanned)
  const shifted = actExpedition(scanned, { type: 'shift' })
  assert.ok(shifted.surveyedCells.includes(mine))
  assert.equal(shifted.probes, 1)
})

test('seals protect the opposite twin and wrong calibration consumes AP and ignores armor', () => {
  const run = calibrated(arena())
  const seal = run.encounter.dawn.seal.index
  assert.equal(tacticalPlan(run, { type: 'attack' }).reason, 'mirror-seal')
  const disabled = actExpedition(run, { type: 'interact', index: seal })
  assert.ok(disabled.encounter?.kind === 'mirror')
  assert.equal(disabled.encounter.dawn.seal.active, false)
  assert.equal(disabled.encounter.dusk.seal.active, true)
  assert.equal(tacticalPlan(disabled, { type: 'attack' }).reason, 'mirror-seal')
  const ring = neighbors(run.game.config, seal)
  const mine = ring.find((index) => run.game.cells[index]!.mine)!
  const safe = ring.find((index) => !run.game.cells[index]!.mine && !run.walls.includes(index))!
  const wrong = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, index) =>
        index === mine
          ? { ...cell, visibility: 'hidden' as const }
          : index === safe
            ? { ...cell, visibility: 'flagged' as const }
            : cell,
      ),
    },
  }
  assert.ok(tacticalPlan(wrong, { type: 'interact', index: seal }).allowed)
  const hurt = actExpedition(wrong, { type: 'interact', index: seal })
  assert.equal(hurt.health, 5)
  assert.equal(hurt.encounter?.points, 2)
  assert.equal(hurt.encounter?.event, 'misfire')
})

test('reflection requires alternating targets and a fallen twin cancels its own attack', () => {
  const run = exposed(arena())
  const hit = actExpedition(run, { type: 'attack' })
  assert.equal(hit.encounter?.lastDamage, 5)
  assert.equal(tacticalPlan(hit, { type: 'attack' }).reason, 'reflection')
  assert.equal(actExpedition(hit, { type: 'attack' }), hit)
  const almost = {
    ...run,
    encounter: { ...run.encounter, health: 15, dawn: { ...run.encounter.dawn, health: 1 } },
  }
  const killed = actExpedition(almost, { type: 'attack' })
  assert.ok(killed.encounter?.kind === 'mirror')
  assert.equal(killed.encounter.dawn.health, 0)
  assert.equal(killed.encounter.health, killed.encounter.dusk.health)
  assert.deepEqual(killed.encounter.intent.targets, [])
  const shifted = actExpedition(killed, { type: 'shift' })
  assert.ok(shifted.encounter?.kind === 'mirror')
  const next = forecastMirror({ ...shifted, encounter: { ...shifted.encounter, turn: 4 } })
  assert.equal(next.encounter.intent.damage, 7)
  assert.notEqual(tacticalPlan(next, { type: 'attack' }).reason, 'reflection')
})

test('forecasts survive movement and switching, and every third turn gives a shared attack opening', () => {
  const run = arena()
  const adjacent = adjacentSteps(run.game, run.player).find(
    (index) => tacticalPlan(run, { type: 'move', index }).allowed,
  )!
  const moved = actExpedition(run, { type: 'move', index: adjacent })
  assert.deepEqual(moved.encounter?.intent, run.encounter.intent)
  const shifted = actExpedition(moved, { type: 'shift' })
  assert.deepEqual(shifted.encounter?.intent, run.encounter.otherIntent)
  const rest = forecastMirror({ ...run, encounter: { ...run.encounter, turn: 3 } })
  assert.deepEqual(rest.encounter.intent.targets, [])
  assert.deepEqual(rest.encounter.otherIntent.targets, [])
  assert.equal(actExpedition(rest, { type: 'end-turn' }).health, run.health)
})

test('equipment and relic growth apply once across both realms, including seal refunds and excavation', () => {
  const initial = arena()
  const run = calibrated({
    ...initial,
    departure: {
      ...initial.departure,
      profession: 'archaeologist',
      equipment: ['focus-lens'],
      training: ['weapon-training'],
    },
    relics: ['tempered-edge', 'breach-sigil', 'duelist-edge'],
  })
  assert.equal(combatStats(run).attack, 9)
  assert.ok(professionSkillArea(run).includes(run.encounter.dawn.seal.index))
  const disabled = actExpedition(run, { type: 'interact', index: run.encounter.dawn.seal.index })
  assert.equal(disabled.encounter?.points, 4)
  assert.ok(disabled.floorTriggers.includes('breach-sigil'))
  const shifted = actExpedition({ ...disabled, skillUsed: true }, { type: 'shift' })
  assert.equal(professionSkillAvailability(shifted), 'used')
  assert.ok(shifted.floorTriggers.includes('breach-sigil'))
  const strike = actExpedition(exposed(run), { type: 'attack' })
  assert.equal(strike.encounter?.lastDamage, 13)
  assert.ok(strike.floorTriggers.includes('duelist-edge'))
})

test('previous rules retire to camp at their extraction checkpoint instead of replaying old combat', () => {
  const old = {
    version: 4,
    camp: { supplies: 100, upgrades: ['workshop'], completed: 2 },
    records: [],
    journal: {
      rulesRevision: EXPEDITION_RULES_REVISION - 1,
      returnSupplies: 157,
      departure: CURRENT_DEPARTURE,
      actions: [{ type: 'end-turn' }],
    },
  }
  const loaded = loadExpeditionSave(JSON.stringify(old))
  assert.ok(loaded)
  assert.equal(loaded.save.journal, null)
  assert.equal(loaded.save.camp.supplies, 257)
  assert.deepEqual(loaded.save.camp.upgrades, ['workshop'])
})

test('mirror rules and blocked actions have complete English, Chinese and Japanese copy', () => {
  for (const language of ['en', 'zh', 'ja'] as const) {
    const copy = tacticalCopy(language, 'mirror')
    assert.ok(copy.name.length > 0 && copy.help.length >= 6)
    for (const reason of ['mirror-seal', 'reflection'] as const)
      assert.ok(
        tacticalPlanCopy(language, { path: [], cost: 2, allowed: false, reason }).length > 10,
      )
  }
})
