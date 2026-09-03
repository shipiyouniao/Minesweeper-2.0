import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createGame, PRESETS, snapshot } from '../src/game/engine.js'
import {
  decodeGameSnapshot,
  decodeLegacyScores,
  decodeScores,
  decodeSession,
} from '../src/persistence/decoders.js'

test('snapshot boundary rejects invalid JSON and non-object input before reaching the engine', () => {
  for (const text of [null, '{broken', 'null', '[]', 'true', '42', '"game"', '{}']) {
    assert.equal(decodeGameSnapshot(text), null)
  }

  const saved = snapshot(createGame(PRESETS.easy, 42))
  assert.deepEqual(decodeGameSnapshot(JSON.stringify(saved)), saved)
})

test('snapshot fields require concrete numeric and visibility values, including an explicit first click', () => {
  const saved = snapshot(createGame(PRESETS.easy, 42))
  const { firstClick, ...missingFirstClick } = saved
  assert.equal(firstClick, null)

  for (const invalid of [
    missingFirstClick,
    { ...saved, firstClick: '0' },
    { ...saved, firstClick: 81 },
    { ...saved, firstClick: 0.5 },
    { ...saved, seed: '42' },
    { ...saved, seed: 0x100000000 },
    { ...saved, seed: -1 },
    { ...saved, config: { ...saved.config, width: '9' } },
    { ...saved, config: { width: 10000, height: 10000, mines: 1 } },
    { ...saved, visible: ['hidden'] },
    { ...saved, visible: Array(81).fill('visible') },
    { ...saved, visible: Array(81).fill(null) },
  ]) {
    assert.equal(decodeGameSnapshot(JSON.stringify(invalid)), null)
  }
})

test('session envelopes reject wrong versions, negative durations and overflowing JSON numbers', () => {
  const saved = { version: 1, game: snapshot(createGame(PRESETS.easy, 42)), elapsed: 123 }
  assert.deepEqual(decodeSession(JSON.stringify(saved)), saved)

  for (const invalid of [
    { ...saved, version: 2 },
    { ...saved, elapsed: -1 },
    { ...saved, elapsed: '123' },
    { ...saved, game: null },
  ]) {
    assert.equal(decodeSession(JSON.stringify(invalid)), null)
  }

  assert.equal(
    decodeSession(JSON.stringify(saved).replace('"elapsed":123', '"elapsed":1e400')),
    null,
  )
})

test('record decoders retain valid neighbors while rejecting malformed fields', () => {
  const score = { id: 'winner', name: 'Player', milliseconds: 123, date: '2026-09-03T00:00:00Z' }
  const mixed = [
    null,
    [],
    score,
    { ...score, milliseconds: '123' },
    { ...score, milliseconds: -1 },
    { ...score, name: 'x'.repeat(33) },
    { ...score, date: 'bad date' },
  ]

  assert.deepEqual(decodeScores(JSON.stringify(mixed)), [score])
  assert.deepEqual(decodeScores('{}'), [])
  assert.deepEqual(decodeScores('{broken'), [])
})

test('legacy decoding recovers separate rank lists and rejects non-string legacy fields', () => {
  const legacy = decodeLegacyScores(
    JSON.stringify({
      easyRank: [null, { ID: 42, time: '0h1min30s' }, { ID: 'Original', time: '0h1min30s' }],
      hardRank: false,
      extraRank: [{ ID: 'Expert', time: '0h0min5s' }],
    }),
  )

  assert.ok(legacy)
  assert.equal(legacy.easy[0]?.milliseconds, 90000)
  assert.equal(legacy.easy[0]?.id, 'legacy-2')
  assert.deepEqual(legacy.medium, [])
  assert.equal(legacy.expert[0]?.milliseconds, 5000)
  assert.equal(decodeLegacyScores('[]'), null)
})
