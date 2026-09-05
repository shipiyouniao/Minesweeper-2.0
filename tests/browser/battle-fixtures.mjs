import assert from 'node:assert/strict'
import { EXPEDITION_RULES_REVISION } from '../../.native/tests/src/persistence/expedition-format.js'
import {
  actExpedition,
  createExpedition,
  frontierCells,
  expeditionEarnings,
} from '../../.native/tests/src/game/expedition.js'
import { walkingPath } from '../../.native/tests/src/game/dungeon-path.js'
import { defeatBattle } from '../../.native/tests/tests/battle-helpers.js'

/** Reach an actual checkpoint with legal actions, then retain critical public-player prefixes. */
export function battleFixture(seed) {
  const departure = {
    seed,
    difficulty: 'standard',
    profession: 'explorer',
    equipment: [],
    archive: false,
    packs: [],
    training: [],
    battleRelics: false,
  }
  let run = createExpedition(departure)
  const actions = []
  const camp = { supplies: 0, upgrades: [], completed: 0 }
  /** Copy the coherent journal before a real browser action. */
  const save = () => ({
    version: 4,
    camp,
    records: [],
    journal: {
      rulesRevision: EXPEDITION_RULES_REVISION,
      returnSupplies: expeditionEarnings({ ...run, phase: 'retreated' }),
      departure,
      actions: [...actions],
    },
  })
  for (let count = 0; run.phase !== 'boss' && count < 1500; count++) {
    const action =
      run.phase === 'reward'
        ? { type: 'relic', relic: run.offers[0] }
        : walkingPath(run, run.exit)
          ? { type: 'move', index: run.exit }
          : {
              type: 'reveal',
              index: [...frontierCells(run)].find((index) => !run.game.cells[index].mine),
            }
    const next = actExpedition(run, action)
    assert.notEqual(next, run)
    actions.push(action)
    run = next
  }
  assert.equal(run.phase, 'boss')
  const entered = { run, save: save() }
  let objective
  let prime
  let last
  for (const action of defeatBattle(run)) {
    const next = actExpedition(run, action)
    if (
      !objective &&
      (next.encounter.event === 'disabled' || next.encounter.event === 'nest-destroyed')
    )
      objective = { save: save(), action, run, next }
    if (!prime && next.encounter.event === 'window-opened')
      prime = { save: save(), action, run, next }
    if (next.phase !== 'boss') last = { save: save(), action, run, next }
    actions.push(action)
    run = next
  }
  return { entered, objective, prime, last }
}
