import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const browser = await chromium.launch({ channel: 'msedge' })
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/minefarer/'
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
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(base)
      await page.evaluate(
        (key) =>
          localStorage.setItem(
            key,
            JSON.stringify({
              version: 4,
              camp: { supplies: 110, upgrades: [], completed: 0 },
              records: [],
              journal: null,
              story: {
                arrived: true,
                completed: ['reach-camp', 'meet-guide', 'survey-road'],
                claimed: ['reach-camp', 'meet-guide', 'survey-road'],
                mapOwned: true,
                campPosition: 13,
                journal: null,
                dialogue: {
                  completed: [
                    'wake',
                    'flag',
                    'open',
                    'travel',
                    'trail',
                    'approach',
                    'arrival',
                    'guide',
                    'north-road-start',
                    'north-road-found',
                    'north-road-report',
                  ],
                  active: null,
                },
              },
            }),
          ),
        key,
      )
      await page.goto(base + '?page=story&lang=' + lang)
      const finish = async () => {
        for (let i = 0; i < 10 && (await page.locator('dialog.story-dialogue').count()); i++)
          await page.locator('[data-story-action="dialogue"]').click()
      }
      const visit = async (index, scene) => {
        await page.locator(`[data-story-cell="${index}"]`).click()
        await page.waitForFunction(
          (scene) => document.querySelector('.story-main')?.dataset.storyScene === scene,
          scene,
        )
        await finish()
      }
      await finish()
      await visit(13, 'north-road')
      await visit(75, 'quarry-yard')
      await page.locator('[data-story-cell="14"]').click({ button: 'right' })
      await visit(21, 'quarry-yard')
      await visit(22, 'quarry-yard')
      await visit(40, 'quarry-yard')
      await visit(52, 'quarry-passage')
      await visit(39, 'quarry-passage')
      await visit(52, 'quarry-machine')
      await visit(21, 'quarry-machine')
      await page.locator('[data-story-cell="22"]').click({ button: 'right' })
      await visit(23, 'quarry-machine')
      await visit(13, 'quarry-machine')
      await visit(39, 'quarry-machine')
      await visit(42, 'quarry-machine')
      await page.reload()
      await page.locator('[data-story-scene="quarry-machine"]').waitFor()
      assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
      await visit(10, 'quarry-passage')
      await visit(10, 'quarry-yard')
      await visit(10, 'north-road')
      await visit(42, 'north-road')
      await visit(42, 'tower-landing')
      await visit(34, 'tower-landing')
      await page.locator('[data-story-action="map"]').click()
      assert.equal(await page.locator('.story-map').getAttribute('data-map-scene'), '8')
      assert.equal(await page.locator('.atlas-connection[data-scene="4"]').count(), 1)
      await page.keyboard.press('Escape')
      await page.locator('.story-quest-reveal').waitFor({ state: 'detached' })
      if (lang === 'zh')
        await page.screenshot({ path: `.native/story-screenshots/tower-landing-${width}.png` })
      await page.reload()
      await page.locator('[data-story-scene="tower-landing"]').waitFor()
      assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
      await visit(28, 'north-road')
      await visit(45, 'camp')
      const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
      assert.ok(save.story.quests.completed.includes('repair-lift'))
      assert.ok(save.story.quests.completed.includes('reach-tower'))
      assert.equal(save.camp.supplies, 110)
      assert.deepEqual(errors, [])
      console.log(`Quarry pickup, lift repair, tower and return: ${width}px ${lang} passed`)
      await page.close()
    }
} finally {
  await browser.close()
}
