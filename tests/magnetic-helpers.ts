import assert from 'node:assert/strict'
import { actExpedition, frontierCells } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { walkingPath, approachPath } from '../src/game/dungeon-path.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { magneticLurePath } from '../src/game/magnetic-field.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** Prove baseline viability with public deductions, deliberate grounding and legal journal actions. */
export function defeatMagnetic(initial: Expedition): ExpeditionAction[] {
  let run = initial
  const actions: ExpeditionAction[] = []
  const safe = new Set<number>()

  /** Require every step to be accepted; this player never patches health, clues or AP. */
  function apply(action: ExpeditionAction): void {
    assert.ok(actions.length < 5000, 'Magnetic acceptance exceeded its action bound')
    const next = actExpedition(run, action)
    assert.notEqual(next, run, `Rejected ${JSON.stringify(action)} at ${run.player}`)
    actions.push(action)
    run = next
    assert.notEqual(run.phase, 'lost', 'Baseline magnetic player died')
  }

  /** Reserve one base AP on pulse turns so known routes never require gambling on a displacement. */
  function budget(): number {
    assert.ok(run.encounter?.kind === 'magnetic')
    return (
      run.encounter.points -
      Number(run.encounter.forecast.kind === 'field' && !run.encounter.braced)
    )
  }

  /** Defense is a real accepted action and shares the same turn clock as player input. */
  function end(): void {
    assert.ok(run.encounter?.kind === 'magnetic')
    if (run.encounter.forecast.kind === 'field' && !run.encounter.braced) apply({ type: 'brace' })
    apply({ type: 'end-turn' })
  }

  /** Walk the known shortest route a cell at a time, preserving the grounding budget. */
  function walk(target: number): void {
    while (run.player !== target) {
      if (budget() < 1) end()
      const path = walkingPath(run, target)
      assert.ok(path && path.length > 1, `No known path to ${target}`)
      apply({ type: 'move', index: path[1]! })
    }
  }

  // The decision surface contains only visible numbers and flags derived from those numbers.
  for (let pass = 0; pass < 1000; pass++) {
    const deduction = deduceMines(run.game, run.walls)
    for (const index of deduction.safe) safe.add(index)
    for (const index of deduction.mines) apply({ type: 'flag', index })
    const candidates = [...frontierCells(run)]
      .filter((index) => safe.has(index))
      .map((index) => ({ index, path: approachPath(run, index) }))
      .filter((entry) => entry.path)
    candidates.sort((a, b) => a.path!.length - b.path!.length || a.index - b.index)
    const target = candidates[0]
    if (!target) break
    walk(target.path!.at(-1)!)
    if (budget() < 1) end()
    apply({ type: 'reveal', index: target.index })
  }
  assert.ok(
    run.game.cells.every(
      (cell, index) => cell.visibility !== 'hidden' || run.walls.includes(index),
    ),
    'Public deductions left unexplored floor',
  )

  for (let cycle = 0; cycle < 12 && run.phase === 'boss'; cycle++) {
    assert.ok(run.encounter?.kind === 'magnetic')
    while (run.encounter.exposedUntil >= run.encounter.turn) {
      if (tacticalPlan(run, { type: 'attack' }).allowed) apply({ type: 'attack' })
      if (run.phase !== 'boss') break
      end()
      assert.ok(run.encounter?.kind === 'magnetic')
    }
    if (run.phase !== 'boss') break
    assert.ok(run.encounter?.kind === 'magnetic')
    const current = { ...run, encounter: run.encounter }
    const targets = run.encounter.anchors.flatMap((anchor) => {
      const route = magneticLurePath(current, anchor.index)
      if (!route) return []
      return adjacentSteps(run.game, anchor.index)
        .filter((index) => !route.includes(index) && walkingPath(run, index))
        .map((position) => ({ index: anchor.index, position }))
    })
    targets.sort(
      (a, b) =>
        (walkingPath(run, a.position)?.length ?? 1000) -
        (walkingPath(run, b.position)?.length ?? 1000),
    )
    const target = targets[0]
    assert.ok(target, 'No public lure and off-route attack position')
    walk(target.position)
    if (budget() < 1) end()
    apply({ type: 'interact', index: target.index })
    end()
  }
  assert.ok(run.phase === 'reward' || run.phase === 'won', 'Magnetic encounter did not finish')
  return actions
}
