import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { battleFixture } from './battle-fixtures.mjs'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4822/minefarer/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
const key = 'minesweeper.variants.v1.expedition'
const errors = []
mkdirSync('.native/performance-screenshots', { recursive: true })

/** Observe actual oscillator scheduling while preserving the browser's activation rules. */
async function pageWithAudio(options = {}) {
  const page = await browser.newPage(options)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    window.speechNotes = []
    const create = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this)
      const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency)
      oscillator.frequency.setValueAtTime = (frequency, time) => {
        window.speechNotes.push(frequency)
        return set(frequency, time)
      }
      return oscillator
    }
  })
  return page
}

/** Read the durable save to prove presentation does not create game actions or rewards. */
async function save(page) {
  return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)), key)
}

/** Wait for a complete sentence, not a fixed typewriter duration. */
async function complete(page) {
  await page.waitForFunction(() => {
    const line = document.querySelector('[data-story-dialogue-line]')
    return (
      line &&
      (!line.querySelector('[data-dialogue-text]') ||
        line.querySelector('[data-dialogue-text]').textContent === line.getAttribute('aria-label'))
    )
  })
}

try {
  const page = await pageWithAudio({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`${base}?lang=zh`)
  await page.locator('.destination-expedition').click()
  await page.locator('.story-awakening').waitFor()
  assert.equal(await page.locator('.story-main').evaluate((el) => el.inert), true)
  const initial = await save(page)
  await page.screenshot({ path: '.native/performance-screenshots/awakening.png' })
  await page.locator('.story-awakening').waitFor({ state: 'detached' })
  assert.equal(await page.locator('.story-main').evaluate((el) => el.inert), false)
  await complete(page)
  assert.ok((await page.evaluate(() => window.speechNotes)).includes(980))
  await page.locator('[data-story-action="dialogue"]').click()
  await page.waitForFunction(() => window.speechNotes.includes(720))
  assert.equal(
    await page.locator('[data-story-speaker="lumi"]').getAttribute('data-active'),
    'true',
  )
  // A root refresh must reattach the paragraph and preserve its current typing timer.
  await page.evaluate(() => {
    window.retainedLine = document.querySelector('[data-story-dialogue-line]')
  })
  await page.locator('[data-story-action="flag"]').click()
  assert.equal(
    await page.evaluate(
      () => window.retainedLine === document.querySelector('[data-story-dialogue-line]'),
    ),
    true,
  )
  await page.locator('[data-story-action="sound"]').click()
  const muted = await page.evaluate(() => window.speechNotes.length)
  await complete(page)
  assert.equal(await page.evaluate(() => window.speechNotes.length), muted)
  assert.equal(await page.locator('[data-story-action="dialogue"]').isVisible(), false)
  assert.deepEqual((await save(page)).story, initial.story)
  await page.screenshot({ path: '.native/performance-screenshots/dialogue-desktop.png' })
  await page.locator('[data-story-action="explore"]').click()
  await page.locator('[data-story-cell="12"]').click()
  await page.reload()
  assert.equal(
    await page.locator('.story-awakening').count(),
    0,
    'resuming gameplay skips the opening',
  )
  await page.locator('[data-story-action="sound"]').click()
  await page.waitForTimeout(80)
  await page.locator('.route-back').click()
  const left = await page.evaluate(() => window.speechNotes.length)
  await page.waitForTimeout(500)
  assert.equal(
    await page.evaluate(() => window.speechNotes.length),
    left,
    'routing away stops speech',
  )
  await page.close()

  for (const skip of ['click', 'keyboard', 'reduce']) {
    const opening = await pageWithAudio({ viewport: { width: 390, height: 844 }, hasTouch: true })
    await opening.goto(`${base}?page=story&lang=zh`)
    await opening.locator('.story-awakening').waitFor()
    if (skip === 'click') await opening.locator('[data-story-action="wake"]').tap()
    else if (skip === 'keyboard') await opening.keyboard.press('Escape')
    else await opening.emulateMedia({ reducedMotion: 'reduce' })
    await opening.locator('.story-awakening').waitFor({ state: 'detached' })
    assert.deepEqual((await save(opening)).story.journal.actions, [])
    if (skip === 'reduce') {
      assert.equal(await opening.locator('[data-dialogue-text]').count(), 0)
      await complete(opening)
      assert.equal(
        await opening.evaluate(
          () => document.getAnimations().filter((a) => a.playState === 'running').length,
        ),
        0,
      )
    }
    await opening.close()
  }

  const camp = await pageWithAudio({ viewport: { width: 390, height: 844 } })
  await camp.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key,
    value: {
      version: 4,
      camp: { supplies: 90, upgrades: [], completed: 0 },
      records: [],
      journal: null,
      story: {
        arrived: true,
        completed: ['reach-camp', 'lost-satchel'],
        claimed: ['reach-camp', 'lost-satchel'],
        campPosition: 31,
        journal: null,
      },
    },
  })
  await camp.goto(`${base}?page=story&lang=zh`)
  await camp.locator('.story-handover').waitFor()
  assert.equal(
    await camp.locator('.story-handover').evaluate((el) => getComputedStyle(el).width),
    '36px',
  )
  await camp.locator('[data-story-cell="51"]').click()
  await camp.waitForFunction(() =>
    [42, 50, 52, 60].includes(Number(document.querySelector('.story-traveler')?.dataset.player)),
  )
  assert.ok(
    await camp
      .locator('[data-story-cell="51"] .story-guide')
      .evaluate((el) => el.getAnimations().length > 0),
  )
  assert.ok(await camp.locator('.story-traveler').evaluate((el) => el.getAnimations().length > 0))
  await complete(camp)
  await camp.locator('[data-story-action="dialogue"]').click()
  await complete(camp)
  await camp.screenshot({ path: '.native/performance-screenshots/camp-mobile.png' })
  assert.equal((await save(camp)).camp.supplies, 90)
  await camp.close()

  for (const mode of ['classic', 'twin', 'sonar', 'survey', 'expedition', 'boss']) {
    const board = await browser.newPage({
      viewport: { width: 1200, height: 950 },
      reducedMotion: 'reduce',
    })
    board.on('pageerror', (error) => errors.push(error.message))
    if (mode === 'boss')
      await board.addInitScript(
        ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
        { key, value: battleFixture(51).entered.save },
      )
    await board.goto(`${base}?ruleset=${mode === 'boss' ? 'expedition' : mode}&lang=zh`)
    if (mode === 'expedition') await board.locator('[data-control="start"]').click()
    if (mode === 'boss') {
      await board.locator('[data-scene="skip"]').click()
      await board.locator('.prologue-dialog').waitFor({ state: 'detached' })
    }
    const tile = board.locator('.cell.hidden').first()
    await tile.waitFor()
    const material = await tile.evaluate((el) => ({
      fill: getComputedStyle(el).backgroundImage,
      edge: getComputedStyle(el).borderBottomWidth,
    }))
    assert.ok(material.fill.includes('rgb(185, 201, 177)'), `${mode}: ${JSON.stringify(material)}`)
    assert.equal(material.edge, '1px')
    if (mode === 'classic') {
      await tile.click({ button: 'right' })
      const flagged = board.locator('.cell.flagged').first()
      assert.equal(await flagged.evaluate((el) => getComputedStyle(el).backgroundImage), 'none')
      await flagged.focus()
      await board.keyboard.press('ArrowRight')
      assert.equal(
        await board
          .locator('.cell:focus-visible')
          .evaluate((el) => getComputedStyle(el).outlineWidth),
        '2px',
      )
      await board.screenshot({ path: '.native/performance-screenshots/classic-tiles.png' })
    }
    console.log(`Shared covered material: ${mode} passed`)
    await board.close()
  }
  assert.deepEqual(errors, [])
  console.log(
    'Opening, skip, voices, mute, paragraph continuity, gestures, route cleanup and shared tiles passed.',
  )
} finally {
  await browser.close()
}
