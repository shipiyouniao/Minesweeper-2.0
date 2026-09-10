import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
import { CampSession } from '../../.native/tests/src/application/camp-session.js'
import { createStoryRun } from '../../.native/tests/src/game/story.js'
import { checkpointStory } from '../../.native/tests/src/game/story-checkpoint.js'
import { campaignProgress, updateCampaign } from '../../.native/tests/src/game/campaign-catalog.js'
import { solveObservatory } from '../../.native/tests/tests/observatory-helpers.js'
import { MemoryStorage, FakeRuntime } from '../../.native/tests/tests/helpers.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4824/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const storage = new MemoryStorage(),
  repo = new VariantRepository(storage)
new ExpeditionSession(repo, new FakeRuntime()).start('explorer', [])
const camp = new CampSession(repo),
  world = createStoryRun(3)
camp.saveStory({
  ...camp.story,
  arrived: true,
  mapOwned: true,
  campPosition: 31,
  completed: ['reach-camp', 'meet-guide', 'survey-road', 'repair-lift', 'reach-tower'],
  facts: [
    'camp-reached',
    'guide-met',
    'lift-discovered',
    'spindle-secured',
    'lift-restored',
    'tower-reached',
  ],
  dialogue: {
    completed: [
      'wake',
      'flag',
      'open',
      'travel',
      'trail',
      'approach',
      'arrival',
      'guide',
      'north-road-start',
      'north-road-found',
      'quarry-lead',
      'spindle-found',
      'lift-repaired',
      'tower-arrival',
    ],
    active: null,
  },
  world: { ...checkpointStory({ ...world, player: 86 }), active: null },
})
const saved = repo.expedition()
let campaign = saved.campaign
for (const id of ['tower-galleries', 'tower-relay'])
  campaign = updateCampaign(campaign, {
    ...campaignProgress(campaign, id),
    cleared: true,
    scenes: id === 'tower-relay' ? ['rescued'] : [],
  })
repo.saveExpedition({ ...saved, campaign })
const fixture = storage.getItem(key)
const actions = solveObservatory().actions
const browser = await chromium.launch({ channel: 'msedge' })
mkdirSync('.native/ridge-screenshots', { recursive: true })

/** Finish visible lines through the same button used by mouse, touch and keyboard players. */
async function dialogue(page, keyboard = false) {
  for (let i = 0; i < 35 && (await page.locator('.signal-dialogue[open]').count()); i++) {
    if (keyboard) {
      await page.locator('[data-signal-next]').focus()
      await page.keyboard.press('Enter')
    } else await page.locator('[data-signal-next]').click()
  }
  assert.equal(await page.locator('.signal-dialogue[open]').count(), 0)
}

try {
  for (const [width, language] of [
    [1440, 'zh'],
    [390, 'zh'],
    [390, 'en'],
    [390, 'ja'],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 950 },
      hasTouch: width === 390,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(base)
    await page.evaluate(({ key, fixture }) => localStorage.setItem(key, fixture), { key, fixture })
    await page.goto(`${base}?page=story&lang=${language}`)
    await page.locator('[data-story-cell="33"]').click()
    await page.locator('[data-signal-scene="camp"]').waitFor()
    await dialogue(page)
    const accepted = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
    assert.ok(accepted.story.quests.accepted.includes('survey-ridge'))
    // Restore only the overworld position; all new-stage gameplay below uses real UI controls.
    await page.evaluate((key) => {
      const save = JSON.parse(localStorage.getItem(key))
      save.story.travel.world.active = 'north-road'
      save.story.travel.campReached = false
      localStorage.setItem(key, JSON.stringify(save))
    }, key)
    await page.reload()
    await page.locator('[data-story-cell="86"] .ridge-instrument').waitFor()
    await page.locator('[data-story-campaign]').click()
    await page.locator('[data-signal-scene="ridge-entry"]').waitFor()
    await page.screenshot({ path: `.native/ridge-screenshots/dialogue-${width}-${language}.png` })
    await dialogue(page)
    let count = 0,
      floor = 1
    for (const action of actions) {
      if (action.type === 'relic') {
        await page.locator(`[data-control="relic:${action.relic}"]`).click()
        floor++
      } else {
        const cell = page.locator(`[data-side="a"] [data-cell="${action.index}"]`)
        if (action.type === 'flag' && width === 390) {
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
        } else if (action.type === 'flag') await cell.click({ button: 'right' })
        else if (width === 390) await cell.tap()
        else await cell.click()
      }
      count++
      await page.waitForFunction(
        ({ key, count }) => {
          const stage = JSON.parse(localStorage.getItem(key)).campaign.stages.find(
            (entry) => entry.id === 'ridge-observatory',
          )
          return stage.cleared || stage.journal?.actions.length === count
        },
        { key, count },
        { timeout: 5000 },
      )
      if (await page.locator('[data-signal-scene="ridge-found"]').count()) {
        await page.locator('[data-beacon-replay]').click()
        await page.reload()
        await page.locator('[data-signal-scene="ridge-found"]').waitFor()
      }
      await dialogue(page)
      if (action.type === 'interact') {
        await page.screenshot({
          path: `.native/ridge-screenshots/board-${width}-${language}-${floor}.png`,
        })
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        )
      }
      if (count === 9) {
        await page.reload()
        await dialogue(page)
      }
      if (language !== 'zh' && action.type === 'interact') break
    }
    if (language === 'zh') {
      const result = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
      assert.ok(result.campaign.stages.find((entry) => entry.id === 'ridge-observatory').cleared)
      assert.equal(result.camp.supplies, saved.camp.supplies + 100)
      assert.deepEqual(result.journal, saved.journal)
      await page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key))
        value.story.travel.campReached = true
        value.story.travel.world.active = null
        value.story.travel.campPosition = 31
        localStorage.setItem(key, JSON.stringify(value))
      }, key)
      await page.goto(`${base}?page=story&lang=${language}`)
      await page.locator('[data-story-cell="33"]').click()
      await page.locator('[data-signal-scene="ridge-camp"]').waitFor()
      await page.locator('[data-beacon-replay]').click()
      await dialogue(page)
      await page.locator('[data-story-action="map"]').click()
      await page.locator('[data-ridge-location]').waitFor()
      await page.screenshot({ path: `.native/ridge-screenshots/map-${width}.png` })
    }
    assert.deepEqual(errors, [])
    console.log(
      `observatory: ${width}px ${language}; ${count} real UI actions; no errors or horizontal page overflow`,
    )
    await page.close()
  }
  // A prepared save isolates the real keyboard, motion and voice boundary before a reading.
  const local = new MemoryStorage()
  local.setItem(key, fixture)
  const localRepo = new VariantRepository(local),
    localCamp = new CampSession(localRepo)
  localCamp.acceptRidgeRoute()
  localCamp.saveStory({
    ...localCamp.story,
    arrived: false,
    world: { ...localCamp.story.world, active: 'north-road' },
  })
  const session = new ExpeditionSession(
    localRepo.forCampaign('ridge-observatory'),
    new FakeRuntime(),
  )
  assert.ok(session.start('explorer', []))
  const stop = actions.findIndex((action) => action.type === 'interact' && action.index === 24)
  for (const action of actions.slice(0, stop)) assert.ok(session.dispatch(action))
  session.completeCampaignScene('ridge-entry')
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
  })
  await page.addInitScript(() => {
    window.ridgeNotes = []
    const create = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this),
        set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency)
      oscillator.frequency.setValueAtTime = (frequency, time) => {
        window.ridgeNotes.push(frequency)
        return set(frequency, time)
      }
      return oscillator
    }
  })
  await page.goto(base)
  await page.evaluate(({ key, fixture }) => localStorage.setItem(key, fixture), {
    key,
    fixture: local.getItem(key),
  })
  await page.goto(`${base}?page=campaign&stage=ridge-observatory&lang=zh`)
  await page.locator('[data-power-cell="24"]').focus()
  await page.keyboard.press('Enter')
  await page.locator('[data-power-cell="24"].power-recorded').waitFor()
  assert.ok(
    await page
      .locator('[data-power-cell="24"]')
      .evaluate((element) => element.getAnimations().length > 0),
  )
  assert.equal(await page.locator('[data-signal-scene="ridge-reading"]').count(), 0)
  await page.locator('[data-signal-scene="ridge-reading"]').waitFor()
  await page.waitForFunction(() => window.ridgeNotes.includes(890))
  const line = page.locator('[data-signal-line]')
  assert.notEqual(
    await line.locator('[data-dialogue-text]').textContent(),
    await line.getAttribute('aria-label'),
  )
  await dialogue(page, true)
  await page.screenshot({ path: '.native/ridge-screenshots/keyboard-reading.png' })
  for (const action of actions.slice(stop)) assert.ok(session.dispatch(action))
  localCamp.completeObservatoryScene('ridge-found')
  localCamp.saveStory({
    ...localCamp.story,
    arrived: true,
    campPosition: 31,
    world: { ...localCamp.story.world, active: null },
  })
  await page.evaluate(({ key, fixture }) => localStorage.setItem(key, fixture), {
    key,
    fixture: local.getItem(key),
  })
  await page.goto(`${base}?page=story&lang=zh`)
  await page.locator('[data-story-cell="33"]').click()
  await page.locator('[data-signal-scene="ridge-camp"]').waitFor()
  await page.locator('[data-beacon-replay]').click()
  await page.waitForFunction(() =>
    [660, 880, 550].every((note) => window.ridgeNotes.includes(note)),
  )
  await dialogue(page, true)
  await page.locator('[data-story-action="sound"]').click()
  await page.locator('[data-story-cell="33"]').click()
  await page.locator('[data-signal-scene="ridge-camp"]').waitFor()
  const silent = await page.evaluate(() => window.ridgeNotes.length)
  await page.locator('[data-beacon-replay]').click()
  await page.waitForTimeout(250)
  assert.equal(await page.evaluate(() => window.ridgeNotes.length), silent)
  await dialogue(page, true)
  console.log(
    'observatory: keyboard reading, motion-before-dialogue, Nia voice, typewriter, beacon playback and mute verified',
  )
  await page.close()
} finally {
  await browser.close()
}
