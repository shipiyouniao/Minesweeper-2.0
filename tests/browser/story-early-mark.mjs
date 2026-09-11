import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { message } from '../../.native/tests/src/i18n.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })

/** Finish only visible dialogue so pointer actions remain real and cannot pierce a modal. */
async function dialogue(page) {
  for (let i = 0; i < 20 && (await page.locator('dialog.story-dialogue[open]').count()); i++)
    await page.locator('[data-story-action="dialogue"]').click()
  assert.equal(await page.locator('dialog.story-dialogue[open]').count(), 0)
}

try {
  for (const [width, language] of [
    [1440, 'zh'],
    [390, 'en'],
    [390, 'ja'],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: width === 390,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}?page=story&lang=${language}`)
    await dialogue(page)
    if (width === 1440) await page.locator('[data-story-cell="22"]').click({ button: 'right' })
    else {
      await page.locator('[data-story-action="flag"]').tap()
      await page.locator('[data-story-cell="22"]').tap()
    }
    await page.locator('dialog.story-dialogue[open]').waitFor()
    await page.waitForFunction(
      (line) => document.querySelector('[data-story-dialogue-line]')?.textContent.startsWith(line),
      message(language, 'story.open-line'),
    )
    await dialogue(page)
    if (width === 390) await page.locator('[data-story-action="explore"]').tap()
    await page.locator('[data-story-lesson="open"]').waitFor({ state: 'visible' })

    // Ordinary opening also counts; players need not use the tutorial's suggested chord.
    for (const index of [31, 32]) {
      await page.locator(`[data-story-cell="${index}"]`).click()
      if (index === 31)
        await page.waitForFunction(
          (line) =>
            document.querySelector('[data-story-dialogue-line]')?.textContent.startsWith(line),
          message(language, 'story.travel-line'),
        )
      await dialogue(page)
    }
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
    await page.locator('[data-story-lesson="travel"]').waitFor({ state: 'visible' })
    const awakening = stored.story.travel.world.scenes.find((scene) => scene.id === 'awakening')
    assert.equal(awakening.inspected, false)
    assert.equal(awakening.practicedFlag, true)
    assert.equal(awakening.practicedReveal, true)

    // Restore the exact blocked state from #74: both actions done, standing at the exit.
    awakening.player = 34
    await page.goto(base)
    await page.evaluate(({ key, stored }) => localStorage.setItem(key, JSON.stringify(stored)), {
      key,
      stored,
    })
    await page.goto(`${base}?page=story&lang=${language}`)
    await dialogue(page)
    await page.locator('[data-story-cell="34"]').click()
    await page.locator('[data-story-scene="trail"]').waitFor()
    await dialogue(page)
    assert.equal(await page.locator('.story-hearts').innerText(), '♥♥♥')
    assert.deepEqual(errors, [])
    await page.close()
    console.log(
      `Early marking ${width}px ${language}: normal safe opening and restored exit continue without inspecting the teaching clue`,
    )
  }
} finally {
  await browser.close()
}
