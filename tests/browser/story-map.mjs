import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
mkdirSync('.native/story-screenshots', { recursive: true })
const key = 'minesweeper.variants.v1.expedition'
try {
  for (const width of [390, 1440])
    for (const lang of ['zh', 'en', 'ja']) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        hasTouch: width === 390,
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
      assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'local')
      assert.equal(await page.locator('.atlas-tile').count(), 63)
      assert.equal(await page.locator('.atlas-tile .atlas-position').count(), 1)
      assert.equal(await page.locator('.atlas-legend').count(), 0)
      await page.locator('.atlas-legend-toggle').click()
      assert.equal(await page.locator('.atlas-landmarks li').count(), 7)
      assert.equal(await page.locator('.atlas-legend-toggle').getAttribute('aria-expanded'), 'true')
      if (lang === 'zh')
        await page
          .locator('.story-atlas')
          .screenshot({ path: `.native/story-screenshots/atlas-legend-${width}.png` })
      await page.locator('.atlas-legend-toggle').click()
      assert.equal(await page.locator('.atlas-legend').count(), 0)
      const landmark = page.locator('.atlas-tile[data-map-name][role="button"]').first()
      if (width === 390) await landmark.tap()
      else await landmark.hover()
      assert.equal(
        await page.locator('.atlas-map-tip strong').innerText(),
        await landmark.getAttribute('data-map-name'),
      )
      if (lang === 'zh')
        await page
          .locator('.story-atlas')
          .screenshot({ path: `.native/story-screenshots/atlas-name-${width}.png` })
      for (const level of ['local', 'region', 'world']) {
        if (level !== 'local') await page.locator('.atlas-scale').click()
        assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), level)
        assert.equal(Number(await page.locator('.atlas-viewport').getAttribute('data-zoom')), 1)
        await page.locator('.atlas-zoom input').fill('200')
        assert.equal(Number(await page.locator('.atlas-viewport').getAttribute('data-zoom')), 2)
        await page.locator('.atlas-legend-toggle').click()
        assert.equal(Number(await page.locator('.atlas-viewport').getAttribute('data-zoom')), 2)
        await page.locator('.atlas-legend-toggle').click()
        const viewport = await page.locator('.atlas-viewport').boundingBox()
        const beforeDrag = await page.locator('.atlas-scene').getAttribute('style')
        if (width === 390) {
          const cdp = await page.context().newCDPSession(page)
          const point = { x: viewport.x + viewport.width / 2, y: viewport.y + viewport.height / 2 }
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: point.x + 45, y: point.y + 35 }],
          })
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
          await cdp.detach()
        } else {
          await page.mouse.move(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2)
          await page.mouse.down()
          await page.mouse.move(
            viewport.x + viewport.width / 2 + 55,
            viewport.y + viewport.height / 2 + 45,
            { steps: 5 },
          )
          await page.mouse.up()
        }
        assert.notEqual(await page.locator('.atlas-scene').getAttribute('style'), beforeDrag)
        assert.equal(
          await page.locator('.story-map').getAttribute('data-map-level'),
          level,
          'dragging must not navigate',
        )
        await page.locator('[data-map-zoom="reset"]').click()
        assert.equal(Number(await page.locator('.atlas-viewport').getAttribute('data-zoom')), 1)
        await page.mouse.move(viewport.x + 30, viewport.y + 30)
        await page.mouse.wheel(0, -150)
        await page.waitForFunction(
          () => Number(document.querySelector('.atlas-viewport').dataset.zoom) > 1,
        )
        await page.locator('[data-map-zoom="reset"]').click()
        const box = await page.locator('.story-atlas').boundingBox()
        await page
          .locator('.story-atlas')
          .screenshot({ path: '.native/story-screenshots/atlas-current.png' })
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1)
        assert.equal(
          await page.locator('.story-atlas').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          true,
          `${width} ${lang} ${level}`,
        )
        if (lang === 'zh')
          await page
            .locator('.story-atlas')
            .screenshot({ path: `.native/story-screenshots/atlas-${level}-${width}.png` })
      }
      await page.waitForTimeout(550)
      if (width === 390) {
        await page.locator('.atlas-region-node').tap()
        assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'world')
        await page.locator('.atlas-map-tip button').tap()
      } else await page.locator('.atlas-region-node').click()
      assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'region')
      for (const scene of [0, 1, 2, 3]) {
        const node = page.locator(`.atlas-node[data-scene="${scene}"]`)
        if (width === 390) {
          await node.tap()
          assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'region')
          await page.locator('.atlas-map-tip button').tap()
        } else await node.click()
        assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'local')
        assert.equal(await page.locator('.story-map').getAttribute('data-map-scene'), String(scene))
        assert.equal(await page.locator('.atlas-tile').count(), 63)
        assert.equal(await page.locator('.atlas-tile .atlas-position').count(), scene === 3 ? 1 : 0)
        await page.locator('.atlas-back').click()
      }
      await page.locator('.atlas-back').click()
      assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'world')
      await page.locator('.atlas-scale').click()
      for (const destination of [2, 1, 0, 1, 2, 3, 4, 3]) {
        const link = page.locator(
          `.atlas-connection[data-scene="${destination}"], .atlas-uncharted [data-scene="${destination}"]`,
        )
        const targetName = await link.getAttribute('data-map-name')
        if (width === 390) {
          await link.tap()
          assert.equal(await page.locator('.atlas-map-tip strong').innerText(), targetName)
          await page.locator('.atlas-map-tip button').tap()
        } else await link.click()
        assert.equal(
          await page.locator('.story-map').getAttribute('data-map-scene'),
          String(destination),
        )
        assert.equal(await page.locator('.atlas-heading h3').innerText(), targetName)
        if (destination === 4) assert.equal(await page.locator('.atlas-tile').count(), 99)
      }
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('.story-atlas').count(), 0)
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), save)
      assert.deepEqual(errors, [])
      await page.close()
      console.log(`Map hierarchy and unchanged game save: ${width}px ${lang} passed`)
    }
} finally {
  await browser.close()
}
