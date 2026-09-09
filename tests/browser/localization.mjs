import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { message } from '../../.native/app/i18n.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 950 },
      hasTouch: width === 390,
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}?ruleset=sonar&lang=zh`)
    await page.locator('[data-cell="0"]').click()
    const sonarSave = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('minesweeper.sonar.v1')),
    )
    for (const mode of ['sonar', 'classic', 'twin', 'expedition']) {
      await page.locator('.brand').click()
      if (mode === 'expedition') await page.locator('.destination-expedition').click()
      else {
        await page.locator('.destination-free').click()
        await page.locator(`.free-mode-card[href*="ruleset=${mode}"]`).click()
      }
      for (const language of ['en', 'ja', 'zh']) {
        await page.locator('.language-trigger').click()
        await page.locator(`[data-language="${language}"]`).click()
        assert.equal(
          await page.locator('html').getAttribute('lang'),
          language === 'zh' ? 'zh-CN' : language,
        )
        assert.equal(new URL(page.url()).searchParams.get('lang'), language)
        assert.equal(
          await page.locator('.route-back').innerText(),
          mode === 'expedition' ? message(language, 'home.back') : message(language, 'home.free'),
        )
        assert.doesNotMatch(await page.locator('body').innerText(), /\{(?:p\d+|count)\}/)
        assert.deepEqual(
          await page.evaluate(() => JSON.parse(localStorage.getItem('minesweeper.sonar.v1'))),
          sonarSave,
        )
      }
    }
    await page.reload()
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN')
    assert.deepEqual(errors, [])
    await context.close()
    console.log(
      `${width}px: all four modes switch languages live, preserve the Sonar journal and restore the chosen locale`,
    )
  }
} finally {
  await browser.close()
}
