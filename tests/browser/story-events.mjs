import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const browser = await chromium.launch({ channel: 'msedge' })
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    window.notes = 0
    window.gifts = 0
    const create = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this)
      const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency)
      oscillator.frequency.setValueAtTime = (frequency, time) => {
        if (frequency === 980 || frequency === 720) window.notes++
        return set(frequency, time)
      }
      return oscillator
    }
    new MutationObserver((records) => {
      for (const r of records)
        for (const n of r.addedNodes)
          if (n.nodeType === 1 && n.matches('.story-gift')) window.gifts++
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto(base + '?page=story&lang=zh')
  const wake = page.locator('[data-story-action="wake"]')
  if (await wake.isVisible()) await wake.click()
  for (let i = 0; i < 8 && (await page.locator('dialog.story-dialogue').count()); i++)
    await page.locator('[data-story-action="dialogue"]').click()
  assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
  await page.reload()
  await page.waitForTimeout(500)
  assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
  assert.equal(await page.evaluate(() => window.notes), 0)
  await page.locator('[data-story-cell="12"]').click()
  for (let i = 0; i < 8 && (await page.locator('dialog.story-dialogue').count()); i++)
    await page.locator('[data-story-action="dialogue"]').click()
  const hearts = await page.locator('.story-hearts').innerText()
  for (const pointerType of ['touch', 'mouse']) {
    await page
      .locator('.story-banner')
      .dispatchEvent('pointerdown', { pointerType, isPrimary: true })
    assert.equal(await page.locator('.story-hearts').innerText(), hearts)
    assert.match(
      await page.locator('[data-story-flag-guidance]').textContent(),
      pointerType === 'touch' ? /长按/ : /右键/,
    )
  }
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
            completed: ['reach-camp', 'lost-satchel', 'meet-guide'],
            claimed: ['reach-camp', 'lost-satchel', 'meet-guide'],
            mapOwned: true,
            campPosition: 31,
            journal: null,
          },
        }),
      ),
    key,
  )
  await page.reload()
  const visit = async (index, scene) => {
    await page.locator(`[data-story-cell="${index}"]`).click()
    await page.waitForFunction(
      (scene) => document.querySelector('.story-main')?.dataset.storyScene === scene,
      scene,
    )
    await page.waitForTimeout(150)
  }
  for (let i = 0; i < 2; i++) {
    await visit(49, 'approach')
    await visit(28, 'trail')
    await visit(19, 'awakening')
    await visit(34, 'trail')
    await visit(52, 'approach')
    await visit(25, 'camp')
  }
  assert.equal(await page.evaluate(() => window.notes), 0, 'returning scenes must be silent')
  assert.equal(
    await page.evaluate(() => window.gifts),
    0,
    'returning scenes must not replay pickups',
  )
  assert.equal(await page.locator('dialog.story-dialogue').count(), 0)
  assert.equal(await page.locator('.story-stage-top').innerText(), '')
  await page.locator('[data-story-action="tasks"]').click()
  assert.equal(await page.locator('.story-quest-panel [data-story-action="pin"]').count(), 0)
  assert.equal(await page.locator('.story-quest-panel .story-quest').count(), 3)
  assert.deepEqual(errors, [])
  console.log(
    'PASS: dialogue completion/reload, two round trips, no speech/pickup replay, completed quest controls',
  )
} finally {
  await browser.close()
}
