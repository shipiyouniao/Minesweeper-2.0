import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  actExpedition,
  createExpedition,
  frontierCells,
  expeditionEarnings,
} from '../../.native/tests/src/game/expedition.js'
import { walkingPath } from '../../.native/tests/src/game/dungeon-path.js'
import { defeatEncounter } from '../../.native/tests/tests/encounter-helpers.js'

// Optional browser acceptance: use an installed Playwright or its explicit module path.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const output = new URL('../../.native/reward-ui/', import.meta.url)
const storageKey = 'minesweeper.variants.v1.expedition'

/** Build real accepted journals; only the fixture driver uses mine truth to reach an exit. */
function fixture(profession = 'explorer', floor = 1, encounters = 'brood-v1', phase = 'reward') {
  const departure = {
    seed: 43,
    difficulty: 'abyss',
    rules: 'relics-v1',
    professions: 'skills-v1',
    rewards: 'difficulty-v1',
    profession,
    equipment: [],
    archive: false,
    packs: [],
    ...(encounters ? { encounters } : {}),
  }
  let run = createExpedition(departure)
  const actions = []
  /** Snapshot the accepted prefix so the final action can be played through the browser. */
  const save = () => ({
    version: 3,
    camp: { supplies: 0, completed: 0, upgrades: profession === 'explorer' ? [] : [profession] },
    records: [],
    journal: { departure, actions: [...actions] },
  })
  let previous = save()
  for (let step = 0; step < 5000; step++) {
    if (run.phase === phase && run.floor === floor)
      return { run, save: save(), previous, last: actions.at(-1) }
    const batch =
      run.phase === 'boss'
        ? defeatEncounter(run)
        : [
            run.phase === 'reward'
              ? run.offers.length
                ? { type: 'relic', relic: run.offers[0] }
                : { type: 'descend' }
              : phase === 'lost'
                ? {
                    type: 'reveal',
                    index:
                      [...frontierCells(run)].find((i) => run.game.cells[i].mine) ??
                      [...frontierCells(run)][0],
                  }
                : walkingPath(run, run.exit)
                  ? { type: 'move', index: run.exit }
                  : {
                      type: 'reveal',
                      index: [...frontierCells(run)].find((i) => !run.game.cells[i].mine),
                    },
          ]
    for (const action of batch) {
      previous = save()
      const next = actExpedition(run, action)
      assert.notEqual(next, run)
      actions.push(action)
      run = next
    }
  }
  throw new Error('Reward fixture did not finish')
}

const regular = fixture()
const archaeologist = fixture('archaeologist')
const boss = fixture('explorer', 4)
const exhausted = fixture('explorer', 7, null)
const victory = fixture('explorer', 12, 'brood-v1', 'won')
const defeat = fixture('explorer', 1, 'brood-v1', 'lost')
assert.equal(exhausted.run.offers.length, 0)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || undefined,
  headless: true,
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: 'reduce',
})
await context.addInitScript(
  ({ key }) => {
    const fixture = sessionStorage.getItem('reward-fixture')
    if (fixture) {
      localStorage.setItem(key, fixture)
      sessionStorage.removeItem('reward-fixture')
    }
  },
  { key: storageKey },
)
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const modal = page.locator('.relic-dialog[open]')
const result = page.locator('.expedition-result-dialog[open]')

/** Load an isolated save after the old page has checkpointed itself. */
async function seed(save, language = 'en') {
  await page.goto(`${base}?ruleset=expedition&lang=${language}`)
  await page.evaluate(
    (value) => sessionStorage.setItem('reward-fixture', JSON.stringify(value)),
    save,
  )
  await page.reload()
}

/** Read only this disposable browser context's journal. */
async function journal() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)).journal, storageKey)
}

/** Read settled totals to catch duplicate payouts on modal reopening and camp navigation. */
async function settledSave() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey)
}

/** Wait for the browser's asynchronous scrolling to produce the expected observation. */
async function wheelOver(viewport, delta) {
  await viewport.hover()
  await page.mouse.wheel(0, delta)
  await page.waitForTimeout(350)
}

try {
  if (process.argv.includes('--before') || process.argv.includes('--before-result')) {
    const resultCapture = process.argv.includes('--before-result')
    await seed(resultCapture ? regular.previous : regular.save, 'zh')
    if (resultCapture) {
      await page.locator('[data-control="retreat"]').click()
      await page.locator('dialog[open] [data-control="confirm"]').click()
    }
    await page.screenshot({
      path: fileURLToPath(new URL(resultCapture ? 'result-before.png' : 'before.png', output)),
      fullPage: true,
    })
    console.log('Captured previous expedition presentation')
  } else {
    // The actual exit click must open the dialog without a page reload.
    await seed(regular.previous)
    await page.locator(`[data-side="a"] [data-cell="${regular.last.index}"]`).click()
    await modal.waitFor()
    assert.equal(await modal.locator('[data-control^="relic:"]').count(), 3)
    assert.equal(await page.locator('.variant-content [data-control^="relic:"]').count(), 0)
    const pending = await journal()
    for (let index = 0; index < 9; index++) {
      await page.keyboard.press('Tab')
      // Native dialogs may hand focus to browser chrome between cycles, never a background control.
      assert.ok(
        await modal.evaluate(
          (element) =>
            document.activeElement === document.body || element.contains(document.activeElement),
        ),
      )
    }
    await page.keyboard.press('Escape')
    await modal.waitFor({ state: 'hidden' })
    assert.deepEqual(await journal(), pending)
    // The native close event restores focus after the open attribute has already disappeared.
    await page.waitForFunction(() => document.activeElement?.matches('[data-control="rewards"]'))
    await page.locator('[data-control="rewards"]').click()
    const selected = await modal
      .locator('[data-control^="relic:"]')
      .first()
      .getAttribute('data-control')
    await modal.locator('[data-control^="relic:"]').first().focus()
    await page.keyboard.press('Enter')
    await modal.waitFor({ state: 'hidden' })
    const advanced = await journal()
    assert.equal(advanced.actions.length, pending.actions.length + 1)
    assert.deepEqual(advanced.actions.at(-1), { type: 'relic', relic: selected.split(':')[1] })
    await page.waitForFunction(() => document.activeElement?.matches('[data-cell]'))
    await page.reload()
    assert.equal(await modal.count(), 0)
    assert.deepEqual(await journal(), advanced)

    for (const language of ['en', 'zh', 'ja']) {
      await seed(archaeologist.save, language)
      assert.equal(await modal.locator('[data-control^="relic:"]').count(), 4)
      const recovered = await journal()
      await page.reload()
      await modal.waitFor()
      assert.deepEqual(await journal(), recovered)
      for (const width of [320, 760, 1280, 3840]) {
        await page.setViewportSize({ width, height: width === 320 ? 420 : 900 })
        assert.ok(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth + 1))
        assert.ok(await modal.evaluate((el) => el.getBoundingClientRect().width <= innerWidth))
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await seed(archaeologist.save, 'zh')
    await page.screenshot({
      path: fileURLToPath(new URL('desktop.png', output)),
    })
    await page.setViewportSize({ width: 375, height: 600 })
    await page.screenshot({
      path: fileURLToPath(new URL('mobile.png', output)),
    })
    const background = await page.evaluate(() => scrollY)
    await wheelOver(modal, 400)
    assert.ok(await modal.evaluate((el) => el.scrollTop > 0))
    assert.equal(await page.evaluate(() => scrollY), background)
    await modal.locator('[data-control="cancel"]').click()
    await page.locator('.variant-heading [data-control="pause"]').click()
    assert.equal(await modal.count(), 0)
    await page.locator('.variant-pause [data-control="pause"]').click()
    await modal.waitFor()
    assert.deepEqual(await journal(), archaeologist.save.journal)

    await seed(boss.previous)
    await page.locator('[data-control="attack"]').click()
    await modal.waitFor()
    assert.deepEqual(await journal(), boss.save.journal)
    await seed(exhausted.save)
    assert.equal(await modal.locator('[data-control^="relic:"]').count(), 0)
    await modal.locator('[data-control="descend"]').click()
    await modal.waitFor({ state: 'hidden' })
    assert.equal((await journal()).actions.at(-1).type, 'descend')

    // Victory and defeat settle before their dialog opens; closing is presentation only.
    for (const finished of [victory, defeat]) {
      await seed(finished.previous)
      if (finished.last.type === 'attack') await page.locator('[data-control="attack"]').click()
      else await page.locator(`[data-side="a"] [data-cell="${finished.last.index}"]`).click()
      await result.waitFor()
      const settled = await settledSave()
      assert.equal(settled.journal, null)
      assert.equal(settled.camp.supplies, expeditionEarnings(finished.run))
      assert.equal(settled.records.length, 1)
      assert.equal(settled.records[0].outcome, finished.run.phase)
      assert.equal(await page.locator('.variant-content .result-banner').count(), 0)
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.activeElement?.matches('[data-control="result"]'))
      await page.locator('[data-control="result"]').click()
      await result.waitFor()
      assert.deepEqual(await settledSave(), settled)
      await result.locator('[data-control="camp"]').focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement?.matches('.camp-panel h1'))
      await page.reload()
      assert.equal(await result.count(), 0)
      assert.deepEqual(await settledSave(), settled)
    }
    for (const language of ['en', 'zh', 'ja']) {
      await seed(regular.previous, language)
      await page.locator('[data-control="retreat"]').click()
      await page.locator('dialog[open] [data-control="confirm"]').click()
      await result.waitFor()
      const settled = await settledSave()
      assert.equal(settled.records[0].outcome, 'retreated')
      assert.equal(settled.journal, null)
      assert.equal(settled.records.length, 1)
      assert.ok(await result.evaluate((el) => el.scrollWidth <= el.clientWidth + 1))
      if (language === 'zh') {
        await page.setViewportSize({ width: 1280, height: 900 })
        await page.screenshot({ path: fileURLToPath(new URL('result-desktop.png', output)) })
        await page.setViewportSize({ width: 320, height: 480 })
        await page.screenshot({ path: fileURLToPath(new URL('result-mobile.png', output)) })
      }
      await result.locator('[data-control="cancel"]').click()
      await page.reload()
      assert.equal(await result.count(), 0)
      assert.deepEqual(await settledSave(), settled)
    }

    // Fit boards must pass wheel scrolling to the page in all three modes.
    await seed(exhausted.previous)
    for (const mode of ['classic', 'twin', 'expedition']) {
      await page.goto(`${base}?ruleset=${mode}&lang=en`)
      await page.setViewportSize({ width: 375, height: 420 })
      const viewport = page.locator('.board-viewport').first()
      await viewport.scrollIntoViewIfNeeded()
      const start = await page.evaluate(() => scrollY)
      await wheelOver(viewport, 250)
      assert.ok(
        await page.evaluate((value) => scrollY > value, start),
        `${mode} must scroll the page`,
      )
    }
    // Enlarged boards consume their own scroll, then chain at both vertical boundaries.
    await page.locator('[data-control="zoom"]').click()
    const viewport = page.locator('.board-viewport')
    await viewport.scrollIntoViewIfNeeded()
    await viewport.evaluate((el) => {
      el.scrollTop = 0
    })
    await wheelOver(viewport, 80)
    assert.ok(await viewport.evaluate((el) => el.scrollTop > 0))
    await page.mouse.wheel(120, 0)
    await page.waitForTimeout(350)
    assert.ok(await viewport.evaluate((el) => el.scrollLeft > 0))
    await viewport.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    const bottom = await page.evaluate(() => scrollY)
    await wheelOver(viewport, 200)
    assert.ok(await page.evaluate((value) => scrollY > value, bottom))
    await viewport.scrollIntoViewIfNeeded()
    await viewport.evaluate((el) => {
      el.scrollTop = 0
    })
    const top = await page.evaluate(() => scrollY)
    await wheelOver(viewport, -150)
    assert.ok(await page.evaluate((value) => scrollY < value, top))
    assert.deepEqual(errors, [])
    console.log(
      JSON.stringify({
        passed: true,
        languages: 3,
        widths: [320, 760, 1280, 3840],
        ordinaryExit: true,
        settlements: ['won', 'lost', 'retreated'],
        bossExit: true,
        recovery: true,
        keyboard: true,
        exhaustedPool: true,
        scrollModes: 3,
        enlargedBoundaryChaining: true,
        errors,
      }),
    )
  }
} finally {
  await browser.close()
}
