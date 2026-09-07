import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { battleFixture } from './battle-fixtures.mjs'
import { defeatClock } from '../../.native/tests/tests/clock-helpers.js'
import { actExpedition, expeditionEarnings } from '../../.native/tests/src/game/expedition.js'
import { tacticalPlan } from '../../.native/tests/src/game/tactical-planning.js'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixture = battleFixture(64)
assert.equal(fixture.entered.run.encounter.kind, 'clock')
let run = fixture.entered.run
const actions = [...fixture.entered.save.journal.actions]
const save = () => ({
  ...fixture.entered.save,
  journal: {
    ...fixture.entered.save.journal,
    actions: [...actions],
    returnSupplies: expeditionEarnings({ ...run, phase: 'retreated' }),
  },
})
let glass, strike, dual
for (const action of defeatClock(run)) {
  for (const entry of run.encounter.hourglasses)
    if (!glass && tacticalPlan(run, { type: 'interact', index: entry.index }).allowed)
      glass = { save: save(), index: entry.index }
  if (!strike && action.type === 'attack') strike = { save: save(), run }
  if (!dual && run.encounter.spells.some((spell) => spell.shape === 'line')) dual = save()
  run = actExpedition(run, action)
  actions.push(action)
}
assert.ok(glass && strike && dual)
await mkdir('.native/clock-ui', { recursive: true })
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || undefined,
})
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.addInitScript((key) => {
  const value = sessionStorage.getItem('clock-fixture')
  if (value) {
    localStorage.setItem(key, value)
    sessionStorage.removeItem('clock-fixture')
  }
}, key)
async function seed(value, language = 'zh') {
  await page.goto(`${base}?ruleset=expedition&lang=${language}`)
  await page.evaluate(
    (value) => sessionStorage.setItem('clock-fixture', JSON.stringify(value)),
    value,
  )
  await page.reload()
  await page.locator('.clock-boss').waitFor()
  const skip = page.locator('[data-scene="skip"]')
  if (await skip.isVisible()) await skip.click()
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  )
}
const journal = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal, key)
try {
  for (const language of ['en', 'zh', 'ja']) {
    await seed(fixture.entered.save, language)
    assert.equal(await page.locator('[data-control="end-turn"]').count(), 1)
    assert.equal(await page.locator('.clock-hourglass').count(), 3)
    assert.equal(await page.locator('.clock-hourglass .landmark-clue').count(), 0)
    assert.ok((await page.locator('.clock-countdowns').count()) > 0)
    await page.locator('[data-control="help"]').click()
    assert.equal(await page.locator('dialog[open] .boss-picture-steps li').count(), 3)
    await page.keyboard.press('Escape')
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1100 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      if (language === 'zh')
        await page.screenshot({ path: `.native/clock-ui/clock-${width}.png`, fullPage: true })
    }
    const before = await journal()
    await page.locator('[data-control="end-turn"]').click()
    assert.equal((await journal()).actions.length, before.actions.length + 1)
    assert.equal(await page.locator('.clock-countdowns b').first().innerText(), '1')
    await page.reload()
    await page.locator('.clock-boss').waitFor()
    const skip = page.locator('[data-scene="skip"]')
    if (await skip.isVisible()) await skip.click()
    assert.equal(await page.locator('.clock-countdowns b').first().innerText(), '1')
  }
  await seed(glass.save)
  const before = await journal()
  const target = page.locator(`[data-side="a"] [data-cell="${glass.index}"]`)
  await target.focus()
  await page.keyboard.press('Enter')
  assert.equal((await journal()).actions.length, before.actions.length + 1)
  assert.ok(await target.evaluate((cell) => cell.classList.contains('clock-used')))
  assert.ok((await page.locator('.clock-countdowns .returned').count()) > 0)
  await page.reload()
  await page.locator('.clock-used').waitFor()
  await seed(strike.save)
  await page.locator('[data-control="attack"]').click()
  assert.match(await page.locator('.clock-queue strong').innerText(), /5/)
  assert.ok(await page.locator('.echo-damage').count())
  const attacked = actExpedition(strike.run, { type: 'attack' })
  const landing = attacked.game.cells.findIndex(
    (_, index) =>
      index !== attacked.player && tacticalPlan(attacked, { type: 'move', index }).allowed,
  )
  if (landing >= 0) {
    await page.locator(`[data-cell="${landing}"]`).click()
    await page.waitForFunction(
      (index) =>
        document.querySelector(`[data-cell="${index}"]`)?.classList.contains('dungeon-player'),
      landing,
    )
    await page.waitForTimeout(500)
  } else assert.notEqual(attacked.player, attacked.encounter.echo.index)
  const clues = await page.locator('.landmark-clue').evaluateAll((elements) =>
    elements
      .filter((el) => Number(el.textContent) > 0)
      .map((el) => ({
        color: getComputedStyle(el).color,
        expected: getComputedStyle(el.parentElement).getPropertyValue('--clue-color').trim(),
        align: getComputedStyle(el).alignItems,
        justify: getComputedStyle(el).justifyContent,
      })),
  )
  assert.ok(clues.length)
  for (const clue of clues) {
    assert.equal(clue.align, 'center')
    assert.equal(clue.justify, 'center')
    assert.ok(clue.expected)
    const rgb = clue.expected
      .slice(1)
      .match(/../g)
      .map((part) => parseInt(part, 16))
    assert.equal(clue.color, `rgb(${rgb.join(', ')})`)
  }
  await page.screenshot({ path: '.native/clock-ui/clock-echo-ready.png', fullPage: true })
  await page.locator('[data-control="end-turn"]').click()
  assert.match(await page.locator('.clock-queue').innerText(), /残影 5/)
  assert.ok(await page.locator('.echo-hit').count())
  assert.ok((await page.locator('.clock-impact').count()) > 0)
  await page.locator('[data-control="brace"]').click()
  assert.equal(await page.locator('.clock-impact').count(), 0)
  await page.reload()
  await page.locator('.clock-boss').waitFor()
  const skip = page.locator('[data-scene="skip"]')
  if (await skip.isVisible()) await skip.click()
  assert.equal(await page.locator('.clock-impact').count(), 0)
  await seed(dual)
  assert.ok((await page.locator('.clock-queue li').count()) >= 2)
  await page.screenshot({ path: '.native/clock-ui/clock-dual.png', fullPage: true })
  await seed(fixture.last.save)
  await page.locator(`[data-control="${fixture.last.action.type}"]`).click()
  await page.locator('dialog[open]').waitFor()
  const complete = await journal()
  assert.ok(complete.actions.length > fixture.last.save.journal.actions.length)
  await page.reload()
  assert.equal((await journal()).actions.length, complete.actions.length)
  assert.deepEqual(errors, [])
  console.log(
    'Clock browser acceptance passed: three languages, widths, keyboard, deadlines, reload, return, echo, dual forecasts and victory.',
  )
} finally {
  await browser.close()
}
