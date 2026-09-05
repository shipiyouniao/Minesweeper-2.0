import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { battleFixture } from './battle-fixtures.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixtures = [battleFixture(42).entered, battleFixture(43).entered, battleFixture(44).entered]
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || undefined,
  headless: true,
})
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
  reducedMotion: 'reduce',
})
await context.addInitScript((key) => {
  const fixture = sessionStorage.getItem('touch-fixture')
  if (fixture) {
    localStorage.setItem(key, fixture)
    sessionStorage.removeItem('touch-fixture')
  }
}, key)
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
const errors = []
page.on('pageerror', (error) => errors.push(error.message))

/** Seed a legal boss journal only in this disposable mobile browser context. */
async function seed(save, language) {
  await page.goto(`${base}?ruleset=expedition&lang=${language}`)
  await page.evaluate((save) => sessionStorage.setItem('touch-fixture', JSON.stringify(save)), save)
  await page.reload()
}

/** Observe accepted public input through the persisted action log. */
async function actions() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal.actions, key)
}

/** Position a covered ordinary cell before sending real touch input at its center. */
async function target() {
  const cell = page.locator('.cell.hidden:not(.wall-cell):not(.landmark-cell)').first()
  await cell.scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
  const box = await cell.boundingBox()
  return {
    index: Number(await cell.getAttribute('data-cell')),
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  }
}

/** Read page and inner-board geometry to catch a moving row even without a scroll event. */
async function geometry() {
  return page.evaluate(() => {
    const board = document.querySelector('.board')
    return {
      page: scrollY,
      top: board.getBoundingClientRect().top,
      left: board.parentElement.scrollLeft,
      inner: board.parentElement.scrollTop,
    }
  })
}

/** Compare after layout settles, allowing only subpixel rounding. */
async function stable(before) {
  await page.waitForTimeout(100)
  const after = await geometry()
  for (const field of Object.keys(before))
    assert.ok(
      Math.abs(after[field] - before[field]) <= 1,
      `${field} shifted: ${JSON.stringify({ before, after })}`,
    )
}

/** Send a native touch sequence; DOM-dispatched pointer events cannot exercise scrolling. */
async function touch(type, point) {
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: point ? [{ x: point.x, y: point.y, id: 1 }] : [],
  })
}

try {
  for (const fixture of fixtures) {
    for (const language of ['en', 'zh', 'ja']) {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 })
        await seed(fixture.save, language)
        const point = await target()
        const before = await geometry()
        const original = await actions()
        await touch('touchStart', point)
        await page.waitForTimeout(550)
        assert.deepEqual(await actions(), [...original, { type: 'flag', index: point.index }])
        await stable(before)

        // Some mobile browsers deliver a native menu on a retargeted cell after the hold.
        await page
          .locator(`[data-side="a"] [data-cell="${point.index + 1}"]`)
          .dispatchEvent('contextmenu')
        await touch('touchEnd')
        await stable(before)
        await page
          .locator(`[data-side="a"] [data-cell="${point.index + 1}"]`)
          .dispatchEvent('contextmenu')
        assert.deepEqual(await actions(), [...original, { type: 'flag', index: point.index }])

        // A fresh gesture is immediately usable; it must not inherit synthetic-click suppression.
        await touch('touchStart', point)
        await page.waitForTimeout(550)
        await touch('touchEnd')
        await stable(before)
        assert.deepEqual((await actions()).slice(-2), [
          { type: 'flag', index: point.index },
          { type: 'flag', index: point.index },
        ])

        await seed(fixture.save, language)
        await page.locator('[data-control="flag-mode"]').tap()
        const tap = await target()
        const tapGeometry = await geometry()
        await page.touchscreen.tap(tap.x, tap.y)
        await stable(tapGeometry)
        assert.deepEqual(await actions(), [...original, { type: 'flag', index: tap.index }])

        await seed(fixture.save, language)
        const swipe = await target()
        const scrollBefore = await geometry()
        await touch('touchStart', swipe)
        for (let step = 1; step <= 8; step++) {
          await touch('touchMove', { ...swipe, y: swipe.y - step * 15 })
          await page.waitForTimeout(30)
        }
        await touch('touchEnd')
        await page.waitForTimeout(550)
        assert.deepEqual(await actions(), original, 'swiping must not flag or reveal')
        assert.ok(
          (await geometry()).page > scrollBefore.page + 30,
          'board swipe must scroll the page',
        )
      }
    }
  }

  // Enlarged boards must still pan horizontally and hand vertical scrolling to the page.
  await seed(fixtures[0].save, 'zh')
  await page.locator('[data-control="zoom"]').tap()
  const point = await target()
  const box = await page.locator('.board-viewport').boundingBox()
  const pan = { x: box.x + box.width * 0.8, y: point.y }
  const before = await actions()
  await touch('touchStart', pan)
  for (let step = 1; step <= 8; step++) {
    await touch('touchMove', { x: pan.x - step * 15, y: pan.y })
    await page.waitForTimeout(30)
  }
  await touch('touchEnd')
  await page.waitForTimeout(550)
  assert.ok((await geometry()).left > 30)
  assert.deepEqual(await actions(), before)

  await seed(fixtures[0].save, 'zh')
  await page.locator('[data-control="probe"]').tap()
  const probe = await target()
  const probeBefore = await actions()
  await touch('touchStart', probe)
  await page.waitForTimeout(550)
  assert.deepEqual(await actions(), probeBefore, 'an armed tool must not become a flag hold')
  await touch('touchEnd')
  await page.waitForTimeout(100)
  assert.deepEqual((await actions()).at(-1), { type: 'probe', index: probe.index })

  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      bosses: 3,
      languages: 3,
      widths: [320, 390],
      nativeTouch: true,
      stableRows: true,
      oneFlagPerHold: true,
      tapFlagMode: true,
      swipeCancellation: true,
      pageScroll: true,
      enlargedPan: true,
      toolPriority: true,
      errors,
    }),
  )
} finally {
  await browser.close()
}
