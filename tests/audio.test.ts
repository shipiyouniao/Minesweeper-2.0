import { test } from 'node:test'
import assert from 'node:assert/strict'
import { act, createGame, PRESETS } from '../src/game/engine.js'
import { cueForMove, cuePriority, notesForCue } from '../src/audio/cues.js'
import { BrowserSoundEffects } from '../src/platform/browser-sound-effects.js'

test('unchanged states have no gameplay cue, flags toggle audibly, and a flood produces one cue', () => {
  const ready = createGame(PRESETS.easy, 31)
  const flagged = act(ready, { type: 'flag', index: 0 })
  const unflagged = act(flagged, { type: 'flag', index: 0 })
  const opened = act(ready, { type: 'reveal', index: 40 })

  assert.equal(cueForMove(ready, ready, 0), null)
  assert.equal(cueForMove(ready, flagged, 0), 'flag')
  assert.equal(cueForMove(flagged, unflagged, 0), 'unflag')
  assert.ok(opened.cells.filter((cell) => cell.visibility === 'revealed').length > 1)
  assert.equal(cueForMove(ready, opened, 40), 'reveal')
})

test('winning and losing replace the normal reveal cue', () => {
  const opened = act(createGame(PRESETS.easy, 31), { type: 'reveal', index: 40 })
  const mine = opened.cells.findIndex((cell) => cell.mine)
  const lost = act(opened, { type: 'reveal', index: mine })
  assert.equal(cueForMove(opened, lost, mine), 'loss')

  let game = opened

  for (const [index, cell] of opened.cells.entries()) {
    if (cell.mine) continue

    const next = act(game, { type: 'reveal', index })
    if (next.phase === 'won') assert.equal(cueForMove(game, next, index), 'win')
    game = next
  }

  assert.equal(game.phase, 'won')
})

test('sound plans stay quiet, bounded, and short enough for interaction feedback', () => {
  for (const cue of [
    'tap',
    'navigate',
    'dismiss',
    'blocked',
    'input',
    'confirm',
    'reveal',
    'flag',
    'unflag',
    'win',
    'loss',
    'damage',
    'shield',
    'heal',
    'magnet-pull',
    'magnet-push',
    'magnet-charge',
  ] as const) {
    const notes = notesForCue(cue)
    assert.ok(notes.length > 0 && notes.length <= 4)

    for (const note of notes) {
      assert.ok(note.frequency >= 80 && note.frequency <= 2000)
      assert.ok(note.endFrequency >= 80 && note.endFrequency <= 2000)
      assert.ok(note.gain > 0 && note.gain <= 0.1)
      assert.ok(note.duration >= 0.02 && note.delay >= 0)
      assert.ok(note.delay + note.duration <= 0.5)
    }
  }
})

test('gameplay and outcome feedback supersede navigation from the same gesture', () => {
  assert.ok(cuePriority('reveal') > cuePriority('dismiss'))
  assert.ok(cuePriority('flag') > cuePriority('navigate'))
  assert.ok(cuePriority('confirm') > cuePriority('input'))
  assert.ok(cuePriority('loss') > cuePriority('reveal'))
  assert.equal(cuePriority('win'), cuePriority('loss'))
})

test('missing Web Audio does not interrupt gameplay, muting, or repeated disposal', () => {
  const sounds = new BrowserSoundEffects(true)
  assert.equal(sounds.enabled, true)
  assert.doesNotThrow(() => {
    sounds.unlock()
    sounds.play('reveal')
    sounds.setEnabled(false)
    sounds.play('win')
    sounds.stop()
    sounds.dispose()
    sounds.dispose()
  })
  assert.equal(sounds.enabled, false)
})
