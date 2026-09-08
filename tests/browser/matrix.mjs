import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { battleFixture } from './battle-fixtures.mjs'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'
import { tacticalPlan } from '../../.native/tests/src/game/tactical-planning.js'
import { professionCopy } from '../../.native/tests/src/ui/variant-copy.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixture = battleFixture(55)
assert.equal(fixture.entered.run.encounter.kind, 'matrix')
await mkdir('.native/matrix-ui', { recursive: true })
await writeFile('.native/matrix-ui/entered.json', JSON.stringify(fixture.entered.save))
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
try {
  for (const width of [390, 1440, 3840]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 3840 ? 2160 : 1000 },
      hasTouch: width === 390,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    /** Restore only a legal accepted journal in this isolated browser context. */
    async function seed(save, lang = 'zh') {
      await page.goto(`${base}?ruleset=expedition&lang=${lang}`)
      await page.evaluate(
        ({ key, save }) => sessionStorage.setItem('matrix-fixture', JSON.stringify({ key, save })),
        { key, save },
      )
      await page.reload()
      await page.locator('.matrix-core').waitFor()
      const skip = page.locator('[data-scene="skip"]')
      if (await skip.isVisible()) await skip.click()
      await page.waitForFunction(() =>
        [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      )
    }
    await page.addInitScript(() => {
      const value = sessionStorage.getItem('matrix-fixture')
      if (value) {
        const { key, save } = JSON.parse(value)
        localStorage.setItem(key, JSON.stringify(save))
        sessionStorage.removeItem('matrix-fixture')
      }
    })
    for (const lang of width === 1440 ? ['zh', 'en', 'ja'] : ['zh']) {
      await seed(fixture.entered.save, lang)
      assert.equal(await page.locator('.matrix-region-cell').count(), 9)
      assert.equal(await page.locator('.survey-line').count(), 0)
      assert.ok((await page.locator('.matrix-panel [data-number]').count()) > 0)
      assert.ok(
        (await page.locator('.player-cell').getAttribute('aria-label')).includes(
          professionCopy(lang, fixture.entered.run.departure.profession).name,
        ),
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      const tops = await page
        .locator('.tactical-controls .dock-slot')
        .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().top))
      assert.ok(Math.max(...tops) - Math.min(...tops) < 2, `Combat buttons wrapped: ${tops}`)
      const geometry = await page.evaluate(() => ({
        cell: document.querySelector('.matrix-panel .cell').getBoundingClientRect().width,
        icon: document.querySelector('.matrix-core img').getBoundingClientRect().width,
      }))
      assert.ok(
        geometry.cell >= 24 && geometry.icon >= geometry.cell * 0.5,
        JSON.stringify(geometry),
      )
      await page.screenshot({ path: `.native/matrix-ui/${width}-${lang}.png`, fullPage: true })
      await page.locator('[data-control="help"]').first().click()
      assert.ok((await page.locator('dialog[open]').innerText()).length > 30)
      await page.keyboard.press('Escape')
    }
    // Clues attach to the board; crystal notes hide and return without flagging mines.
    const observe = page.locator('.tactical-controls [data-control="observe"]')
    await observe.click()
    assert.equal(await page.locator('.matrix-edge-clue').count(), 6)
    assert.equal(await page.locator('.matrix-mini-cell').count(), 0)
    const local = fixture.entered.run.encounter.regions[0].crystals[0]
    const square = page.locator('[data-side="a"] [data-cell="' + local + '"]')
    const originalLabel = await square.getAttribute('aria-label')
    await square.press('f')
    assert.equal(await square.evaluate((e) => e.classList.contains('matrix-crystal-note')), true)
    const markedLabel = await square.getAttribute('aria-label')
    assert.notEqual(markedLabel, originalLabel)
    assert.ok(markedLabel.startsWith(originalLabel + ', '))
    await observe.click()
    assert.equal(await square.getAttribute('aria-label'), originalLabel)
    assert.equal(await page.locator('.matrix-observation').isVisible(), false)
    assert.equal(await page.locator('.matrix-crystal-note').count(), 0)
    await observe.click()
    assert.equal(await square.evaluate((e) => e.classList.contains('matrix-crystal-note')), true)
    assert.equal(await square.getAttribute('aria-label'), markedLabel)
    await square.press('f')
    assert.equal(await square.getAttribute('aria-label'), originalLabel)
    assert.equal(await page.locator('.matrix-crystal-note').count(), 0)
    await page.screenshot({ path: `.native/matrix-ui/${width}-observation.png`, fullPage: true })
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.matrix-observation').isVisible(), false)
    // Exhaust AP with legal movement, then verify both visual and interaction state.
    let exhausted = fixture.entered.run
    const spent = []
    while (exhausted.encounter.points > 0 && spent.length < 10) {
      const index = exhausted.game.cells.findIndex((_, index) => {
        const plan = tacticalPlan(exhausted, { type: 'move', index })
        return (
          exhausted.game.cells[index].visibility === 'revealed' && plan.allowed && plan.cost === 1
        )
      })
      assert.ok(index >= 0)
      const action = { type: 'move', index }
      exhausted = actExpedition(exhausted, action)
      spent.push(action)
    }
    assert.equal(exhausted.encounter.points, 0)
    await seed({
      ...fixture.entered.save,
      journal: {
        ...fixture.entered.save.journal,
        actions: [...fixture.entered.save.journal.actions, ...spent],
      },
    })
    const depleted = page.locator('[data-control="attune"]')
    assert.equal(await depleted.getAttribute('aria-disabled'), 'true')
    assert.ok(await depleted.evaluate((e) => Number(getComputedStyle(e).opacity) < 0.6))
    await depleted.click({ force: true })
    assert.equal(await depleted.getAttribute('aria-pressed'), 'false')
    assert.equal(await page.locator('#attune-tip').isVisible(), true)
    // A board click walks to the crystal and extracts it without a separate tool activation.
    await seed({
      ...fixture.objective.save,
      journal: {
        ...fixture.objective.save.journal,
        actions: [...fixture.objective.save.journal.actions, { type: 'end-turn' }],
      },
    })
    await observe.click()
    await page.locator('[data-cell="' + fixture.objective.action.index + '"]').click()
    await page.locator('.matrix-exposed').waitFor()
    assert.equal(await observe.getAttribute('aria-expanded'), 'false')
    assert.equal(await observe.getAttribute('aria-pressed'), 'false')
    assert.equal(await page.locator('.matrix-observation').isVisible(), false)
    await observe.click()
    assert.equal(await observe.getAttribute('aria-expanded'), 'false')
    assert.equal(await page.locator('.matrix-collected-cell').count(), 2)
    await seed(fixture.objective.save)
    const tool = page.locator('[data-control="attune"]')
    const target = page.locator('[data-cell="' + fixture.objective.action.index + '"]')
    if (width === 390) {
      await tool.tap()
      await tool.tap()
      assert.equal(await tool.getAttribute('aria-pressed'), 'false')
      await tool.tap()
      await target.tap()
    } else {
      await tool.press('Enter')
      await target.press('Enter')
    }
    assert.equal(await page.locator('.matrix-exposed').count(), 1)
    assert.equal(await page.locator('.matrix-collected-cell').count(), 2)
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal, key)
    assert.equal(saved.actions.at(-1).type, 'attune')
    assert.equal(saved.actions.at(-1).index, fixture.objective.action.index)
    await page.screenshot({ path: '.native/matrix-ui/' + width + '-shield.png', fullPage: true })
    await page.reload()
    assert.equal(await page.locator('.matrix-exposed').count(), 1)
    assert.deepEqual(errors, [])
    await context.close()
  }
  console.log(
    'Matrix: touch/keyboard targeting, local notes, three locales, responsive layout, ordinary clues, extraction and replay verified.',
  )
} finally {
  await browser.close()
}
