import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4821/minefarer/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
const errors = []
mkdirSync('.native/story-screenshots', { recursive: true })

/** Read only painted clues, markers and terrain; no session object or hidden layout is inspected. */
async function visible(page) {
  return page.locator('[data-story-cell]').evaluateAll((buttons) =>
    buttons.map((button) => ({
      index: Number(button.dataset.storyCell),
      covered: button.classList.contains('is-covered'),
      flag: button.classList.contains('is-flagged'),
      clue: button.querySelector('img')
        ? null
        : Number(button.querySelector('.story-clue')?.textContent || 0),
    })),
  )
}

/** Orthogonal and adjacent neighborhoods are public board geometry. */
function ring(index, straight = false) {
  return Array.from({ length: 63 }, (_, other) => other).filter((other) => {
    const x = Math.abs((other % 9) - (index % 9))
    const y = Math.abs(Math.floor(other / 9) - Math.floor(index / 9))
    return straight ? x + y === 1 : (x || y) && x <= 1 && y <= 1
  })
}

/** Solve exposed number constraints, including elementary subset differences. */
function deductions(cells) {
  const constraints = cells
    .filter((c) => !c.covered && !c.flag && c.clue !== null)
    .map((c) => {
      const adjacent = cells.filter((v) => ring(c.index).includes(v.index))
      return {
        cells: adjacent.filter((v) => v.covered).map((v) => v.index),
        mines: c.clue - adjacent.filter((v) => v.flag).length,
      }
    })
    .filter((c) => c.cells.length)
  const all = [...constraints]
  for (const a of constraints)
    for (const b of constraints)
      if (a.cells.length < b.cells.length && a.cells.every((n) => b.cells.includes(n)))
        all.push({ cells: b.cells.filter((n) => !a.cells.includes(n)), mines: b.mines - a.mines })
  return {
    flags: [...new Set(all.filter((c) => c.mines === c.cells.length).flatMap((c) => c.cells))],
    safe: [...new Set(all.filter((c) => c.mines === 0).flatMap((c) => c.cells))],
  }
}

/** Determine reachable frontier solely from revealed, unflagged scene cells. */
function reachable(cells, start, target) {
  const opened = new Set(cells.filter((c) => !c.covered && !c.flag).map((c) => c.index))
  const queue = [start]
  const seen = new Set(queue)
  for (let i = 0; i < queue.length; i++)
    for (const next of ring(queue[i], true))
      if (opened.has(next) && !seen.has(next)) {
        seen.add(next)
        queue.push(next)
      }
  return seen.has(target) || ring(target, true).some((n) => seen.has(n))
}

/** Use real click input and wait for a committed rendered destination. */
async function visit(page, index) {
  await page.locator(`[data-story-cell="${index}"]`).click()
  await page.waitForFunction(
    (target) =>
      document.querySelector('.story-traveler')?.getAttribute('data-player') === String(target),
    index,
  )
  await verifyClues(page)
}

/** Occupied revealed clues stay readable; covered cells expose no numeric badge or truth. */
async function verifyClues(page) {
  const result = await page.evaluate(() => {
    const traveler = document.querySelector('.story-traveler')
    const cell = document.querySelector(`[data-story-cell="${traveler.dataset.player}"]`)
    const badge = traveler.querySelector('.story-clue-badge')
    const badges = [...document.querySelectorAll('.story-clue-badge')]
    return {
      number: Number(cell.dataset.number),
      badge: Number(badge?.textContent || 0),
      leaks: [...document.querySelectorAll('.story-cell.is-covered')].filter(
        (el) => Number(el.dataset.number) || el.querySelector('.story-clue-badge'),
      ).length,
      aligned: badges.every((el) => {
        const style = getComputedStyle(el)
        const range = document.createRange()
        range.selectNodeContents(el)
        const text = range.getBoundingClientRect()
        const circle = el.getBoundingClientRect()
        return (
          style.display === 'grid' &&
          style.placeItems === 'center' &&
          Math.abs(text.x + text.width / 2 - circle.x - circle.width / 2) < 1
        )
      }),
      colors: badges.every(
        (el) => getComputedStyle(el).color === getComputedStyle(el.parentElement).color,
      ),
    }
  })
  assert.equal(result.badge, result.number)
  assert.equal(result.leaks, 0)
  assert.equal(result.aligned, true)
  assert.equal(result.colors, true)
}

/** Complete the current exchange through its public dialogue button. */
async function finishDialogue(page) {
  const next = page.locator('[data-story-action="dialogue"]')
  for (let i = 0; i < 12 && (await next.isVisible()); i++) await next.click()
  assert.equal(await next.isVisible(), false)
}

/** Complete each scene from public clues and the visible teaching objectives. */
async function solve(page, floor) {
  await finishDialogue(page)
  if (floor === 0) await page.locator('[data-story-cell="12"]').click()
  for (let turn = 0; turn < 50; turn++) {
    const cells = await visible(page)
    const { flags, safe } = deductions(cells)
    for (const index of flags)
      await page.locator(`[data-story-cell="${index}"]`).click({ button: 'right' })
    let acted = false
    for (const index of safe) {
      if (index === [34, 52, 25][floor]) continue
      const latest = await visible(page)
      if (!latest.find((c) => c.index === index)?.covered) continue
      const player = Number(await page.locator('.story-traveler').getAttribute('data-player'))
      if (!reachable(latest, player, index)) continue
      await visit(page, index)
      acted = true
    }
    if (!acted && !flags.length) break
  }
  if (floor < 2) await visit(page, 31)
  if (floor === 1) await visit(page, 42)
  if (floor < 2) {
    assert.equal(
      await page
        .locator('.story-hearts')
        .getAttribute('aria-label')
        .then((s) => s.endsWith('3 / 3')),
      true,
    )
  }
  assert.equal(await page.locator('[data-story-action="continue"]').count(), 0)
  await page.locator(`[data-story-cell="${[34, 52, 25][floor]}"]`).click()
  await page.locator(`[data-story-scene="${['trail', 'approach', 'camp'][floor]}"]`).waitFor()
}

/** Assert scene readability and fixed controls at the viewport edges. */
async function geometry(page) {
  const result = await page.evaluate(() => {
    const host = document.querySelector('.ruleset-host')
    const dock = document.querySelector('.story-dock')?.getBoundingClientRect()
    const board = document.querySelector('.story-board')?.getBoundingClientRect()
    return {
      width: innerWidth,
      height: innerHeight,
      overflow: host.scrollWidth > host.clientWidth + 1,
      dock: dock ? { left: dock.left, right: dock.right, bottom: dock.bottom } : null,
      board: board ? { left: board.left, right: board.right } : null,
      dialogs: document.querySelectorAll('dialog').length,
      broken: [...document.images].filter((i) => i.complete && !i.naturalWidth).map((i) => i.src),
    }
  })
  assert.equal(result.overflow, false, JSON.stringify(result))
  assert.equal(result.dialogs, 0)
  assert.deepEqual(result.broken, [])
  if (result.board) assert.ok(result.board.left >= 0 && result.board.right <= result.width + 1)
  if (result.dock) assert.ok(Math.abs(result.dock.bottom - result.height) < 2)
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${base}?lang=zh`)
  await page.locator('.destination-expedition').click()
  assert.equal(await page.locator('[data-story-scene="awakening"]').count(), 1)
  assert.equal(await page.locator('.story-tasks .story-quest').count(), 0)
  await page.locator('[data-story-action="map"]').click()
  assert.ok((await page.locator('.story-quest-panel').innerText()).includes('地图'))
  assert.equal(await page.locator('.story-map').count(), 0)
  await page.locator('[data-story-action="close-panel"]').click()
  await finishDialogue(page)
  await page.locator('.story-quest-reveal').waitFor()
  await page.locator('.story-tasks summary').click()
  assert.equal(await page.locator('.story-quest-bubble').isVisible(), true)
  await page.locator('[data-story-action="pin"]').click()
  assert.equal(await page.locator('.story-tasks .story-quest').count(), 0)
  await page.locator('[data-story-action="tasks"]').click()
  await page.locator('.story-quest-panel summary').click()
  await page.locator('.story-quest-panel [data-story-action="pin"]').click()
  assert.equal(await page.locator('.story-tasks .story-quest').count(), 1)
  await page.locator('[data-story-action="close-panel"]').click()
  await page.screenshot({ path: '.native/story-screenshots/prologue-desktop.png' })
  await solve(page, 0)
  await page.reload()
  assert.equal(await page.locator('[data-story-scene="trail"]').count(), 1)
  // Leaving for the temporary mode neither gates nor overwrites either attempt.
  await page.locator('.story-shortcut').click()
  await page.locator('[data-control="start"]').click()
  const legacy = await page.evaluate(
    () => JSON.parse(localStorage.getItem('minesweeper.variants.v1.expedition')).journal,
  )
  await page.goBack()
  assert.equal(await page.locator('[data-story-scene="trail"]').count(), 1)
  await solve(page, 1)
  await solve(page, 2)
  await page.locator('[data-story-scene="camp"]').waitFor()
  await finishDialogue(page)
  await geometry(page)
  await page.locator('.title-trigger').click()
  assert.equal(await page.locator('.title-options').isVisible(), true)
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.title-options').isVisible(), false)
  let save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('minesweeper.variants.v1.expedition')),
  )
  assert.deepEqual(save.journal, legacy)
  assert.equal(save.camp.supplies, 90)
  await page.locator('[data-story-cell="51"]').click()
  await page.waitForFunction(() => {
    const player = Number(document.querySelector('.story-traveler')?.getAttribute('data-player'))
    return [42, 50, 52, 60].includes(player)
  })
  await page.screenshot({ path: '.native/story-screenshots/camp-desktop.png' })
  await finishDialogue(page)
  await page.locator('[data-story-action="map"]').click()
  assert.equal(await page.locator('.atlas-local-grid').count(), 1)
  await page.locator('[data-story-action="close-panel"]').click()
  await page.locator('[data-story-cell="11"]').click()
  await page.locator('[data-camp-page="shop"]').waitFor()
  assert.ok((await page.locator('.shop-tile').count()) >= 27)
  await page.locator('[data-control="camp-page:overview"]').click()
  await page.reload()
  save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('minesweeper.variants.v1.expedition')),
  )
  assert.equal(save.camp.supplies, 90)
  assert.ok(save.story.completed.includes('meet-guide'))
  const campStorage = await page.context().storageState()
  await page.locator('[data-story-cell="49"]').click()
  await page.locator('[data-story-scene="approach"]').waitFor()
  await page.reload()
  await page.locator('[data-story-scene="approach"]').waitFor()
  assert.equal(await page.locator('.story-traveler').getAttribute('data-player'), '25')
  for (const [gate, next] of [
    [28, 'trail'],
    [19, 'awakening'],
  ]) {
    await page.locator(`[data-story-cell="${gate}"]`).click()
    await page.locator(`[data-story-scene="${next}"]`).waitFor()
  }
  for (const [gate, next] of [
    [34, 'trail'],
    [52, 'approach'],
    [25, 'camp'],
  ]) {
    await page.locator(`[data-story-cell="${gate}"]`).click()
    await page.locator(`[data-story-scene="${next}"]`).waitFor()
  }
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('minesweeper.variants.v1.expedition')).camp.supplies,
    ),
    90,
  )
  await page.close()

  for (const width of [320, 390, 800, 844, 1440, 3840]) {
    for (const language of ['en', 'zh', 'ja']) {
      const context = await browser.newContext({
        viewport: { width, height: width === 3840 ? 2160 : width === 844 ? 390 : 950 },
        hasTouch: width < 500,
        reducedMotion: 'reduce',
      })
      const responsive = await context.newPage()
      responsive.on('pageerror', (e) => errors.push(e.message))
      await responsive.goto(`${base}?page=story&lang=${language}`)
      await geometry(responsive)
      const boardBox = await responsive.locator('.story-board').boundingBox()
      assert.ok(boardBox.width >= 200 && boardBox.height >= 150, JSON.stringify(boardBox))
      if (width === 390 && language === 'zh') {
        await finishDialogue(responsive)
        await responsive.locator('[data-story-cell="12"]').tap()
        assert.ok((await responsive.locator('.story-stage-top').innerText()).includes('长按'))
        const cell = responsive.locator('[data-story-cell="22"]')
        await cell.scrollIntoViewIfNeeded()
        const box = await cell.boundingBox()
        const cdp = await context.newCDPSession(responsive)
        const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
        await responsive.waitForTimeout(600)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        assert.ok(await cell.getAttribute('class').then((s) => s.includes('is-flagged')))
        assert.equal(await responsive.locator('.story-cell.is-flagged').count(), 1)
        assert.ok(
          (await responsive.locator('[data-story-cell="31"]').getAttribute('class')).includes(
            'is-scope',
          ),
        )
        await responsive.waitForTimeout(850)
        // A compatibility click must remain suppressed even after a long stationary hold.
        for (const flagMode of [false, true]) {
          if (flagMode) await responsive.locator('[data-story-action="flag"]').tap()
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
          await responsive.waitForTimeout(1600)
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
          await cell.dispatchEvent('click')
          assert.equal((await cell.getAttribute('class')).includes('is-flagged'), flagMode)
          assert.ok(
            (await responsive.locator('.story-hearts').getAttribute('aria-label')).endsWith(
              '3 / 3',
            ),
          )
          await responsive.waitForTimeout(850)
        }
        await responsive.locator('[data-story-action="explore"]').tap()
        await responsive.locator('[data-story-cell="31"]').tap()
        assert.equal(await responsive.locator('.story-traveler').getAttribute('data-player'), '31')
        await responsive.screenshot({ path: '.native/story-screenshots/prologue-mobile.png' })
      }
      await context.close()
      const campContext = await browser.newContext({
        storageState: campStorage,
        viewport: { width, height: width === 3840 ? 2160 : width === 844 ? 390 : 950 },
        reducedMotion: 'reduce',
      })
      const camp = await campContext.newPage()
      await camp.goto(`${base}?page=story&lang=${language}`)
      await geometry(camp)
      if (language === 'zh' && [390, 3840].includes(width))
        await camp.screenshot({ path: `.native/story-screenshots/camp-${width}.png` })
      await campContext.close()
    }
    console.log(`Story/camp geometry: ${width}px, all three languages passed`)
  }
  assert.deepEqual(errors, [])
  console.log(
    'Inline teaching, public-clue playthrough, camp services, touch holds, route coexistence and atomic arrival passed.',
  )
} finally {
  await browser.close()
}
