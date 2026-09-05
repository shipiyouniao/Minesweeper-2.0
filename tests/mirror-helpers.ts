import assert from 'node:assert/strict'
import { actExpedition, frontierCells } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { shiftMirror } from '../src/game/mirror-battle.js'
import { oppositeMirror } from '../src/game/mirror-state.js'
import { neighbors } from '../src/game/engine.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'
import type { MirrorSide } from '../src/types/mirror.js'
import type { BattleTestPlan } from './battle-types.js'
import type { MirrorTestGoal, MirrorTestKnowledge } from './mirror-types.js'

/** Inspect either public board without treating the inspection as a played action. */
function view(run: Expedition, side: MirrorSide): Expedition {
  const encounter = run.encounter
  assert.ok(encounter?.kind === 'mirror')
  return encounter.active === side ? run : shiftMirror({ ...run, encounter })
}

/** Close free flag deductions, then transfer only their public mine-exclusion consequences. */
export function mirrorKnowledge(run: Expedition): MirrorTestKnowledge {
  const dawn = view(run, 'dawn')
  const dusk = view(run, 'dusk')
  const boards = { dawn: dawn.game, dusk: dusk.game }
  const rooms = { dawn, dusk }
  const safe = { dawn: new Set(dawn.surveyedCells), dusk: new Set(dusk.surveyedCells) }
  const mines = { dawn: new Set<number>(), dusk: new Set<number>() }
  for (let pass = 0; pass < dawn.game.cells.length; pass++) {
    let changed = false
    for (const side of ['dawn', 'dusk'] as const) {
      const deduction = deduceMines(boards[side], rooms[side].walls)
      for (const index of deduction.safe) safe[side].add(index)
      for (const index of deduction.mines) {
        mines[side].add(index)
        changed = true
      }
      boards[side] = {
        ...boards[side],
        cells: boards[side].cells.map((cell, index) =>
          mines[side].has(index) ? { ...cell, visibility: 'flagged' } : cell,
        ),
      }
      for (const [index, cell] of boards[side].cells.entries())
        if (cell.visibility === 'flagged') safe[oppositeMirror(side)].add(index)
    }
    if (!changed) break
  }
  return {
    dawn: { safe: [...safe.dawn], mines: [...mines.dawn] },
    dusk: { safe: [...safe.dusk], mines: [...mines.dusk] },
  }
}

/** Flag only already deduced mines through accepted journal actions on the active board. */
function flagKnown(plan: BattleTestPlan, knowledge: MirrorTestKnowledge): BattleTestPlan {
  let run = plan.run
  const encounter = run.encounter
  if (run.phase !== 'boss' || encounter?.kind !== 'mirror') return plan
  const actions = [...plan.actions]
  for (const index of knowledge[encounter.active].mines) {
    if (run.game.cells[index]?.visibility !== 'hidden') continue
    const action: ExpeditionAction = { type: 'flag', index }
    const next = actExpedition(run, action)
    if (next !== run) {
      run = next
      actions.push(action)
    }
  }
  return { run, actions }
}

/** Measure a public route, allowing only the final known-safe covered cell as a frontier step. */
function distance(run: Expedition, target: number): number {
  const reached = new Map([[run.player, 0]])
  const queue = [run.player]
  for (const index of queue) {
    if (index === target) return reached.get(index)!
    for (const next of adjacentSteps(run.game, index)) {
      if (reached.has(next) || run.walls.includes(next)) continue
      if (run.game.cells[next]?.visibility !== 'revealed' && next !== target) continue
      reached.set(next, reached.get(index)! + 1)
      queue.push(next)
    }
  }
  return run.game.cells.length
}

/** Prioritize calibrated seals, useful safe frontiers, then reachable attack positions. */
function waypoint(run: Expedition, knowledge: MirrorTestKnowledge): number | null {
  const encounter = run.encounter
  assert.ok(encounter?.kind === 'mirror')
  const seal = encounter[encounter.active].seal
  const known = knowledge[encounter.active]
  const flagsReady =
    neighbors(run.game.config, seal.index).filter(
      (index) => known.mines.includes(index) || run.game.cells[index]?.visibility === 'flagged',
    ).length === run.game.cells[seal.index]?.adjacent
  if (seal.active && flagsReady && run.game.cells[seal.index]?.visibility === 'revealed')
    return seal.index
  const frontier = [...frontierCells(run)].filter((index) => known.safe.includes(index))
  const attack = adjacentSteps(run.game, encounter.boss).filter(
    (index) => run.game.cells[index]?.visibility === 'revealed',
  )
  // A reached boss is not a useful waypoint while the other realm's seal still protects it.
  // Continue revealing cross-realm clues instead of oscillating beside an invulnerable target.
  const opposite = oppositeMirror(encounter.active)
  const canStrike =
    !encounter[opposite].seal.active &&
    encounter[encounter.active].health > 0 &&
    (encounter.lastStruck !== encounter.active || encounter[opposite].health === 0)
  const choices = !seal.active && canStrike && attack.length ? attack : frontier
  return choices.sort((a, b) => distance(run, a) - distance(run, b))[0] ?? null
}

/** Choose which realm needs progress, changing sides only for a concrete objective or missing clue. */
function goal(run: Expedition, knowledge: MirrorTestKnowledge): MirrorTestGoal {
  const encounter = run.encounter
  assert.ok(encounter?.kind === 'mirror')
  let side = encounter.active
  const opposite = oppositeMirror(side)
  if (
    (!encounter[side].seal.active && encounter[opposite].seal.active) ||
    (!encounter.dawn.seal.active &&
      !encounter.dusk.seal.active &&
      (encounter[side].health === 0 ||
        (encounter.lastStruck === side && encounter[opposite].health > 0)))
  )
    side = opposite
  let index = waypoint(view(run, side), knowledge)
  if (index === null) {
    side = oppositeMirror(side)
    index = waypoint(view(run, side), knowledge)
  }
  assert.notEqual(index, null, 'Public deduction must provide a next objective')
  return { side, index: index! }
}

/** Rank survival and objective progress, counting both boards so a shift cannot erase progress. */
function score(run: Expedition, target: MirrorTestGoal): number {
  if (run.phase === 'lost') return -100000
  if (run.phase === 'reward' || run.phase === 'won') return 100000
  const encounter = run.encounter
  assert.ok(encounter?.kind === 'mirror')
  const revealed = [...run.game.cells, ...encounter.other.game.cells].filter(
    (cell) => cell.visibility === 'revealed',
  ).length
  return (
    run.health * 150 +
    run.shields * 180 -
    encounter.health * 35 -
    (Number(encounter.dawn.seal.active) + Number(encounter.dusk.seal.active)) * 900 +
    revealed * 4 -
    distance(view(run, target.side), target.index) * 6 +
    Number(encounter.active === target.side) * 24
  )
}

/** Enumerate bounded legal moves, known-safe reveals, shifts and combat actions. */
function choices(run: Expedition, knowledge: MirrorTestKnowledge): ExpeditionAction[] {
  const encounter = run.encounter
  assert.ok(encounter?.kind === 'mirror')
  const actions: ExpeditionAction[] = [
    { type: 'attack' },
    { type: 'shift' },
    { type: 'brace' },
    { type: 'interact', index: encounter[encounter.active].seal.index },
  ]
  for (const index of adjacentSteps(run.game, run.player)) {
    if (run.game.cells[index]?.visibility === 'revealed') actions.push({ type: 'move', index })
    else if (
      run.game.cells[index]?.visibility === 'hidden' &&
      knowledge[encounter.active].safe.includes(index)
    )
      actions.push({ type: 'reveal', index })
  }
  return actions.filter((action) => tacticalPlan(run, action).allowed)
}

/** Win through public clues and accepted actions with the base explorer's finite health and AP. */
export function defeatMirror(initial: Expedition): ExpeditionAction[] {
  let run = initial
  const transcript: ExpeditionAction[] = []
  for (let turn = 0; turn < 400 && run.phase === 'boss'; turn++) {
    const knowledge = mirrorKnowledge(run)
    const flagged = flagKnown({ run, actions: [] }, knowledge)
    run = flagged.run
    transcript.push(...flagged.actions)
    const target = goal(run, knowledge)
    let beam: BattleTestPlan[] = [{ run, actions: [] }]
    let best: BattleTestPlan = {
      run: actExpedition(run, { type: 'end-turn' }),
      actions: [{ type: 'end-turn' }],
    }
    for (let depth = 0; depth < 7; depth++) {
      const candidates: BattleTestPlan[] = []
      const seen = new Set<string>()
      for (const plan of beam) {
        for (const action of choices(plan.run, knowledge)) {
          const next = actExpedition(plan.run, action)
          if (next === plan.run) continue
          const advanced = flagKnown({ run: next, actions: [...plan.actions, action] }, knowledge)
          if (advanced.run.phase !== 'boss') {
            if (score(advanced.run, target) > score(best.run, target)) best = advanced
            continue
          }
          const ended = actExpedition(advanced.run, { type: 'end-turn' })
          if (score(ended, target) > score(best.run, target))
            best = { run: ended, actions: [...advanced.actions, { type: 'end-turn' }] }
          const identity = JSON.stringify([
            advanced.run.player,
            advanced.run.encounter,
            advanced.run.game.cells.map((cell) => cell.visibility),
            advanced.run.health,
            advanced.run.shields,
          ])
          if (!seen.has(identity)) {
            seen.add(identity)
            candidates.push(advanced)
          }
        }
      }
      beam = candidates.sort((a, b) => score(b.run, target) - score(a.run, target)).slice(0, 16)
      if (!beam.length || best.run.phase === 'reward' || best.run.phase === 'won') break
    }
    assert.notEqual(
      best.run.phase,
      'lost',
      `No surviving mirror plan: seed ${run.departure.seed}, turn ${turn}`,
    )
    transcript.push(...best.actions)
    run = best.run
  }
  assert.ok(
    run.phase === 'reward' || run.phase === 'won',
    `Mirror stalled: ${JSON.stringify({ seed: run.departure.seed, player: run.player, health: run.health, encounter: run.encounter, last: transcript.slice(-15) })}`,
  )
  return transcript
}
