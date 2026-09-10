import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
import { CampSession } from '../../.native/tests/src/application/camp-session.js'
import { createStoryRun } from '../../.native/tests/src/game/story.js'
import { checkpointStory } from '../../.native/tests/src/game/story-checkpoint.js'
import { MemoryStorage, FakeRuntime } from '../../.native/tests/tests/helpers.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const storage = new MemoryStorage(),
  repo = new VariantRepository(storage)
new ExpeditionSession(repo, new FakeRuntime()).start('explorer', [])
const camp = new CampSession(repo),
  world = createStoryRun(7)
camp.saveStory({
  ...camp.story,
  arrived: false,
  completed: ['reach-camp', 'meet-guide', 'survey-road', 'repair-lift', 'reach-tower'],
  world: checkpointStory({ ...world, player: world.board.exit }),
  dialogue: { completed: ['quarry-lead', 'lift-repaired', 'tower-arrival'], active: null },
  mapOwned: true,
  journal: null,
})
const key = 'minesweeper.variants.v1.expedition',
  fixture = storage.getItem(key)
const browser = await chromium.launch({ channel: 'msedge' })
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/minefarer/'
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
      await page.evaluate(({ key, fixture }) => localStorage.setItem(key, fixture), {
        key,
        fixture,
      })
      await page.goto(base + '?page=story&lang=' + lang)
      assert.equal(await page.locator('.story-shortcut').count(), 0)
      await page.locator('[data-story-campaign]').click()
      await page.locator('[data-control="skill"]').waitFor()
      assert.equal(new URL(page.url()).searchParams.get('page'), 'campaign')
      const read = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
      const before = await read()
      const checkGuide = async () => {
        const geometry = await page.locator('.campaign-lesson').evaluate((guide) => {
          const frame = guide.closest('.variant-board-panel')
          const board = frame.querySelector('.board-viewport').getBoundingClientRect()
          const popup = guide.getBoundingClientRect()
          const target = frame
            .querySelector('[data-cell].campaign-lesson-target')
            ?.getBoundingClientRect()
          return {
            inside:
              popup.left >= board.left &&
              popup.right <= board.right &&
              popup.top >= board.top &&
              popup.bottom <= board.bottom,
            overlaps:
              target &&
              popup.left < target.right &&
              popup.right > target.left &&
              popup.top < target.bottom &&
              popup.bottom > target.top,
          }
        })
        assert.equal(geometry.inside, true, 'Guide stays inside the board')
        assert.ok(!geometry.overlaps, 'Guide leaves the target cell clickable')
      }
      await checkGuide()

      await page.locator('.campaign-lesson button').click()
      await checkGuide()
      if (lang === 'zh')
        await page.screenshot({ path: `.native/story-screenshots/campaign-lesson-${width}.png` })
      await page.locator('[data-control="probe"]').click()
      await page.locator('[data-cell].campaign-lesson-target').first().click()
      await page.locator('[data-lesson-step="2"]').waitFor()
      await checkGuide()
      if (await page.locator('[data-cell].campaign-lesson-target').count())
        await page.locator('[data-cell].campaign-lesson-target').first().click()
      await page.locator('[data-control="skill"][aria-disabled="false"]').waitFor()
      await page.locator('[data-control="skill"]').click()
      await page.locator('[data-lesson-step="3"]').waitFor()
      await checkGuide()
      await page.locator('[data-cell].campaign-lesson-target').first().click()
      await page.locator('.campaign-lesson').waitFor({ state: 'detached' })
      const snapshot = await read()
      assert.equal(snapshot.camp.milestones.skills, (before.camp.milestones?.skills ?? 0) + 1)
      assert.equal(snapshot.story.quests.campaignActivity.skills, 1)
      await page.locator('[data-campaign-return]').click()
      await page.locator('[data-story-campaign]').click()
      assert.equal(await page.locator('.campaign-lesson').count(), 0)
      assert.deepEqual((await read()).campaign.stages, snapshot.campaign.stages)
      assert.deepEqual((await read()).journal, before.journal)
      await page.reload()
      await page.locator('[data-control="skill"]').waitFor()
      assert.equal(await page.locator('.campaign-lesson').count(), 0)
      assert.deepEqual((await read()).campaign.stages, snapshot.campaign.stages)
      if (lang === 'zh')
        await page.screenshot({ path: `.native/story-screenshots/campaign-${width}.png` })
      assert.deepEqual(errors, [])
      console.log(
        `Campaign UI, skill, leave/reenter and independent saves: ${width}px ${lang} passed`,
      )
      await page.close()
    }
} finally {
  await browser.close()
}
