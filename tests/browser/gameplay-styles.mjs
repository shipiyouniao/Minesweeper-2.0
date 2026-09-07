import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { battleFixture } from './battle-fixtures.mjs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
try {
  for (const seed of [48, 49, 50, 45, 46, 47]) {
    for (const width of [320, 390, 1440, 3840]) {
      const touch = width < 900
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        hasTouch: touch,
        reducedMotion: 'reduce',
      })
      await page.addInitScript(
        (save) => localStorage.setItem('minesweeper.variants.v1.expedition', JSON.stringify(save)),
        battleFixture(seed).entered.save,
      )
      await page.goto(`${base}?ruleset=expedition&lang=zh`)
      await page.locator('[data-scene="skip"]').click()
      const dock = page.locator('.action-dock')
      const host = await page.locator('.ruleset-host').boundingBox()
      const bounds = await dock.boundingBox()
      assert.ok(host.y + host.height <= bounds.y + 1, 'scrolling board ends above the fixed dock')
      const skill = page.locator('.dock-skill > button')
      const bubble = page.locator('.skill-bubble')
      assert.equal(await skill.getAttribute('aria-disabled'), 'true')
      assert.equal(await skill.evaluate((el) => getComputedStyle(el).filter), 'grayscale(1)')
      assert.equal(await skill.getAttribute('title'), null)
      assert.equal(await skill.evaluate((el) => el.getBoundingClientRect().height), 76)
      const tapSkill = async () => {
        const box = await skill.boundingBox()
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
      }
      if (touch) await tapSkill()
      else await skill.hover()
      assert.ok(await bubble.isVisible())
      assert.equal(
        await bubble.evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(255, 254, 248)',
      )
      const tip = await bubble.boundingBox()
      assert.ok(
        tip.x >= 0 && tip.x + tip.width <= width && tip.y + tip.height <= bounds.y + bounds.height,
      )
      if (touch) {
        await tapSkill()
        assert.ok(!(await bubble.isVisible()), 'second touch dismisses the tooltip without hover')
        await tapSkill()
        await page.locator('.run-overview').tap()
        assert.ok(!(await bubble.isVisible()), 'outside touch dismisses the tooltip')
      } else {
        const brace = page.locator('[data-control="brace"]')
        await brace.hover()
        assert.equal(
          await brace.evaluate((el) => getComputedStyle(el).backgroundColor),
          'rgb(229, 237, 223)',
        )
        await page.mouse.move(0, 0)
        await brace.focus()
        await page.keyboard.press('Tab')
        assert.equal(
          await page
            .locator('[data-control="end-turn"]')
            .evaluate((el) => getComputedStyle(el).outlineStyle),
          'solid',
        )
      }
      await page.close()
      console.log(
        `seed ${seed}, ${width}px: dock clearance, disabled skill, tooltip and pointer/keyboard states passed`,
      )
    }
  }
} finally {
  await browser.close()
}
