import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { milestoneProgress } from '../../.native/tests/src/game/milestones.js'
import { EMPTY_CAMP } from '../../.native/tests/src/game/expedition.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const errors = []
await mkdir('.native/milestone-ui', { recursive: true })
const fixture = {
  version: 4,
  camp: {
    ...EMPTY_CAMP,
    completed: 3,
    upgrades: ['workshop'],
    milestones: { ...milestoneProgress(EMPTY_CAMP), travel: 20, skills: 3, floors: 5, wins: 3 },
  },
  journal: null,
  records: [],
}

async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
}
async function checkLayout(page) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    'No horizontal page overflow',
  )
  assert.ok(
    await page
      .locator('.milestone-card')
      .evaluateAll((cards) => cards.every((card) => card.scrollWidth <= card.clientWidth + 1)),
  )
}

try {
  for (const language of ['en', 'zh', 'ja']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    })
    await context.addInitScript(
      ({ key, fixture }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(fixture))
      },
      { key, fixture },
    )
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}?ruleset=expedition&lang=${language}`)
    assert.equal(
      await page.locator('[data-camp-page="overview"] [data-control^="difficulty:"]').count(),
      5,
    )
    assert.equal(await page.locator('[data-control="camp-page:route"]').count(), 0)
    await page.locator('[data-control="difficulty:expert"]').click()
    await page.reload()
    assert.equal(
      await page.locator('[data-control="difficulty:expert"]').getAttribute('aria-pressed'),
      'true',
    )
    if (language === 'zh')
      await page.screenshot({ path: '.native/milestone-ui/overview.png', fullPage: true })
    await page.locator('[data-control="camp-page:missions"]').click()
    assert.equal(await page.locator('.milestone-card').count(), 21)
    assert.equal(
      await page
        .locator('[data-milestone="first-steps"]')
        .evaluate((card) => getComputedStyle(card).borderTopColor),
      'rgb(115, 159, 141)',
      'completed unclaimed goals retain their ready border',
    )
    assert.deepEqual(
      await page
        .locator('.milestone-heading img')
        .first()
        .evaluate((icon) => {
          const rect = icon.getBoundingClientRect()
          return [rect.width, rect.height]
        }),
      [60, 60],
    )
    assert.ok(await page.locator('[data-control="claim-milestone:first-boss"]').isDisabled())
    await page.locator('[data-control="claim-milestone:first-steps"]').focus()
    await page.keyboard.press('Enter')
    assert.equal(
      await page
        .locator('[data-milestone="first-steps"]')
        .evaluate((card) => getComputedStyle(card).backgroundColor),
      'rgb(241, 244, 239)',
      'claimed goals retain their distinct state',
    )
    assert.equal((await saved(page)).camp.supplies, 30)
    assert.ok(await page.locator('[data-control="claim-milestone:first-steps"]').isDisabled())
    await page.reload()
    await page.locator('[data-control="camp-page:missions"]').click()
    assert.ok(await page.locator('[data-control="claim-milestone:first-steps"]').isDisabled())
    assert.equal((await saved(page)).camp.supplies, 30)
    await page.locator('[data-control="claim-milestone:field-practice"]').click()
    await page.locator('[data-control="claim-milestone:floor-runner"]').click()
    assert.equal((await saved(page)).camp.supplies, 190)
    for (const width of [320, 390, 900, 1440, 3840]) {
      await page.setViewportSize({ width, height: 1000 })
      await checkLayout(page)
      if (language === 'zh' && width === 390)
        await page.screenshot({ path: '.native/milestone-ui/missions-mobile.png', fullPage: true })
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.locator('[data-control="camp-page:achievements"]').click()
    assert.equal(await page.locator('.milestone-card').count(), 24)
    if (language === 'zh')
      await page.screenshot({ path: '.native/milestone-ui/achievements.png', fullPage: true })
    await page.locator('[data-control="claim-milestone:veteran"]').click()
    assert.equal((await saved(page)).camp.supplies, 390)
    await page.locator('[data-control="camp-page:equipment"]').click()
    assert.ok(await page.locator('[data-control="equipment:field-radio"]').isEnabled())
    await page.locator('[data-control="equipment:field-radio"]').click()
    await page.locator('[data-control="camp-page:overview"]').click()
    await page.locator('[data-control="start"]').click()
    const departure = (await saved(page)).journal.departure
    assert.deepEqual(departure.milestoneRelics, ['pulse-coil', 'trail-heart'])
    assert.deepEqual(departure.equipment, ['field-radio'])
    assert.equal(departure.difficulty, 'expert')
    await context.close()
  }
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  await context.addInitScript(
    ({ key, fixture }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(fixture))
    },
    { key, fixture },
  )
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}?ruleset=expedition&lang=zh`)
  await page.locator('[data-control="difficulty:abyss"]').tap()
  await checkLayout(page)
  await page.locator('[data-control="camp-page:missions"]').tap()
  await page.locator('[data-control="claim-milestone:first-steps"]').tap()
  assert.equal((await saved(page)).camp.supplies, 30)
  await page.reload()
  assert.equal((await saved(page)).camp.supplies, 30)
  assert.equal((await saved(page)).difficulty, 'abyss')
  await context.close()
  assert.deepEqual(errors, [])
  console.log(
    'Milestones browser acceptance passed: homepage difficulty, three languages, five widths, keyboard/touch claims, reload and exclusive departure rewards.',
  )
} finally {
  await browser.close()
}
