import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { readyRescue, solveRescue } from '../../.native/tests/tests/rail-helpers.js'
import { FakeRuntime, MemoryStorage } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
import { StorySession } from '../../.native/tests/src/application/story-session.js'
import { RAIL_SCENES } from '../../.native/tests/src/game/rail-story.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4824/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const storage = new MemoryStorage(),
  repo = new VariantRepository(storage),
  camp = readyRescue(repo)
const session = new ExpeditionSession(repo.forCampaign('quarry-rescue'), new FakeRuntime())
assert.ok(session.start('explorer', []))
const actions = solveRescue()
let first, third, command, ending, boarding, unloading
for (const action of actions) {
  const before = session.run,
    saved = storage.getItem(key)
  if (!first && action.type === 'interact') {
    session.completeCampaignScene('rail-entry')
    first = storage.getItem(key)
    command = action.index
  }
  assert.ok(session.dispatch(action))
  if (action.type === 'interact' && session.run.floor === 3) {
    const hadPassenger = before.rail.stations.find(
      (station) => station.kind === 'passenger',
    ).visited
    const hasPassenger = session.run.rail.stations.find(
      (station) => station.kind === 'passenger',
    ).visited
    if (!hadPassenger && hasPassenger) boarding = { saved, command: action.index }
    if (session.run.rail.stations.every((station) => station.visited))
      unloading = { saved, command: action.index }
  }
  if (!third && session.run.floor === 3) {
    for (const scene of ['rail-entry', 'rail-brakes', 'rail-rescue'])
      session.completeCampaignScene(scene)
    third = storage.getItem(key)
  }
}
ending = storage.getItem(key)
for (const scene of RAIL_SCENES) camp.completeStageScene('quarry-rescue', scene)
const story = new StorySession(camp)
assert.ok(story.dispatch({ type: 'visit', index: 10 }))
assert.ok(story.travelWorld())
assert.ok(story.dispatch({ type: 'visit', index: 45 }))
assert.ok(story.travelWorld())
assert.equal(story.run, null)
const home = storage.getItem(key)
const browser = await chromium.launch({ channel: 'msedge' })
mkdirSync('.native/rail-screenshots', { recursive: true })

/** A fixture uses accepted session actions and an isolated browser context. */
async function seed(page, value, route) {
  await page.goto(base)
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value })
  await page.goto(base + route)
}

/** Close real story typewriters using their normal buttons. */
async function finish(page) {
  for (let i = 0; i < 60; i++) {
    const next = page.locator(
      '.signal-dialogue[open] [data-signal-next], .story-dialogue[open] [data-story-action="dialogue"]',
    )
    if (!(await next.count())) return
    await next.first().click()
  }
  throw Error('Dialogue did not complete')
}

try {
  for (const [width, language] of [
    [320, 'zh'],
    [390, 'ja'],
    [3840, 'en'],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: width > 1000 ? 2160 : 880 },
      hasTouch: width < 1000,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await seed(page, third, `?page=campaign&stage=quarry-rescue&lang=${language}`)
    assert.equal(await page.locator('.rail-board [data-cell]').count(), 289)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.locator('.rail-objective [data-control="help"]').click()
    const modal = page.locator('dialog[open]')
    assert.equal(await modal.locator('.boss-picture-steps > li').count(), 4)
    assert.equal(
      await modal.evaluate((element) => element.scrollWidth > element.clientWidth + 1),
      false,
    )
    await modal
      .locator('img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
    await page.screenshot({
      path: `.native/rail-screenshots/presentation-${width}-${language}.png`,
    })
    await page.keyboard.press('Escape')
    await seed(page, ending, `?page=story&lang=${language}`)
    for (let i = 0; i < 30 && (await page.locator('.story-dialogue[open]').count()); i++)
      await page.locator('[data-story-action="dialogue"]').click()
    await page.locator('[data-signal-scene="rail-home"][open]').waitFor()
    const wallet = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).camp.supplies,
      key,
    )
    await page.reload()
    await page.locator('[data-signal-scene="rail-home"][open]').waitFor()
    assert.equal(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).camp.supplies, key),
      wallet,
    )
    await finish(page)
    await seed(page, home, `?page=story&lang=${language}`)
    await finish(page)
    const resident = page.locator('[data-story-cell="29"] .rail-toma')
    await resident.evaluate((image) => image.decode())
    await page.locator('[data-story-cell="29"]').click()
    await page.locator('[data-signal-scene="rail-camp"][open]').waitFor()
    await page.screenshot({ path: `.native/rail-screenshots/toma-${width}-${language}.png` })
    await finish(page)
    assert.notEqual(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)).story.travel.campPosition,
        key,
      ),
      29,
    )
    assert.deepEqual(errors, [])
    console.log(
      `${language} ${width}px: guide, ending recovery and physical camp conversation passed`,
    )
    await page.close()
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: 'no-preference',
  })
  await page.addInitScript(() => {
    window.railAudioStarts = 0
    window.railTrips = []
    const original = OscillatorNode.prototype.start
    OscillatorNode.prototype.start = function (...args) {
      window.railAudioStarts++
      return original.apply(this, args)
    }
    // Capture departure in the browser's own task; a later driver read can miss a short trip.
    const animate = Element.prototype.animate
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args)
      if (this.matches('[data-rail-vehicle]')) {
        const passenger = this.querySelector('.rail-toma')
        window.railTrips.push({
          passengers: this.querySelectorAll('.rail-toma').length,
          visibility: passenger ? getComputedStyle(passenger).visibility : null,
        })
      }
      return animation
    }
  })
  await seed(page, first, '?page=campaign&stage=quarry-rescue&lang=zh')
  await page.locator(`[data-control="rail-control:${command}"]`).click()
  await page.locator('.rail-moving-cell').waitFor()
  assert.equal(
    await page.locator('.rail-moving-cell').evaluate((element) => getComputedStyle(element).zIndex),
    '30',
  )
  assert.ok(
    await page
      .locator('[data-rail-vehicle]')
      .evaluate((element) => element.getAnimations().length > 0),
  )
  await page.screenshot({ path: '.native/rail-screenshots/cart-moving.png' })
  await page.waitForFunction(() => !document.querySelector('.rail-moving-cell'))
  assert.ok(await page.evaluate(() => window.railAudioStarts > 0))
  console.log('Normal motion: visible cart travel above sibling tiles and audible winch passed')
  for (const [name, checkpoint] of [
    ['boarding', boarding],
    ['unloading', unloading],
  ]) {
    assert.ok(checkpoint)
    await seed(page, checkpoint.saved, '?page=campaign&stage=quarry-rescue&lang=zh')
    await finish(page)
    await page.locator(`[data-control="rail-control:${checkpoint.command}"]`).click()
    await page.waitForFunction(() => window.railTrips.length === 1)
    const departure = await page.evaluate(() => window.railTrips[0])
    const passenger = page.locator('[data-rail-vehicle] .rail-toma')
    assert.equal(departure.passengers, 1)
    assert.equal(departure.visibility, name === 'boarding' ? 'hidden' : 'visible')
    await page.waitForFunction(() => !document.querySelector('.rail-moving-cell'))
    if (name === 'unloading')
      await page.waitForFunction(() => !document.querySelector('[data-rail-vehicle] .rail-toma'))
    else await passenger.waitFor({ state: 'visible' })
    assert.equal(await passenger.count(), name === 'boarding' ? 1 : 0)
    if (name === 'boarding')
      assert.equal(
        await passenger.evaluate((element) => getComputedStyle(element).visibility),
        'visible',
      )
    await page.screenshot({ path: `.native/rail-screenshots/${name}.png` })
  }
  console.log('Passenger boards after arrival and leaves only at the home platform')
  await page.close()
} finally {
  await browser.close()
}
