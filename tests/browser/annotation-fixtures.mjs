import assert from 'node:assert/strict'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'
import { chordTargets, neighbors } from '../../.native/tests/src/game/engine.js'
import { occupied } from '../../.native/tests/src/game/dungeon-occupancy.js'

/** Derive a flag-count chord from visible numbers; fixture flags are placed with legal actions. */
export function withChord(fixture) {
  for (let index = 0; index < fixture.run.game.cells.length; index++) {
    let run = fixture.run
    const cell = run.game.cells[index]
    if (cell.visibility !== 'revealed' || cell.adjacent === 0 || occupied(run, index)) continue
    const actions = [...fixture.save.journal.actions]
    for (const target of neighbors(run.game.config, index)) {
      if (!run.game.cells[target].mine || run.game.cells[target].visibility === 'flagged') continue
      const action = { type: 'flag', index: target }
      const next = actExpedition(run, action)
      if (next !== run) {
        actions.push(action)
        run = next
      }
    }
    if (!chordTargets(run.game, index).some((target) => !occupied(run, target))) continue
    return { run, index, save: { ...fixture.save, journal: { ...fixture.save.journal, actions } } }
  }
  assert.fail(`No playable chord in ${fixture.run.encounter?.kind ?? 'floor'} fixture`)
}
