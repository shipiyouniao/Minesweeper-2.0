import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GameClock } from '../src/application/game-clock.js'
import { GameSession } from '../src/application/game-session.js'
import { Repository } from '../src/storage.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'

/** Compose production session/repository objects around deterministic external services. */
function fixture(): { session: GameSession; repository: Repository; runtime: FakeRuntime } {
  const runtime = new FakeRuntime()
  const repository = new Repository(new MemoryStorage())
  const session = new GameSession(repository, runtime, 'easy')

  return { session, repository, runtime }
}

/** Reveal every safe cell to reach a real engine win, without stubbing game rules. */
function win(session: GameSession): void {
  for (const [index, cell] of session.state.game.cells.entries()) {
    if (!cell.mine) {
      session.play({ type: 'reveal', index })
    }
  }
}

test('clock preserves active intervals and excludes repeated pauses/resumes', () => {
  const runtime = new FakeRuntime()
  const clock = new GameClock(runtime.now)

  clock.resume()
  runtime.milliseconds = 500
  clock.resume()
  assert.equal(clock.elapsed, 500)

  clock.pause()
  runtime.milliseconds = 2000
  clock.pause()
  assert.equal(clock.elapsed, 500)

  clock.resume()
  runtime.milliseconds = 2300
  assert.equal(clock.elapsed, 800)

  clock.reset(1234)
  assert.equal(clock.elapsed, 1234)
  assert.equal(clock.running, false)
})

test('first reveal starts time, pre-game flags and invalid moves do not', () => {
  const { session, runtime } = fixture()

  session.play({ type: 'flag', index: 0 })
  runtime.milliseconds = 5000
  assert.equal(session.running, false)
  assert.equal(session.state.elapsed, 0)
  assert.equal(session.play({ type: 'reveal', index: 0 }), false)

  session.play({ type: 'reveal', index: 40 })
  runtime.milliseconds = 6500
  assert.equal(session.state.elapsed, 1500)
  assert.equal(session.running, true)

  session.togglePause()
  runtime.milliseconds = 9000
  assert.equal(session.state.elapsed, 1500)
  assert.equal(session.play({ type: 'flag', index: 1 }), false)

  session.togglePause()
  runtime.milliseconds = 9300
  assert.equal(session.state.elapsed, 1800)
})

test('dialog replacement resumes only the pause introduced by that dialog', () => {
  const { session, runtime } = fixture()
  session.play({ type: 'reveal', index: 40 })
  runtime.milliseconds = 700

  session.openDialog()
  session.openDialog()
  session.togglePause()
  runtime.milliseconds = 5000
  assert.equal(session.state.elapsed, 700)
  assert.equal(session.state.paused, true)

  session.closeDialog()
  runtime.milliseconds = 5400
  assert.equal(session.state.elapsed, 1100)

  session.togglePause()
  session.openDialog()
  session.closeDialog()
  assert.equal(session.state.paused, true)
  assert.equal(session.running, false)
})

test('backgrounding while a dialog is open cancels automatic resume', () => {
  const { session, runtime, repository } = fixture()
  session.play({ type: 'reveal', index: 40 })
  runtime.milliseconds = 1200
  session.openDialog()

  // The game is already paused by the dialog when the document becomes hidden.
  session.suspend()
  runtime.milliseconds = 10000
  session.closeDialog()

  assert.equal(session.state.paused, true)
  assert.equal(session.running, false)
  assert.equal(session.state.elapsed, 1200)
  assert.equal(repository.load('easy')?.elapsed, 1200)
})

test('difficulty switching and reload preserve independent progress in a paused state', () => {
  const { session, runtime, repository } = fixture()
  session.play({ type: 'reveal', index: 40 })
  runtime.milliseconds = 2400
  const original = session.state.game

  session.changeDifficulty('medium')
  assert.equal(session.state.game.config.mines, 40)
  assert.equal(session.state.elapsed, 0)

  session.changeDifficulty('easy')
  assert.deepEqual(session.state.game, original)
  assert.equal(session.state.elapsed, 2400)
  assert.equal(session.state.paused, true)

  const restored = new GameSession(repository, runtime, 'easy')
  assert.deepEqual(restored.state.game, original)
  assert.equal(restored.running, false)
  assert.equal(restored.state.elapsed, 2400)

  session.changeDifficulty('easy')
  assert.deepEqual(session.state.game, original)
})

test('restart clears timer and dialog ownership; invalid custom input leaves state intact', () => {
  const { session, runtime } = fixture()
  session.play({ type: 'reveal', index: 40 })
  runtime.milliseconds = 300
  const previous = session.state.game

  assert.throws(
    () => session.changeDifficulty('custom', { width: 1, height: 1, mines: 1 }),
    RangeError,
  )
  assert.equal(session.state.game, previous)
  assert.equal(session.state.mode, 'easy')

  session.openDialog()
  runtime.seed = 99
  session.restart()
  session.closeDialog()

  assert.equal(session.state.game.seed, 99)
  assert.equal(session.state.game.phase, 'ready')
  assert.equal(session.state.elapsed, 0)
  assert.equal(session.state.paused, false)
  assert.equal(session.running, false)
})

test('a preset win records once, stops time, clears progress, and renames in place', () => {
  const { session, runtime, repository } = fixture()
  session.play({ type: 'reveal', index: 40 })
  runtime.milliseconds = 4321
  win(session)

  assert.equal(session.state.game.phase, 'won')
  assert.equal(session.running, false)
  assert.equal(repository.load('easy'), null)
  assert.equal(repository.scores('easy')[0]?.milliseconds, 4321)
  assert.equal(runtime.ids, 1)

  session.play({ type: 'reveal', index: 40 })
  session.renameRecord('  Ada  ')
  runtime.milliseconds = 9999
  assert.equal(runtime.ids, 1)
  assert.equal(repository.scores('easy').length, 1)
  assert.equal(repository.scores('easy')[0]?.name, 'Ada')
  assert.equal(session.state.elapsed, 4321)
})

test('custom wins and preset losses never add ranked records', () => {
  const { session, runtime, repository } = fixture()
  session.changeDifficulty('custom', { width: 5, height: 5, mines: 16 })
  session.play({ type: 'reveal', index: 12 })
  assert.equal(session.state.game.phase, 'won')
  assert.equal(session.state.currentScore, null)
  assert.equal(runtime.ids, 0)
  assert.deepEqual(repository.scores('custom'), [])

  session.changeDifficulty('easy')
  session.play({ type: 'reveal', index: 40 })
  runtime.milliseconds = 600
  const mine = session.state.game.cells.findIndex((cell) => cell.mine)
  session.play({ type: 'reveal', index: mine })
  assert.equal(session.state.game.phase, 'lost')
  assert.equal(session.running, false)
  assert.equal(repository.load('easy'), null)
  assert.deepEqual(repository.scores('easy'), [])
})
