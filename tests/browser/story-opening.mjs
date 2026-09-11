import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })

/** Model host visibility events deterministically; this does not emulate a QQ browser kernel. */
async function visibility(page, hidden) {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (hidden ? 'hidden' : 'visible'),
    })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)
}

/** Observe a full hidden interval, longer than the original opening, without advancing its clock. */
async function pausedOpening(page) {
  const eyelids = page.locator('.story-eyelid')
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.story-eyelid')].every((el) =>
      // A pause takes effect on the next animation frame; do not sample its pending clock.
      el
        .getAnimations()
        .some((animation) => animation.playState === 'paused' && !animation.pending),
    ),
  )
  const before = await eyelids.evaluateAll((els) =>
    els.map((el) => el.getAnimations()[0].currentTime),
  )
  await page.waitForTimeout(2400)
  assert.equal(await page.locator('.story-awakening').count(), 1)
  assert.equal(await page.locator('dialog.story-dialogue[open]').count(), 0)
  assert.deepEqual(
    await eyelids.evaluateAll((els) => els.map((el) => el.getAnimations()[0].currentTime)),
    before,
  )
}

try {
  for (const [width, language] of [
    [390, 'zh'],
    [1440, 'en'],
    [390, 'ja'],
  ]) {
    for (const startHidden of [false, true]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: 'no-preference',
      })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      if (startHidden)
        await page.addInitScript(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
          Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'hidden',
          })
        })
      await page.goto(`${base}?page=story&lang=${language}`)
      await page.locator('.story-awakening').waitFor()
      const saved = await page.evaluate((key) => localStorage.getItem(key), key)
      if (!startHidden) await visibility(page, true)
      await pausedOpening(page)
      await visibility(page, false)
      await page.locator('.story-awakening').waitFor({ state: 'detached' })
      await page.locator('dialog.story-dialogue[open]').waitFor()
      assert.equal(await page.locator('.story-main').evaluate((el) => el.inert), false)
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), saved)
      assert.deepEqual(errors, [])
      await page.close()
      console.log(
        `Opening ${width}px ${language}: ${startHidden ? 'hidden mount' : 'background interruption'} resumes without changing progress`,
      )
    }
  }

  for (const skip of ['button', 'keyboard', 'reduce']) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      reducedMotion: 'no-preference',
    })
    await page.goto(`${base}?page=story&lang=zh`)
    await page.locator('.story-awakening').waitFor()
    if (skip === 'button') await page.locator('[data-story-action="wake"]').tap()
    else if (skip === 'keyboard') await page.keyboard.press('Escape')
    else await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.locator('dialog.story-dialogue[open]').waitFor()
    assert.equal(await page.locator('.story-awakening').count(), 0)
    await visibility(page, true)
    await visibility(page, false)
    assert.equal(await page.locator('.story-awakening').count(), 0)
    await page.reload()
    await page.locator('dialog.story-dialogue[open]').waitFor()
    assert.equal(await page.locator('.story-awakening').count(), 0)
    await page.close()
    console.log(`Opening ${skip}: explicit skip and restored dialogue stay skipped`)
  }
} finally {
  await browser.close()
}
