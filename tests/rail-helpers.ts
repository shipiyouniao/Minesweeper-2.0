import assert from 'node:assert/strict'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { approachPath } from '../src/game/dungeon-path.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { CampSession } from '../src/application/camp-session.js'
import { createStoryRun } from '../src/game/story.js'
import { checkpointStory } from '../src/game/story-checkpoint.js'
import type { VariantRepository } from '../src/persistence/variant-repository.js'
import type { ExpeditionAction } from '../src/types/variants.js'
import { CURRENT_DEPARTURE, FakeRuntime } from './helpers.js'

/** The routing order is authored; every excavation still requires public Minesweeper deductions. */
export const RAIL_OPERATIONS = [
  [78, 112, 78],
  [88, 125, 88, 89, 88, 89, 125, 88, 131, 88],
  [105, 142, 105, 105, 106, 80, 105, 105],
] as const

/** Exercise all three floors through the same commands accepted from pointer, touch and keyboard. */
export function solveRescue(): readonly ExpeditionAction[] {
  let run = createExpedition({ ...CURRENT_DEPARTURE, seed: 0, campaign: 'quarry-rescue-v1' })
  const actions: ExpeditionAction[] = []
  const apply = (action: ExpeditionAction): boolean => {
    const next = actExpedition(run, action)
    if (next === run) return false
    run = next
    actions.push(action)
    return true
  }
  const explore = (): void => {
    for (let count = 0; count < 500; count++) {
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
    assert.fail('Deduction loop failed to settle')
  }
  for (const operations of RAIL_OPERATIONS) {
    for (const index of operations) {
      explore()
      assert.ok(apply({ type: 'interact', index }), `Floor ${run.floor}, lever ${index}`)
    }
    explore()
    assert.ok(
      apply({
        type: run.game.cells[run.exit]?.visibility === 'revealed' ? 'move' : 'reveal',
        index: run.exit,
      }),
    )
    assert.equal(run.health, run.maxHealth, 'A complete public solution takes no damage')
    assert.ok(run.phase === 'reward' || run.phase === 'won')
    if (run.phase === 'reward')
      assert.ok(
        apply({ type: 'relic', relic: run.offers.find((id) => id === 'purse') ?? run.offers[0]! }),
      )
  }
  assert.equal(run.phase, 'won')
  return actions
}

/** The branch opens before any main dungeon is cleared, beside a separately paused roguelite. */
export function readyRescue(repo: VariantRepository, atGate = true): CampSession {
  new ExpeditionSession(repo, new FakeRuntime()).start('explorer', [])
  const camp = new CampSession(repo)
  const quarry = createStoryRun(4)
  camp.saveStory({
    ...camp.story,
    arrived: true,
    mapOwned: true,
    completed: ['reach-camp', 'meet-guide', 'survey-road'],
    facts: ['camp-reached', 'guide-met', 'lift-discovered'],
    dialogue: {
      completed: [
        'wake',
        'flag',
        'open',
        'travel',
        'trail',
        'approach',
        'arrival',
        'guide',
        'north-road-start',
        'north-road-found',
        'quarry-lead',
      ],
      active: null,
    },
    world: checkpointStory({ ...quarry, player: atGate ? 25 : 24 }),
  })
  camp.acceptDiscoveredRoutes()
  return camp
}
