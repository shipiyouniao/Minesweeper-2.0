import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { actSurvey, createSurvey, surveyLine } from '../../.native/tests/src/game/survey.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const key = 'minesweeper.survey.v1'
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const errors = []
/** Read the journal to count accepted gestures, independently of visible feedback. */
async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
}
/** Reconstruct expected evidence using the actual accepted commands. */
async function model(page) {
  const journal = await saved(page)
  return journal.actions.reduce(actSurvey, createSurvey(journal.seed, journal.difficulty))
}
/** A native stationary hold must stay on its original square and must not scroll the page. */
async function hold(context, page, target) {
  await target.scrollIntoViewIfNeeded()
  const bounds = await target.boundingBox()
  const position = await page.evaluate(() => ({ x: scrollX, y: scrollY }))
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, id: 1 }],
  })
  await page.waitForTimeout(550)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  assert.deepEqual(await page.evaluate(() => ({ x: scrollX, y: scrollY })), position)
  await cdp.detach()
}
/** Verify both axes align with their cells, including after container resize and panning. */
async function geometry(page) {
  const result = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('[data-cell]')]
    const columns = [...document.querySelectorAll('[data-axis="column"]')]
    const rows = [...document.querySelectorAll('[data-axis="row"]')]
    return {
      horizontal: columns.every(
        (header, i) =>
          Math.abs(header.getBoundingClientRect().x - cells[i].getBoundingClientRect().x) < 1,
      ),
      vertical: rows.every(
        (header, i) =>
          Math.abs(
            header.getBoundingClientRect().y - cells[i * columns.length].getBoundingClientRect().y,
          ) < 1,
      ),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }
  })
  assert.deepEqual(result, { horizontal: true, vertical: true, overflow: false })
}
try {
  for (const language of ['en', 'zh', 'ja'])
    for (const width of [390, 1440]) {
      const mobile = width < 500
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        hasTouch: mobile,
        isMobile: mobile,
      })
      await context.addInitScript(
        ({ key }) => {
          if (sessionStorage.getItem('survey-fixture')) return
          sessionStorage.setItem('survey-fixture', '1')
          localStorage.setItem(
            key,
            JSON.stringify({
              version: 2,
              difficulty: 'easy',
              seed: 31,
              actions: [],
              settled: false,
              records: [],
            }),
          )
        },
        { key },
      )
      const page = await context.newPage()
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${base}?ruleset=survey&lang=${language}`)
      const initial = await model(page)
      for (const axis of ['row', 'column'])
        for (let i = 0; i < (axis === 'row' ? 8 : 8); i++)
          assert.deepEqual(
            await page.locator(`#survey-${axis}-${i} strong`).allTextContents(),
            (surveyLine(initial, axis, i).runs.length
              ? surveyLine(initial, axis, i).runs
              : [0]
            ).map(String),
          )
      await geometry(page)
      const dock = await page.locator('.action-dock').evaluate((element) => ({
        position: getComputedStyle(element).position,
        bottom: element.getBoundingClientRect().bottom,
        width: element.getBoundingClientRect().width,
      }))
      assert.equal(dock.position, 'fixed')
      assert.ok(Math.abs(dock.bottom - 1000) < 1)
      assert.ok(Math.abs(dock.width - width) < 1)
      assert.equal(await page.locator('.difficulty-tabs .selected').count(), 1)
      const safe = initial.game.cells.findIndex(
        (cell) => !cell.mine && cell.visibility === 'hidden',
      )
      const open = initial.game.cells.findIndex(
        (cell, index) =>
          !cell.mine &&
          index !== safe &&
          (Math.floor(index / 8) === Math.floor(safe / 8) || index % 8 === safe % 8),
      )
      assert.ok(open >= 0)
      if (initial.game.cells[open].visibility === 'hidden')
        await page.locator(`[data-cell="${open}"]`).click()
      const target = page.locator(`[data-cell="${safe}"]`)
      for (const state of ['flagged', 'suspected-safe', 'hidden']) {
        if (mobile) await hold(context, page, target)
        else await target.click({ button: 'right' })
        assert.match(await target.getAttribute('class'), new RegExp(state))
      }
      const before = await saved(page)
      await target.focus()
      await page.keyboard.press('f')
      await page.keyboard.press('s')
      await page.keyboard.press('s')
      assert.equal((await saved(page)).actions.length, before.actions.length + 3)
      await page.keyboard.press('ArrowLeft')
      assert.equal(await page.locator('[data-axis="row"][data-active="true"]').count(), 1)
      assert.equal(await page.locator('[data-axis="column"][data-active="true"]').count(), 1)
      // A safe note anywhere on the selected row/column participates in quick-open.
      await target.focus()
      await page.keyboard.press('s')
      const openCell = page.locator(`[data-cell="${open}"]`)
      if (mobile) await hold(context, page, openCell)
      else await openCell.click({ button: 'right' })
      assert.match(await target.getAttribute('class'), /revealed/)
      assert.equal(await page.locator('.cell.hidden.mine').count(), 0)
      assert.equal(await page.locator('.cell.hidden[data-number]:not([data-number=""])').count(), 0)
      const snapshot = await saved(page)
      await page.reload()
      assert.deepEqual(await saved(page), snapshot)
      // Restart confirmation, record tabs and help must not modify the journal.
      await page.locator('[data-survey-difficulty="expert"]').click()
      assert.equal(await page.locator('dialog').evaluate((d) => d.open), true)
      await page.keyboard.press('Escape')
      assert.deepEqual(await saved(page), snapshot)
      await page.locator('.tutorial-entry').click()
      assert.equal(await page.locator('dialog[data-tutorial="survey"]').count(), 1)
      await page.locator('[data-practice="cycle"]').click()
      await page.locator('[data-practice="next"]').click()
      if (language === 'zh')
        await page.screenshot({ path: `.native/survey-tutorial-${width}.png`, fullPage: true })
      for (const index of [2, 1, 3]) {
        await page.locator(`[data-practice-cell="${index}"]`).click()
        await page.locator('[data-practice="next"]').click()
      }
      await page.locator('[data-practice="cycle"]').click()
      await page.locator('[data-practice="cycle"]').click()
      await page.locator('[data-practice="next"]').click()
      await page.locator('[data-practice-cell="2"]').click()
      assert.match(await page.locator('[data-practice-cell="0"]').getAttribute('class'), /open/)
      assert.match(await page.locator('[data-practice-cell="4"]').getAttribute('class'), /open/)
      await page.locator('[data-practice="next"]').click()
      await page.locator('[data-practice="cycle"]').click()
      await page.locator('[data-practice="next"]').click()
      await page.locator('[data-practice-cell="12"]').click()
      await page.locator('[data-practice="next"]').click()
      await page.locator('[data-practice="close"]').last().click()
      assert.deepEqual(await saved(page), snapshot)
      await page.locator('[data-control="records"]').last().click()
      await page.locator('[data-survey-record="expert"]').click()
      assert.equal(
        await page.locator('[data-survey-record="expert"]').getAttribute('aria-pressed'),
        'true',
      )
      // Backgrounding while a dialog is open retains the privacy cover after closing it.
      await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
      await page.keyboard.press('Escape')
      assert.equal(
        await page.locator('.board-viewport').evaluate((e) => getComputedStyle(e).visibility),
        'hidden',
      )
      assert.equal(await page.locator('.survey-sidebar').evaluate((e) => e.inert), true)
      await page.locator('.survey-pause [data-control="pause"]').click()
      await page.locator('[data-ruleset="classic"]').click()
      await page.locator('[data-ruleset="survey"]').click()
      assert.deepEqual(await saved(page), snapshot)
      for (const difficulty of ['medium', 'expert']) {
        await page.locator(`[data-survey-difficulty="${difficulty}"]`).click()
        if (await page.locator('dialog').evaluate((d) => d.open))
          await page.locator('[data-control="confirm"]').click()
        await geometry(page)
      }
      await page.locator('[data-control="zoom"]').click()
      await page.locator('.survey-viewport').evaluate((e) => {
        e.scrollLeft = 100
        e.scrollTop = 100
      })
      await geometry(page)
      assert.equal(await page.locator('[data-control="zoom"]').getAttribute('aria-pressed'), 'true')
      if (mobile) {
        const viewport = page.locator('.survey-viewport')
        const box = await viewport.boundingBox()
        const savedBeforeScroll = await saved(page)
        const cdp = await context.newCDPSession(page)
        const x = box.x + box.width / 2,
          y = Math.max(box.y + 100, 150)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x, y, id: 1 }],
        })
        for (let step = 1; step <= 6; step++)
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: x - 10 * step, y: y - 12 * step, id: 1 }],
          })
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        assert.deepEqual(await saved(page), savedBeforeScroll)
        await cdp.detach()
      }
      console.log(
        `Survey ${language} ${width}: gestures, clues, privacy, replay and geometry passed`,
      )
      await context.close()
    }
  for (const width of [320, 800, 3840]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 3840 ? 2160 : 1000 },
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}?ruleset=survey&lang=zh`)
    await page.locator('[data-survey-difficulty="expert"]').click()
    await geometry(page)
    await page.screenshot({ path: `.native/survey-final-${width}.png`, fullPage: true })
    await page.close()
  }
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
}
