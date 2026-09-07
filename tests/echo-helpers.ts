import assert from 'node:assert/strict'
import { actExpedition } from '../src/game/expedition.js'
import { echoCandidates } from '../src/game/expedition-sonar.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** A deterministic reference strategy using public scans, surveyed paths and frozen warnings. */
export function defeatEcho(initial: Expedition): ExpeditionAction[] {
  let run = initial
  const actions: ExpeditionAction[] = []
  for (let step = 0; step < 1200 && run.phase === 'boss'; step++) {
    assert.ok(run.encounter?.kind === 'echo')
    const e = run.encounter
    const candidates = echoCandidates(run)
    const safe = (index: number): boolean =>
      !run.walls.includes(index) &&
      (run.game.cells[index]?.visibility === 'revealed' || run.surveyedCells.includes(index)) &&
      !run.confirmedMines.includes(index)
    const movement = (index: number): import('../src/types/variants.js').ExpeditionAction => ({
      type: run.game.cells[index]?.visibility === 'revealed' ? 'move' : 'reveal',
      index,
    })
    const threatened = e.intent.targets.includes(run.player)
    const bandDone = e.phase < 3 && e.health === Math.ceil((e.maxHealth * (3 - e.phase)) / 3)
    let action: import('../src/types/variants.js').ExpeditionAction = { type: 'end-turn' }
    if ((threatened && e.points <= 1) || bandDone) {
      const dodge = adjacentSteps(run.game, run.player).find(
        (index) => safe(index) && !e.intent.targets.includes(index),
      )
      if (threatened && dodge !== undefined && e.points > 0) action = movement(dodge)
    } else if (candidates.length > 1 && e.points > Number(threatened)) {
      action = { type: 'sonar', index: candidates[0]! }
    } else if (candidates.length === 1) {
      const core = candidates[0]!
      if (adjacentSteps(run.game, run.player).includes(core)) {
        const desired: import('../src/types/variants.js').ExpeditionAction =
          e.exposedUntil >= e.turn ? { type: 'attack' } : { type: 'interact', index: core }
        const plan = tacticalPlan(run, desired)
        if (plan.allowed && e.points - plan.cost >= Number(threatened)) action = desired
      } else {
        const queue = [run.player],
          parent = new Map([[run.player, run.player]])
        let target: number | undefined
        for (const index of queue) {
          if (adjacentSteps(run.game, index).includes(core)) {
            target = index
            break
          }
          for (const next of adjacentSteps(run.game, index))
            if (!parent.has(next) && safe(next)) {
              parent.set(next, index)
              queue.push(next)
            }
        }
        if (target !== undefined && e.points > 1) {
          while (parent.get(target) !== run.player) target = parent.get(target)!
          if (
            !e.intent.targets.includes(target) ||
            adjacentSteps(run.game, target).some(
              (index) => safe(index) && !e.intent.targets.includes(index),
            )
          )
            action = movement(target)
        }
      }
    }
    if (action.type === 'end-turn' && threatened && e.points > 0) {
      const dodge = adjacentSteps(run.game, run.player).find(
        (index) => safe(index) && !e.intent.targets.includes(index),
      )
      if (dodge !== undefined) action = movement(dodge)
    }
    const next = actExpedition(run, action)
    assert.notEqual(next, run, `rejected ${action.type}`)
    actions.push(action)
    run = next
  }
  assert.ok(run.phase === 'reward' || run.phase === 'won', `Echo strategy stopped at ${run.phase}`)
  return actions
}
