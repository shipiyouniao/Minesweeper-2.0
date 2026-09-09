import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { actSonar, createSonar } from '../../.native/tests/src/game/sonar.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const key = 'minesweeper.sonar.v1'
const seed = 31
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const errors = []

/** Inspect only the serializable journal to verify one accepted command per physical gesture. */
async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
}

try {
  for (const language of ['en', 'zh', 'ja']) {
    for (const width of [390, 1440]) {
      const mobile = width < 500
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        hasTouch: mobile,
        isMobile: mobile,
      })
      await context.addInitScript(
        ({ key, seed }) => {
          if (sessionStorage.getItem('seeded')) return
          sessionStorage.setItem('seeded', '1')
          localStorage.setItem(
            key,
            JSON.stringify({
              version: 2,
              difficulty: 'easy',
              seed,
              actions: [],
              settled: false,
              records: [],
            }),
          )
        },
        { key, seed },
      )
      const page = await context.newPage()
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${base}?ruleset=sonar&lang=${language}`)
      const pulse = page.locator('[data-control="scan"]')
      assert.equal(await pulse.isDisabled(), true)
      await page.locator('[data-cell="0"]').click()
      assert.equal(await pulse.isEnabled(), true)
      const beforeRejectedFlag = await saved(page)
      await page.keyboard.press('q')
      await page.keyboard.press('f')
      assert.equal(await pulse.getAttribute('aria-pressed'), 'false')
      assert.equal(await page.locator('.sonar-preview').count(), 0)
      assert.deepEqual(await saved(page), beforeRejectedFlag)
      await page.keyboard.press('q')
      assert.equal(
        await page.locator('.sonar-preview rect').count(),
        1,
        'Q previews even when the cell already has focus',
      )
      await page.keyboard.press('ArrowRight')
      assert.equal(await page.evaluate(() => document.activeElement.dataset.cell), '1')
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('.sonar-preview').count(), 0)
      const records = mobile
        ? page.locator('.sonar-mobile-records')
        : page.locator('.site-header [data-control="records"]')
      await records.click()
      await page.locator('[data-sonar-record="expert"]').click()
      assert.equal(
        await page.locator('[data-sonar-record="expert"]').getAttribute('aria-pressed'),
        'true',
      )
      await page.keyboard.press('Escape')

      // Mouse and touch explicitly select an instrument, then confirm its center.
      for (const center of [40, 41, 42]) {
        if (mobile) await pulse.tap()
        else await pulse.click()
        const target = page.locator(`[data-cell="${center}"]`)
        if (mobile) {
          await target.tap()
        } else {
          await target.hover()
          assert.equal(await page.locator('.sonar-preview rect').count(), 1)
          await target.click()
        }
        assert.equal((await saved(page)).actions.at(-1).type, 'scan')
        assert.equal(await pulse.getAttribute('aria-pressed'), 'false')
        assert.equal(await page.locator('.sonar-preview').count(), 0)
        const readout = await page.locator('.sonar-target-hint').innerText()
        assert.ok(readout.length > 0)
        await page.locator('[data-control="pause"]').first().click()
        assert.equal(await page.locator('.sonar-target-hint').innerText(), '')
        await page.locator('.sonar-pause [data-control="pause"]').click()
        assert.equal(await page.locator('.sonar-target-hint').innerText(), readout)
      }
      assert.equal(await page.locator('.sonar-reading').count(), 3)
      assert.equal(await page.locator('.sonar-equation').count(), 1)
      const journal = await saved(page)
      let model = createSonar(seed)
      for (const action of journal.actions) model = actSonar(model, action)
      for (const [index, reading] of model.readings.entries())
        assert.equal(
          (await page.locator(`[data-sonar-reading="${index}"] strong`).innerText()).split(' ')[0],
          String(reading.mines),
        )

      // No cell identity is exposed by measuring; false flags and guesses retain their meaning.
      assert.equal(await page.locator('.cell.hidden[data-number]:not([data-number=""])').count(), 0)
      assert.equal(await page.locator('.cell.hidden.mine').count(), 0)
      const targetIndex = model.game.cells.findIndex(
        (cell) => !cell.mine && cell.visibility === 'hidden',
      )
      const target = page.locator(`[data-cell="${targetIndex}"]`)
      if (mobile) {
        await target.scrollIntoViewIfNeeded()
        const cdp = await context.newCDPSession(page)
        const box = await target.boundingBox()
        const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }
        const before = await page.locator('.ruleset-host').evaluate((host) => host.scrollTop)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
        await page.waitForTimeout(550)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        assert.match(await target.getAttribute('class'), /flagged/)
        assert.equal(await page.locator('.ruleset-host').evaluate((host) => host.scrollTop), before)
      } else await target.click({ button: 'right' })
      assert.match(await target.getAttribute('class'), /flagged/)
      await target.focus()
      await page.keyboard.press('s')
      assert.match(await target.getAttribute('class'), /suspected-safe/)

      const beforeRecall = await saved(page)
      await pulse.click()
      await page.locator('[data-cell="40"]').click()
      assert.deepEqual(
        await saved(page),
        beforeRecall,
        'recall after depletion must not append or charge',
      )
      await pulse.click()
      await page.locator('[data-cell="43"]').click()
      assert.deepEqual(await saved(page), beforeRecall, 'depleted scan cannot reveal a new count')
      await page.keyboard.press('Escape')
      assert.equal(await pulse.getAttribute('aria-pressed'), 'false')
      assert.equal(await page.locator('.sonar-preview').count(), 0)

      // Native modal closure must not cancel a separately owned privacy pause.
      await page.locator('[data-control="pause"]').first().click()
      await page.locator('[data-control="help"]').click()
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('.sonar-pause').isVisible(), true)
      await page.locator('.sonar-pause [data-control="pause"]').click()
      await page.locator('[data-control="new"]').click()
      await page.keyboard.press('Escape')
      assert.deepEqual(await saved(page), beforeRecall)

      // Routing out and back keeps the seed and complete scan history in its own namespace.
      await page.locator('.route-back').click()
      await page.locator('.free-mode-card[href*="ruleset=sonar"]').click()
      assert.deepEqual(await saved(page), beforeRecall)
      await page.reload()
      assert.equal(await page.locator('.sonar-reading').count(), 3)
      assert.deepEqual(await saved(page), beforeRecall)
      assert.equal(await page.locator('.sonar-preview').count(), 0)
      if (language === 'zh') {
        await page.screenshot({ path: `.native/sonar-${width}.png`, fullPage: true })
        if (!mobile) {
          await page.setViewportSize({ width: 3840, height: 2160 })
          await page.screenshot({ path: '.native/sonar-3840.png', fullPage: true })
        }
      }

      for (const difficulty of ['medium', 'expert']) {
        await page.locator(`[data-sonar-difficulty="${difficulty}"]`).click()
        const confirm = page.locator('dialog[open] [data-control="confirm"]')
        if (await confirm.count()) await confirm.click()
        const geometry = await page
          .locator('.sonar-main')
          .evaluate((main) => ({ width: main.clientWidth, scroll: main.scrollWidth }))
        assert.ok(geometry.scroll <= geometry.width + 1, 'the board must not overflow the page')
        assert.equal((await saved(page)).difficulty, difficulty)
        assert.equal(await page.locator('.sonar-reading').count(), 0)
      }
      await context.close()
      console.log(
        `Sonar: ${language}/${width}px mouse, keyboard, touch, scans, comparisons, privacy, replay and difficulties passed`,
      )
    }
  }
  // Exercise native swipe cancellation and aim-hold priority on an enlarged mobile board.
  const mobileContext = await browser.newContext({
    viewport: { width: 320, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  const mobilePage = await mobileContext.newPage()
  mobilePage.on('pageerror', (error) => errors.push(error.message))
  await mobileContext.addInitScript(
    ({ key, seed }) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 2,
          difficulty: 'expert',
          seed,
          actions: [{ type: 'reveal', index: 0 }],
          settled: false,
          records: [],
        }),
      ),
    { key, seed },
  )
  await mobilePage.goto(`${base}?ruleset=sonar&lang=zh`)
  await mobilePage.locator('[data-control="zoom"]').tap()
  const cdp = await mobileContext.newCDPSession(mobilePage)
  const cell = mobilePage.locator('[data-cell="3"]')
  await cell.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'center' }))
  await mobilePage.waitForTimeout(100)
  const box = await cell.boundingBox()
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }
  const beforeSwipe = await saved(mobilePage)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
  for (let step = 1; step <= 8; step++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ ...point, y: point.y - step * 12 }],
    })
    await mobilePage.waitForTimeout(25)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  assert.deepEqual(await saved(mobilePage), beforeSwipe)
  // Let native scroll momentum settle before starting a separate gesture.
  await mobilePage.waitForTimeout(800)
  await mobilePage.locator('[data-control="scan"]').tap()
  await cell.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'center' }))
  await mobilePage.waitForTimeout(100)
  const aimBox = await cell.boundingBox()
  const aim = { x: aimBox.x + aimBox.width / 2, y: aimBox.y + aimBox.height / 2, id: 1 }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [aim] })
  await mobilePage.waitForTimeout(550)
  assert.deepEqual(await saved(mobilePage), beforeSwipe)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await mobilePage.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key)).actions.at(-1)?.type === 'scan',
    key,
  )
  assert.deepEqual((await saved(mobilePage)).actions.at(-1), { type: 'scan', index: 3 })
  assert.equal(
    await mobilePage.locator('.sonar-pulse').evaluate((element) => element.getAnimations().length),
    0,
  )
  await mobileContext.close()

  // A fixture ends one accepted move before victory, so the real UI owns settlement and restart.
  let puzzle = actSonar(createSonar(seed), { type: 'reveal', index: 0 })
  const actions = [{ type: 'reveal', index: 0 }]
  let winningIndex = null
  for (const [index, cell] of puzzle.game.cells.entries()) {
    if (cell.mine) continue
    const next = actSonar(puzzle, { type: 'reveal', index })
    if (next.game.phase === 'won') {
      winningIndex = index
      break
    }
    if (next !== puzzle) actions.push({ type: 'reveal', index })
    puzzle = next
  }
  assert.notEqual(winningIndex, null)
  const outcomeContext = await browser.newContext()
  const outcomePage = await outcomeContext.newPage()
  outcomePage.on('pageerror', (error) => errors.push(error.message))
  await outcomeContext.addInitScript(
    ({ key, seed, actions }) => {
      if (sessionStorage.getItem('outcome-seeded')) return
      sessionStorage.setItem('outcome-seeded', '1')
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 2,
          difficulty: 'easy',
          seed,
          actions,
          settled: false,
          records: [],
        }),
      )
    },
    { key, seed, actions },
  )
  await outcomePage.goto(`${base}?ruleset=sonar&lang=en`)
  await outcomePage.locator(`[data-cell="${winningIndex}"]`).click()
  assert.equal(await outcomePage.locator('dialog[open]').count(), 1)
  assert.equal((await saved(outcomePage)).records.length, 1)
  await outcomePage.reload()
  assert.equal((await saved(outcomePage)).records.length, 1)
  await outcomePage.locator('.site-header [data-control="records"]').click()
  assert.equal(await outcomePage.locator('.sonar-records li').count(), 1)
  await outcomePage.keyboard.press('Escape')
  await outcomePage.locator('[data-control="new"]').click()
  assert.equal((await saved(outcomePage)).actions.length, 0)
  assert.equal((await saved(outcomePage)).records.length, 1)
  await outcomeContext.close()
  assert.deepEqual(errors, [])
  console.log(
    'Sonar: native swipe cancellation, aimed touch hold, reduced motion and exactly-once UI settlement passed',
  )
} finally {
  await browser.close()
}
