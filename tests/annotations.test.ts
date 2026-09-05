import assert from 'node:assert/strict'
import test from 'node:test'
import { act, chordTargets, createGame, PRESETS, restore, snapshot } from '../src/game/engine.js'
import { createExpedition, actExpedition } from '../src/game/expedition.js'
import { createTwin, actTwin } from '../src/game/twin.js'
import { placedBoard } from '../src/game/variant-board.js'
import { inspectArea } from '../src/game/dungeon-discovery.js'
import { enterBattle } from '../src/game/battle-arena.js'
import { enterMirror } from '../src/game/mirror-battle.js'
import { approachPath } from '../src/game/dungeon-path.js'
import { decodeGameSnapshot } from '../src/persistence/decoders.js'
import { decodeExpeditionSave } from '../src/persistence/variant-decoders.js'
import { EXPEDITION_RULES_REVISION } from '../src/persistence/expedition-format.js'
import { parseNavigation } from '../src/ui/input-parser.js'
import { boardHelpTemplate } from '../src/ui/board-help.js'
import { secondaryBoardAction } from '../src/ui/board-actions.js'
import type { Expedition } from '../src/types/variants.js'
import { CURRENT_DEPARTURE } from './helpers.js'
import { isEncounterFloor } from '../src/game/encounter-roster.js'

/** A small numbered room isolates travel, notes and false-flag effects without flood expansion. */
function room(): Expedition {
  const original = createExpedition({ ...CURRENT_DEPARTURE, seed: 12 })
  const board = placedBoard({ width: 5, height: 5, mines: 4 }, new Set([7, 20, 23, 24]), 12, 12)
  return {
    ...original,
    game: {
      ...board,
      cells: board.cells.map((cell, index) => ({
        ...cell,
        visibility: index === 12 ? 'revealed' : index === 7 ? 'flagged' : 'hidden',
      })),
    },
    entrance: 12,
    player: 12,
    exit: 4,
    walls: [],
    treasures: [],
    collected: [],
    probes: 0,
    scans: 0,
    shields: 0,
    health: 10,
    maxHealth: 10,
  }
}

/** Keep ordinary combat accounting while using the controlled numbered room. */
function battle(points: number): Expedition {
  const original = room()
  const entered = enterBattle(original, 'bastion')
  assert.ok(entered.encounter?.kind === 'bastion')
  return {
    ...original,
    phase: 'boss',
    encounter: { ...entered.encounter, points, boss: 4, pylons: [], mechanisms: [] },
  }
}

test('pointer shortcuts cycle player marks and quick-open revealed cells using public state', () => {
  let game = createGame(PRESETS.easy, 42)
  for (const expected of ['flag', 'mark-safe', 'mark-safe'] as const) {
    const type = secondaryBoardAction(game, 1)
    assert.equal(type, expected)
    assert.ok(type)
    game = act(game, { type, index: 1 })
  }
  assert.equal(game.cells[1]?.visibility, 'hidden')
  assert.deepEqual(game.safeMarks, [])
  const opened = act(game, { type: 'reveal', index: 10 })
  assert.equal(secondaryBoardAction(opened, 10), 'chord')
  assert.equal(secondaryBoardAction(game, -1), null)
})

test('quick opening exposes stairs without ending exploration or granting an exit payment', () => {
  const original = { ...room(), exit: 13 }
  const next = actExpedition(original, { type: 'chord', index: 12 })
  assert.equal(next.game.cells[13]?.visibility, 'revealed')
  assert.equal(next.phase, 'exploring')
  assert.equal(next.loot, original.loot)
  assert.deepEqual(next.offers, original.offers)
  const standing = { ...next, player: next.exit }
  assert.equal(actExpedition(standing, { type: 'reveal', index: next.exit }), standing)
  const entered = actExpedition(standing, { type: 'move', index: next.exit })
  assert.equal(entered.phase, 'reward')
  assert.ok(entered.loot > next.loot)
})

test('quick opening guarded stairs waits for deliberate entry before starting the boss', () => {
  const original = { ...room(), floor: 3, exit: 13 }
  assert.ok(isEncounterFloor(original))
  const next = actExpedition(original, { type: 'chord', index: 12 })
  assert.equal(next.phase, 'exploring')
  assert.equal(next.encounter, null)
  const entered = actExpedition(next, { type: 'move', index: next.exit })
  assert.equal(entered.phase, 'boss')
})

test('safe hypotheses are removable, exclusive with flags, persisted, and never open a first click', () => {
  const initial = createGame(PRESETS.easy, 42)
  const marked = act(initial, { type: 'mark-safe', index: 1 })
  assert.equal(marked.phase, 'ready')
  assert.equal(marked.firstClick, null)
  assert.deepEqual(marked.safeMarks, [1])
  assert.deepEqual(restore(snapshot(marked)), marked)
  assert.deepEqual(decodeGameSnapshot(JSON.stringify(snapshot(marked))), snapshot(marked))
  assert.deepEqual(act(marked, { type: 'mark-safe', index: 1 }), initial)
  const flagged = act(marked, { type: 'flag', index: 1 })
  assert.deepEqual(flagged.safeMarks, [])
  const replaced = act(flagged, { type: 'mark-safe', index: 1 })
  assert.equal(replaced.cells[1]?.visibility, 'hidden')
  assert.deepEqual(replaced.safeMarks, [1])
  const opened = act(replaced, { type: 'reveal', index: 1 })
  assert.equal(opened.cells[1]?.visibility, 'revealed')
  assert.deepEqual(opened.safeMarks, [])
})

test('snapshot notes reject forged, duplicate, revealed and out-of-board indices', () => {
  const saved = snapshot(createGame(PRESETS.easy, 42))
  for (const safeMarks of [[-1], [81], [1, 1], ['1'], [1.2], null])
    assert.equal(decodeGameSnapshot(JSON.stringify({ ...saved, safeMarks })), null)
  assert.equal(
    decodeGameSnapshot(
      JSON.stringify({
        ...saved,
        safeMarks: [0],
        visible: saved.visible.map((value, index) => (index === 0 ? 'revealed' : value)),
      }),
    ),
    null,
  )
})

test('Classic boards created before notes retain their unchanged rules and visible progress', () => {
  const game = act(createGame(PRESETS.easy, 42), { type: 'reveal', index: 10 })
  const saved = decodeGameSnapshot(JSON.stringify({ ...snapshot(game), safeMarks: undefined }))
  assert.ok(saved)
  assert.deepEqual(restore(saved), game)
})

test('ordinary quick open follows connected routes and clears notes only for revealed cells', () => {
  const before = room()
  const targets = chordTargets(before.game, 12)
  assert.equal(targets.length, 7)
  const next = actExpedition(before, { type: 'chord', index: 12 })
  assert.ok(targets.every((index) => next.game.cells[index]?.visibility === 'revealed'))
  assert.deepEqual(next.game.safeMarks, [])
  assert.equal(next.health, before.health)
})

test('boss quick open spends per-reveal AP and does not advance the enemy turn', () => {
  const before = battle(1)
  const next = actExpedition(before, { type: 'chord', index: 12 })
  assert.equal(next.encounter?.points, 0)
  assert.equal(next.encounter?.turn, before.encounter?.turn)
  assert.equal(next.game.cells.filter((cell) => cell.visibility === 'revealed').length, 2)
  assert.equal(next.game.safeMarks.length, 6)
  assert.equal(next.player, 11)
  assert.deepEqual(actExpedition(next, { type: 'chord', index: 12 }), next)
  const removed = actExpedition(next, { type: 'mark-safe', index: next.game.safeMarks[0]! })
  assert.equal(removed.game.safeMarks.length, 5)
  assert.equal(removed.encounter?.points, 0)
})

test('safe notes open without matching flags in Classic and Twin; an incorrect note can hit a mine', () => {
  const game = act(room().game, { type: 'flag', index: 7 })
  const noted = act(game, { type: 'mark-safe', index: 13 })
  assert.deepEqual(chordTargets(noted, 12), [13])
  const opened = act(noted, { type: 'chord', index: 12 })
  assert.equal(opened.cells[13]?.visibility, 'revealed')
  assert.equal(opened.cells[7]?.visibility, 'hidden')
  assert.deepEqual(opened.safeMarks, [])
  const twin = { ...createTwin(42), a: noted, b: game, phase: 'playing' as const }
  const paired = actTwin(twin, { side: 'a', type: 'chord', index: 12 })
  assert.equal(paired.a.cells[13]?.visibility, 'revealed')
  assert.equal(paired.b, twin.b)
  const mistaken = act(game, { type: 'mark-safe', index: 7 })
  assert.equal(act(mistaken, { type: 'chord', index: 12 }).phase, 'lost')
})

test('Expedition quick opening digs only noted or surveyed neighbors when flags do not match', () => {
  const unflagged = actExpedition(room(), { type: 'flag', index: 7 })
  const noted = actExpedition(unflagged, { type: 'mark-safe', index: 11 })
  const surveyed = inspectArea(noted, [13])
  const next = actExpedition(surveyed, { type: 'chord', index: 12 })
  assert.equal(next.game.cells[11]?.visibility, 'revealed')
  assert.equal(next.game.cells[13]?.visibility, 'revealed')
  assert.equal(next.game.cells[7]?.visibility, 'hidden')
  assert.equal(next.game.cells[17]?.visibility, 'hidden')
  assert.deepEqual(next.game.safeMarks, [])
  assert.equal(next.health, surveyed.health)
})

test('noted and surveyed Boss targets retain their marks when unreachable or unaffordable', () => {
  const unflagged = actExpedition(battle(1), { type: 'flag', index: 7 })
  const noted = actExpedition(unflagged, { type: 'mark-safe', index: 11 })
  const surveyed = inspectArea(noted, [13])
  const next = actExpedition(surveyed, { type: 'chord', index: 12 })
  assert.equal(next.encounter?.points, 0)
  assert.equal(next.game.cells[11]?.visibility, 'revealed')
  assert.equal(next.game.cells[13]?.visibility, 'hidden')
  assert.ok(next.surveyedCells.includes(13))
  assert.equal(actExpedition(next, { type: 'chord', index: 12 }), next)
  const distant = { ...surveyed, player: 0 }
  assert.equal(actExpedition(distant, { type: 'chord', index: 12 }), distant)
  assert.deepEqual(distant.game.safeMarks, [11])
})

test('quick opening a mistaken safe note deals normal mine damage and stops the batch', () => {
  const unflagged = actExpedition(room(), { type: 'flag', index: 7 })
  const mistaken = actExpedition(unflagged, { type: 'mark-safe', index: 7 })
  const next = actExpedition(mistaken, { type: 'chord', index: 12 })
  assert.equal(next.health, 5)
  assert.deepEqual(next.triggeredMines, [7])
  assert.equal(next.game.cells[11]?.visibility, 'hidden')
  assert.deepEqual(next.game.safeMarks, [])
})

test('unreachable targets become hypotheses without inspecting hidden mines or creating paths', () => {
  const original = room()
  const disconnected = {
    ...original,
    player: 0,
    entrance: 0,
    game: {
      ...original.game,
      cells: original.game.cells.map((cell, index) =>
        index === 0 ? { ...cell, visibility: 'revealed' as const } : cell,
      ),
    },
  }
  const marked = actExpedition(disconnected, { type: 'chord', index: 12 })
  assert.equal(marked.player, 0)
  assert.equal(marked.game.safeMarks.length, 7)
  assert.equal(approachPath(marked, 18), null)
  const poisoned = {
    ...disconnected,
    game: {
      ...disconnected.game,
      cells: disconnected.game.cells.map((cell) =>
        cell.visibility === 'hidden' ? { ...cell, mine: !cell.mine, adjacent: 8 } : cell,
      ),
    },
  }
  assert.deepEqual(
    actExpedition(poisoned, { type: 'chord', index: 12 }).game.safeMarks,
    marked.game.safeMarks,
  )
})

test('wrong flag counts do nothing; matching wrong flags can hit a mine and stop the batch', () => {
  const original = room()
  const noFlags = actExpedition(original, { type: 'flag', index: 7 })
  assert.equal(actExpedition(noFlags, { type: 'chord', index: 12 }), noFlags)
  const incorrect = actExpedition(noFlags, { type: 'flag', index: 11 })
  const hit = actExpedition(incorrect, { type: 'chord', index: 12 })
  assert.deepEqual(hit.triggeredMines, [7])
  assert.equal(hit.health, 5)
  assert.ok(hit.game.safeMarks.length > 0)
  assert.ok(hit.confirmedMines.includes(7))
  assert.equal(actExpedition(hit, { type: 'flag', index: 7 }), hit)
  assert.equal(actExpedition(hit, { type: 'mark-safe', index: 7 }), hit)
})

test('a shielded mine remains a triggered hazard after later scans; surveys clear contradicted notes', () => {
  const original = actExpedition(room(), { type: 'flag', index: 7 })
  const marked = actExpedition({ ...original, shields: 1 }, { type: 'mark-safe', index: 7 })
  const hit = actExpedition(marked, { type: 'reveal', index: 7 })
  assert.equal(hit.health, 10)
  assert.equal(hit.shields, 0)
  assert.deepEqual(hit.triggeredMines, [7])
  assert.deepEqual(hit.game.safeMarks, [])
  const inspected = inspectArea(hit, [7, 13])
  assert.deepEqual(inspected.triggeredMines, [7])
  assert.equal(actExpedition(inspected, { type: 'flag', index: 13 }), inspected)
  const noted = actExpedition(room(), { type: 'mark-safe', index: 13 })
  const surveyed = inspectArea(noted, [13, 23])
  assert.deepEqual(surveyed.game.safeMarks, [])
  assert.ok(surveyed.confirmedMines.includes(23))
  assert.deepEqual(surveyed.triggeredMines, [])
})

test('twin notes remain board-local and mirror shifts preserve each realms notes and hazard sources', () => {
  const twin = actTwin(createTwin(44), { side: 'a', type: 'reveal', index: 30 })
  const index = twin.a.cells.findIndex((cell) => cell.visibility === 'hidden')
  const marked = actTwin(twin, { side: 'a', type: 'mark-safe', index })
  assert.deepEqual(marked.a.safeMarks, [index])
  assert.deepEqual(marked.b.safeMarks, [])
  let mirror = enterMirror(createExpedition({ ...CURRENT_DEPARTURE, seed: 44 }))
  assert.ok(mirror.encounter?.kind === 'mirror')
  const candidate = mirror.game.cells.findIndex(
    (cell, index) => cell.visibility === 'hidden' && !mirror.walls.includes(index),
  )
  mirror = actExpedition(mirror, { type: 'mark-safe', index: candidate })
  const shifted = actExpedition(mirror, { type: 'shift' })
  assert.ok(shifted.encounter?.kind === 'mirror')
  assert.deepEqual(shifted.encounter.other.game.safeMarks, [candidate])
  assert.deepEqual(shifted.game.safeMarks, [])
  assert.deepEqual(actExpedition(shifted, { type: 'shift' }).game.safeMarks, [candidate])
})

test('current journals decode annotations and chords while older rules retire at their checkpoint', () => {
  const save = {
    version: 4,
    camp: { supplies: 10, upgrades: [], completed: 0 },
    records: [],
    journal: {
      rulesRevision: EXPEDITION_RULES_REVISION,
      departure: CURRENT_DEPARTURE,
      returnSupplies: 78,
      actions: [
        { type: 'mark-safe', index: 1 },
        { type: 'chord', index: 2 },
      ],
    },
  }
  assert.deepEqual(
    decodeExpeditionSave(JSON.stringify(save))?.journal?.actions,
    save.journal.actions,
  )
  const retired = decodeExpeditionSave(
    JSON.stringify({
      ...save,
      journal: { ...save.journal, rulesRevision: EXPEDITION_RULES_REVISION - 1 },
    }),
  )
  assert.equal(retired?.journal, null)
  assert.equal(retired?.camp.supplies, 88)
})

test('vim navigation and concise help cover every locale and input alternative', () => {
  assert.deepEqual(['h', 'j', 'k', 'l'].map(parseNavigation), [
    'arrowleft',
    'arrowdown',
    'arrowup',
    'arrowright',
  ])
  for (const language of ['en', 'zh', 'ja'] as const) {
    const help = boardHelpTemplate(language, true)
    assert.ok(help.includes('Vimium'))
    assert.ok(help.includes('H J K L'))
    assert.ok(help.includes('<details>'))
  }
})
