import assert from 'node:assert/strict'
import { actExpedition, frontierCells } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { walkingPath, approachPath } from '../src/game/dungeon-path.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { magneticLurePath, magneticProjection } from '../src/game/magnetic-field.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { neighbors } from '../src/game/engine.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** Prove baseline viability with public deductions, deliberate grounding and legal journal actions. */
export function defeatMagnetic(initial: Expedition): ExpeditionAction[] {
  let run = initial
  const actions: ExpeditionAction[] = []
  const safe = new Set<number>()
  let goal: number | null = null

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
      3 * Number(run.encounter.forecast.kind === 'field' && !run.encounter.braced)
    )
  }

  /** Defense is a real accepted action and shares the same turn clock as player input. */
  function end(): void {
    assert.ok(run.encounter?.kind === 'magnetic')
    if (run.encounter.forecast.kind === 'field') {
      const e = run.encounter
      const choices = run.game.cells
        .flatMap((_, index) => {
          const path = walkingPath(run, index)
          if (!path) return []
          return [false, true].flatMap((brace) => {
            if (path.length - 1 + Number(brace && !e.braced) > e.points) return []
            const projection = magneticProjection({
              ...run,
              player: index,
              encounter: { ...e, braced: e.braced || brace },
            })
            return projection.path.every(
              (cell) => run.game.cells[cell]?.visibility === 'revealed' || safe.has(cell),
            )
              ? [
                  {
                    path,
                    brace,
                    collision: projection.collision,
                    distance:
                      goal === null
                        ? 0
                        : (walkingPath({ ...run, player: projection.path.at(-1)! }, goal)?.length ??
                          1000),
                  },
                ]
              : []
          })
        })
        .sort(
          (a, b) =>
            Number(a.collision) * 10000 +
            a.distance * 10 +
            a.path.length +
            Number(a.brace) -
            Number(b.collision) * 10000 -
            b.distance * 10 -
            b.path.length -
            Number(b.brace),
        )
      assert.ok(
        choices[0],
        `No public safe landing: ${JSON.stringify({ player: run.player, points: e.points, braced: e.braced, forecast: e.forecast, turn: e.turn, health: run.health, near: adjacentSteps(run.game, run.player).map((index) => ({ index, v: run.game.cells[index]?.visibility, wall: run.walls.includes(index) })) })}`,
      )
      for (const index of choices[0].path.slice(1)) apply({ type: 'move', index })
      if (choices[0].brace && !e.braced) apply({ type: 'brace' })
    }
    apply({ type: 'end-turn' })
  }

  /** Walk the known shortest route a cell at a time, preserving the grounding budget. */
  function walk(target: number): void {
    goal = target
    while (run.player !== target) {
      if (budget() < 1) {
        end()
        continue
      }
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
    if (!target && deduction.mines.length) continue
    if (!target) break
    walk(target.path!.at(-1)!)
    while (budget() < 1) end()
    if (
      run.game.cells[target.index]?.visibility !== 'revealed' &&
      tacticalPlan(run, { type: 'reveal', index: target.index }).allowed
    )
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
        .filter((index) => walkingPath(run, index))
        .map((position) => ({ index: anchor.index, position }))
    })
    targets.sort(
      (a, b) =>
        (walkingPath(run, a.position)?.length ?? 1000) -
        (walkingPath(run, b.position)?.length ?? 1000),
    )
    const target = targets[0]
    assert.ok(target, 'No public lure and adjacent approach')
    walk(target.position)
    while (budget() < 1) {
      end()
      walk(target.position)
    }
    apply({ type: 'interact', index: target.index })
    end()
    const danger = new Set([target.index, ...neighbors(run.game.config, target.index)])
    assert.ok(run.encounter?.kind === 'magnetic' && run.encounter.forecast.kind === 'charge')
    const route = run.encounter.forecast.path
    const escapes = run.game.cells
      .flatMap((_, index) => {
        const path = walkingPath(run, index)
        return !danger.has(index) && !route.includes(index) && path && path.length - 1 <= budget()
          ? [{ index, distance: path.length }]
          : []
      })
      .sort((a, b) => a.distance - b.distance)
    assert.ok(escapes[0], 'No known escape within the full withdrawal turn')
    walk(escapes[0].index)
    end()
    walk(target.position)
  }
  assert.ok(run.phase === 'reward' || run.phase === 'won', 'Magnetic encounter did not finish')
  return actions
}
