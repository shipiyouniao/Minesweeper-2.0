import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseNavigation } from '../src/ui/input-parser.js'
import { PRESETS } from '../src/game/engine.js'
import { translations } from '../src/i18n.js'
import { cellContent, escapeHtml, formatTime, moveFocus } from '../src/ui/presentation.js'

test('covered mines and clues have identical public content during play', () => {
  const mine = cellContent(
    { mine: true, adjacent: 3, visibility: 'hidden' },
    false,
    translations.en,
  )
  const safe = cellContent(
    { mine: false, adjacent: 1, visibility: 'hidden' },
    false,
    translations.en,
  )

  assert.deepEqual(mine, safe)
  assert.equal(mine.html, '')
  assert.equal(mine.label, translations.en.closed)
})

test('player names are escaped at the HTML boundary', () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)"> & \'name\''),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;name&#39;',
  )
})

test('time formatting carries minutes and hours without rounding the score upward', () => {
  assert.equal(formatTime(59999, true), '00:59.9')
  assert.equal(formatTime(60000), '01:00')
  assert.equal(formatTime(3600123, true), '1:00:00.1')
})

test('keyboard movement respects edges and row-local Home/End', () => {
  assert.equal(moveFocus(PRESETS.easy, 0, 'arrowleft'), 0)
  assert.equal(moveFocus(PRESETS.easy, 8, 'arrowright'), 8)
  assert.equal(moveFocus(PRESETS.easy, 3, 'arrowup'), 3)
  assert.equal(moveFocus(PRESETS.easy, 79, 'arrowdown'), 79)
  assert.equal(moveFocus(PRESETS.easy, 40, 'home'), 36)
  assert.equal(moveFocus(PRESETS.easy, 40, 'end'), 44)
  assert.equal(moveFocus(PRESETS.easy, 40, 'arrowup'), 31)
  assert.equal(parseNavigation('f'), null)
})
