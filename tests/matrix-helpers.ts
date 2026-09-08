import assert from 'node:assert/strict'
import { actExpedition } from '../src/game/expedition.js'
import {
  activePrism,
  matrixKnowledge,
  matrixLine,
  matrixHealthFloor,
} from '../src/game/matrix-logic.js'
import { deduceSurvey, surveyIndices } from '../src/game/survey-logic.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** Win using public line intersections, legal AP, normal excavation and frozen beam evasion. */
export function defeatMatrix(initial: Expedition): ExpeditionAction[] {
  assert.ok(initial.encounter?.kind === 'matrix')
  const initialMatrix = { ...initial, encounter: initial.encounter }
  const facts = deduceSurvey(
    initial.game.config,
    initial.encounter.rows,
    initial.encounter.columns,
    initial.game.cells.map((_, index) => matrixKnowledge(initialMatrix, index)),
  ).cells
  assert.ok(!facts.includes('unresolved'))
  let run = initial
  const actions: ExpeditionAction[] = []
  /** Execute and record an accepted intent, never editing health, coordinates or AP. */
  function apply(action: ExpeditionAction): void {
    const next = actExpedition(run, action)
    assert.notEqual(next, run, `rejected ${JSON.stringify(action)}`)
    actions.push(action)
    run = next
  }
  for (const [index, fact] of facts.entries()) if (fact === 'mine') apply({ type: 'flag', index })

  for (let step = 0; step < 1800 && run.phase === 'boss'; step++) {
    assert.ok(run.encounter?.kind === 'matrix')
    const e = run.encounter
    const narrowed = { ...run, encounter: e }
    const prism = activePrism(narrowed)
    const safe = (index: number): boolean => facts[index] === 'safe' && !run.walls.includes(index)
    const movement = (index: number): ExpeditionAction => ({
      type: run.game.cells[index]?.visibility === 'revealed' ? 'move' : 'reveal',
      index,
    })
    const threatens = (index: number): boolean => e.intent.targets.includes(index)
    const dodge = adjacentSteps(run.game, run.player).find(
      (index) => safe(index) && !threatens(index),
    )
    const bandDone = e.health <= matrixHealthFloor(narrowed)
    let desired: ExpeditionAction | null = null
    if (!bandDone && !e.armed) {
      if (e.exposedUntil >= e.turn) desired = { type: 'attack' }
      else if (matrixLine(narrowed, prism.axis, prism.line).complete)
        desired = { type: 'interact', index: prism.index }
    }
    let action: ExpeditionAction = { type: 'end-turn' }
    if (
      desired &&
      tacticalPlan(run, desired).allowed &&
      e.points - tacticalPlan(run, desired).cost >=
        Number(threatens(run.player) || desired.type === 'interact')
    ) {
      action = desired
    } else if (!bandDone && !e.armed && e.points > 0) {
      const target = e.exposedUntil >= e.turn ? e.boss : prism.index
      const incomplete =
        e.exposedUntil < e.turn && !matrixLine(narrowed, prism.axis, prism.line).complete
      const pending = incomplete
        ? surveyIndices(run.game.config, prism.axis, prism.line).filter(
            (index) =>
              safe(index) &&
              run.game.cells[index]?.visibility !== 'revealed' &&
              !run.surveyedCells.includes(index),
          )
        : []
      // Surveyed stations still need physical excavation before they can be calibrated.
      if (incomplete && !pending.length && run.game.cells[prism.index]?.visibility !== 'revealed')
        pending.push(prism.index)
      const parent = new Map([[run.player, run.player]])
      const queue = [run.player]
      let destination: number | undefined
      for (const index of queue) {
        if (
          pending.length ? pending.includes(index) : adjacentSteps(run.game, index).includes(target)
        ) {
          destination = index
          break
        }
        for (const other of adjacentSteps(run.game, index))
          if (safe(other) && !parent.has(other)) {
            parent.set(other, index)
            queue.push(other)
          }
      }
      if (destination !== undefined && destination !== run.player) {
        while (parent.get(destination) !== run.player) destination = parent.get(destination)!
        if (
          !threatens(destination) ||
          (e.points > 1 &&
            adjacentSteps(run.game, destination).some((index) => safe(index) && !threatens(index)))
        )
          action = movement(destination)
      } else if (
        destination === run.player &&
        run.game.cells[prism.index]?.visibility === 'hidden' &&
        adjacentSteps(run.game, run.player).includes(prism.index)
      )
        action = { type: 'reveal', index: prism.index }
    }
    if (action.type === 'end-turn' && threatens(run.player) && e.points > 0 && dodge !== undefined)
      action = movement(dodge)
    apply(action)
  }
  assert.ok(
    run.phase === 'reward' || run.phase === 'won',
    `Matrix strategy stopped at ${run.phase}, player ${run.player}, ${JSON.stringify(actions.slice(-20))}, ${JSON.stringify(run.encounter)}`,
  )
  return actions
}
