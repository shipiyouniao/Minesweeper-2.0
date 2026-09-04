import assert from 'node:assert/strict'
import { actExpedition } from '../src/game/expedition.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { occupied } from '../src/game/dungeon-occupancy.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** Find a publicly revealed approach that may require clearing a removable occupant first. */
export function broodApproach(run: Expedition): number[] {
  assert.ok(run.encounter?.kind === 'brood')
  const goals = adjacentSteps(run.game, run.encounter.boss)
  const parents = new Map<number, number>([[run.player, run.player]])
  const queue = [run.player]
  for (const current of queue) {
    if (goals.includes(current)) {
      const path = [current]
      while (path[0] !== run.player) path.unshift(parents.get(path[0]!)!)
      return path
    }
    for (const index of adjacentSteps(run.game, current)) {
      if (
        parents.has(index) ||
        run.walls.includes(index) ||
        run.game.cells[index]?.visibility !== 'revealed'
      )
        continue
      parents.set(index, current)
      queue.push(index)
    }
  }
  throw new Error('No revealed approach to queen')
}

/** Beat the queen from public terrain with no tools or relics, reserving protection before each turn. */
export function defeatBrood(initial: Expedition): ExpeditionAction[] {
  let run = initial
  const actions: ExpeditionAction[] = []
  for (let count = 0; count < 600 && run.phase === 'boss'; count++) {
    const encounter = run.encounter
    assert.ok(encounter?.kind === 'brood')
    const path = broodApproach(run)
    const action: ExpeditionAction =
      encounter.points <= 1
        ? { type: encounter.braced ? 'end-turn' : 'brace' }
        : path.length === 1
          ? { type: 'attack' }
          : { type: occupied(run, path[1]!) ? 'interact' : 'move', index: path[1]! }
    const next = actExpedition(run, action)
    assert.notEqual(next, run, JSON.stringify(action))
    assert.notEqual(next.phase, 'lost')
    actions.push(action)
    run = next
  }
  assert.ok(
    run.phase === 'reward' || run.phase === 'won',
    'queen must be beatable without purchases',
  )
  return actions
}
