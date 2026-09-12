import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { CampSession } from '../../.native/tests/src/application/camp-session.js'
import { createStoryRun } from '../../.native/tests/src/game/story.js'
import { checkpointStory } from '../../.native/tests/src/game/story-checkpoint.js'
import { campaignProgress, updateCampaign } from '../../.native/tests/src/game/campaign-catalog.js'
import { MemoryStorage } from '../../.native/tests/tests/helpers.js'
import { readyRescue } from '../../.native/tests/tests/rail-helpers.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const key = 'minesweeper.variants.v1.expedition'
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/minefarer/'
const storage = new MemoryStorage(),
  repo = new VariantRepository(storage)
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
const initial = repo.expedition()
repo.saveExpedition({
  ...initial,
  campaign: updateCampaign(initial.campaign, {
    ...campaignProgress(initial.campaign, 'tower-galleries'),
    cleared: true,
  }),
})
const tower = storage.getItem(key)
const quarryStorage = new MemoryStorage(),
  quarryRepo = new VariantRepository(quarryStorage)
const quarryCamp = readyRescue(quarryRepo)
quarryCamp.saveStory({
  ...quarryCamp.story,
  dialogue: {
    ...quarryCamp.story.dialogue,
    completed: [...quarryCamp.story.dialogue.completed, 'quarry-brake'],
  },
})
const unlocked = quarryStorage.getItem(key),
  quarry = quarryRepo.expedition()
quarryRepo.saveExpedition({
  ...quarry,
  campaign: updateCampaign(quarry.campaign, {
    ...campaignProgress(quarry.campaign, 'tower-galleries'),
    cleared: false,
  }),
})
const locked = quarryStorage.getItem(key)
const browser = await chromium.launch({ channel: 'msedge' })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: width === 390,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(base)
    await page.evaluate(({ key, tower }) => localStorage.setItem(key, tower), { key, tower })
    await page.goto(`${base}?page=campaign&stage=tower-relay&lang=zh`)
    await page.locator('[data-signal-scene="tower-response"][open]').waitFor()
    assert.equal(await page.locator('[data-story-campaign]').count(), 0)
    await page.screenshot({ path: `.native/tower-response-${width}.png` })
    for (
      let beat = 0;
      beat < 12 && (await page.locator('[data-signal-scene="tower-response"][open]').count());
      beat++
    ) {
      await page.locator('[data-signal-next]').click()
      await page.waitForTimeout(50)
    }
    await page.locator('[data-story-campaign][href*="tower-relay"]').waitFor()
    await page.reload()
    assert.equal(await page.locator('[data-signal-scene="tower-response"][open]').count(), 0)
    for (const [value, visible] of [
      [locked, false],
      [unlocked, true],
    ]) {
      await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value })
      await page.goto(`${base}?page=story&lang=zh`)
      assert.equal(
        await page.locator('[data-story-cell="25"] img.rail-cart').count(),
        Number(visible),
      )
      assert.equal(
        await page.locator('[data-story-campaign][href*="quarry-rescue"]').count(),
        Number(visible),
      )
      await page.locator('[data-story-action="map"]').click()
      assert.equal(await page.locator('.atlas-local-grid img.rail-cart').count(), Number(visible))
    }
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key,
      value: locked,
    })
    await page.goto(`${base}?page=campaign&stage=quarry-rescue&lang=zh`)
    assert.equal(await page.locator('.story-board').count(), 1)
    assert.equal(await page.locator('.variant-main.expedition').count(), 0)
    await page.evaluate((key) => {
      const saved = JSON.parse(localStorage.getItem(key))
      saved.journal = null
      localStorage.setItem(key, JSON.stringify(saved))
    }, key)
    await page.goto(`${base}?ruleset=expedition&lang=zh`)
    assert.equal(await page.locator('.story-board').count(), 1)
    assert.equal(await page.locator('[data-control="start"], .camp-destinations').count(), 0)
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log(
    'PASS: First clear dialogue, persistent completion, next-stage handoff, and locked/unlocked cart on board and map at 390/1440.',
  )
} finally {
  await browser.close()
}
