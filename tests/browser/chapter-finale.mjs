import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { readyFinale } from '../../.native/tests/tests/finale-fixtures.js'
import { solveFinale } from '../../.native/tests/tests/finale-helpers.js'
import { MemoryStorage } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4824/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const storage = new MemoryStorage()
const repository = new VariantRepository(storage)
readyFinale(repository)
const fixture = storage.getItem(key)
const baseline = repository.expedition()
const plans = {
  'tower-control': solveFinale('tower-control').actions,
  'northwest-bastion': solveFinale('northwest-bastion').actions,
}
const browser = await chromium.launch({ channel: 'msedge' })
mkdirSync('.native/finale-screenshots', { recursive: true })

/** Advance real typewriter buttons, including the guardian's longer concluding conversation. */
async function dialogue(page) {
  for (let i = 0; i < 80 && (await page.locator('.signal-dialogue[open]').count()); i++)
    await page.locator('[data-signal-next]').click()
  assert.equal(await page.locator('.signal-dialogue[open]').count(), 0)
}

/** Validate both diagram layout and image decoding without dispatching a gameplay action. */
async function guide(page, width, name) {
  await page.locator('[data-control="help"]').first().click()
  const dialog = page.locator('dialog[open]')
  await dialog.waitFor()
  assert.ok((await dialog.locator('.boss-picture-steps > li').count()) >= 3)
  await dialog
    .locator('img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
  assert.equal(
    await dialog.evaluate((element) => element.scrollWidth > element.clientWidth + 1),
    false,
  )
  await page.screenshot({ path: `.native/finale-screenshots/${name}-guide-${width}.png` })
  await page.keyboard.press('Escape')
}

/** Use the original touch location for long-press flags, including in the tactical arena. */
async function flag(page, cell, width) {
  if (width > 390) return cell.click({ button: 'right' })
  await cell.scrollIntoViewIfNeeded()
  const box = await cell.boundingBox()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
  })
  await page.waitForTimeout(560)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

/** Play a full authored stage through its visible controls and compare each persisted intent. */
async function stage(page, id, width) {
  await dialogue(page)
  await guide(page, width, id)
  let count = 0,
    floor = 1
  for (const action of plans[id]) {
    if (action.type === 'relic') {
      await page.locator(`[data-control="relic:${action.relic}"]`).click()
      floor++
    } else if (['attack', 'end-turn', 'brace'].includes(action.type)) {
      await page.locator(`[data-control="${action.type}"]`).click()
    } else {
      const cell = page.locator(`[data-side="a"] [data-cell="${action.index}"]`)
      if (action.type === 'flag') await flag(page, cell, width)
      else if (width <= 390) await cell.tap()
      else await cell.click()
    }
    count++
    await page.waitForFunction(
      ({ key, id, count }) => {
        const saved = JSON.parse(localStorage.getItem(key)).campaign.stages.find(
          (stage) => stage.id === id,
        )
        return saved.cleared || saved.journal?.actions.length === count
      },
      { key, id, count },
      { timeout: 5000 },
    )
    const saved = await page.evaluate(
      ({ key, id }) =>
        JSON.parse(localStorage.getItem(key)).campaign.stages.find((stage) => stage.id === id),
      { key, id },
    )
    if (saved.journal) assert.deepEqual(saved.journal.actions.at(-1), action)
    if (count === 9) {
      await page.reload()
      await dialogue(page)
    }
    if (saved.cleared) {
      writeFileSync(
        `.native/${id}-ending-save.json`,
        await page.evaluate((key) => localStorage.getItem(key), key),
      )
      await page.screenshot({ path: `.native/finale-screenshots/${id}-ending-${width}.png` })
    }
    await dialogue(page)
    if (action.type === 'relic') {
      assert.equal(
        await page.locator('dialog.prologue-dialog[open]').count(),
        0,
        'The campaign owns its guardian dialogue',
      )
      await guide(page, width, `${id}-floor-${floor}`)
      if (floor === 3 && id === 'northwest-bastion')
        await page.screenshot({ path: `.native/finale-screenshots/guardian-${width}.png` })
    }
    if (count % 100 === 0)
      console.log(`${width}px ${id}: ${count}/${plans[id].length} accepted actions`)
  }
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
  )
  await page.locator('[data-control="camp"]').click()
  await page.locator('.story-board').waitFor()
  return count
}

/** These known paths visit actual portals; selecting the atlas never changes the player's location. */
async function worldClick(page, index, destination) {
  await page.locator(`[data-story-cell="${index}"]`).click()
  if (destination) await page.locator(`[data-story-scene="${destination}"]`).waitFor()
}

/** Zoom into the western district, then open a discovered local map with one tap or click. */
async function openMapNode(page, scene, width) {
  await page.locator('[data-map-zoom="reset"]').click()
  await page.locator('[data-map-focus="west"]').click()
  const marker = page.locator(`.atlas-node[data-scene="${scene}"]`)
  if (width > 390) await marker.click()
  else await marker.tap()
}

try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 950 },
      hasTouch: width <= 390,
      reducedMotion: 'reduce',
    })
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(base)
    await page.evaluate(({ key, fixture }) => localStorage.setItem(key, fixture), { key, fixture })
    await page.goto(`${base}?page=story&lang=zh`)
    await page.locator('[data-story-campaign]').click()
    const controlActions = await stage(page, 'tower-control', width)
    await worldClick(page, 28, 'north-road')
    await worldClick(page, 12, 'northwest-bridge')
    await page.screenshot({ path: `.native/finale-screenshots/bridge-${width}.png` })
    for (const index of [76, 66]) await worldClick(page, index)
    await worldClick(page, 14, 'blockade-pass')
    await page.reload()
    await worldClick(page, 92, 'camp')
    await worldClick(page, 19, 'blockade-pass')
    await worldClick(page, 16)
    await page.locator('[data-story-campaign]').click()
    const bossActions = await stage(page, 'northwest-bastion', width)
    await worldClick(page, 92, 'camp')
    await dialogue(page)
    const after = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
    assert.equal(after.camp.supplies, baseline.camp.supplies + 420)
    assert.deepEqual(after.journal, baseline.journal)
    assert.ok(after.story.quests.completed.includes('open-blockade'))
    assert.ok(
      after.campaign.stages
        .find((stage) => stage.id === 'northwest-bastion')
        .scenes.includes('chapter-camp'),
    )
    await page.locator('[data-story-action="map"]').click()
    await page.locator('[data-story-action="map-level"][data-level="world"]').first().click()
    await page
      .locator('[data-atlas-route="north-road:northwest-bridge"][data-route-state="open"]')
      .waitFor()
    assert.equal(await page.locator('[data-scene="9"]').isDisabled(), false)
    assert.equal(await page.locator('[data-scene="10"]').isDisabled(), false)
    await page.screenshot({ path: `.native/finale-screenshots/world-${width}.png` })
    const checkpoint = await page.evaluate((key) => localStorage.getItem(key), key)
    await openMapNode(page, 9, width)
    await page.locator('[data-map-level="local"][data-map-scene="9"]').waitFor()
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), checkpoint)
    await page.locator('[data-story-action="map-level"][data-level="world"]').first().click()
    await openMapNode(page, 10, width)
    await page.locator('[data-map-level="local"][data-map-scene="10"]').waitFor()
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), checkpoint)
    assert.deepEqual(errors, [])
    console.log(
      `chapter finale ${width}px: ${controlActions + bossActions} stage actions, physical northwest route and return trip passed`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
