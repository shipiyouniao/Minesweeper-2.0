import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/minefarer/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
const key = 'minesweeper.variants.v1.expedition'
mkdirSync('.native/story-screenshots', { recursive: true })
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
      await page.goto(base)
      await page.evaluate(
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
      const finish = async () => {
        for (let i = 0; i < 10 && (await page.locator('dialog.story-dialogue').count()); i++)
          await page.locator('[data-story-action="dialogue"]').click()
        assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
      }
      const visit = async (index, scene) => {
        await page.locator(`[data-story-cell="${index}"]`).click()
        await page.waitForFunction(
          (scene) => document.querySelector('.story-main')?.dataset.storyScene === scene,
          scene,
        )
      }
      await visit(13, 'north-road')
      await finish()
      assert.equal(await page.locator('.story-cell').count(), 63)
      await visit(42, 'north-road')
      await finish()
      await page.locator('[data-story-action="map"]').click()
      assert.equal(await page.locator('.story-map').getAttribute('data-map-scene'), '4')
      assert.equal(await page.locator('.atlas-tile').count(), 99)
      const lift = page.locator('.atlas-connection[data-scene="8"]')
      if (width === 390) {
        await lift.tap()
        await page.locator('.atlas-map-tip button').tap()
      } else await lift.click()
      assert.equal(await page.locator('.atlas-tile').count(), 63)
      await page.keyboard.press('Escape')
      await page.locator('.story-quest-reveal').waitFor({ state: 'detached' })
      if (lang === 'zh')
        await page.screenshot({ path: `.native/story-screenshots/north-road-${width}.png` })
      await visit(45, 'camp')
      await visit(51, 'camp')
      await finish()
      const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
      assert.ok(save.story.quests.completed.includes('survey-road'))
      assert.equal(save.camp.supplies, 110)
      await visit(13, 'north-road')
      assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
      await page.reload()
      await page.locator('[data-story-scene="north-road"]').waitFor()
      assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
      await visit(45, 'camp')
      await visit(51, 'camp')
      assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
      assert.equal(
        await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).camp.supplies, key),
        110,
      )
      await visit(49, 'approach')
      assert.deepEqual(errors, [])
      await page.close()
      console.log(`North road discovery/report/revisit: ${width}px ${lang} passed`)
    }
} finally {
  await browser.close()
}
