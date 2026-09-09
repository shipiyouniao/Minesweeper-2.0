import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const browser = await chromium.launch({ channel: 'msedge' })
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/minefarer/'
try {
  for (const touch of [false, true]) {
    const page = await browser.newPage({
      hasTouch: touch,
      reducedMotion: 'reduce',
      viewport: { width: touch ? 390 : 1440, height: 1000 },
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(base + '?page=story&lang=zh')
    const finish = async () => {
      for (let i = 0; i < 10 && (await page.locator('dialog.story-dialogue').count()); i++)
        if (touch) await page.locator('[data-story-action="dialogue"]').tap()
        else await page.locator('[data-story-action="dialogue"]').click()
    }
    const secondary = async (index) => {
      const cell = page.locator(`[data-story-cell="${index}"]`)
      if (!touch) return cell.click({ button: 'right' })
      await cell.dispatchEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 7,
        isPrimary: true,
        clientX: 100,
        clientY: 100,
      })
      await page.waitForTimeout(600)
      await page.dispatchEvent('body', 'pointerup', {
        pointerType: 'touch',
        pointerId: 7,
        isPrimary: true,
      })
    }
    await finish()
    if (touch) await page.locator('[data-story-cell="12"]').tap()
    else await page.locator('[data-story-cell="12"]').click()
    await finish()
    await secondary(22)
    await finish()
    assert.match(
      await page.locator('[data-story-chord-guidance]').textContent(),
      touch ? /长按/ : /右键/,
    )
    await secondary(21)
    await finish()
    const read = () =>
      page.evaluate(() =>
        JSON.parse(
          localStorage.getItem('minesweeper.variants.v1.expedition'),
        ).story.travel.world.scenes.find((scene) => scene.id === 'awakening'),
      )
    const saved = await read()
    assert.ok(saved.revealed.includes(31))
    assert.ok(saved.flagged.includes(22))
    assert.equal(saved.player, 21)
    assert.equal(saved.health, 3)
    await page.reload()
    await page.locator('.story-main').waitFor()
    assert.deepEqual(await read(), saved)
    assert.deepEqual(errors, [])
    await page.close()
    console.log(`Story chord lesson and reload: ${touch ? 'touch hold' : 'right click'} passed`)
  }
} finally {
  await browser.close()
}
