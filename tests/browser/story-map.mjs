import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
mkdirSync('.native/atlas-screenshots', { recursive: true })

/** Activate a visible marker through the real pointer path used by each device. */
async function activate(page, selector, touch) {
  const target = page.locator(selector)
  if (touch) await target.tap()
  else await target.click()
}

/** Drive native two-finger input, including a delayed final release that must not click a marker. */
async function pinch(page, box) {
  const cdp = await page.context().newCDPSession(page)
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2
  const left = { x: x - 30, y, id: 1 },
    right = { x: x + 30, y, id: 2 }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left, right] })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { ...left, x: x - 70 },
      { ...right, x: x + 70 },
    ],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [{ ...right, x: x + 70 }],
  })
  await page.waitForTimeout(850)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

try {
  for (const [width, lang] of [
    [320, 'zh'],
    [390, 'ja'],
    [1440, 'en'],
    [3840, 'zh'],
  ]) {
    const touch = width < 500
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: touch,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 4,
            camp: { supplies: 90, upgrades: [], completed: 0 },
            records: [],
            journal: null,
            story: {
              arrived: true,
              completed: ['reach-camp', 'meet-guide'],
              claimed: ['reach-camp', 'meet-guide'],
              mapOwned: true,
              campPosition: 31,
              journal: null,
            },
          }),
        ),
      key,
    )
    await page.goto(`${base}?page=story&lang=${lang}`)
    const save = await page.evaluate((key) => localStorage.getItem(key), key)
    await page.locator('[data-story-action="map"]').click()
    assert.equal(await page.locator('.atlas-tile').count(), 63)
    const legend = page.locator('.atlas-legend-toggle')
    assert.equal(await legend.innerText(), '')
    assert.ok(await legend.getAttribute('aria-label'))
    assert.equal(
      await legend.evaluate((el) => getComputedStyle(el).backgroundColor),
      'rgba(0, 0, 0, 0)',
    )
    const drawing = await page.locator('.atlas-canvas').boundingBox(),
      legendBox = await legend.boundingBox()
    assert.ok(
      legendBox.y >= drawing.y + drawing.height,
      'legend control must not overlap map content',
    )
    await legend.click()
    assert.equal(await page.locator('.atlas-landmarks li').count(), 7)
    await legend.click()
    const landmark = page.locator('.atlas-tile[data-map-name][role="button"]').first()
    if (touch) await landmark.tap()
    else await landmark.hover()
    assert.equal(
      await page.locator('.atlas-map-tip strong').innerText(),
      await landmark.getAttribute('data-map-name'),
    )

    await page.locator('.atlas-scale').click()
    assert.equal(await page.locator('.atlas-viewport').getAttribute('data-detail'), 'districts')
    assert.equal(await page.locator('[data-atlas-detail="places"] .atlas-node:visible').count(), 0)
    await activate(page, '[data-map-focus="camp"]', touch)
    assert.equal(await page.locator('.atlas-viewport').getAttribute('data-detail'), 'places')
    assert.equal(await page.locator('.atlas-viewport').getAttribute('data-zoom'), '2')
    assert.ok((await page.locator('.atlas-vector-tile').count()) <= 9)
    const camera = await page.locator('.atlas-scene').getAttribute('style')
    await legend.click()
    await legend.click()
    assert.equal(await page.locator('.atlas-scene').getAttribute('style'), camera)
    await page
      .locator('.story-atlas')
      .screenshot({ path: `.native/atlas-screenshots/${width}-${lang}-places.png` })
    await activate(page, '.atlas-node[data-scene="3"]', touch)
    assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'local')
    await page.locator('.atlas-back').click()
    assert.equal(
      await page.locator('.atlas-scene').getAttribute('style'),
      camera,
      'returning retains the region camera',
    )

    await page.locator('[data-map-zoom="reset"]').click()
    const viewport = await page.locator('.atlas-viewport').boundingBox()
    if (touch) {
      await pinch(page, viewport)
      assert.ok(Number(await page.locator('.atlas-viewport').getAttribute('data-zoom')) > 2)
      assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'region')
    } else {
      await page.locator('.atlas-viewport').focus()
      await page.keyboard.press('+')
      assert.equal(await page.locator('.atlas-viewport').getAttribute('data-zoom'), '1.25')
      await page.keyboard.press('ArrowRight')
      assert.match(await page.locator('.atlas-scene').getAttribute('style'), /translate\(-/)
    }
    await page.locator('[data-map-zoom="reset"]').click()
    await page.locator('.atlas-scale').click()
    assert.equal(await page.locator('.atlas-viewport').getAttribute('data-detail'), 'regions')
    await activate(page, '.atlas-region-node', touch)
    assert.equal(await page.locator('.atlas-viewport').getAttribute('data-detail'), 'districts')
    await activate(page, '[data-atlas-detail="districts"] [data-map-focus="camp"]', touch)
    assert.equal(await page.locator('.atlas-viewport').getAttribute('data-detail'), 'places')
    assert.ok(Number(await page.locator('.atlas-viewport').getAttribute('data-zoom')) > 4)
    await activate(page, '.atlas-node[data-scene="3"]', touch)
    assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'local')
    assert.equal(await page.locator('.story-map').getAttribute('data-map-scene'), '3')
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    assert.equal(
      await page.locator('.story-atlas').evaluate((el) => el.scrollWidth > el.clientWidth + 1),
      false,
    )
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.story-atlas').count(), 0)
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), save)
    assert.deepEqual(errors, [])
    await page.close()
    console.log(
      `${width}px ${lang}: tiled zoom, detail levels, direct destinations, camera restoration, legend and unchanged saves passed`,
    )
  }
} finally {
  await browser.close()
}
