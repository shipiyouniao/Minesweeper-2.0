import { EXPEDITION_RULES_REVISION } from '../../.native/tests/src/persistence/expedition-format.js'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { UPGRADES } from '../../.native/tests/src/game/expedition.js'
import { battleFixture } from './battle-fixtures.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const output = new URL('../../.native/battle-ui/', import.meta.url)

const fixtures = [battleFixture(42), battleFixture(43)]
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || undefined,
  headless: true,
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  reducedMotion: 'reduce',
})
await context.addInitScript(
  ({ key }) => {
    const value = sessionStorage.getItem('battle-fixture')
    if (value) {
      localStorage.setItem(key, value)
      sessionStorage.removeItem('battle-fixture')
    }
  },
  { key },
)
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))

/** Seed only this isolated browser context after the previous page checkpoints itself. */
async function seed(save, language = 'en') {
  await page.goto(`${base}?ruleset=expedition&lang=${language}`)
  await page.evaluate(
    (value) => sessionStorage.setItem('battle-fixture', JSON.stringify(value)),
    save,
  )
  await page.reload()
}

/** Read the persisted journal rather than inspecting private application objects. */
async function journal() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal, key)
}

try {
  for (const fixture of fixtures) {
    const kind = fixture.entered.run.encounter.kind
    for (const language of ['en', 'zh', 'ja']) {
      await seed(fixture.entered.save, language)
      assert.equal(
        await page
          .locator('.combat-stats strong')
          .allTextContents()
          .then((values) => values.join(',')),
        '5,0,3',
      )
      const objectives =
        kind === 'brood'
          ? fixture.entered.run.encounter.nests
          : fixture.entered.run.encounter.pylons.map((entry) => entry.index)
      for (const index of objectives)
        assert.equal(
          await page.locator(`[data-cell="${index}"] .landmark-clue`).count(),
          0,
          'covered objective must not leak its number',
        )
      assert.ok(await page.locator('[data-control="attack"]').isDisabled())
      await page.locator('[data-control="help"]').click()
      assert.match(await page.locator('dialog[open]').innerText(), /5/)
      await page.keyboard.press('Escape')
      for (const width of [320, 1280, 3840]) {
        await page.setViewportSize({ width, height: width === 3840 ? 2160 : 900 })
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
        assert.ok(
          await page
            .locator('img')
            .evaluateAll((images) =>
              images.every((image) => image.complete && image.naturalWidth > 0),
            ),
        )
        if (language === 'zh')
          await page.screenshot({
            path: fileURLToPath(new URL(`${kind}-${width}.png`, output)),
            fullPage: true,
          })
      }
    }
    await page.setViewportSize({ width: 1280, height: 1000 })
    await seed(fixture.objective.save, 'zh')
    await page.locator(`[data-cell="${fixture.objective.action.index}"]`).click()
    const after = await journal()
    assert.equal(after.actions.length, fixture.objective.save.journal.actions.length + 1)
    assert.deepEqual(after.actions.at(-1), fixture.objective.action)
    await page.reload()
    assert.deepEqual(await journal(), after)
    if (kind === 'brood') assert.equal(await page.locator('.nest-destroyed').count(), 1)
    if (fixture.prime) {
      await seed(fixture.prime.save, 'zh')
      await page.locator('[data-control="attack"]').click()
      assert.deepEqual((await journal()).actions.at(-1), fixture.prime.action)
    }
    await seed(fixture.last.save, 'zh')
    await page.locator('[data-control="attack"]').click()
    await page.locator('.relic-dialog[open]').waitFor()
    assert.equal((await journal()).actions.length, fixture.last.save.journal.actions.length + 1)
  }
  await seed(
    {
      version: 4,
      camp: { supplies: 6000, upgrades: ['workshop', 'steel-blade', 'medical-kit'], completed: 0 },
      journal: null,
      records: [],
    },
    'zh',
  )
  assert.equal(await page.locator('[data-control^="upgrade:"]').count(), UPGRADES.length)
  await page.locator('[data-control="upgrade:vitality-training"]').click()
  await page.locator('[data-control="upgrade:weapon-training"]').click()
  assert.ok(await page.locator('[data-control="upgrade:weapon-training"]').isDisabled())
  await page.locator('[data-control="equipment:steel-blade"]').click()
  await page.locator('[data-control="equipment:medical-kit"]').click()
  await page.locator('[data-control="start"]').click()
  assert.match(await page.locator('.vitality-heading').innerText(), /13\/13/)
  const started = await journal()
  assert.equal(started.rulesRevision, EXPEDITION_RULES_REVISION)
  assert.deepEqual(started.departure.training, ['vitality-training', 'weapon-training'])
  assert.deepEqual(started.departure.equipment, ['steel-blade', 'medical-kit'])
  await page.reload()
  assert.deepEqual(await journal(), started)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      bosses: 2,
      languages: 3,
      widths: [320, 1280, 3840],
      objectiveClicks: true,
      corePriming: true,
      bossRewards: true,
      campTraining: true,
      recovery: true,
      hiddenClues: true,
      errors,
    }),
  )
} finally {
  await browser.close()
}
