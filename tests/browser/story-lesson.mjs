import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
mkdirSync('.native/story-lesson-screenshots', { recursive: true })

/** Let the conversation finish normally; the action card should appear only afterwards. */
async function dialogue(page) {
  for (let i = 0; i < 30 && (await page.locator('dialog.story-dialogue[open]').count()); i++) {
    assert.equal(await page.locator('[data-story-lesson]').count(), 0)
    await page.locator('[data-story-action="dialogue"]').click()
  }
  assert.equal(await page.locator('dialog.story-dialogue[open]').count(), 0)
}

/** Check the visible card does not obscure the target, overflow the screen or cover the dock. */
async function guide(page, step, index) {
  const card = page.locator(`[data-story-lesson="${step}"]`)
  await card.waitFor({ state: 'visible' })
  await page.locator(`[data-story-cell="${index}"]`).scrollIntoViewIfNeeded()
  await page.waitForTimeout(80)
  const geometry = await card.evaluate((element) => {
    const box = element.getBoundingClientRect()
    const target = document.querySelector('.campaign-lesson-target').getBoundingClientRect()
    const dock = document.querySelector('.story-dock').getBoundingClientRect()
    return {
      box: box.toJSON(),
      target: target.toJSON(),
      width: innerWidth,
      dock: dock.top,
      visible: !element.hidden,
      fits: element.querySelector('p').getBoundingClientRect().bottom <= box.bottom - 5,
      targetIndex: document.querySelector('.campaign-lesson-target').dataset.storyCell,
      overlap:
        box.left < target.right &&
        box.right > target.left &&
        box.top < target.bottom &&
        box.bottom > target.top,
    }
  })
  assert.equal(geometry.targetIndex, String(index))
  assert.equal(geometry.visible, true)
  assert.equal(geometry.fits, true, JSON.stringify(geometry))
  assert.equal(geometry.overlap, false, JSON.stringify(geometry))
  assert.ok(
    geometry.box.left >= 0 && geometry.box.right <= geometry.width,
    JSON.stringify(geometry),
  )
  assert.ok(geometry.box.top >= 0 && geometry.box.bottom <= geometry.dock, JSON.stringify(geometry))
}

/** Send an actual held touch to exercise the same pointer lifecycle as a phone. */
async function mark(page, index, touch) {
  const target = page.locator(`[data-story-cell="${index}"]`)
  if (!touch) return target.click({ button: 'right' })

  const bounds = await target.boundingBox()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
  })
  await page.waitForTimeout(580)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

try {
  for (const [width, language] of [
    [320, 'zh'],
    [320, 'ja'],
    [390, 'en'],
    [1440, 'zh'],
  ]) {
    const touch = width < 500
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      hasTouch: touch,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}?page=story&lang=${language}`)
    await dialogue(page)
    await guide(page, 'inspect', 12)
    await page.locator('.story-quest-reveal').waitFor({ state: 'detached' })
    await page.screenshot({
      path: `.native/story-lesson-screenshots/${language}-${width}-inspect.png`,
    })
    if (touch) await page.locator('[data-story-cell="12"]').tap()
    else await page.locator('[data-story-cell="12"]').click()
    await dialogue(page)
    await guide(page, 'flag', 22)

    // Reload resumes the action, and visiting the journal removes its scene-only overlay.
    await page.reload()
    await dialogue(page)
    await guide(page, 'flag', 22)
    await page.setViewportSize({ width, height: 600 })
    await guide(page, 'flag', 22)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(100)
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await guide(page, 'flag', 22)
    await page.locator('[data-story-action="tasks"]').click()
    assert.equal(await page.locator('[data-story-lesson]').count(), 0)
    await page.locator('[data-story-action="close-panel"]').click()
    await guide(page, 'flag', 22)
    await mark(page, 22, touch)
    await dialogue(page)
    await guide(page, 'open', 21)
    await page.screenshot({
      path: `.native/story-lesson-screenshots/${language}-${width}-open.png`,
    })
    await mark(page, 21, touch)
    await dialogue(page)
    await guide(page, 'travel', 34)
    await page.screenshot({
      path: `.native/story-lesson-screenshots/${language}-${width}-travel.png`,
    })

    for (const index of [32, 34]) {
      await page.locator(`[data-story-cell="${index}"]`).click()
      await dialogue(page)
    }
    await page.locator('[data-story-scene="trail"]').waitFor()
    assert.equal(await page.locator('[data-story-lesson]').count(), 0)
    assert.equal(await page.locator('.story-hearts').innerText(), '♥♥♥')
    assert.deepEqual(errors, [])
    await page.close()
    console.log(
      `Prologue guide ${width}px ${language}: four real actions, touch/right-click, resume, journal and exit passed`,
    )
  }
} finally {
  await browser.close()
}
