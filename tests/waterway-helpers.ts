import assert from 'node:assert/strict'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { approachPath } from '../src/game/dungeon-path.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'
import { CURRENT_DEPARTURE } from './helpers.js'

export const WATERWAY_DEPARTURE = {
  ...CURRENT_DEPARTURE,
  seed: 0,
  campaign: 'old-waterway-v1' as const,
}

/** This plan knows the public circuit labels, but uses only visible numbers to open or flag cells. */
export function solveWaterway(): {
  readonly actions: readonly ExpeditionAction[]
  readonly run: Expedition
} {
  const actions: ExpeditionAction[] = []
  let run = createExpedition(WATERWAY_DEPARTURE)
  const apply = (action: ExpeditionAction): boolean => {
    const next = actExpedition(run, action)
    if (next === run) return false
    actions.push(action)
    run = next
    return true
  }
  /** Exhaust reachable deductions before moving a switch, without revealing the stairs early. */
  const explore = (): void => {
    for (let turn = 0; turn < 500; turn++) {
      let changed = false
      const knowledge = deduceMines(run.game, run.walls)
      for (const index of knowledge.mines)
        if (run.game.cells[index]?.visibility === 'hidden')
          changed = apply({ type: 'flag', index }) || changed
      for (const index of knowledge.safe)
        if (
          index !== run.exit &&
          run.game.cells[index]?.visibility === 'hidden' &&
          approachPath(run, index)
        )
          changed = apply({ type: 'reveal', index }) || changed
      if (!changed) return
    }
    assert.fail('Deductions did not settle')
  }
  for (const operations of [
    [156, 51, 156],
    [194, 72, 37, 72, 62, 194],
    [217, 81, 41, 81, 71, 130, 217],
  ]) {
    for (const index of operations) {
      explore()
      assert.ok(
        apply({ type: 'interact', index }),
        `floor ${run.floor}, device ${index}; player ${run.player}`,
      )
    }
    explore()
    assert.ok(
      apply({
        type: run.game.cells[run.exit]?.visibility === 'revealed' ? 'move' : 'reveal',
        index: run.exit,
      }),
    )
    assert.equal(run.health, run.maxHealth, 'No hidden-truth guesses, tools or damage needed')
    assert.equal(run.phase, run.floor === 3 ? 'won' : 'reward')
    if (run.phase === 'reward')
      assert.ok(
        apply({ type: 'relic', relic: run.offers.find((id) => id === 'purse') ?? run.offers[0]! }),
      )
  }
  return { actions, run }
}
