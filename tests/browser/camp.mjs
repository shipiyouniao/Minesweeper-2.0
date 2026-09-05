import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { upgradeCost } from '../../.native/tests/src/game/camp-progression.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const errors = []
const capture = process.env.CAPTURE_SCREENSHOTS === '1'

/** Read the persisted domain state without reaching into the application's controller. */
async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
}

/** Fail on page overflow, cropped item text or a detail panel covering its selected tile. */
async function layout(page, width) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  const selected = page.locator('.shop-tile[aria-pressed="true"]')
  if (!(await selected.count())) return
  const tile = await selected.boundingBox()
  const detail = await page.locator('.shop-detail').boundingBox()
  assert.ok(tile && detail)
  if (width <= 900) assert.ok(detail.y >= tile.y + tile.height - 1)
  else assert.ok(detail.x >= tile.x + tile.width)
  assert.ok(
    await page
      .locator('.shop-tile')
      .evaluateAll((tiles) => tiles.every((tile) => tile.scrollHeight <= tile.clientHeight + 1)),
  )
  assert.ok(
    await page.locator('.shop-tile').evaluateAll((tiles) => {
      const boxes = tiles.map((tile) => tile.getBoundingClientRect())
      return boxes.every((box, index) =>
        boxes.every(
          (other, second) =>
            index === second ||
            box.right <= other.left + 1 ||
            other.right <= box.left + 1 ||
            box.bottom <= other.top + 1 ||
            other.bottom <= box.top + 1,
        ),
      )
    }),
    'product tiles do not overlap',
  )
}

try {
  for (const language of ['en', 'zh', 'ja']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      reducedMotion: 'reduce',
    })
    await context.addInitScript(
      ({ key }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(
            key,
            JSON.stringify({
              version: 4,
              difficulty: 'standard',
              journal: null,
              records: [],
              camp: {
                supplies: 2800,
                completed: 8,
                upgrades: ['engineer', 'surveyor', 'workshop', 'steel-blade', 'medical-kit'],
              },
            }),
          )
      },
      { key },
    )
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}?ruleset=expedition&lang=${language}`)
    assert.equal(await page.locator('.camp-destinations button').count(), 4)
    assert.equal(
      await page
        .locator(
          '[data-control^="upgrade:"], [data-control^="profession:"], [data-control^="equipment:"]',
        )
        .count(),
      0,
    )
    await page.locator('[data-control="camp-page:shop"]').click()
    assert.equal(await page.locator('.shop-tile').count(), 26)
    assert.equal(await page.locator('[data-control^="upgrade:"]').count(), 1)

    for (const [category, count] of [
      ['all', 26],
      ['professions', 5],
      ['equipment', 6],
      ['relics', 12],
      ['camp', 3],
    ]) {
      await page.locator(`[data-control="shop-category:${category}"]`).click()
      assert.equal(await page.locator('.shop-tile').count(), count)
      const items = await page
        .locator('.shop-tile')
        .evaluateAll((tiles) => tiles.map((tile) => tile.dataset.control.slice(10)))
      const prices = items.map(upgradeCost)
      assert.deepEqual(
        prices,
        [...prices].sort((a, b) => a - b),
      )
      assert.equal(await page.locator('.shop-tile[aria-pressed="true"]').count(), 1)
      assert.equal((await saved(page)).camp.supplies, 2800)
    }
    await page.locator('[data-control="shop-category:all"]').click()
    await page.locator('[data-control="shop-item:archive"]').click()
    assert.ok(await page.locator('[data-control="upgrade:archive"]').isDisabled())
    await page.locator('[data-control="shop-item:alchemist"]').click()
    assert.equal((await saved(page)).camp.supplies, 2800)
    await page.keyboard.press('Tab')
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.control),
      'upgrade:alchemist',
    )
    await page.keyboard.press('Enter')
    assert.equal((await saved(page)).camp.supplies, 1900)
    assert.ok((await saved(page)).camp.upgrades.includes('alchemist'))
    assert.ok(await page.locator('[data-control="upgrade:alchemist"]').isDisabled())
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.control),
      'shop-item:alchemist',
    )
    await page.reload()
    assert.equal((await saved(page)).camp.supplies, 1900)

    await page.locator('[data-control="camp-page:professions"]').click()
    await page.locator('[data-control="profession:engineer"]').click()
    await page.locator('[data-control="camp-page:equipment"]').click()
    await page.locator('[data-control="equipment:steel-blade"]').click()
    await page.locator('[data-control="equipment:medical-kit"]').click()
    assert.ok(await page.locator('[data-control="equipment:probe"]').isDisabled())
    await page.locator('[data-control="camp-page:route"]').click()
    await page.locator('[data-control="difficulty:advanced"]').click()
    await page.locator('[data-control="camp-page:overview"]').click()
    assert.equal(await page.locator('.camp-loadout-summary li').count(), 2)
    assert.ok((await page.locator('.camp-route-summary').innerText()).includes('13 × 13'))

    for (const width of [320, 390, 900, 1024, 1440, 3840]) {
      await page.setViewportSize({ width, height: 1050 })
      await layout(page, width)
      if (capture && language === 'zh' && width === 1440)
        await page.screenshot({ path: 'docs/screenshots/camp-overview-after.png', fullPage: true })
      await page.locator('[data-control="camp-page:shop"]').click()
      await page.locator('[data-control="shop-category:all"]').click()
      await page.locator('[data-control="shop-item:survey-notes"]').click()
      await layout(page, width)
      if (capture && language === 'zh' && width === 1440) {
        await page.evaluate(() => scrollTo(0, 0))
        await page.screenshot({ path: 'docs/screenshots/camp-shop-desktop.png', fullPage: true })
      }
      if (capture && language === 'zh' && width === 390)
        await page.screenshot({ path: 'docs/screenshots/camp-shop-mobile.png' })
      await page.locator('[data-control="camp-page:overview"]').click()
    }
    await page.locator('[data-control="start"]').click()
    const departure = (await saved(page)).journal.departure
    assert.equal(departure.profession, 'engineer')
    assert.equal(departure.difficulty, 'advanced')
    assert.deepEqual(departure.equipment, ['steel-blade', 'medical-kit'])
    assert.equal(await page.locator('.camp-panel').count(), 0)
    await context.close()
  }

  // A fresh mobile player can inspect locked equipment and reach the Workshop from that screen.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}?ruleset=expedition&lang=zh`)
  await page.locator('[data-control="camp-page:shop"]').tap()
  await page.locator('[data-control="shop-category:professions"]').tap()
  await page.locator('[data-control="camp-page:equipment"]').tap()
  await page.locator('[data-control="shop-item:workshop"]').tap()
  assert.equal(
    await page.locator('.shop-tile[aria-pressed="true"]').getAttribute('data-control'),
    'shop-item:workshop',
  )
  assert.ok(await page.locator('[data-control="upgrade:workshop"]').isDisabled())
  await layout(page, 390)
  await context.close()
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      languages: 3,
      widths: [320, 390, 900, 1024, 1440, 3840],
      categories: 5,
      purchases: 26,
      inspectWithoutSpending: true,
      purchasePersistence: true,
      keyboardPurchase: true,
      departureChoices: true,
      mobileNavigation: true,
      errors,
    }),
  )
} finally {
  await browser.close()
}
