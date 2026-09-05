import { EXPEDITION_RULES_REVISION } from '../../.native/tests/src/persistence/expedition-format.js'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || undefined,
  headless: true,
})
const context = await browser.newContext({ reducedMotion: 'reduce' })
await context.addInitScript((key) => {
  const fixture = sessionStorage.getItem('retirement-fixture')
  if (fixture) {
    localStorage.setItem(key, fixture)
    sessionStorage.removeItem('retirement-fixture')
  }
}, key)
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))

/** Seed after the previous page saves itself; use only a disposable browser context. */
async function seed(save, language) {
  await page.goto(`${base}?ruleset=expedition&lang=${language}`)
  await page.evaluate(
    (save) => sessionStorage.setItem('retirement-fixture', JSON.stringify(save)),
    save,
  )
  await page.reload()
}

/** Observe the persisted envelope without accessing internal application state. */
async function saved() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
}

try {
  for (const language of ['en', 'zh', 'ja']) {
    for (const width of [320, 1280, 3840]) {
      await page.setViewportSize({ width, height: 1000 })
      await seed(
        {
          version: 3,
          camp: { supplies: 321, completed: 2, upgrades: ['engineer', 'workshop'] },
          records: [],
          journal: { departure: { encounters: 'brood-v1' }, actions: [] },
        },
        language,
      )
      assert.equal((await saved()).camp.supplies, 521)
      assert.equal((await saved()).journal, null)
      assert.equal((await saved()).version, 4)
      assert.equal(await page.locator('.tactical-panel').count(), 0)
      await page.locator('[data-control="camp-page:equipment"]').click()
      for (const equipment of ['probe', 'scanner', 'guard']) {
        const card = page.locator(`[data-control="equipment:${equipment}"]`)
        assert.ok(!(await card.locator('strong').innerText()).includes('·'))
        assert.match(
          await card.locator('span').innerText(),
          language === 'en'
            ? /^[12] loadout points?\. Starting .+ \+1\.$/
            : language === 'zh'
              ? /^装备预算 [12] 点。初始.+ \+1。$/
              : /^装備[12]ポイント。初期.+\+1。$/,
        )
      }
      if (language === 'zh' && width === 1280) {
        await page.locator('[data-control="equipment:probe"]').scrollIntoViewIfNeeded()
        await page.screenshot({ path: '.native/retirement-loadout.png' })
      }
      assert.ok((await page.locator('.variant-storage').innerText()).includes('200'))
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
      )
      await page.reload()
      assert.equal((await saved()).camp.supplies, 521)
      assert.equal((await saved()).camp.completed, 2)
      assert.deepEqual((await saved()).camp.upgrades, ['engineer', 'workshop'])
      assert.equal(await page.locator('.variant-storage').innerText(), '')
      await page.locator('[data-control="start"]').click()
      const journal = (await saved()).journal
      assert.equal(journal.rulesRevision, EXPEDITION_RULES_REVISION)
      assert.equal(journal.returnSupplies, 0)
      assert.equal(journal.departure.encounters, undefined)
      await page.reload()
      assert.deepEqual((await saved()).journal, journal)
    }
    await seed(
      {
        version: 4,
        camp: { supplies: 321, completed: 2, upgrades: [] },
        records: [],
        journal: { rulesRevision: 0, returnSupplies: 157, actions: [{ type: 'retired-command' }] },
      },
      language,
    )
    assert.equal((await saved()).camp.supplies, 478)
    assert.ok((await page.locator('.variant-storage').innerText()).includes('157'))
    await page.reload()
    assert.equal((await saved()).camp.supplies, 478)
  }
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      languages: 3,
      widths: [320, 1280, 3840],
      retirement: true,
      singleCredit: true,
      checkpointExtraction: true,
      newDeparture: true,
      consistentLoadoutCopy: true,
      errors,
    }),
  )
} finally {
  await browser.close()
}
