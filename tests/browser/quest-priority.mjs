import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readyChapterTwo } from '../../.native/tests/tests/recollection-helpers.js'
import { MemoryStorage } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { StorySession } from '../../.native/tests/src/application/story-session.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const storage = new MemoryStorage(),
  repository = new VariantRepository(storage)
const camp = readyChapterTwo(repository),
  story = new StorySession(camp)
assert.ok(story.travelNorthwest())
assert.ok(story.completeRegionalScene('reed-arrival'))
camp.saveStory({
  ...camp.story,
  accepted: ['rescue-toma', ...camp.story.accepted.filter((id) => id !== 'rescue-toma')],
  pinned: ['rescue-toma', 'settle-reed-camp'],
})
const key = 'minesweeper.variants.v1.expedition',
  value = storage.getItem(key)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/minefarer/'
const browser = await chromium.launch({ channel: 'msedge' })
try {
  for (const [language, main, side] of [
    ['zh', '主线', '支线'],
    ['en', 'Main', 'Side'],
    ['ja', 'メイン', 'サブ'],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    })
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key, value })
    await page.goto(`${base}?page=story&lang=${language}`)
    const ids = await page
      .locator('.story-tasks [data-task]')
      .evaluateAll((nodes) =>
        nodes.filter((node) => node.matches('details')).map((node) => node.dataset.task),
      )
    assert.deepEqual(ids, ['settle-reed-camp', 'rescue-toma'])
    assert.ok(
      (await page.locator('.story-tasks details').first().innerText()).startsWith(main + ' · '),
    )
    assert.ok(
      (await page.locator('.story-tasks details').last().innerText()).startsWith(side + ' · '),
    )
    await page.locator('[data-story-action="tasks"]').click()
    assert.equal(
      await page.locator('.story-journal-list button').first().getAttribute('data-task'),
      'settle-reed-camp',
    )
    const names = await page.locator('.story-journal-list strong').allTextContents()
    assert.ok(names.every((name) => name.startsWith(main + ' · ') || name.startsWith(side + ' · ')))
    assert.ok(names.every((name) => (name.match(/ · /g) ?? []).length === 1))
    await page.close()
  }
  console.log(
    'PASS: Main quest labels and priority in pinned tracker and journal across zh/en/ja, without duplicate prefixes.',
  )
} finally {
  await browser.close()
}
