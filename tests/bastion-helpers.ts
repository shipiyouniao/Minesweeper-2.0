import assert from 'node:assert/strict'
import { actExpedition, frontierCells } from '../src/game/expedition.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { neighbors } from '../src/game/engine.js'
import { walkingPath } from '../src/game/dungeon-path.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** Infer the ring mines using only revealed clues and prior deductions, never covered mine values. */
export function deduceBastionMines(run: Expedition): Set<number> {
  const safe = new Set(
    run.game.cells.flatMap((cell, index) => (cell.visibility === 'revealed' ? [index] : [])),
  )
  const mines = new Set<number>()
  for (let pass = 0; pass < run.game.cells.length; pass++) {
    const before = safe.size + mines.size
    for (const [index, cell] of run.game.cells.entries()) {
      if (cell.visibility !== 'revealed' || run.walls.includes(index)) continue
      const ring = neighbors(run.game.config, index)
      const hidden = ring.filter((other) => !safe.has(other) && !mines.has(other))
      const left = cell.adjacent - ring.filter((other) => mines.has(other)).length
      if (left === 0) for (const other of hidden) safe.add(other)
      else if (left === hidden.length) for (const other of hidden) mines.add(other)
    }
    if (before === safe.size + mines.size) break
  }
  assert.equal(mines.size, 4, 'all four mines must be deducible from public clues')
  return mines
}

/** Produce a legal zero-tool victory transcript; brace makes every explicit turn safe. */
export function defeatBastion(initial: Expedition): ExpeditionAction[] {
  assert.ok(initial.encounter?.kind === 'bastion')
  let run = initial
  const actions: ExpeditionAction[] = []
  /** Commit one action and reject a stalled fixture immediately. */
  function apply(action: ExpeditionAction): void {
    const next = actExpedition(run, action)
    assert.notEqual(next, run, JSON.stringify(action))
    assert.notEqual(next.phase, 'lost')
    run = next
    actions.push(action)
  }
  /** End a protected turn so the next action has its full public budget. */
  function refresh(): void {
    if (run.phase !== 'boss') return
    apply({ type: 'brace' })
    apply({ type: 'end-turn' })
  }
  /** Walk one known safe cell at a time while reserving enough AP for protection. */
  function approach(destination: number): void {
    const path = adjacentSteps(run.game, destination)
      .map((index) => walkingPath(run, index))
      .filter((entry): entry is number[] => entry !== null)
      .sort((a, b) => a.length - b.length)[0]
    assert.ok(path)
    for (const index of path.slice(1)) {
      apply({ type: 'move', index })
      refresh()
    }
  }

  for (const index of deduceBastionMines(run)) apply({ type: 'flag', index })
  assert.ok(run.encounter?.kind === 'bastion')
  for (const pylon of run.encounter.pylons) {
    // Cardinal cells around a pylon are publicly deduced safe. Open the nearest one first.
    const targets = adjacentSteps(run.game, pylon.index)
    if (targets.some((index) => walkingPath(run, index))) {
      approach(pylon.index)
      apply({ type: 'interact', index: pylon.index })
      refresh()
      continue
    }
    const target = targets.find((index) => frontierCells(run).has(index))
    assert.notEqual(target, undefined)
    approach(target!)
    apply({ type: 'reveal', index: target! })
    refresh()
    apply({ type: 'interact', index: pylon.index })
    refresh()
  }
  approach(run.encounter.boss)
  while (run.phase === 'boss') {
    apply({ type: 'attack' })
    refresh()
  }
  assert.ok(run.phase === 'won' || run.phase === 'reward')
  return actions
}
