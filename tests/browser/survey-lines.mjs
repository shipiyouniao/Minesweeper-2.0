import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createSurvey, actSurvey } from '../../.native/tests/src/game/survey.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.survey.v1'
const initial = createSurvey(31, 'medium')
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})

/** Seed accepted flags along one line, leaving all excavation to actual browser interactions. */
async function fixture(page, axis, line) {
  const actions = initial.game.cells.flatMap((cell, index) =>
    cell.mine && (axis === 'row' ? Math.floor(index / 12) : index % 12) === line
      ? [{ type: 'flag', index }]
      : [],
  )
  const save = { version: 2, difficulty: 'medium', seed: 31, actions, settled: false, records: [] }
  await page.evaluate(
    ({ key, save }) => sessionStorage.setItem(`${key}.fixture`, JSON.stringify(save)),
    {
      key,
      save,
    },
  )
  await page.reload()
  return save
}

/** Compare persistent commands so synthetic clicks and repeat gestures cannot hide duplicate actions. */
async function journal(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
}

/** Capture the shared control's computed appearance rather than merely checking its class name. */
async function zoomStyle(page) {
  return page.locator('.zoom-icon').evaluate((button) => {
    const style = getComputedStyle(button)
    return {
      width: style.width,
      height: style.height,
      radius: style.borderRadius,
      background: style.backgroundColor,
      border: style.border,
      icon: button.querySelector('svg').outerHTML,
    }
  })
}

try {
  for (const language of ['en', 'zh', 'ja'])
    for (const width of [390, 1440]) {
      const mobile = width === 390
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        hasTouch: mobile,
        isMobile: mobile,
      })
      const page = await context.newPage()
      // Apply fixtures after the previous document has persisted its final state during pagehide.
      await page.addInitScript((key) => {
        const fixture = sessionStorage.getItem(`${key}.fixture`)
        if (!fixture) return
        localStorage.setItem(key, fixture)
        sessionStorage.removeItem(`${key}.fixture`)
      }, key)
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${base}?ruleset=twin&lang=${language}`)
      const sharedZoom = await zoomStyle(page)
      await page.goto(`${base}?ruleset=survey&lang=${language}`)
      assert.deepEqual(await zoomStyle(page), sharedZoom)
      const zoom = page.locator('.zoom-icon')
      const originalLabel = await zoom.getAttribute('aria-label')
      await zoom.click()
      assert.equal(await zoom.locator('span').innerText(), '−')
      assert.equal(await zoom.getAttribute('title'), await zoom.getAttribute('aria-label'))
      assert.notEqual(await zoom.getAttribute('aria-label'), originalLabel)
      await zoom.click()
      assert.equal(await zoom.locator('span').innerText(), '+')
      assert.equal(await zoom.getAttribute('aria-label'), originalLabel)

      for (const axis of ['row', 'column']) {
        const save = await fixture(page, axis, 0)
        const header = page.locator(`#survey-${axis}-0`)
        if (mobile) await header.tap()
        else await header.click()
        assert.deepEqual(await journal(page), save, 'one tap/click only selects a clue')
        if (mobile) await header.tap()
        else await header.dblclick()
        const after = await journal(page)
        assert.deepEqual(after.actions, [...save.actions, { type: 'chord-line', axis, index: 0 }])
        const before = save.actions.reduce(actSurvey, initial)
        const expected = actSurvey(before, { type: 'chord-line', axis, index: 0 })
        for (const [index, cell] of expected.game.cells.entries())
          assert.equal(
            await page.locator(`[data-cell="${index}"]`).getAttribute('data-state'),
            cell.visibility,
          )
        await header.focus()
        await page.keyboard.press('Enter')
        assert.deepEqual(await journal(page), after, 'repeating a finished line is a no-op')
        await page.reload()
        assert.deepEqual(await journal(page), after)
      }

      for (const key of ['Enter', 'Space', 'c']) {
        const save = await fixture(page, 'row', 0)
        await page.locator('#survey-row-0').focus()
        await page.keyboard.press(key)
        assert.equal((await journal(page)).actions.length, save.actions.length + 1)
      }
      const save = await fixture(page, 'row', 0)
      if (mobile) {
        await page.locator('#survey-row-0').tap()
        await page.locator('#survey-row-1').tap()
        assert.deepEqual(await journal(page), save, 'taps on different clues cannot pair')
        // A native pan originating on a clue must clear a pending tap and preserve page scrolling.
        const header = page.locator('#survey-row-0')
        await header.scrollIntoViewIfNeeded()
        const box = await header.boundingBox()
        const cdp = await context.newCDPSession(page)
        const x = box.x + box.width / 2,
          y = box.y + box.height / 2
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x, y, id: 1 }],
        })
        for (let i = 1; i <= 5; i++)
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x, y: y - i * 12, id: 1 }],
          })
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await cdp.detach()
        await header.tap()
        assert.deepEqual(await journal(page), save, 'scrolling never quick-opens a line')
      }
      await page.locator('[data-control="pause"]').first().click()
      await page.locator('#survey-row-0').dispatchEvent('dblclick', { button: 0 })
      assert.deepEqual(await journal(page), save, 'privacy pause blocks header actions')
      assert.deepEqual(errors, [])
      console.log(
        `Survey line controls ${language} ${width}: shared zoom, exact axis, gestures, keyboard, replay and pause passed`,
      )
      await context.close()
    }
} finally {
  await browser.close()
}
