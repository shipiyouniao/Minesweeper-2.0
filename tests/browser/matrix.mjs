import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { battleFixture } from './battle-fixtures.mjs'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'
import { professionCopy } from '../../.native/tests/src/ui/variant-copy.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixture = battleFixture(55)
assert.equal(fixture.entered.run.encounter.kind, 'matrix')
await mkdir('.native/matrix-ui', { recursive: true })
await writeFile('.native/matrix-ui/entered.json', JSON.stringify(fixture.entered.save))
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
try {
  for (const width of [390, 1440, 3840]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 3840 ? 2160 : 1000 },
      hasTouch: width === 390,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    /** Restore only a legal accepted journal in this isolated browser context. */
    async function seed(save, lang = 'zh') {
      await page.goto(`${base}?ruleset=expedition&lang=${lang}`)
      await page.evaluate(
        ({ key, save }) => sessionStorage.setItem('matrix-fixture', JSON.stringify({ key, save })),
        { key, save },
      )
      await page.reload()
      await page.locator('.matrix-core').waitFor()
      const skip = page.locator('[data-scene="skip"]')
      if (await skip.isVisible()) await skip.click()
      await page.waitForFunction(() =>
        [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      )
    }
    await page.addInitScript(() => {
      const value = sessionStorage.getItem('matrix-fixture')
      if (value) {
        const { key, save } = JSON.parse(value)
        localStorage.setItem(key, JSON.stringify(save))
        sessionStorage.removeItem('matrix-fixture')
      }
    })
    for (const lang of width === 1440 ? ['zh', 'en', 'ja'] : ['zh']) {
      await seed(fixture.entered.save, lang)
      assert.equal(await page.locator('.matrix-prism').count(), 3)
      assert.equal(await page.locator('.matrix-active').count(), 1)
      assert.equal(await page.locator('.matrix-grid [data-number]').count(), 0)
      assert.equal(await page.locator('.dungeon-player .landmark-clue').count(), 0)
      assert.ok(
        (await page.locator('.player-cell').getAttribute('aria-label')).includes(
          professionCopy(lang, fixture.entered.run.departure.profession).name,
        ),
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      const geometry = await page.evaluate(() => ({
        header: document.querySelector('.survey-column-heads').getBoundingClientRect().bottom,
        first: document.querySelector('.matrix-grid .cell').getBoundingClientRect().top,
        cell: document.querySelector('.matrix-grid .cell').getBoundingClientRect().width,
        icon: document.querySelector('.matrix-core img').getBoundingClientRect().width,
      }))
      assert.ok(geometry.header <= geometry.first, JSON.stringify(geometry))
      assert.ok(
        geometry.cell >= 24 && geometry.icon >= geometry.cell * 0.5,
        JSON.stringify(geometry),
      )
      await page.screenshot({ path: `.native/matrix-ui/${width}-${lang}.png`, fullPage: true })
      await page.locator('[data-control="help"]').first().click()
      assert.ok((await page.locator('dialog[open]').innerText()).length > 30)
      await page.keyboard.press('Escape')
    }
    // A native line button must work for a touch tap or a keyboard click, and persist its axis.
    const header = page.locator(
      `[data-control="matrix-row:${Math.floor(fixture.entered.run.game.config.height / 2)}"]`,
    )
    if (width === 390) await header.tap()
    else {
      await header.focus()
      await page.keyboard.press('Enter')
    }
    const journal = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal, key)
    assert.equal(journal.actions.at(-1).type, 'matrix-row')
    assert.ok(journal.actions.length > fixture.entered.save.journal.actions.length)
    await seed(fixture.objective.save)
    const target = page.locator(`[data-cell="${fixture.objective.action.index}"]`)
    if (width === 390) await target.tap()
    else await target.click()
    assert.ok((await page.locator('.matrix-return-row, .matrix-return-column').count()) > 0)
    await page.screenshot({ path: `.native/matrix-ui/${width}-reflection.png`, fullPage: true })
    // Once armed, the same tile remains a legal walking destination through ordinary input.
    if (width === 390) await target.tap()
    else await target.click()
    const movement = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).journal.actions.at(-1),
      key,
    )
    assert.deepEqual(movement, { type: 'move', index: fixture.objective.action.index })
    assert.ok(
      (await target.getAttribute('aria-label')).includes(
        professionCopy('zh', fixture.objective.run.departure.profession).name,
      ),
    )
    await page.locator('[data-control="end-turn"]').click()
    assert.equal(await page.locator('.matrix-exposed').count(), 1)
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal, key)
    const expected = actExpedition(actExpedition(fixture.objective.next, movement), {
      type: 'end-turn',
    })
    assert.equal(saved.actions.at(-1).type, 'end-turn')
    await page.reload()
    assert.equal(await page.locator('.matrix-exposed').count(), 1)
    assert.equal(expected.encounter.reflections, 1)
    assert.deepEqual(errors, [])
    await context.close()
  }
  console.log(
    'Matrix: touch/keyboard line actions, three locales, mobile/desktop/4K, clues, artwork, reflection and replay verified.',
  )
} finally {
  await browser.close()
}
