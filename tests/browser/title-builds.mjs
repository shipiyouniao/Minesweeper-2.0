import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { TITLES } from '../../.native/tests/src/game/title-effects.js'
import { titleEffectCopy } from '../../.native/tests/src/ui/title-copy.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const errors = []

/** Read the persisted intent snapshot rather than depending on private controller fields. */
async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
}

/** Arrival art is independent of this test's title selection and departure assertions. */
async function skipArrival(page) {
  const skip = page.locator('[data-scene="skip"]')
  if (await skip.isVisible()) await skip.click()
}

try {
  for (const language of ['en', 'zh', 'ja']) {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        hasTouch: width < 500,
        reducedMotion: 'reduce',
      })
      await context.addInitScript(
        ({ key, titles }) => {
          if (sessionStorage.getItem('title-seeded')) return
          sessionStorage.setItem('title-seeded', '1')
          localStorage.setItem(
            key,
            JSON.stringify({
              version: 4,
              camp: {
                supplies: 8765,
                completed: 3,
                upgrades: [],
                milestones: { title: null, claimed: titles, relics: [], bossKinds: [] },
              },
              journal: null,
              records: [],
            }),
          )
        },
        { key, titles: TITLES },
      )
      const page = await context.newPage()
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${base}?ruleset=expedition&lang=${language}`)
      const trigger = page.locator('.title-trigger')
      if (width < 500) await trigger.tap()
      else await trigger.click()
      const options = page.locator('.title-options')
      assert.equal(await options.locator('small').count(), 22)
      for (const id of TITLES)
        assert.equal(
          await options.locator(`[data-control="equip-title:${id}"] small`).innerText(),
          titleEffectCopy(language, id),
        )
      await page.locator('[data-control="equip-title:veteran"]').focus()
      await page.keyboard.press('Enter')
      assert.equal(
        await page.locator('#title-effect').innerText(),
        titleEffectCopy(language, 'veteran'),
      )
      await page.locator('[data-control="camp-page:achievements"]').click()
      assert.equal(await page.locator('.title-reward-effect').count(), 22)
      assert.match(
        await page.locator('[data-milestone="veteran"] .milestone-reward').innerText(),
        /200/,
      )
      await page.locator('[data-control="camp-page:overview"]').click()
      await page.locator('[data-control="start"]').click()
      await skipArrival(page)
      assert.equal((await saved(page)).journal.departure.title, 'veteran')
      assert.match(await page.locator('.vitality-heading strong').innerText(), /11\/11/)
      await trigger.click()
      await page.locator('[data-control="equip-title:field-unscathed"]').click()
      assert.equal((await saved(page)).camp.milestones.title, 'field-unscathed')
      assert.equal((await saved(page)).journal.departure.title, 'veteran')
      assert.equal(await page.locator('.active-title').getAttribute('data-active-title'), 'veteran')
      assert.match(await page.locator('.vitality-heading strong').innerText(), /11\/11/)
      await page.reload()
      await skipArrival(page)
      assert.equal((await saved(page)).journal.departure.title, 'veteran')
      assert.match(await page.locator('.vitality-heading strong').innerText(), /11\/11/)
      await page.locator('[data-control="retreat"]').click()
      await page.locator('dialog[open] [data-control="confirm"]').click()
      await page.locator('dialog[open] [data-control="camp"]').click()
      await page.locator('[data-control="start"]').click()
      await skipArrival(page)
      assert.equal((await saved(page)).journal.departure.title, 'field-unscathed')
      assert.match(await page.locator('.vitality-heading strong').innerText(), /10\/10/)
      assert.equal((await saved(page)).camp.supplies, 8765)
      if (language === 'zh') {
        await trigger.scrollIntoViewIfNeeded()
        await trigger.click()
        await page.screenshot({ path: `.native/title-builds-${width}.png`, fullPage: true })
      }
      await context.close()
      console.log(
        `Title builds: ${language}/${width}px descriptions, input, rewards, frozen departure and reload passed`,
      )
    }
  }
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
}
