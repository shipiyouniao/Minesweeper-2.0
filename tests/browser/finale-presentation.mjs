import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync } from 'node:fs'
import { readyFinale } from '../../.native/tests/tests/finale-fixtures.js'
import { solveFinale } from '../../.native/tests/tests/finale-helpers.js'
import { MemoryStorage, FakeRuntime } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
import { CampSession } from '../../.native/tests/src/application/camp-session.js'
import { createStoryRun } from '../../.native/tests/src/game/story.js'
import { checkpointStory } from '../../.native/tests/src/game/story-checkpoint.js'
import { recordStoryFacts } from '../../.native/tests/src/game/story-quests.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4824/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({ channel: 'msedge' })
mkdirSync('.native/finale-screenshots', { recursive: true })

/** Install a validated checkpoint only after leaving the previous active application. */
async function seed(page, value, route) {
  await page.goto(base)
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value })
  await page.goto(base + route)
}

/** Skip typing with the actual next button while retaining every distinct spoken line. */
async function finish(page) {
  for (let i = 0; i < 80 && (await page.locator('.signal-dialogue[open]').count()); i++)
    await page.locator('[data-signal-next]').click()
}

/** Prepare a real floor-three journal and a solved first control for keyboard performance checks. */
function prepared() {
  const storage = new MemoryStorage(),
    repo = new VariantRepository(storage)
  readyFinale(repo)
  const session = new ExpeditionSession(repo.forCampaign('tower-control'), new FakeRuntime())
  assert.ok(session.start('explorer', []))
  const actions = solveFinale('tower-control').actions
  const stop = actions.findIndex((action) => action.type === 'interact')
  for (const action of actions.slice(0, stop)) assert.ok(session.dispatch(action))
  session.completeCampaignScene('control-entry')
  const first = storage.getItem(key),
    target = actions[stop].index
  for (const action of actions.slice(stop)) {
    if (session.run.floor === 3) break
    assert.ok(session.dispatch(action))
  }
  for (const scene of ['control-entry', 'control-line', 'control-heart'])
    session.completeCampaignScene(scene)
  return { first, target, floor: storage.getItem(key) }
}

/** Reach the guardian through real stage intents so its illustrated variant uses a valid save. */
function guardianCheckpoint(ending) {
  const storage = new MemoryStorage()
  storage.setItem(key, ending)
  const repo = new VariantRepository(storage),
    camp = new CampSession(repo)
  const world = createStoryRun(9)
  camp.completeStageScene('tower-control', 'control-restored')
  camp.saveStory(
    recordStoryFacts({ ...camp.story, world: checkpointStory({ ...world, player: 16 }) }, [
      'west-shortcut',
    ]),
  )
  const session = new ExpeditionSession(repo.forCampaign('northwest-bastion'), new FakeRuntime())
  assert.ok(session.start('explorer', []))
  for (const action of solveFinale('northwest-bastion').actions) {
    if (session.run.phase === 'boss') break
    assert.ok(session.dispatch(action))
  }
  for (const scene of ['pass-entry', 'pass-warning', 'pass-guardian'])
    session.completeCampaignScene(scene)
  return storage.getItem(key)
}

try {
  const ready = prepared()
  const ending = readFileSync('.native/tower-control-ending-save.json', 'utf8')
  const guardian = guardianCheckpoint(ending)
  const stored = new MemoryStorage()
  stored.setItem(key, readFileSync('.native/northwest-bastion-ending-save.json', 'utf8'))
  const camp = new CampSession(new VariantRepository(stored))
  camp.completeStageScene('northwest-bastion', 'pass-open')
  camp.completeStageScene('northwest-bastion', 'chapter-camp')
  camp.saveStory({
    ...camp.story,
    arrived: true,
    campPosition: 19,
    world: { ...camp.story.world, active: null },
  })
  const completed = stored.getItem(key)
  for (const [language, width] of [
    ['zh', 320],
    ['en', 390],
    ['ja', 390],
    ['zh', 3840],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 3840 ? 2160 : 950 },
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await seed(page, ready.floor, `?page=campaign&stage=tower-control&lang=${language}`)
    await page.locator('[data-power-purpose="restoration"]').waitFor()
    await page
      .locator('img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({
      path: `.native/finale-screenshots/control-floor3-${width}-${language}.png`,
    })
    await page.locator('[data-control="help"]').first().click()
    const guide = page.locator('dialog[open]')
    assert.equal(await guide.locator('.boss-picture-steps > li').count(), 3)
    assert.equal(
      await guide.evaluate((element) => element.scrollWidth > element.clientWidth + 1),
      false,
    )
    await page.keyboard.press('Escape')
    await seed(page, ending, `?page=story&lang=${language}`)
    await page.locator('[data-bridge-reveal]').waitFor()
    assert.equal(
      await page
        .locator('.chapter-lowering-bridge')
        .evaluate((element) => element.getAnimations().length),
      0,
    )
    await page.screenshot({
      path: `.native/finale-screenshots/bridge-recovery-${width}-${language}.png`,
    })
    const balance = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).camp.supplies,
      key,
    )
    await finish(page)
    await page.reload()
    assert.equal(await page.locator('[data-bridge-reveal]').count(), 0)
    assert.equal(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).camp.supplies, key),
      balance,
    )
    await seed(page, completed, `?page=story&lang=${language}`)
    await page.locator('[data-story-action="map"]').click()
    await page.locator('[data-story-action="map-level"][data-level="region"]').first().click()
    const before = await page.evaluate((key) => localStorage.getItem(key), key)
    for (const scene of [9, 10]) {
      await page.locator(`.atlas-node[data-scene="${scene}"]`).focus()
      await page.keyboard.press('Enter')
      await page.locator(`[data-map-level="local"][data-map-scene="${scene}"]`).waitFor()
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), before)
      await page.locator('[data-story-action="map-level"][data-level="region"]').first().click()
    }
    await seed(page, guardian, `?page=campaign&stage=northwest-bastion&lang=${language}`)
    await page.locator('[data-control="help"]').first().click()
    const battleGuide = page.locator('dialog[open]')
    assert.equal(await battleGuide.locator('.boss-picture-steps > li').count(), 3)
    assert.equal(
      await battleGuide.evaluate((element) => element.scrollWidth > element.clientWidth + 1),
      false,
    )
    assert.equal(
      await battleGuide.locator('.boss-picture-steps > li').last().locator('.mini-danger').count(),
      7,
    )
    await page.screenshot({
      path: `.native/finale-screenshots/guardian-pressure-${width}-${language}.png`,
    })
    await page.keyboard.press('Escape')
    assert.deepEqual(errors, [])
    console.log(
      `finale presentation ${language} ${width}px: floor, diagrams, ending recovery, reduced motion and atlas navigation passed`,
    )
    await page.close()
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
  })
  await page.addInitScript(() => {
    window.finaleNotes = []
    const create = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this),
        set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency)
      oscillator.frequency.setValueAtTime = (frequency, time) => {
        window.finaleNotes.push(frequency)
        return set(frequency, time)
      }
      return oscillator
    }
  })
  await seed(page, ready.first, '?page=campaign&stage=tower-control&lang=zh')
  await page.locator(`[data-power-cell="${ready.target}"]`).focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction((target) => {
    const cell = document.querySelector(`[data-power-cell="${target}"]`)
    return (
      cell?.classList.contains('power-live') && cell.getAnimations({ subtree: true }).length > 0
    )
  }, ready.target)
  await seed(page, ending, '?page=story&lang=zh')
  await page.locator('[data-bridge-reveal]').waitFor()
  assert.ok(
    (await page
      .locator('.chapter-lowering-bridge')
      .evaluate((element) => element.getAnimations().length)) > 0,
  )
  for (let beat = 0; beat < 3; beat++) {
    const previous = await page.locator('[data-signal-line]').getAttribute('aria-label')
    await page.locator('[data-signal-next]').click()
    if ((await page.locator('[data-signal-line]').getAttribute('aria-label')) === previous)
      await page.locator('[data-signal-next]').click()
    await page.waitForTimeout(100)
  }
  await page.waitForFunction(() =>
    [260, 980, 890].every((note) => window.finaleNotes.includes(note)),
  )
  await finish(page)
  console.log(
    'finale performance: accepted keyboard switch, lowering bridge and three distinct audible voices passed',
  )
  await page.close()
} finally {
  await browser.close()
}
