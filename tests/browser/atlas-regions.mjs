import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { readyChapterTwo } from '../../.native/tests/tests/recollection-helpers.js'
import { MemoryStorage } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { StorySession } from '../../.native/tests/src/application/story-session.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const storage = new MemoryStorage()
const camp = readyChapterTwo(new VariantRepository(storage))
const story = new StorySession(camp)
assert.ok(story.travelNorthwest())
assert.ok(story.completeRegionalScene('reed-arrival'))
const browser = await chromium.launch({ channel: 'msedge' })
mkdirSync('.native/atlas-screenshots', { recursive: true })
try {
  for (const [width, lang] of [
    [390, 'zh'],
    [1440, 'en'],
    [3840, 'ja'],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: width === 390,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key,
      value: storage.getItem(key),
    })
    await page.goto(`${base}?page=story&lang=${lang}`)
    await page.locator('[data-story-action="map"]').click()
    const before = await page.evaluate((key) => localStorage.getItem(key), key)
    await page.locator('[data-level="region"]').click()
    assert.equal(await page.locator('.atlas-river-region').count(), 1)
    await page.locator('.atlas-zoom input').focus()
    await page.keyboard.press('End')
    const camera = await page.locator('.atlas-scene').getAttribute('style')
    await page.locator('[data-level="world"]').click()
    assert.equal(await page.locator('.atlas-region-node').count(), 2)
    await page
      .locator('.story-atlas')
      .screenshot({ path: `.native/atlas-screenshots/${width}-${lang}-chapter-two-world.png` })
    await page.locator('.atlas-region-node[data-scene="11"]').click()
    assert.equal(await page.locator('.atlas-scene').getAttribute('style'), camera)
    await page.locator('[data-map-zoom="reset"]').click()
    await page.locator('.atlas-node[data-story-action="map-region"]').click()
    assert.equal(await page.locator('.story-map').getAttribute('data-map-region'), 'woodland')
    await page.locator('[data-level="world"]').click()
    await page.locator('.atlas-region-node[data-scene="11"]').click()
    await page.locator('.atlas-node[data-story-action="map-scene"]').click()
    assert.equal(await page.locator('.story-map').getAttribute('data-map-level'), 'local')
    assert.equal(await page.locator('.story-map').getAttribute('data-map-scene'), '11')
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), before)
    await page
      .locator('img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
    assert.deepEqual(errors, [])
    await page.close()
    console.log(
      `${width}px ${lang}: world discovery, river/woodland navigation, independent cameras and save isolation passed`,
    )
  }
} finally {
  await browser.close()
}
