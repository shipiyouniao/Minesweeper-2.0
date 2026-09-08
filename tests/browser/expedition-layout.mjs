import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { battleFixture } from './battle-fixtures.mjs'
import { MILESTONES } from '../../.native/tests/src/game/milestones.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixture = battleFixture(52).entered.save
const save = {
  ...fixture,
  camp: {
    ...fixture.camp,
    milestones: {
      claimed: MILESTONES.filter((entry) => entry.kind === 'achievements').map((entry) => entry.id),
      bossKinds: [],
      relics: [],
    },
  },
}
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const errors = []
try {
  for (const language of ['en', 'zh', 'ja']) {
    for (const width of [320, 390, 1440, 2560, 3840]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        hasTouch: width < 500,
        reducedMotion: 'reduce',
      })
      await context.addInitScript(
        ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
        { key, save },
      )
      const page = await context.newPage()
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${base}?ruleset=expedition&lang=${language}`)
      await page.locator('[data-scene="skip"]').click()
      const metrics = page.locator('.run-overview .variant-metrics')
      // Stress presentation with long values without modifying the game or its saved journal.
      await metrics.locator('strong').evaluateAll((nodes) => {
        for (const [index, node] of nodes.entries())
          node.textContent = index === 0 ? '12 / 12' : '999,999,999'
      })
      await metrics.scrollIntoViewIfNeeded()
      const rows = await metrics.locator('.variant-metric').evaluateAll((nodes) =>
        nodes.map((node) => {
          const row = node.getBoundingClientRect()
          const value = node.querySelector('strong')
          const number = value.getBoundingClientRect()
          return {
            y: row.y,
            bottom: row.bottom,
            right: row.right,
            valueRight: number.right,
            oneLine: number.height <= parseFloat(getComputedStyle(value).lineHeight) + 1,
          }
        }),
      )
      assert.equal(rows.length, 3)
      assert.ok(
        rows.every(
          (row, index) =>
            row.oneLine &&
            row.valueRight <= row.right + 1 &&
            (!index || row.y >= rows[index - 1].bottom - 1),
        ),
        JSON.stringify({ language, width, rows }),
      )
      const trigger = page.locator('.title-trigger')
      await trigger.scrollIntoViewIfNeeded()
      if (width < 500) await trigger.tap()
      else await trigger.click()
      const menu = page.locator('.title-options')
      assert.ok(await menu.isVisible())
      const bounds = await menu.boundingBox()
      assert.ok(
        bounds.x >= 0 &&
          bounds.x + bounds.width <= width + 1 &&
          bounds.y >= 0 &&
          bounds.y + bounds.height <= 1001,
      )
      const hostBefore = await page.locator('.ruleset-host').evaluate((host) => host.scrollTop)
      await menu.hover()
      await page.mouse.wheel(0, 500)
      await page.waitForFunction(
        () => document.querySelector('.title-options')?.scrollTop > 0,
        null,
        { timeout: 2000 },
      )
      assert.ok(
        await menu.evaluate((element) => element.scrollTop > 0),
        JSON.stringify({
          language,
          width,
          bounds,
          menu: await menu.evaluate((element) => ({
            height: element.clientHeight,
            scroll: element.scrollHeight,
            top: element.scrollTop,
            visible: !element.hidden,
            hit: document
              .elementFromPoint(
                element.getBoundingClientRect().x + element.clientWidth / 2,
                element.getBoundingClientRect().y + element.clientHeight / 2,
              )
              ?.outerHTML.slice(0, 180),
          })),
        }),
      )
      assert.equal(
        await page.locator('.ruleset-host').evaluate((host) => host.scrollTop),
        hostBefore,
      )
      if (language === 'zh' && [390, 1440, 3840].includes(width))
        await page.screenshot({ path: `.native/expedition-layout-${width}.png`, fullPage: true })
      await page.keyboard.press('Escape')
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
      if (language === 'zh' && [390, 1440, 3840].includes(width))
        await page.screenshot({ path: `.native/expedition-stats-${width}.png`, fullPage: true })
      await context.close()
    }
  }
  assert.deepEqual(errors, [])
  console.log(
    'Passed: three metric rows and scrolling title menus in three languages at 320/390/1440/2560/3840px.',
  )
} finally {
  await browser.close()
}
