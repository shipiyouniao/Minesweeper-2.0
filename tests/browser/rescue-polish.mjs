import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { readyFinale } from '../../.native/tests/tests/finale-fixtures.js'
import { solveFinale } from '../../.native/tests/tests/finale-helpers.js'
import { readyRescue, solveRescue } from '../../.native/tests/tests/rail-helpers.js'
import { MemoryStorage, FakeRuntime } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
import { createStoryRun } from '../../.native/tests/src/game/story.js'
import { checkpointStory } from '../../.native/tests/src/game/story-checkpoint.js'
import { recordStoryFacts } from '../../.native/tests/src/game/story-quests.js'
import { grantRescuer } from '../../.native/tests/src/game/story-rewards.js'
import { EMPTY_CAMP } from '../../.native/tests/src/game/expedition.js'
import { rescueLandings } from '../../.native/tests/src/game/rescue-skill.js'
import { floorObjectiveComplete } from '../../.native/tests/src/game/floor-circuits.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4824/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
mkdirSync('.native/rescue-polish', { recursive: true })

/** Reach the real boss from accepted main-story actions; no private UI hooks or synthetic boards. */
function guardianSave() {
  const storage = new MemoryStorage(),
    repo = new VariantRepository(storage)
  const camp = readyFinale(repo)
  const fifth = new ExpeditionSession(repo.forCampaign('tower-control'), new FakeRuntime())
  assert.ok(fifth.start('explorer', []))
  for (const action of solveFinale('tower-control').actions) assert.ok(fifth.dispatch(action))
  camp.completeStageScene('tower-control', 'control-restored')
  const world = createStoryRun(9)
  camp.saveStory(
    recordStoryFacts({ ...camp.story, world: checkpointStory({ ...world, player: 16 }) }, [
      'west-shortcut',
    ]),
  )
  camp.acceptDiscoveredRoutes()
  const session = new ExpeditionSession(repo.forCampaign('northwest-bastion'), new FakeRuntime())
  assert.ok(session.start('explorer', []))
  for (const action of solveFinale('northwest-bastion').actions) {
    if (session.run.phase === 'boss') break
    assert.ok(session.dispatch(action))
  }
  for (const scene of ['pass-entry', 'pass-warning', 'pass-guardian'])
    session.completeCampaignScene(scene)
  session.setBattleLesson('points')
  return storage.getItem(key)
}

/** Stop just before the cart finishes the first floor's objective. */
function doorSave() {
  const storage = new MemoryStorage(),
    repo = new VariantRepository(storage)
  readyRescue(repo)
  const session = new ExpeditionSession(repo.forCampaign('quarry-rescue'), new FakeRuntime())
  assert.ok(session.start('explorer', []))
  session.completeCampaignScene('rail-entry')
  for (const action of solveRescue()) {
    const before = session.run,
      saved = storage.getItem(key)
    assert.ok(session.dispatch(action))
    if (!floorObjectiveComplete(before) && floorObjectiveComplete(session.run))
      return { saved, action, exit: session.run.exit }
  }
  throw Error('Missing door-opening checkpoint')
}

/** Seed one independent browser context without touching the user's real saves. */
async function seed(page, saved, route) {
  await page.goto(base)
  await page.evaluate(({ key, saved }) => localStorage.setItem(key, saved), { key, saved })
  await page.goto(base + route)
}

/** Read presentation progress and resource snapshots through the serialized public boundary. */
async function lesson(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).camp.battleLesson, key)
}

const guardian = guardianSave(),
  door = doorSave()
const browser = await chromium.launch({ channel: 'msedge' })
try {
  for (const [width, language] of [
    [390, 'zh'],
    [1440, 'en'],
    [320, 'ja'],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 950 },
      hasTouch: width < 500,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await seed(page, guardian, `?page=campaign&stage=northwest-bastion&lang=${language}`)
    assert.equal(await page.locator('dialog[open]').count(), 0)
    await page.locator('[data-battle-lesson="points"]').waitFor()
    await page.locator('[data-battle-next]').click()
    const safe = page.locator('[data-side="a"] [data-cell].campaign-lesson-target')
    if (width < 500) await safe.tap()
    else {
      await safe.focus()
      await page.keyboard.press('Enter')
    }
    await page.locator('[data-battle-lesson="turn"]').waitFor()
    await page.locator('[data-control="end-turn"]').click()
    await page.locator('[data-battle-lesson="combat"]').waitFor()
    assert.equal(await lesson(page), 'combat')
    await page.reload()
    await page.locator('[data-battle-lesson="combat"]').waitFor()
    await page.locator('[data-battle-next]').click()
    await page.locator('[data-battle-lesson="attack"]').waitFor()
    await page.screenshot({ path: `.native/rescue-polish/coach-${width}-${language}.png` })
    if (width < 500) {
      await page.setViewportSize({ width, height: 500 })
      await page.locator('.ruleset-host').evaluate((host) => host.scrollTo(0, host.scrollHeight))
      await page.waitForFunction(() => document.querySelector('.battle-lesson').hidden)
      await page.setViewportSize({ width, height: 950 })
      await page.locator('.ruleset-host').evaluate((host) => host.scrollTo(0, 0))
      await page.locator('[data-battle-skip]').waitFor({ state: 'visible' })
    }
    await page.locator('[data-battle-skip]').click()
    await page.reload()
    assert.equal(await page.locator('.battle-lesson').count(), 0)
    await page.locator('[data-control="help"]').first().click()
    const before = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)).campaign.stages.find(
          (s) => s.id === 'northwest-bastion',
        ).journal,
      key,
    )
    await page.locator('dialog[open] [data-control="tutorial"]').click()
    assert.equal(await page.locator('dialog[open]').count(), 0)
    await page.locator('[data-battle-lesson="points"]').waitFor()
    const after = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)).campaign.stages.find(
          (s) => s.id === 'northwest-bastion',
        ).journal,
      key,
    )
    assert.deepEqual(after, before)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    assert.deepEqual(errors, [])
    console.log(
      `${width}px ${language}: real coach, accepted movement, turns, resume, skip and reopen passed`,
    )
    await page.close()
  }
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion })
    await page.addInitScript(() => {
      window.exitAnimations = 0
      window.ropeAnimations = 0
      const animate = Element.prototype.animate
      Element.prototype.animate = function (...args) {
        if (this.matches('.exit-opening')) window.exitAnimations++
        if (this.matches('.dungeon-player') && document.querySelector('.rescue-rope'))
          window.ropeAnimations++
        return animate.apply(this, args)
      }
    })
    await seed(page, door.saved, '?page=campaign&stage=quarry-rescue&lang=zh')
    const exit = page.locator(`[data-side="a"] [data-cell="${door.exit}"]`)
    assert.equal(await exit.getAttribute('data-exit-state'), 'closed')
    assert.equal(await exit.locator('img[src$="exit-closed.png"]').count(), 1)
    await page.locator(`[data-control="rail-control:${door.action.index}"]`).click()
    await page.waitForFunction(() => document.querySelector('[data-exit-state="open"]'))
    assert.equal(
      await page.evaluate(() => window.exitAnimations),
      reducedMotion === 'reduce' ? 0 : 1,
    )
    await page.waitForFunction(() => !document.querySelector('.exit-opening'))
    await page.reload()
    assert.equal(await exit.getAttribute('data-exit-state'), 'open')
    assert.equal(await page.evaluate(() => window.exitAnimations), 0)
    const storage = new MemoryStorage(),
      repo = new VariantRepository(storage)
    repo.saveExpedition({ version: 4, camp: grantRescuer(EMPTY_CAMP), journal: null, records: [] })
    const session = new ExpeditionSession(repo, new FakeRuntime())
    assert.ok(session.start('rescuer', []))
    const target = rescueLandings(session.run)[0]
    await seed(page, storage.getItem(key), '?ruleset=expedition&lang=zh')
    await page.locator('[data-control="skill"]').click()
    await page.locator(`[data-control="skill-target:${target}"]`).click()
    assert.equal(
      await page.evaluate(() => window.ropeAnimations),
      reducedMotion === 'reduce' ? 0 : 1,
    )
    await page.waitForFunction(() => !document.querySelector('.rescue-rope'))
    console.log(
      `${reducedMotion}: closed/open asset, one opening, reload and lifeline animation passed`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
