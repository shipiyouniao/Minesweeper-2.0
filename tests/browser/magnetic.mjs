import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { battleFixture } from './battle-fixtures.mjs'
import { defeatMagnetic } from '../../.native/tests/tests/magnetic-helpers.js'
import { actExpedition, expeditionEarnings } from '../../.native/tests/src/game/expedition.js'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixture = battleFixture(47)
assert.equal(fixture.entered.run.encounter.kind, 'magnetic')
const output = new URL('../../.native/magnetic-ui/', import.meta.url)
await mkdir(output, { recursive: true })
let run = fixture.entered.run
const prefix = [...fixture.entered.save.journal.actions]
let charge
let pulse

/** Capture a current journal after legal actions, including its real extraction checkpoint. */
function save() {
  return {
    ...fixture.entered.save,
    journal: {
      ...fixture.entered.save.journal,
      actions: [...prefix],
      returnSupplies: expeditionEarnings({ ...run, phase: 'retreated' }),
    },
  }
}

for (const action of defeatMagnetic(run)) {
  if (!charge && action.type === 'end-turn' && run.encounter.forecast.kind === 'charge')
    charge = { run, save: save(), next: actExpedition(run, action) }
  if (!pulse && run.encounter.forecast.kind === 'field' && !run.encounter.braced) {
    const next = actExpedition(run, { type: 'end-turn' })
    if (next.health > 0 && next.encounter.resolution.playerPath.length > 1)
      pulse = { run, save: save(), next }
  }
  run = actExpedition(run, action)
  prefix.push(action)
}
assert.ok(charge && pulse)

const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || undefined,
  headless: true,
})
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
await context.addInitScript((key) => {
  const fixture = sessionStorage.getItem('magnetic-fixture')
  if (fixture) {
    localStorage.setItem(key, fixture)
    sessionStorage.removeItem('magnetic-fixture')
  }
}, key)
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))

/** Reload only the isolated browser profile, never the user's live camp or running expedition. */
async function seed(value, language = 'en') {
  await page.goto(`${base}?ruleset=expedition&lang=${language}`)
  await page.evaluate(
    (value) => sessionStorage.setItem('magnetic-fixture', JSON.stringify(value)),
    value,
  )
  await page.reload()
  await page.locator('[data-magnetic]').waitFor()
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  )
}

/** Observe persistence rather than inspecting private application state or injecting game commands. */
async function journal() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal, key)
}

/** A completed turn must leave one coherent new board and no transient performance actors. */
async function settled(next) {
  await page.waitForFunction(
    (turn) => document.querySelector('.tactical-counters strong')?.textContent === String(turn),
    next.encounter.turn,
  )
  assert.equal(
    await page.locator('.magnetic-actor, .magnetic-performing, .magnetic-impact').count(),
    0,
  )
  assert.equal(await page.locator('.player-cell').getAttribute('data-cell'), String(next.player))
  assert.equal(
    await page.locator('.boss-cell').getAttribute('data-cell'),
    String(next.encounter.boss),
  )
}

try {
  for (const language of ['en', 'zh', 'ja']) {
    await seed(fixture.entered.save, language)
    assert.equal(await page.locator('[data-control="end-turn"]').count(), 1)
    assert.ok((await page.locator('.magnetic-arrow').count()) > 20)
    assert.equal(await page.locator('.magnetic-anchor .landmark-clue').count(), 0)
    assert.ok(await page.locator('[data-control="attack"]').isDisabled())
    await page.locator('[data-control="help"]').click()
    assert.match(await page.locator('dialog[open]').innerText(), /6/)
    await page.keyboard.press('Escape')
    for (const width of [320, 390, 900, 1440, 3840]) {
      await page.setViewportSize({ width, height: width === 3840 ? 2160 : 1100 })
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.board-viewport')].every(
          (area) => area.scrollWidth <= area.clientWidth + 1,
        ),
      )
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      assert.ok(
        await page
          .locator('.magnetic-overlay')
          .evaluate((element) => getComputedStyle(element).pointerEvents === 'none'),
      )
      if (language === 'zh' && [390, 1440, 3840].includes(width))
        await page.screenshot({
          path: fileURLToPath(new URL(`magnetic-${width}.png`, output)),
          fullPage: true,
        })
    }
  }
  await page.setViewportSize({ width: 1440, height: 1100 })
  await seed(pulse.save)
  const previousLanding = await page.locator('.magnetic-landing').getAttribute('data-cell')
  await page.locator('[data-control="brace"]').click()
  await page.setViewportSize({ width: 900, height: 1100 })
  assert.equal(await page.locator('.magnetic-landing, .cell[aria-description]').count(), 0)
  assert.equal(await page.locator(`[data-cell="${previousLanding}"]`).getAttribute('title'), null)
  await page.setViewportSize({ width: 1440, height: 1100 })
  await seed(pulse.save, 'zh')
  const pulseBefore = await journal()
  // Deliver the second real click immediately; a screenshot can outlast the entire performance.
  await page.locator('[data-control="end-turn"]').dblclick()
  await page.locator('[data-performance="move"] .magnetic-actor').waitFor()
  await page.screenshot({
    path: fileURLToPath(new URL('magnetic-pulse.png', output)),
    fullPage: true,
  })
  await settled(pulse.next)
  assert.equal((await journal()).actions.length, pulseBefore.actions.length + 1)

  await seed(fixture.objective.save, 'zh')
  const anchor = page.locator(`[data-cell="${fixture.objective.action.index}"]`)
  await anchor.click()
  assert.equal(await page.locator('.magnetic-charge').count(), 1)
  assert.deepEqual((await journal()).actions.at(-1), fixture.objective.action)
  await page.reload()
  await page.locator('.magnetic-charge').waitFor()
  assert.equal(
    await page.locator('.magnetic-performing').count(),
    0,
    'replay must not replay audiovisual effects',
  )

  await seed(charge.save, 'zh')
  await page.locator('.magnetic-stage').scrollIntoViewIfNeeded()
  await page.screenshot({
    path: fileURLToPath(new URL('magnetic-lure.png', output)),
    fullPage: true,
  })
  const chargeBefore = await journal()
  await page.locator('[data-control="end-turn"]').focus()
  await page.keyboard.press('Enter')
  await page.locator('[data-performance="move"] .magnetic-actor').waitFor()
  await page.screenshot({
    path: fileURLToPath(new URL('magnetic-charge.png', output)),
    fullPage: true,
  })
  await settled(charge.next)
  assert.equal((await journal()).actions.length, chargeBefore.actions.length + 1)
  assert.ok(await page.locator('[data-control="attack"]').isEnabled())
  assert.equal(await page.locator('.magnetic-exposed').count(), 1)
  await page.screenshot({
    path: fileURLToPath(new URL('magnetic-exposed.png', output)),
    fullPage: true,
  })

  // Cancelling presentation after commit must retain that turn and release the input guard.
  await seed(charge.save)
  await page.locator('[data-control="end-turn"]').click()
  await page.locator('.magnetic-performing').waitFor()
  await page.locator('[data-control="pause"]').first().click()
  await page.locator('.variant-pause [data-control="pause"]').click()
  await settled(charge.next)
  assert.equal((await journal()).actions.length, chargeBefore.actions.length + 1)

  await seed(charge.save)
  await page.locator('[data-control="end-turn"]').click()
  await page.locator('.magnetic-performing').waitFor()
  await page.locator('[data-control="help"]').click()
  await page.keyboard.press('Escape')
  await settled(charge.next)
  assert.equal((await journal()).actions.length, chargeBefore.actions.length + 1)

  await seed(charge.save)
  await page.locator('[data-control="end-turn"]').click()
  await page.locator('.magnetic-performing').waitFor()
  await page.setViewportSize({ width: 900, height: 1100 })
  await settled(charge.next)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seed(charge.save)
  assert.ok(
    await page
      .locator('.magnetic-trail')
      .evaluate((element) => getComputedStyle(element).animationName === 'none'),
  )
  await page.locator('[data-control="end-turn"]').click()
  await settled(charge.next)
  await page.reload()
  await settled(charge.next)
  await seed(fixture.last.save)
  await page.locator('[data-control="attack"]').click()
  await page.locator('.relic-dialog[open]').waitFor()

  // Touch input remains on real cells underneath the noninteractive overlay.
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  await mobile.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), {
    key,
    save: fixture.objective.save,
  })
  const touch = await mobile.newPage()
  touch.on('pageerror', (error) => errors.push(error.message))
  await touch.goto(`${base}?ruleset=expedition&lang=zh`)
  await touch.locator(`[data-cell="${fixture.objective.action.index}"]`).tap()
  await touch.locator('.magnetic-charge').waitFor()
  await touch.locator('[data-control="end-turn"]').tap()
  await touch.locator('.magnetic-exposed').waitFor()
  assert.equal(await touch.locator('.magnetic-performing').count(), 0)
  await mobile.close()
  assert.deepEqual(errors, [])
  console.log(
    'Magnetic browser acceptance passed: three languages, five widths, public forecasts, actual pulse/charge animations, keyboard, touch, pause, reduced motion, replay and victory.',
  )
} finally {
  await browser.close()
}
