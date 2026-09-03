import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validConfig } from '../src/game/engine.js'
import { parseCommand, parseNavigation, parseSubmission } from '../src/ui/input-parser.js'

test('unrecognized UI strings are rejected before application dispatch', () => {
  assert.equal(parseCommand('restart-confirmed'), 'restart-confirmed')
  assert.equal(parseCommand('delete-all'), null)
  assert.equal(parseNavigation('home'), 'home')
  assert.equal(parseNavigation('f'), null)
  assert.equal(parseSubmission('unrecognized-form', new FormData()), null)
})

test('custom form values become a concrete config and missing or file values cannot become valid numbers', () => {
  const data = new FormData()
  data.set('width', '9')
  data.set('height', '9')
  data.set('mines', '10')
  assert.deepEqual(parseSubmission('custom-form', data), {
    kind: 'custom',
    config: { width: 9, height: 9, mines: 10 },
  })

  for (const value of ['', 'abc', new Blob(['9'])]) {
    data.set('width', value)
    const submission = parseSubmission('custom-form', data)
    assert.ok(submission?.kind === 'custom')
    assert.equal(validConfig(submission.config), false)
  }

  data.delete('width')
  const missing = parseSubmission('custom-form', data)
  assert.ok(missing?.kind === 'custom')
  assert.equal(validConfig(missing.config), false)
})

test('name submissions accept text without coercing a missing value or uploaded file', () => {
  const data = new FormData()
  assert.equal(parseSubmission('name-form', data), null)
  data.set('name', new Blob(['Player']))
  assert.equal(parseSubmission('name-form', data), null)
  data.set('name', 'Player')
  assert.deepEqual(parseSubmission('name-form', data), { kind: 'name', name: 'Player' })
})
