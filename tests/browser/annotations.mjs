import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { battleFixture } from './battle-fixtures.mjs'
import { actExpedition, createExpedition } from '../../.native/tests/src/game/expedition.js'
import { chordTargets } from '../../.native/tests/src/game/engine.js'
import { tacticalPlan } from '../../.native/tests/src/game/tactical-planning.js'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixtures = [42, 43, 44].map((seed) => battleFixture(seed).entered)
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || undefined,
  headless: true,
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  reducedMotion: 'reduce',
})
await context.addInitScript((key) => {
  const fixture = sessionStorage.getItem('annotation-fixture')
  if (fixture) {
    localStorage.setItem(key, fixture)
    sessionStorage.removeItem('annotation-fixture')
  }
}, key)
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await mkdir(new URL('../../.native/annotation-ui/', import.meta.url), { recursive: true })

/** Restore only a legal replay inside a disposable browser context. */
async function seed(fixture, language = 'en') {
  await page.goto(`${base}?ruleset=expedition&lang=${language}`)
  await page.evaluate(
    (save) => sessionStorage.setItem('annotation-fixture', JSON.stringify(save)),
    fixture.save,
  )
  await page.reload()
  await page.locator('[data-side="a"]').waitFor()
}

/** Inspect accepted actions without reaching into the live application object. */
async function actions() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal.actions, key)
}

/** Derive a flag-count chord from visible numbers; fixture flags are placed with legal actions. */
function withChord(fixture) {
  let run = fixture.run
  const actions = [...fixture.save.journal.actions]
  const index = run.game.cells.findIndex(
    (cell, index) =>
      cell.visibility === 'revealed' &&
      cell.adjacent > 0 &&
      !run.walls.includes(index) &&
      run.game.cells.some(
        (other, target) =>
          other.visibility === 'hidden' &&
          !run.walls.includes(target) &&
          Math.abs(
            Math.floor(target / run.game.config.width) - Math.floor(index / run.game.config.width),
          ) <= 1 &&
          Math.abs((target % run.game.config.width) - (index % run.game.config.width)) <= 1,
      ),
  )
  assert.ok(index >= 0)
  const width = run.game.config.width
  for (let target = 0; target < run.game.cells.length; target++) {
    if (
      !run.game.cells[target].mine ||
      Math.abs(Math.floor(target / width) - Math.floor(index / width)) > 1 ||
      Math.abs((target % width) - (index % width)) > 1
    )
      continue
    const action = { type: 'flag', index: target }
    const next = actExpedition(run, action)
    if (next !== run) {
      actions.push(action)
      run = next
    }
  }
  assert.ok(chordTargets(run.game, index).length > 0)
  return { run, index, save: { ...fixture.save, journal: { ...fixture.save.journal, actions } } }
}

try {
  // Native mouse sequences exercise Windows-style context menus and drag cancellation.
  for (const fixture of fixtures) {
    await seed(fixture)
    await page.evaluate(() => {
      document.documentElement.dataset.rightBubbles = '0'
      for (const name of ['pointerdown', 'pointermove', 'mousedown', 'mousemove'])
        window.addEventListener(name, (event) => {
          if (event.buttons & 2)
            document.documentElement.dataset.rightBubbles = String(
              Number(document.documentElement.dataset.rightBubbles) + 1,
            )
        })
    })
    const index = Number(
      await page
        .locator('[data-side="a"] .cell.hidden:not(.wall-cell):not(.landmark-cell)')
        .first()
        .getAttribute('data-cell'),
    )
    const cell = page.locator(`[data-side="a"] [data-cell="${index}"]`)
    const before = await actions()
    await cell.click({ button: 'right' })
    assert.deepEqual(await actions(), [...before, { type: 'flag', index }])
    await cell.click({ button: 'right' })
    assert.deepEqual((await actions()).slice(-2), [
      { type: 'flag', index },
      { type: 'flag', index },
    ])
    await cell.scrollIntoViewIfNeeded()
    const box = await cell.boundingBox()
    const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const preDrag = await actions()
    await page.mouse.move(start.x, start.y)
    await page.mouse.down({ button: 'right' })
    await page.mouse.move(start.x + 75, start.y, { steps: 8 })
    await page.mouse.move(start.x, start.y, { steps: 8 })
    await page.mouse.up({ button: 'right' })
    assert.deepEqual(await actions(), preDrag)
    assert.equal(await page.locator('html').getAttribute('data-right-bubbles'), '0')
    await cell.click({ button: 'right' })
    assert.equal(
      (await actions()).length,
      preDrag.length + 1,
      'a fresh press works immediately after a cancelled drag',
    )
    const outsideMenu = await page
      .locator('[data-control="help"]')
      .evaluate((button) =>
        button.dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }),
        ),
      )
    assert.equal(outsideMenu, true, 'context menus outside cells remain available')
  }

  for (const language of ['en', 'zh', 'ja']) {
    const fixture = withChord(fixtures[0])
    await seed(fixture, language)
    const hidden = page
      .locator('[data-side="a"] .cell.hidden:not(.wall-cell):not(.landmark-cell)')
      .first()
    const index = Number(await hidden.getAttribute('data-cell'))
    await hidden.focus()
    await page.keyboard.press('s')
    assert.equal(
      await page.locator(`[data-side="a"] [data-cell="${index}"]`).getAttribute('data-number'),
      '',
    )
    assert.equal(
      await page.locator(`[data-side="a"] [data-cell="${index}"].suspected-safe`).count(),
      1,
    )
    await page.keyboard.press('s')
    assert.equal(await page.locator('.suspected-safe').count(), 0)
    await page.locator('[data-control="safe-mode"]').click()
    await hidden.click()
    assert.deepEqual((await actions()).at(-1), { type: 'mark-safe', index })
    await page.reload()
    assert.equal(await page.locator(`[data-cell="${index}"].suspected-safe`).count(), 1)
    const number = page.locator(`[data-side="a"] [data-cell="${fixture.index}"]`)
    await number.focus()
    await page.keyboard.press('c')
    assert.deepEqual((await actions()).at(-1), { type: 'chord', index: fixture.index })
    const current = (await actions()).reduce(
      actExpedition,
      createExpedition(fixture.save.journal.departure),
    )
    assert.ok(current.encounter.points >= 0)
    assert.deepEqual(
      await page
        .locator('[data-side="a"] .suspected-safe')
        .evaluateAll((cells) =>
          cells.map((cell) => Number(cell.dataset.cell)).sort((a, b) => a - b),
        ),
      [...current.game.safeMarks].sort((a, b) => a - b),
    )
    for (const width of [320, 390, 1280, 3840]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1400 })
      await page.waitForTimeout(120)
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${language} ${width} overflow`,
      )
      assert.equal(await page.locator('.variant-input-mode button').count(), 4)
      if (language === 'zh' && (width === 390 || width === 3840))
        await page.screenshot({
          path: new URL(
            `../../.native/annotation-ui/notes-${width}.png`,
            import.meta.url,
          ).pathname.replace(/^\/(\w:)/, '$1'),
          fullPage: true,
        })
    }
    await page.locator('[data-control="help"]').click()
    await page.locator('.board-help details').click()
    assert.ok((await page.locator('.board-help').innerText()).includes('Vimium'))
    await page.keyboard.press('Escape')
  }

  // A shielded hit and a later tool discovery have distinct, locked provenance in the DOM.
  const hazard = fixtures[0].run.game.cells.findIndex(
    (cell, index) => cell.mine && tacticalPlan(fixtures[0].run, { type: 'reveal', index }).allowed,
  )
  assert.ok(hazard >= 0)
  await seed(fixtures[0], 'zh')
  await page.locator(`[data-side="a"] [data-cell="${hazard}"]`).click()
  await page.locator(`[data-cell="${hazard}"].triggered-mine`).waitFor()
  assert.equal(await page.locator(`[data-cell="${hazard}"].confirmed-mine`).count(), 0)
  const afterHit = await actions()
  await page.locator(`[data-side="a"] [data-cell="${hazard}"]`).click({ button: 'right' })
  assert.deepEqual(await actions(), afterHit)
  await page.locator('[data-control="end-turn"]').click()
  const scanRun = (await actions()).reduce(
    actExpedition,
    createExpedition(fixtures[0].save.journal.departure),
  )
  const probe = scanRun.game.cells.findIndex(
    (cell, index) =>
      cell.mine && !scanRun.confirmedMines.includes(index) && !scanRun.walls.includes(index),
  )
  assert.ok(probe >= 0)
  await page.locator('[data-control="probe"]').click()
  await page.locator(`[data-side="a"] [data-cell="${probe}"]`).click()
  await page.locator(`[data-cell="${probe}"].confirmed-mine`).waitFor()
  assert.equal(await page.locator(`[data-cell="${hazard}"].triggered-mine`).count(), 1)
  assert.ok((await page.locator('.surveyed-safe').count()) > 0)
  const surveyed = await actions()
  await page.locator(`[data-side="a"] [data-cell="${probe}"]`).click({ button: 'right' })
  assert.deepEqual(await actions(), surveyed)

  // The same modes and vim keys work without tactical movement in classic play.
  for (const language of ['en', 'zh', 'ja']) {
    await page.goto(`${base}?ruleset=classic&lang=${language}`)
    const modes = ['reveal-mode', 'flag-mode', 'safe-mode', 'chord-mode']
    assert.equal(
      await page.locator('[data-action="reveal-mode"]').getAttribute('aria-pressed'),
      'true',
    )
    for (const selected of modes) {
      await page.locator(`[data-action="${selected}"]`).click()
      for (const mode of modes)
        assert.equal(
          await page.locator(`[data-action="${mode}"]`).getAttribute('aria-pressed'),
          String(mode === selected),
        )
    }
  }
  await page.goto(`${base}?ruleset=classic&lang=en`)
  await page.evaluate(() => localStorage.removeItem('minesweeper.v3.game.easy'))
  await page.reload()
  const first = page.locator('#board [data-cell="10"]')
  await first.focus()
  for (const [key, expected] of [
    ['h', 9],
    ['j', 18],
    ['k', 9],
    ['l', 10],
  ]) {
    await page.keyboard.press(key)
    assert.equal(await page.evaluate(() => document.activeElement.dataset.cell), String(expected))
  }
  await page.locator('[data-action="safe-mode"]').click()
  await first.focus()
  await page.keyboard.press('Space')
  assert.equal(await page.locator('#board .suspected-safe').count(), 1)
  await page.keyboard.press('s')
  assert.equal(await page.locator('#board .suspected-safe').count(), 0)
  await first.click({ button: 'right' })
  assert.equal(await page.locator('#board .flagged').count(), 1)
  for (const width of [320, 390, 1280, 3840]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  }
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      bosses: 3,
      languages: 3,
      widths: [320, 390, 1280, 3840],
      notes: true,
      chords: true,
      vimKeys: true,
      modeSelection: true,
      rightClicks: true,
      rightDragCancellation: true,
      errors,
    }),
  )
} finally {
  await browser.close()
}
