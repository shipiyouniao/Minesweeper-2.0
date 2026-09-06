import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { tutorialLesson } from '../../.native/app/ui/tutorial-lessons.js'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ headless: true, channel: 'msedge' })
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'no-preference',
})
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const url = `${base}?ruleset=expedition&tutorial=expedition&lang=zh`
try {
  await page.goto(url)
  await page.locator('.tutorial-entry').click()
  const next = page.locator('[data-practice="next"]')
  for (const step of tutorialLesson('expedition', 'zh').steps) {
    if (step.action === 'skill') await page.locator('[data-practice="skill"]').click()
    else {
      if (step.action === 'probe' || step.action === 'scan')
        await page.locator(`[data-practice="${step.action}"]`).click()
      await page.locator(`[data-practice-cell="${step.index}"]`).click()
      if (step.action === 'cell') {
        assert.equal(
          await page.locator('dialog[data-tutorial]').getAttribute('data-practice-moving'),
          'true',
        )
        assert.ok(await next.isDisabled())
        await page.locator(`[data-practice-cell="${step.index}"]`).click({ force: true })
        await page.waitForFunction(() => !document.querySelector('[data-practice-moving]'))
      }
    }
    assert.ok(await next.isEnabled())
    await next.click()
  }
  await page.locator('[data-practice="restart"]').click()
  await page.locator('[data-practice-cell="7"]').click()
  await page.locator('[data-practice="restart"]').click()
  await page.waitForTimeout(800)
  assert.equal((await page.locator('.lesson-number').innerText()).trim(), '01')
  assert.ok(await next.isDisabled())
  await page.locator('[data-practice-cell="7"]').click()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
  assert.equal(await page.locator('dialog[open]').count(), 0)
  assert.deepEqual(errors, [])
  console.log(
    'Passed: animated movement, frontier reveal, chest and stairs; double clicks; restart and Escape cancellation.',
  )
} finally {
  await browser.close()
}
