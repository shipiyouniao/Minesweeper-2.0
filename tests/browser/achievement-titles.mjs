import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
import assert from 'node:assert/strict'
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
for (const width of [390, 1280]) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: 'reduce',
    hasTouch: width < 500,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(
        'minesweeper.variants.v1.expedition',
        JSON.stringify({
          version: 4,
          camp: {
            supplies: 3000,
            upgrades: [],
            completed: 3,
            milestones: {
              claimed: ['veteran', 'web-untouched', 'field-unscathed'],
              bossKinds: [],
              relics: [],
            },
          },
          journal: null,
          records: [],
        }),
      )
      sessionStorage.setItem('seeded', '1')
    }
  })
  await page.goto(`${base}?ruleset=expedition&lang=zh`)
  await page.locator('.title-cabinet summary').click()
  await page.locator('[data-control="equip-title:web-untouched"]').focus()
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('.title-cabinet').evaluate((menu) => menu.open), true)
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('data-control')),
    'equip-title:web-untouched',
  )
  await page.keyboard.press('Tab')
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('data-control')),
    'equip-title:field-unscathed',
  )
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('.title-cabinet').evaluate((menu) => menu.open), true)
  await page.locator('[data-control="equip-title:web-untouched"]').click()
  assert.match(await page.locator('.title-cabinet summary').innerText(), /蛛网漫步者/)
  await page.reload()
  assert.match(await page.locator('.title-cabinet summary').innerText(), /蛛网漫步者/)
  await page.evaluate(async () => {
    const { MilestoneNotices } =
      await import('/Minesweeper-2.0/.native/app/ui/milestone-notices.js')
    const { milestoneProgress } = await import('/Minesweeper-2.0/.native/app/game/milestones.js')
    const empty = { supplies: 0, upgrades: [], completed: 0 }
    const notices = new MilestoneNotices()
    notices.observe(empty, 'zh')
    notices.observe(
      { ...empty, milestones: { ...milestoneProgress(empty), travel: 20, chests: 3 } },
      'zh',
    )
  })
  await page.locator('.milestone-toast').waitFor()
  assert.equal(await page.locator('.milestone-toast').count(), 1)
  assert.match(await page.locator('.milestone-toast').innerText(), /20 \/ 20/)
  assert.equal(await page.locator('.milestone-toast.is-complete').count(), 1)
  const box = await page.locator('.milestone-toast').boundingBox()
  assert.ok(box.x >= 0 && box.x + box.width <= width)
  await page.screenshot({ path: `.native/titles-${width}.png`, fullPage: true })
  await page.locator('.milestone-toast button').click()
  await page.waitForTimeout(300)
  assert.match(await page.locator('.milestone-toast').innerText(), /3 \/ 3/)
  await page.evaluate(() => {
    const modal = document.createElement('dialog')
    modal.id = 'pause-test'
    document.body.append(modal)
    modal.showModal()
  })
  await page.waitForTimeout(350)
  assert.equal(await page.locator('.milestone-toast').isVisible(), false)
  await page.evaluate(() => document.querySelector('#pause-test').remove())
  await page.waitForTimeout(350)
  assert.equal(await page.locator('.milestone-toast').isVisible(), true)
  assert.deepEqual(errors, [])
  console.log(`${width}px: title selection/reload, queued completion, modal pause, bounds OK`)
  await context.close()
}
await browser.close()
