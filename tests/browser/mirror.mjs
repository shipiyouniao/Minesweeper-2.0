import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { battleFixture } from './battle-fixtures.mjs'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixture = battleFixture(46)
assert.equal(fixture.entered.run.encounter.kind, 'mirror')
const output = new URL('../../.native/mirror-ui/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || undefined,
  headless: true,
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  reducedMotion: 'reduce',
})
await context.addInitScript((key) => {
  const value = sessionStorage.getItem('mirror-fixture')
  if (value) {
    localStorage.setItem(key, value)
    sessionStorage.removeItem('mirror-fixture')
  }
}, key)
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))

/** Load a coherent accepted journal in a disposable browser context and wait for all sprites. */
async function seed(save, language = 'en') {
  await page.goto(`${base}?ruleset=expedition&lang=${language}`)
  await page.evaluate(
    (value) => sessionStorage.setItem('mirror-fixture', JSON.stringify(value)),
    save,
  )
  await page.reload()
  await page.locator('[data-control="shift"]').waitFor()
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  )
}

/** Observe persistence instead of reaching into private application fields. */
async function journal() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal, key)
}

try {
  for (const language of ['en', 'zh', 'ja']) {
    await seed(fixture.entered.save, language)
    assert.equal(await page.locator('.board').count(), 2)
    assert.equal(await page.locator('[data-side="b"]').getAttribute('aria-readonly'), 'true')
    for (const [slot, seal] of [
      ['a', fixture.entered.run.encounter.dawn.seal.index],
      ['b', fixture.entered.run.encounter.dusk.seal.index],
    ])
      assert.equal(
        await page.locator(`[data-side="${slot}"] [data-cell="${seal}"] .landmark-clue`).count(),
        0,
      )
    assert.ok(await page.locator('[data-control="attack"]').isDisabled())
    await page.locator('[data-control="help"]').click()
    assert.match(await page.locator('dialog[open]').innerText(), /5/)
    await page.keyboard.press('Escape')
    for (const width of [320, 390, 1280, 3840]) {
      await page.setViewportSize({ width, height: width === 3840 ? 2160 : 1000 })
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.board-viewport')].every(
          (area) => area.scrollWidth <= area.clientWidth + 1,
        ),
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      assert.ok(
        await page
          .locator('.board-viewport')
          .evaluateAll((areas) => areas.every((area) => area.scrollWidth <= area.clientWidth + 1)),
      )
      if (language === 'zh') {
        await page.locator('.mirror-boards').scrollIntoViewIfNeeded()
        await page.screenshot({
          path: fileURLToPath(new URL(`mirror-${width}.png`, output)),
          fullPage: true,
        })
      }
    }
    await page.setViewportSize({ width: 1280, height: 1000 })
    await seed(fixture.entered.save, language)
    const before = await journal()
    const comparison = page.locator('[data-side="b"] .cell.hidden:not(.landmark-cell)').first()
    await comparison.click()
    await comparison.click({ button: 'right' })
    assert.deepEqual(await journal(), before, 'comparison input must not change the active realm')
    await page.locator('[data-control="shift"]').click()
    const shifted = await journal()
    assert.deepEqual(shifted.actions.at(-1), { type: 'shift' })
    assert.equal(shifted.actions.length, before.actions.length + 1)
    assert.equal(await page.locator('.mirror-active').getAttribute('data-realm'), 'dusk')
    assert.equal(
      await page.locator('[data-side="a"] .boss-cell img').getAttribute('src'),
      new URL('assets/dungeon/mirror-dusk.png', base).pathname,
    )
    await page.reload()
    assert.deepEqual(await journal(), shifted)
    assert.equal(await page.locator('.mirror-active').getAttribute('data-realm'), 'dusk')
    const model = actExpedition(fixture.entered.run, { type: 'shift' })
    assert.equal(
      await page.locator('[data-side="a"] .player-cell').getAttribute('data-cell'),
      String(model.player),
    )
    await page.locator('[data-control="probe"]').click()
    await page.locator('[data-control="shift"]').click()
    assert.equal(await page.locator('.tool-target').count(), 0)
    assert.equal(await page.locator('[data-control="probe"]').getAttribute('aria-pressed'), 'false')
  }
  await seed(fixture.objective.save, 'zh')
  await page.locator(`[data-side="a"] [data-cell="${fixture.objective.action.index}"]`).click()
  assert.deepEqual((await journal()).actions.at(-1), fixture.objective.action)
  assert.equal(await page.locator('[data-side="a"] .mirror-inert').count(), 1)
  await seed(fixture.last.save, 'en')
  await page.locator('[data-control="attack"]').click()
  await page.locator('.relic-dialog[open]').waitFor()
  assert.equal((await journal()).actions.length, fixture.last.save.journal.actions.length + 1)
  await page.reload()
  await page.locator('.relic-dialog[open]').waitFor()
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      languages: 3,
      widths: [320, 390, 1280, 3840],
      hiddenClues: true,
      readOnlyComparison: true,
      shiftAndReplay: true,
      toolCancellation: true,
      sealInteraction: true,
      victoryAndRecovery: true,
      errors,
    }),
  )
} finally {
  await browser.close()
}
