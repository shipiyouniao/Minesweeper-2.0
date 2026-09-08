import assert from 'node:assert/strict'
import { actExpedition } from '../src/game/expedition.js'
import { activeRegion } from '../src/game/matrix-logic.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { deduceSurvey } from '../src/game/survey-logic.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'
import type { BattleTestPlan } from './battle-types.js'

/** Public crystal deductions identify objectives without reading the hidden crystal set. */
export function matrixObjectives(run: Expedition): number[] {
  assert.ok(run.encounter?.kind === 'matrix')
  if (run.encounter.exposed)
    return adjacentSteps(run.game, run.encounter.boss).filter((index) => !run.walls.includes(index))
  const region = activeRegion({ ...run, encounter: run.encounter })
  const solution = deduceSurvey(
    { width: 3, height: 3, mines: 0 },
    region.rows,
    region.columns,
    region.indices.map(() => 'unresolved'),
  )
  return region.indices.filter(
    (index, local) =>
      solution.cells[local] === 'mine' &&
      !(run.encounter?.kind === 'matrix' && run.encounter.collected.includes(index)),
  )
}

/** Prioritize objective routes while accepting uncertainty only as a routing heuristic, never excavation permission. */
function distance(run: Expedition, targets: readonly number[]): number {
  const queue = [run.player],
    distances = new Map([[run.player, 0]])
  for (const index of queue) {
    if (targets.includes(index)) return distances.get(index)!
    for (const next of adjacentSteps(run.game, index))
      if (
        !distances.has(next) &&
        !run.walls.includes(next) &&
        run.game.cells[next]!.visibility !== 'flagged'
      ) {
        distances.set(next, distances.get(index)! + 1)
        queue.push(next)
      }
  }
  return 100
}

/** A short public-state beam plans safe excavation, extraction, melee and frozen-forecast evasion. */
export function defeatMatrix(initial: Expedition): ExpeditionAction[] {
  let run = initial
  const transcript: ExpeditionAction[] = []
  const knownSafe = new Set<number>()
  const visited = new Map<string, number>()
  let waypoints: readonly number[] = []
  /** Score actual phase progress and routes, without inspecting a covered clue or crystal identity. */
  function score(state: Expedition): number {
    assert.ok(state.encounter?.kind === 'matrix')
    if (state.phase === 'lost') return -100000
    if (state.phase !== 'boss') return 100000
    return (
      state.encounter.collected.length * 500 -
      state.encounter.health * 25 +
      state.health * 25 +
      state.shields * 35 -
      distance(state, waypoints) * 8 +
      state.game.cells.filter((cell) => cell.visibility === 'revealed').length * 1.5
    )
  }
  for (let turn = 0; turn < 120 && run.phase === 'boss'; turn++) {
    assert.ok(run.encounter?.kind === 'matrix')
    for (const index of matrixObjectives(run)) if (!run.encounter.exposed) knownSafe.add(index)
    for (let pass = 0; pass < run.game.cells.length; pass++) {
      const deduction = deduceMines(run.game, run.walls)
      for (const index of deduction.safe) knownSafe.add(index)
      if (!deduction.mines.length) break
      for (const index of deduction.mines) {
        const action: ExpeditionAction = { type: 'flag', index }
        run = actExpedition(run, action)
        transcript.push(action)
      }
    }
    const goals = matrixObjectives(run)
    const reachable = new Set([run.player]),
      queue = [run.player]
    for (const index of queue)
      for (const next of adjacentSteps(run.game, index)) {
        if (
          !reachable.has(next) &&
          !run.walls.includes(next) &&
          (run.game.cells[next]!.visibility === 'revealed' || knownSafe.has(next))
        ) {
          reachable.add(next)
          queue.push(next)
        }
      }
    waypoints = goals.filter((index) => reachable.has(index))
    if (!waypoints.length) {
      // Follow a justified frontier when a direct objective route is still unknown.
      // An optimistic straight-line objective metric would otherwise reward waiting at a dead end.
      waypoints = [...knownSafe]
        .filter((index) => reachable.has(index) && run.game.cells[index]!.visibility === 'hidden')
        .sort(
          (a, b) =>
            distance({ ...run, player: a }, goals) +
            distance(run, [a]) -
            distance({ ...run, player: b }, goals) -
            distance(run, [b]),
        )
        .slice(0, 1)
    }
    let beam: BattleTestPlan[] = [{ run, actions: [] }]
    let best: BattleTestPlan = {
      run: actExpedition(run, { type: 'end-turn' }),
      actions: [{ type: 'end-turn' }],
    }
    let bestScore = -Infinity
    for (let depth = 0; depth < 6; depth++) {
      const nextBeam: BattleTestPlan[] = []
      const seen = new Set<string>()
      for (const plan of beam) {
        const state = plan.run
        if (state.phase !== 'boss') continue
        assert.ok(state.encounter?.kind === 'matrix')
        const adjacent = adjacentSteps(state.game, state.player)
        const choices: ExpeditionAction[] = [{ type: 'attack' }, { type: 'brace' }]
        if (!state.encounter.exposed)
          for (const index of matrixObjectives(state)) choices.push({ type: 'attune', index })
        for (const index of adjacent) {
          if (state.game.cells[index]!.visibility === 'revealed')
            choices.push({ type: 'move', index })
          else if (knownSafe.has(index)) choices.push({ type: 'reveal', index })
        }
        for (const action of choices) {
          if (!tacticalPlan(state, action).allowed) continue
          const after = actExpedition(state, action)
          if (after === state) continue
          const key = JSON.stringify([
            after.player,
            after.encounter,
            after.game.cells.map((cell) => cell.visibility),
            after.health,
            after.shields,
          ])
          if (seen.has(key)) continue
          seen.add(key)
          const actions = [...plan.actions, action]
          const ended = after.phase === 'boss' ? actExpedition(after, { type: 'end-turn' }) : after
          const signature = JSON.stringify([
            ended.player,
            ended.encounter?.health,
            ended.encounter?.kind === 'matrix' ? ended.encounter.collected : [],
            ended.game.cells.map((cell) => cell.visibility),
          ])
          const value = score(ended) - (visited.get(signature) ?? 0) * 12 - actions.length * 0.01
          if (value > bestScore) {
            bestScore = value
            best = {
              run: ended,
              actions: [...actions, ...(ended === after ? [] : [{ type: 'end-turn' as const }])],
            }
          }
          nextBeam.push({ run: after, actions })
        }
      }
      nextBeam.sort((a, b) => score(b.run) - score(a.run))
      beam = nextBeam.slice(0, 24)
    }
    transcript.push(...best.actions)
    run = best.run
    const signature = JSON.stringify([
      run.player,
      run.encounter?.health,
      run.encounter?.kind === 'matrix' ? run.encounter.collected : [],
      run.game.cells.map((cell) => cell.visibility),
    ])
    visited.set(signature, (visited.get(signature) ?? 0) + 1)
  }
  assert.ok(
    run.phase === 'reward' || run.phase === 'won',
    `Matrix stopped: ${run.phase}, turn ${run.encounter?.turn}, player ${run.player}, boss ${run.encounter?.health}, ${JSON.stringify(transcript.slice(-12))}`,
  )
  return transcript
}
