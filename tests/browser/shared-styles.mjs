import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
try {
  for (const width of [320, 390, 800, 1050, 1440, 3840])
    for (const language of ['zh', 'en', 'ja']) {
      const page = await browser.newPage({
        viewport: { width, height: 950 },
        reducedMotion: 'reduce',
      })
      await page.goto(`${base}?ruleset=classic&lang=${language}`)
      const styles = await page.evaluate(() => {
        const style = (selector) => getComputedStyle(document.querySelector(selector))
        return {
          header: style('.site-header').padding,
          glass: style('.site-header').backdropFilter,
          layout: style('.layout').padding,
          art: style('.hero-art').width,
          learn: style('.tutorial-entry').color,
          overflow: document.documentElement.scrollWidth > innerWidth,
        }
      })
      assert.match(styles.glass, /blur/)
      assert.equal(styles.learn, 'rgb(53, 93, 66)')
      assert.equal(styles.overflow, false)
      if (width <= 480) {
        assert.equal(styles.layout, '0px 16px')
        assert.equal(styles.art, '110px')
      }
      await page.locator('.language-trigger').click()
      const selected = page.locator('.language-option[aria-checked="true"]')
      assert.equal(await selected.count(), 1)
      await page.keyboard.press('ArrowDown')
      await selected.focus()
      assert.equal(await selected.evaluate((e) => getComputedStyle(e).outlineStyle), 'solid')
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('.language-menu').isVisible(), false)
      if (width > 650) {
        await page.locator('[data-action="records"]').click()
        const eyebrow = page.locator('dialog[open] .eyebrow')
        assert.equal(await eyebrow.evaluate((e) => getComputedStyle(e).fontSize), '9px')
        assert.equal(await eyebrow.evaluate((e) => getComputedStyle(e).marginBottom), '17px')
        await page.keyboard.press('Escape')
      }
      await page.close()
    }
  console.log(
    'Shared UI: six widths, three locales, responsive geometry, menu states and dialog typography passed.',
  )
} finally {
  await browser.close()
}
