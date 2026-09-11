import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import {
  readyChapterTwo,
  finishRecollectionFloor,
} from '../../.native/tests/tests/recollection-helpers.js'
import { MemoryStorage, FakeRuntime } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
import { StorySession } from '../../.native/tests/src/application/story-session.js'
import { message } from '../../.native/tests/src/i18n.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4826/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({ channel: 'msedge' })
const errors = []
mkdirSync('.native/recollection-screenshots', { recursive: true })

/** Use the settled chapter fixture, then extract its intentionally preserved legacy expedition. */
function fixture() {
  const storage = new MemoryStorage(),
    repository = new VariantRepository(storage)
  readyChapterTwo(repository)
  const old = new ExpeditionSession(repository, new FakeRuntime())
  assert.ok(old.dispatch({ type: 'retreat' }))
  assert.ok(old.returnToCamp())
  return storage.getItem(key)
}

/** Prepare a configuration without changing the shared progression fixture. */
function configuredSession(kind, difficulty) {
  const storage = new MemoryStorage(),
    repository = new VariantRepository(storage)
  const camp = readyChapterTwo(repository),
    story = new StorySession(camp)
  assert.ok(story.travelNorthwest())
  assert.ok(story.completeRegionalScene('reed-arrival'))
  assert.ok(story.moveCamp(49))
  assert.ok(story.completeRegionalScene('recollection-light'))
  const session = new ExpeditionSession(repository, new FakeRuntime())
  assert.ok(session.dispatch({ type: 'retreat' }))
  assert.ok(session.returnToCamp())
  assert.ok(session.start('explorer', [], difficulty, { floors: [kind], bosses: ['bastion'] }))
  return { storage, session }
}

/** Reach combat through real session actions so the browser exercises a valid replay journal. */
function bossFixture() {
  const { storage, session } = configuredSession('routing', 'relaxed')
  for (let floor = 1; floor <= 3; floor++) {
    finishRecollectionFloor(session)
    if (floor < 3) assert.ok(session.dispatch({ type: 'relic', relic: session.run.offers[0] }))
  }
  assert.equal(session.run.phase, 'boss')
  return storage.getItem(key)
}

/** Keep snapshots before and after the original campaign's three-floor title range. */
function deepFloorFixtures(kind) {
  const { storage, session } = configuredSession(kind, 'abyss')
  const snapshots = []
  for (let floor = 1; floor <= 4; floor++) {
    if (floor === 2 || floor === 4) snapshots.push({ kind, floor, value: storage.getItem(key) })
    if (floor === 4) break
    finishRecollectionFloor(session)
    assert.equal(session.run.phase, 'reward')
    assert.ok(session.dispatch({ type: 'relic', relic: session.run.offers[0] }))
  }
  return snapshots
}

/** Advance only visible dialogue controls; a click finishes text before advancing the beat. */
async function dialogue(page) {
  for (let i = 0; i < 30 && (await page.locator('.signal-dialogue[open]').count()); i++)
    await page.locator('[data-signal-next]').click()
  assert.equal(await page.locator('.signal-dialogue[open]').count(), 0)
}

/** Browser geometry catches clipped choices, broken art and accidental body overflow. */
async function geometry(page, name) {
  await page
    .locator('img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    clipped: [...document.querySelectorAll('.recollection-choice')].some(
      (element) => element.scrollWidth > element.clientWidth + 1,
    ),
    broken: [...document.images].filter((image) => !image.naturalWidth).map((image) => image.src),
  }))
  assert.equal(result.overflow, false, JSON.stringify(result))
  assert.equal(result.clipped, false, JSON.stringify(result))
  assert.deepEqual(result.broken, [])
  await page.screenshot({ path: `.native/recollection-screenshots/${name}.png`, fullPage: true })
}

try {
  for (const [width, height, language] of [
    [390, 844, 'zh'],
    [1440, 1000, 'en'],
    [3840, 2160, 'ja'],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: width === 390,
    })
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(
      ({ key, value }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value)
      },
      { key, value: fixture() },
    )
    await page.goto(`${base}?page=story&lang=${language}`)
    await page.locator('[data-story-scene="blockade-pass"]').waitFor()
    await page.locator('[data-story-cell="16"]').click()
    await page.locator('[data-story-scene="reed-camp"]').waitFor()
    await page.locator('[data-signal-scene="reed-arrival"]').waitFor()
    await geometry(page, `arrival-${width}`)
    await dialogue(page)
    await page.locator('[data-story-cell="49"]').click()
    await page.locator('[data-signal-scene="recollection-light"]').waitFor()
    assert.equal(await page.locator('.recollection-ignition img').count(), 1)
    await dialogue(page)
    await page.locator('.recollection-settings').waitFor()
    assert.equal(await page.locator('[data-boss]:enabled').count(), 1)
    assert.equal(await page.locator('[data-floor]:enabled').count(), 3)
    await geometry(page, `preparation-${width}`)
    // The five-tier control is the same control as the existing expedition preparation.
    await page.locator('[data-control="difficulty:expert"]').click()
    assert.equal(
      await page.locator('[data-control="difficulty:expert"]').getAttribute('aria-pressed'),
      'true',
    )
    await page.locator('[data-floor="ordinary"]').uncheck()
    await page.locator('[data-floor="routing"]').uncheck()
    await page.locator('[data-boss="bastion"]').uncheck()
    assert.equal(await page.locator('[data-recollection-start]').isDisabled(), true)
    await page.locator('[data-boss="bastion"]').check()
    await page.locator('[data-recollection-start]').click()
    await page.locator('.variant-main.expedition').waitFor()
    assert.equal(await page.locator('.header-identity [data-recollection-return]').count(), 1)
    const departure = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).journal.departure,
      key,
    )
    assert.deepEqual(departure.recollection, { floors: ['relay'], bosses: ['bastion'] })
    assert.equal(departure.difficulty, 'expert')
    await page.reload()
    await page.locator('.variant-main.expedition').waitFor()
    const resumed = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).journal.departure,
      key,
    )
    assert.deepEqual(resumed, departure)
    await geometry(page, `relay-${width}`)
    await page.locator('[data-control="retreat"]').click()
    await page.locator('dialog[open] [data-control="confirm"]').click()
    await page.locator('dialog[open] [data-control="camp"]').click()
    await page.locator('.recollection-settings').waitFor()
    await page.locator('header [data-route][href*="page=story"]').click()
    await page.locator('[data-story-scene="reed-camp"]').waitFor()
    assert.equal(await page.locator('.story-temporary').count(), 0)
    assert.equal(await page.locator('.signal-dialogue[open]').count(), 0)
    await page.locator('[data-story-action="map"]').click()
    await page.locator('.story-atlas').waitFor()
    assert.equal(await page.locator('.atlas-local-grid .atlas-position').count(), 1)
    await page.locator('[data-story-action="map-level"][data-level="world"]').click()
    assert.equal(await page.locator('[data-atlas-waypoint="reed-camp"].is-current').count(), 1)
    assert.equal(
      await page
        .locator('[data-atlas-route="blockade-pass:reed-camp"]')
        .getAttribute('data-route-state'),
      'open',
    )
    await geometry(page, `map-${width}`)
    await page.locator('[data-story-action="close-panel"]').click()
    await page.locator('[data-story-cell="102"]').click()
    await page.locator('[data-story-scene="blockade-pass"]').waitFor()
    await context.close()
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value)
    },
    { key, value: bossFixture() },
  )
  await page.goto(`${base}?ruleset=expedition&lang=zh`)
  await page.locator('.battle-reference-actions').waitFor()
  assert.equal(await page.locator('.prologue-replay').count(), 0)
  assert.equal(await page.locator('.boss-dialogue[open], .signal-dialogue[open]').count(), 0)
  assert.equal(await page.locator('.battle-reference-actions [data-control="help"]').count(), 1)
  await geometry(page, 'boss-390')
  await context.close()

  for (const snapshot of [...deepFloorFixtures('relay'), ...deepFloorFixtures('routing')]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key,
      value: snapshot.value,
    })
    for (const language of ['zh', 'en', 'ja']) {
      await page.goto(`${base}?ruleset=expedition&lang=${language}`)
      const objective = page.locator('.signal-objective')
      await objective.waitFor()
      assert.equal(
        await objective.locator('strong').innerText(),
        message(
          language,
          snapshot.kind === 'relay' ? 'recollection.relay' : 'recollection.routing',
        ),
      )
      assert.ok(!(await objective.innerText()).includes('undefined'))
      assert.ok(!(await objective.innerText()).includes(message(language, 'signal.record')))
      if (snapshot.kind === 'relay') {
        assert.equal(await objective.locator('span').count(), 1)
        assert.equal(await page.locator('[data-side="a"] img[src*="exit-closed"]').count(), 1)
      } else {
        await page.locator('.power-help').click()
        assert.equal(
          await page.locator('dialog[open] .power-guide h3').innerText(),
          message(language, 'recollection.routing'),
        )
      }
    }
    await context.close()
  }
  assert.deepEqual(errors, [])
  console.log(
    'PASS: Chapter Two travel, voiced scenes, lantern, five difficulties, pool validation, replay, extraction and regional map at 390 / 1440 / 3840 px in zh / en / ja; Recollection combat retains help without arrival dialogue.',
  )
} finally {
  await browser.close()
}
