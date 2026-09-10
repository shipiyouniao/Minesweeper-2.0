import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { readyRescue, solveRescue } from '../../.native/tests/tests/rail-helpers.js'
import { MemoryStorage } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4824/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const storage = new MemoryStorage(),
  repository = new VariantRepository(storage)
readyRescue(repository, false)
const fixture = storage.getItem(key),
  baseline = repository.expedition(),
  actions = solveRescue()
const browser = await chromium.launch({ channel: 'msedge' })
mkdirSync('.native/rail-screenshots', { recursive: true })

/** Finish actual voiced dialogue through its next button, never a private application method. */
async function dialogue(page) {
  for (let i = 0; i < 30 && (await page.locator('.signal-dialogue[open]').count()); i++)
    await page.locator('[data-signal-next]').click()
  assert.equal(await page.locator('.signal-dialogue[open]').count(), 0)
}

/** Long-press the original coordinate on phones; the ordinary desktop secondary action stays native. */
async function flag(page, cell, touch) {
  if (!touch) return cell.click({ button: 'right' })
  await cell.scrollIntoViewIfNeeded()
  const box = await cell.boundingBox(),
    cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
  })
  await page.waitForTimeout(560)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

/** The illustrated guide must fit the modal and use decoded art at every floor. */
async function guide(page, width, floor) {
  await page.locator('[data-control="help"]').first().click()
  const modal = page.locator('dialog[open]')
  assert.equal(await modal.locator('.boss-picture-steps > li').count(), 3)
  await modal
    .locator('img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
  assert.equal(
    await modal.evaluate((element) => element.scrollWidth > element.clientWidth + 1),
    false,
  )
  await page.screenshot({ path: `.native/rail-screenshots/guide-${width}-${floor}.png` })
  await page.keyboard.press('Escape')
}

try {
  for (const width of [1440, 390]) {
    const touch = width === 390
    const page = await browser.newPage({
      viewport: { width, height: 950 },
      hasTouch: touch,
      reducedMotion: 'reduce',
    })
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(base)
    await page.evaluate(({ key, fixture }) => localStorage.setItem(key, fixture), { key, fixture })
    await page.goto(`${base}?page=story&lang=zh`)
    for (let beat = 0; beat < 40 && (await page.locator('.story-dialogue[open]').count()); beat++)
      await page.locator('[data-story-action="dialogue"]').click()
    const entrance = page.locator('[data-story-cell="25"]')
    if (touch) await entrance.tap()
    else await entrance.click()
    await page.locator('[data-story-campaign]').click()
    await dialogue(page)
    await guide(page, width, 1)
    let count = 0,
      floor = 1,
      operated = 0
    for (const action of actions) {
      if (action.type === 'relic') {
        await page.locator(`[data-control="relic:${action.relic}"]`).click()
        floor++
      } else if (action.type === 'interact' && operated++ % 2 === 0) {
        const lever = page.locator(`[data-control="rail-control:${action.index}"]`)
        if (touch) await lever.tap()
        else {
          await lever.focus()
          await page.keyboard.press('Enter')
        }
      } else {
        const cell = page.locator(`[data-side="a"] [data-cell="${action.index}"]`)
        if (action.type === 'flag') await flag(page, cell, touch)
        else if (touch) await cell.tap()
        else await cell.click()
      }
      count++
      await page.waitForFunction(
        ({ key, count }) => {
          const stage = JSON.parse(localStorage.getItem(key)).campaign.stages.find(
            (entry) => entry.id === 'quarry-rescue',
          )
          return stage.cleared || stage.journal?.actions.length === count
        },
        { key, count },
        { timeout: 6000 },
      )
      const stage = await page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)).campaign.stages.find(
            (entry) => entry.id === 'quarry-rescue',
          ),
        key,
      )
      if (stage.journal) assert.deepEqual(stage.journal.actions.at(-1), action)
      if (count === 15 || (action.type === 'interact' && operated === 5)) {
        await page.reload()
        await dialogue(page)
      }
      if (action.type === 'interact') {
        assert.equal(await page.locator('[data-rail-vehicle]').count(), 1)
        await page.screenshot({ path: `.native/rail-screenshots/floor-${floor}-${width}.png` })
      }
      if (stage.cleared)
        writeFileSync(
          '.native/rail-ending-save.json',
          await page.evaluate((key) => localStorage.getItem(key), key),
        )
      await dialogue(page)
      if (action.type === 'relic') await guide(page, width, floor)
      if (count % 60 === 0) console.log(`${width}px: ${count}/${actions.length} accepted actions`)
    }
    await page.locator('[data-control="camp"]').click()
    await page.locator('.story-board').waitFor()
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
    assert.deepEqual(saved.journal, baseline.journal)
    assert.equal(saved.camp.supplies, baseline.camp.supplies + 120)
    assert.equal(saved.camp.upgrades.filter((id) => id === 'engineer').length, 1)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    assert.deepEqual(errors, [])
    console.log(
      `${width}px: complete rescue, ${count} actions, one settlement; paused roguelite preserved`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
