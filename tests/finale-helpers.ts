import assert from 'node:assert/strict'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { approachPath } from '../src/game/dungeon-path.js'
import { campaignStage } from '../src/game/campaign-catalog.js'
import { defeatBattle } from './battle-helpers.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'
import { CURRENT_DEPARTURE } from './helpers.js'

/** Authored operation order follows public wiring labels; all excavations use visible clues only. */
export const FINALE_OPERATIONS = {
  'tower-control': [
    [140, 64, 140, 217],
    [156, 110, 72, 130, 156, 243],
    [175, 110, 72, 149, 175, 281],
  ],
  'northwest-bastion': [
    [123, 64, 123, 183],
    [156, 110, 72, 130, 156, 243],
  ],
} as const

/** Exercise the real engine from an unequipped departure to the final accepted result. */
export function solveFinale(stage: keyof typeof FINALE_OPERATIONS): {
  readonly actions: readonly ExpeditionAction[]
  readonly run: Expedition
} {
  let run = createExpedition({
    ...CURRENT_DEPARTURE,
    seed: 0,
    campaign: campaignStage(stage).revision,
  })
  const actions: ExpeditionAction[] = []
  const apply = (action: ExpeditionAction): boolean => {
    const next = actExpedition(run, action)
    if (next === run) return false
    actions.push(action)
    run = next
    return true
  }
  /** No oracle, scanner or guessed flag is needed to reach any control on the authored route. */
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
    assert.fail('Public deductions did not settle')
  }
  for (const operations of FINALE_OPERATIONS[stage]) {
    for (const index of operations) {
      explore()
      assert.ok(
        apply({ type: 'interact', index }),
        `${stage}, floor ${run.floor}, control ${index}`,
      )
    }
    explore()
    assert.ok(
      apply({
        type: run.game.cells[run.exit]?.visibility === 'revealed' ? 'move' : 'reveal',
        index: run.exit,
      }),
    )
    assert.equal(run.health, run.maxHealth, 'Exploration has a no-damage public solution')
    assert.ok(run.phase === 'reward' || run.phase === 'won')
    if (run.phase === 'reward')
      assert.ok(
        apply({ type: 'relic', relic: run.offers.find((id) => id === 'purse') ?? run.offers[0]! }),
      )
  }
  if (stage === 'northwest-bastion') {
    assert.equal(run.phase, 'boss')
    assert.equal(run.floor, 3)
    for (const action of defeatBattle(run)) assert.ok(apply(action))
  }
  assert.equal(run.phase, 'won')
  return { actions, run }
}
