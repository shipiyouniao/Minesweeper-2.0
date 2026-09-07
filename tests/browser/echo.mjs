import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { battleFixture } from './battle-fixtures.mjs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const fixture = battleFixture(53)
assert.equal(fixture.entered.run.encounter.kind, 'echo')
await mkdir('.native/echo-ui', { recursive: true })
await writeFile('.native/echo-ui/save.json', JSON.stringify(fixture.entered.save))
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
try {
  for (const width of [390, 1280])
    for (const language of ['zh', 'en', 'ja']) {
      const context = await browser.newContext({
        viewport: { width, height: 950 },
        hasTouch: width === 390,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.addInitScript((save) => {
        if (!sessionStorage.getItem('echo-seeded')) {
          localStorage.setItem('minesweeper.variants.v1.expedition', JSON.stringify(save))
          sessionStorage.setItem('echo-seeded', 'yes')
        }
      }, fixture.entered.save)
      await page.goto(`${base}?ruleset=expedition&lang=${language}`)
      await page.locator('.echo-body').first().waitFor()
      const skip = page.locator('[data-scene="skip"]')
      if (await skip.isVisible()) await skip.click()
      assert.equal(await page.locator('.echo-body').count(), 3)
      assert.equal(await page.locator('.boss-cell').count(), 3)
      assert.equal(await page.locator('.echo-located').count(), 0)
      await page.waitForFunction(() =>
        [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      assert.ok(
        await page
          .locator('.echo-obscured')
          .evaluateAll((cells) =>
            cells.every(
              (cell) =>
                !cell.hasAttribute('data-number') &&
                !/\d+ mines/.test(cell.getAttribute('aria-label') || ''),
            ),
          ),
      )
      const target = page.locator(
        `[data-side="a"] [data-cell="${fixture.entered.run.encounter.bodies[0]}"]`,
      )
      await page.locator('[data-tool="sonar"]').click()
      await target.click()
      await page.locator('.expedition-sonar-log li').first().waitFor()
      assert.equal(await page.locator('.expedition-sonar-log li').count(), 1)
      const saved = await page.evaluate(() =>
        localStorage.getItem('minesweeper.variants.v1.expedition'),
      )
      await page.reload()
      await page.locator('.echo-body').first().waitFor()
      if (await skip.isVisible()) await skip.click()
      assert.equal(await page.locator('.expedition-sonar-log li').count(), 1)
      assert.equal(
        await page.evaluate(() => localStorage.getItem('minesweeper.variants.v1.expedition')),
        saved,
      )
      const dropTarget = page.locator(
        `[data-side="a"] [data-cell="${fixture.entered.run.encounter.bodies[1]}"]`,
      )
      await dropTarget.scrollIntoViewIfNeeded()
      const from = await page.locator('[data-tool="sonar"]').boundingBox()
      const to = await dropTarget.boundingBox()
      const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
      const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
      if (width === 390) {
        const cdp = await context.newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ ...start, id: 1 }],
        })
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ ...end, id: 1 }],
        })
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await cdp.detach()
      } else {
        await page.mouse.move(start.x, start.y)
        await page.mouse.down()
        await page.mouse.move(end.x, end.y, { steps: 8 })
        await page.mouse.up()
      }
      await page.waitForFunction(
        () => document.querySelectorAll('.expedition-sonar-log li').length === 2,
      )
      assert.equal(await page.locator('.echo-located').count(), 1)
      await page.locator('[data-sonar-reading]').first().click()
      assert.ok((await page.locator('.sonar-observed').count()) > 0)
      await page.waitForTimeout(400) // Allow the tool controller's synthetic-click guard to expire.
      await page.locator('[data-control="help"]').click()
      assert.equal(await page.locator('dialog[open] .boss-picture-steps li').count(), 3)
      await page.keyboard.press('Escape')
      await page.locator('[data-side="a"]').scrollIntoViewIfNeeded()
      await page.screenshot({ path: `.native/echo-ui/${language}-${width}.png`, fullPage: true })
      assert.deepEqual(errors, [])
      await context.close()
    }
} finally {
  await browser.close()
}
console.log(
  'Echo desktop/mobile locales, public bodies, scans, replay and illustrated guide passed.',
)
