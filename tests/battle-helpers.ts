import { defeatMirror } from './mirror-helpers.js'
import assert from 'node:assert/strict'
import { actExpedition, frontierCells } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { neighbors } from '../src/game/engine.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'
import type { BattleTestPlan } from './battle-types.js'

/** Find public objective distance while treating covered cells as uncertain traversable terrain. */
function objectiveDistance(run: Expedition, waypoint?: number): number {
  const encounter = run.encounter
  if (!encounter) return 0
  assert.ok(encounter.kind !== 'mirror')
  const goals =
    encounter.kind === 'bastion'
      ? encounter.pylons.filter((entry) => entry.active).map((entry) => entry.index)
      : encounter.nests
  const targets =
    waypoint !== undefined
      ? [waypoint]
      : goals.length
        ? goals
        : adjacentSteps(run.game, encounter.boss)
  const queue = [run.player]
  const distance = new Map([[run.player, 0]])
  for (const index of queue) {
    if (targets.includes(index)) return distance.get(index)!
    for (const next of adjacentSteps(run.game, index)) {
      if (
        !distance.has(next) &&
        !run.walls.includes(next) &&
        (run.game.cells[next]?.visibility === 'revealed' || next === waypoint)
      ) {
        distance.set(next, distance.get(index)! + 1)
        queue.push(next)
      }
    }
  }
  return run.game.cells.length
}

/** Rank progression and survival without looking at covered cell contents. */
function score(run: Expedition, waypoint?: number): number {
  if (run.phase === 'lost') return -100000
  if (run.phase === 'reward' || run.phase === 'won') return 100000
  const encounter = run.encounter!
  assert.ok(encounter.kind !== 'mirror')
  const remaining =
    encounter.kind === 'bastion'
      ? encounter.pylons.filter((entry) => entry.active).length
      : encounter.nests.length
  const entities =
    encounter.kind === 'brood' ? encounter.eggs.length + encounter.hatchlings.length : 0
  const opening =
    encounter.kind === 'bastion'
      ? Math.max(0, (encounter.exposedUntil ?? 0) - encounter.turn + 1)
      : 0
  return (
    opening * 8 +
    run.health * 30 +
    run.shields * 45 -
    remaining * 300 -
    encounter.health * 13 -
    objectiveDistance(run, waypoint) * 3 -
    entities * 5 +
    run.game.cells.filter((cell) => cell.visibility === 'revealed').length * 0.5
  )
}

/** Enumerate legal reasoning, movement and combat choices from the visible board only. */
function choices(run: Expedition, knownSafe: ReadonlySet<number>): ExpeditionAction[] {
  const encounter = run.encounter!
  assert.ok(encounter.kind !== 'mirror')
  const adjacent = adjacentSteps(run.game, run.player)
  const actions: ExpeditionAction[] = [{ type: 'attack' }, { type: 'brace' }]
  const objectives =
    encounter.kind === 'bastion'
      ? [...encounter.pylons.map((entry) => entry.index), encounter.boss]
      : [
          ...encounter.nests,
          ...encounter.webs,
          ...encounter.eggs.map((egg) => egg.index),
          ...encounter.hatchlings,
        ]
  actions.push(
    ...objectives
      .filter((index) => index === run.player || adjacent.includes(index))
      .map((index): ExpeditionAction => ({ type: 'interact', index })),
  )
  for (const index of adjacent) {
    if (run.game.cells[index]?.visibility === 'revealed') actions.push({ type: 'move', index })
    else if (knownSafe.has(index) && run.game.cells[index]?.visibility === 'hidden')
      actions.push({ type: 'reveal', index })
  }
  return actions.filter((action) => tacticalPlan(run, action).allowed)
}

/** Play complete turns with a bounded beam, proving wins through accepted public-state actions. */
export function defeatBattle(initial: Expedition): ExpeditionAction[] {
  if (initial.encounter?.kind === 'mirror') return defeatMirror(initial)
  let run = initial
  const transcript: ExpeditionAction[] = []
  const knownSafe = new Set<number>()
  const visited = new Set<string>()
  for (let turn = 0; turn < 240 && run.phase === 'boss'; turn++) {
    for (let pass = 0; pass < run.game.cells.length; pass++) {
      const deduction = deduceMines(run.game, run.walls)
      for (const index of deduction.safe) knownSafe.add(index)
      if (!deduction.mines.length) break
      for (const index of deduction.mines) {
        const action: ExpeditionAction = { type: 'flag', index }
        const next = actExpedition(run, action)
        assert.notEqual(next, run)
        transcript.push(action)
        run = next
      }
    }
    // Waiting on a safe beat can change an alternating attack cycle without losing health.
    const signature = JSON.stringify([
      run.player,
      run.encounter?.health,
      run.encounter?.turn! % 6,
      run.game.cells.map((cell) => cell.visibility),
    ])
    const waited = actExpedition(run, { type: 'end-turn' })
    if (visited.has(signature) && waited.health === run.health && waited.shields === run.shields) {
      transcript.push({ type: 'end-turn' })
      run = waited
      visited.clear()
      continue
    }
    visited.add(signature)
    const encounter = run.encounter!
    assert.ok(encounter.kind !== 'mirror')
    const objectives =
      encounter.kind === 'bastion'
        ? encounter.pylons.filter((entry) => entry.active).map((entry) => entry.index)
        : encounter.nests
    const ready = objectives.filter(
      (index) =>
        run.game.cells[index]?.visibility === 'revealed' &&
        neighbors(run.game.config, index).filter(
          (other) => run.game.cells[other]?.visibility === 'flagged',
        ).length === run.game.cells[index]?.adjacent,
    )
    const frontier = [...frontierCells(run)].filter((index) => knownSafe.has(index))
    const candidates = ready.length
      ? ready
      : frontier.length
        ? frontier
        : adjacentSteps(run.game, encounter.boss).filter(
            (index) => run.game.cells[index]?.visibility === 'revealed',
          )
    const waypoint =
      !ready.length && !frontier.length
        ? undefined
        : candidates.sort((a, b) => objectiveDistance(run, a) - objectiveDistance(run, b))[0]
    let beam: BattleTestPlan[] = [{ run, actions: [] }]
    let best: BattleTestPlan = {
      run: actExpedition(run, { type: 'end-turn' }),
      actions: [{ type: 'end-turn' }],
    }
    for (let depth = 0; depth < 7; depth++) {
      const candidates: BattleTestPlan[] = []
      const seen = new Set<string>()
      for (const plan of beam) {
        for (const action of choices(plan.run, knownSafe)) {
          const next = actExpedition(plan.run, action)
          if (next === plan.run) continue
          const actions = [...plan.actions, action]
          if (next.phase !== 'boss') {
            if (score(next, waypoint) > score(best.run, waypoint)) best = { run: next, actions }
            continue
          }
          const ended = actExpedition(next, { type: 'end-turn' })
          if (score(ended, waypoint) > score(best.run, waypoint))
            best = { run: ended, actions: [...actions, { type: 'end-turn' }] }
          const identity = JSON.stringify([
            next.player,
            next.encounter,
            next.game.cells.map((cell) => cell.visibility),
            next.health,
            next.shields,
          ])
          if (!seen.has(identity)) {
            seen.add(identity)
            candidates.push({ run: next, actions })
          }
        }
      }
      beam = candidates.sort((a, b) => score(b.run, waypoint) - score(a.run, waypoint)).slice(0, 24)
      if (best.run.phase === 'won' || best.run.phase === 'reward' || !beam.length) break
    }
    assert.notEqual(
      best.run.phase,
      'lost',
      `No surviving plan on turn ${turn}, seed ${run.departure.seed}`,
    )
    transcript.push(...best.actions)
    run = best.run
  }
  assert.ok(
    run.phase === 'reward' || run.phase === 'won',
    `Battle stalled: ${JSON.stringify({ player: run.player, health: run.health, encounter: run.encounter, last: transcript.slice(-20), board: run.game.cells.map((cell) => (cell.visibility === 'flagged' ? 'F' : cell.visibility === 'revealed' ? String(cell.adjacent) : '?')).join(''), hidden: run.game.cells.filter((cell) => cell.visibility === 'hidden').length })}`,
  )
  return transcript
}
