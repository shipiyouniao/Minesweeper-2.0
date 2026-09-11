import assert from 'node:assert/strict'
import test from 'node:test'
import { createExpedition, actExpedition } from '../src/game/expedition.js'
import { enterChapterGuardian, guardianLayout } from '../src/game/chapter-guardian.js'
import {
  advanceBattleLesson,
  lessonSafeMove,
  parseBattleLesson,
} from '../src/game/battle-lesson.js'
import { battleThreat } from '../src/game/combat-build.js'
import { CURRENT_DEPARTURE } from './helpers.js'

/** Start from the real authored arena with one HP, no shields and no equipment bonuses. */
function firstBattle() {
  const layout = guardianLayout()
  return enterChapterGuardian({
    ...createExpedition({ ...CURRENT_DEPARTURE, seed: 0, campaign: 'northwest-bastion-v1' }),
    ...layout,
    floor: 3,
    player: layout.entrance,
    health: 1,
    shields: 0,
  })
}

test('the first boss coach has a legal safe move and ends a real turn without hurting a one-HP player', () => {
  const before = firstBattle()
  const index = lessonSafeMove(before)
  assert.notEqual(index, null)
  assert.equal(battleThreat(before.encounter!, index!, before.game.config), 0)
  const action = { type: 'move' as const, index: index! }
  const moved = actExpedition(before, action)
  assert.equal(moved.player, index)
  assert.ok(moved.encounter!.points < before.encounter!.points)
  assert.equal(advanceBattleLesson('move', before, moved, action), 'turn')
  const next = actExpedition(moved, { type: 'end-turn' })
  assert.equal(next.health, 1)
  assert.equal(next.shields, 0)
  assert.equal(next.encounter!.turn, 2)
  assert.equal(advanceBattleLesson('turn', moved, next, { type: 'end-turn' }), 'combat')
})

test('guide recommendations use public information, never skip on rejected actions and honor completion', () => {
  const run = firstBattle()
  const alternate = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell) =>
        cell.visibility === 'hidden' ? { ...cell, mine: !cell.mine } : cell,
      ),
    },
  }
  assert.equal(lessonSafeMove(run), lessonSafeMove(alternate))
  assert.equal(advanceBattleLesson('move', run, run, { type: 'move', index: run.player }), 'move')
  assert.equal(
    advanceBattleLesson('done', run, { ...run, player: 111 }, { type: 'move', index: 111 }),
    'done',
  )
  assert.equal(parseBattleLesson('bad'), 'points')
  assert.equal(lessonSafeMove({ ...run, encounter: { ...run.encounter!, points: 0 } }), null)
})
