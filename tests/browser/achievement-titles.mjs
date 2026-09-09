import { createRequire } from 'node:module'
import { MILESTONES } from '../../.native/tests/src/game/milestones.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
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
  await page.addInitScript(
    (titles) => {
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
                claimed: titles,
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
    },
    MILESTONES.filter((entry) => entry.kind === 'achievements').map((entry) => entry.id),
  )
  await page.goto(`${base}?ruleset=expedition&lang=zh`)
  const trigger = page.locator('.title-trigger')
  const pickerHeight = (await page.locator('.title-cabinet').boundingBox()).height
  await trigger.click()
  assert.equal((await page.locator('.title-cabinet').boundingBox()).height, pickerHeight)
  assert.ok(
    await page.locator('.title-options').evaluate((menu) => menu.scrollHeight > menu.clientHeight),
  )
  await page.locator('[data-control="equip-title:web-untouched"]').focus()
  await page.keyboard.press('Enter')
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
  assert.ok(await trigger.evaluate((button) => button === document.activeElement))
  await page.keyboard.press('ArrowDown')
  assert.equal(
    await page.locator('[data-control="equip-title:web-untouched"]').getAttribute('aria-checked'),
    'true',
  )
  await page.keyboard.press('End')
  assert.ok(await page.locator('.title-options').evaluate((menu) => menu.scrollTop > 0))
  await page.keyboard.press('Escape')
  assert.match(await trigger.innerText(), /蛛网漫步者/)
  await page.keyboard.press('Enter')
  await page.screenshot({ path: `.native/title-picker-${width}.png`, fullPage: true })
  await page.keyboard.press('Tab')
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
  assert.ok(await trigger.evaluate((button) => button !== document.activeElement))
  await trigger.click()
  await page.locator('.camp-panel h1').click()
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
  await trigger.click()
  await page.locator('[data-control="equip-title:none"]').click()
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false')
  await trigger.click()
  await page.locator('[data-control="equip-title:web-untouched"]').click()
  assert.match(await trigger.innerText(), /蛛网漫步者/)
  await page.reload()
  assert.match(await trigger.innerText(), /蛛网漫步者/)
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('minesweeper.variants.v1.expedition')).camp.supplies,
    ),
    3000,
  )
  await page.evaluate(async () => {
    const { MilestoneNotices } = await import('/minefarer/.native/app/ui/milestone-notices.js')
    const { milestoneProgress } = await import('/minefarer/.native/app/game/milestones.js')
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
