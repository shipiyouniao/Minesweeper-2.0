import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
import { CampSession } from '../../.native/tests/src/application/camp-session.js'
import { createStoryRun } from '../../.native/tests/src/game/story.js'
import { checkpointStory } from '../../.native/tests/src/game/story-checkpoint.js'
import { campaignProgress, updateCampaign } from '../../.native/tests/src/game/campaign-catalog.js'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'
import { deduceMines } from '../../.native/tests/src/game/mine-deduction.js'
import { approachPath } from '../../.native/tests/src/game/dungeon-path.js'
import { relayReady } from '../../.native/tests/src/game/floor-circuits.js'
import { MemoryStorage, FakeRuntime } from '../../.native/tests/tests/helpers.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const storage = new MemoryStorage(),
  repo = new VariantRepository(storage)
const rogue = new ExpeditionSession(repo, new FakeRuntime())
rogue.start('explorer', [])
const camp = new CampSession(repo),
  world = createStoryRun(7)
camp.saveStory({
  ...camp.story,
  arrived: false,
  completed: ['reach-camp', 'meet-guide', 'survey-road', 'repair-lift', 'reach-tower'],
  world: checkpointStory({ ...world, player: world.board.exit }),
  journal: null,
  dialogue: { completed: ['guide', 'quarry-lead', 'lift-repaired', 'tower-arrival'], active: null },
})
const saved = repo.expedition()
repo.saveExpedition({
  ...saved,
  campaign: updateCampaign(saved.campaign, {
    ...campaignProgress(saved.campaign, 'tower-galleries'),
    scenes: ['tower-response'],
    cleared: true,
    lesson: 4,
  }),
})
const fixture = storage.getItem(key)
const browser = await chromium.launch({ channel: 'msedge' })
mkdirSync('.native/story-screenshots', { recursive: true })

/** Plan the encounter from public clues; every accepted intent is then repeated through browser controls. */
function plan(run, record) {
  const actions = []
  const apply = (action) => {
    const next = actExpedition(run, action)
    if (next === run) return false
    run = next
    actions.push(action)
    return true
  }
  for (let floor = 1; floor <= 3; floor++) {
    for (let turn = 0; turn < 200 && run.phase === 'exploring'; turn++) {
      let changed = false
      const known = deduceMines(run.game, run.walls)
      for (const index of known.mines)
        if (run.game.cells[index]?.visibility === 'hidden')
          changed = apply({ type: 'flag', index }) || changed
      for (const index of known.safe)
        if (
          index !== run.exit &&
          run.game.cells[index]?.visibility === 'hidden' &&
          approachPath(run, index)
        )
          changed = apply({ type: 'reveal', index }) || changed
      for (const relay of run.circuits.relays)
        if ((!relay.optional || record) && relayReady(run, relay))
          changed = apply({ type: 'interact', index: relay.index }) || changed
      if (!changed) break
    }
    if (record && run.circuits.record !== null) apply({ type: 'move', index: run.circuits.record })
    apply({
      type: run.game.cells[run.exit].visibility === 'hidden' ? 'reveal' : 'move',
      index: run.exit,
    })
    assert.equal(run.phase, floor === 3 ? 'won' : 'reward')
    if (floor < 3) apply({ type: 'relic', relic: run.offers[0] })
  }
  return actions
}

/** Native modal buttons finish typing first, then advance one spoken beat. */
async function dialogue(page) {
  for (let guard = 0; guard < 40 && (await page.locator('.signal-dialogue[open]').count()); guard++)
    await page.locator('[data-signal-next]').click()
  assert.equal(await page.locator('.signal-dialogue[open]').count(), 0)
}

try {
  for (const [width, language, record] of [
    [1440, 'zh', true],
    [390, 'zh', false],
    [390, 'en', true],
    [390, 'ja', true],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: width === 390,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(base)
    await page.evaluate(({ key, fixture }) => localStorage.setItem(key, fixture), { key, fixture })
    await page.goto(`${base}?page=story&lang=${language}`)
    await page.locator('[data-story-campaign]').click()
    await page.locator('.signal-dialogue[open]').waitFor()
    await page.screenshot({
      path: `.native/story-screenshots/signal-dialogue-${width}-${language}.png`,
    })
    await dialogue(page)
    assert.equal(await page.locator('.campaign-lesson').count(), 0)
    assert.ok(await page.locator('[data-relay]').count())
    const local = new MemoryStorage()
    local.setItem(key, await page.evaluate((key) => localStorage.getItem(key), key))
    let run = new ExpeditionSession(
      new VariantRepository(local).forCampaign('tower-relay'),
      new FakeRuntime(),
    ).run
    const actions = plan(run, record)
    let count = 0
    for (const action of actions) {
      const terminal = actExpedition(run, action).phase === 'won'
      if (action.type === 'relic')
        await page.locator(`[data-control="relic:${action.relic}"]`).click()
      else {
        const cell = page.locator(`[data-side="a"] [data-cell="${action.index}"]`)
        if (action.type === 'flag' && width === 390) {
          // A real touch hold exercises the mobile flag path without dispatching domain actions.
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
        } else if (action.type === 'flag') await cell.click({ button: 'right' })
        else if (width === 390) await cell.tap()
        else await cell.click()
      }
      count++
      run = actExpedition(run, action)
      await page.waitForFunction(
        ({ key, count, terminal }) => {
          const stage = JSON.parse(localStorage.getItem(key)).campaign.stages.find(
            (entry) => entry.id === 'tower-relay',
          )
          return terminal ? stage.cleared : stage.journal?.actions.length === count
        },
        { key, count, terminal },
        { timeout: 5000 },
      )
      if (terminal && width === 1440) {
        await page.locator('[data-signal-scene="rescued"]').waitFor()
        const banked = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).camp, key)
        await page.reload()
        await page.locator('[data-signal-scene="rescued"]').waitFor()
        assert.deepEqual(
          await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).camp, key),
          banked,
        )
      }
      await dialogue(page)
      if (action.type === 'interact') {
        const gate = run.circuits.relays.find((entry) => entry.index === action.index).gate
        assert.ok(await page.locator(`[data-signal-gate="${gate}"].signal-released`).count())
        assert.equal(
          await page.locator(`[data-signal-gate="${gate}"] .landmark-clue`).textContent(),
          String(run.game.cells[gate].adjacent || ''),
        )
        await page.screenshot({
          path: `.native/story-screenshots/signal-board-${width}-${language}-${run.floor}.png`,
        })
      }
      if (count === 6) {
        await page.locator('[data-campaign-return]').click()
        await page.locator('[data-story-campaign]').click()
        assert.equal(await page.locator('[data-signal-scene="entry"]').count(), 0)
      }
      if (language !== 'zh' && action.type === 'interact') break
    }
    if (language === 'zh') {
      const result = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
      const progress = result.campaign.stages.find((entry) => entry.id === 'tower-relay')
      assert.equal(progress.recordSaved, record)
      assert.equal(result.camp.supplies, saved.camp.supplies + 80)
      assert.deepEqual(result.journal, saved.journal)
      if (await page.locator('.expedition-result-dialog [data-control="camp"]').count())
        await page.locator('.expedition-result-dialog [data-control="camp"]').click()
      // World travel is independent; construct only a safe camp location to inspect the permanent resident.
      await page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key))
        value.story.travel.campReached = true
        value.story.travel.world.active = null
        value.story.travel.campPosition = 31
        localStorage.setItem(key, JSON.stringify(value))
      }, key)
      await page.goto(`${base}?page=story&lang=${language}`)
      await page.locator('[data-story-cell="33"] .signal-nia').waitFor()
      await page.locator('[data-story-cell="33"]').click()
      await page.locator('[data-signal-scene="camp"]').waitFor()
      await dialogue(page)
      await page.screenshot({ path: `.native/story-screenshots/signal-camp-${width}.png` })
    }
    assert.deepEqual(errors, [])
    console.log(`signal browser: ${width}px ${language}, ${count} UI actions, record=${record}`)
    await page.close()
  }
  // A normal-motion keyboard pass verifies that visible disconnection finishes before dialogue.
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  await page.addInitScript(() => {
    window.signalNotes = []
    const create = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this)
      const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency)
      oscillator.frequency.setValueAtTime = (frequency, time) => {
        window.signalNotes.push(frequency)
        return set(frequency, time)
      }
      return oscillator
    }
  })
  await page.goto(base)
  await page.evaluate(({ key, fixture }) => localStorage.setItem(key, fixture), { key, fixture })
  await page.goto(`${base}?page=story&lang=zh`)
  await page.locator('[data-story-campaign]').click()
  await dialogue(page)
  const local = new MemoryStorage()
  local.setItem(key, await page.evaluate((key) => localStorage.getItem(key), key))
  const run = new ExpeditionSession(
    new VariantRepository(local).forCampaign('tower-relay'),
    new FakeRuntime(),
  ).run
  for (const action of plan(run, true)) {
    const cell = page.locator(`[data-side="a"] [data-cell="${action.index}"]`)
    if (action.type === 'interact') {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await cell.focus()
      await cell.press('Enter')
      await page.locator('.signal-released').first().waitFor()
      assert.equal(await page.locator('.signal-dialogue[open]').count(), 0)
      assert.ok(
        await page
          .locator('.signal-released')
          .first()
          .evaluate((element) => element.getAnimations().length > 0),
      )
      await page.locator('[data-signal-scene="connected"]').waitFor()
      await page.waitForFunction(() => window.signalNotes.includes(890))
      const line = page.locator('[data-signal-line]')
      assert.notEqual(
        await line.locator('[data-dialogue-text]').textContent(),
        await line.getAttribute('aria-label'),
      )
      await dialogue(page)
      break
    }
    if (action.type === 'flag') await cell.click({ button: 'right' })
    else await cell.click()
  }
  console.log('signal browser: keyboard activation, visible gate animation, voiced typewriter')
  await page.close()
} finally {
  await browser.close()
}
