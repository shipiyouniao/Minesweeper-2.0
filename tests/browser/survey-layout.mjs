import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/minefarer/'
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})

/** Measure actual text and button boxes, rather than trusting the declared grid track size. */
async function aligned(page) {
  return page.evaluate(() => {
    const columns = [...document.querySelectorAll('.survey-column-heads .survey-line')]
    const rows = [...document.querySelectorAll('.survey-row-heads .survey-line')]
    const cells = [...document.querySelectorAll('[data-cell]')]
    const inside = (outer, inner) => inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1
    return {
      columns: columns.every((header, index) => {
        const h = header.getBoundingClientRect(),
          c = cells[index].getBoundingClientRect()
        return (
          Math.abs(h.x - c.x) < 1 &&
          h.bottom <= c.top &&
          [...header.querySelectorAll('.survey-runs, strong')].every((e) =>
            inside(h, e.getBoundingClientRect()),
          )
        )
      }),
      rows: rows.every((header, index) => {
        const h = header.getBoundingClientRect(),
          c = cells[index * columns.length].getBoundingClientRect()
        return (
          Math.abs(h.y - c.y) < 1 &&
          Math.abs(h.height - c.height) < 1 &&
          inside(h, header.querySelector('.survey-runs').getBoundingClientRect())
        )
      }),
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
    }
  })
}

/** Probe the exposed frame gutters and sticky clue bands after both axes have moved. */
async function clipped(page) {
  return page.evaluate(() => {
    const viewport = document.querySelector('.survey-viewport')
    const v = viewport.getBoundingClientRect()
    const rows = document.querySelector('.survey-row-heads'),
      columns = document.querySelector('.survey-column-heads')
    const r = rows.getBoundingClientRect(),
      c = columns.getBoundingClientRect()
    const at = (x, y) => document.elementFromPoint(x, y)
    const boardAt = (x, y) => Boolean(at(x, y)?.closest('.survey-grid'))
    const x = Math.min(Math.max(c.left + 10, r.right + 10), v.right - 10)
    const y = Math.max(v.top + c.height + 10, r.top + 10)
    const cellHeight = document.querySelector('[data-cell]').getBoundingClientRect().height
    const gap = parseFloat(getComputedStyle(document.querySelector('.survey-grid')).gap)
    const rowGap = [...rows.children]
      .map((h) => h.getBoundingClientRect().bottom + gap / 2)
      .find((y) => y > c.bottom + 2 && y < v.bottom - cellHeight)
    const columnGap = [...columns.children]
      .map((h) => h.getBoundingClientRect().right + gap / 2)
      .find((x) => x > r.right + 2 && x < v.right - cellHeight)
    return {
      leftGutter: boardAt(v.left - 2, y),
      topGutter: boardAt(x, v.top - 2),
      rowGapCovered:
        rowGap === undefined || Boolean(at(r.left + 4, rowGap)?.closest('.survey-row-heads')),
      columnGapCovered:
        columnGap === undefined ||
        Boolean(at(columnGap, c.top + 4)?.closest('.survey-column-heads')),
      horizontalPinned: !viewport.scrollLeft || Math.abs(r.left - v.left) < 1,
      verticalPinned: !viewport.scrollTop || Math.abs(c.top - v.top) < 1,
    }
  })
}

try {
  for (const [width, height] of [
    [320, 700],
    [390, 700],
    [800, 900],
    [1440, 900],
    [3840, 2160],
    [1440, 600],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() =>
      localStorage.setItem(
        'minesweeper.survey.v1',
        JSON.stringify({
          version: 2,
          difficulty: 'expert',
          seed: 31,
          actions: [],
          settled: false,
          records: [],
        }),
      ),
    )
    await page.goto(`${base}?ruleset=survey&lang=zh`)
    const viewport = page.locator('.survey-viewport')
    for (const enlarged of [false, true]) {
      if (enlarged) await page.locator('.zoom-icon').click()
      await viewport.evaluate((e) => {
        e.scrollLeft = 0
        e.scrollTop = 0
      })
      await page.locator('.survey-board-surface').scrollIntoViewIfNeeded()
      assert.deepEqual(await aligned(page), { columns: true, rows: true, pageOverflow: false })
      for (const end of [false, true]) {
        await viewport.evaluate((e, end) => {
          e.scrollLeft = end ? e.scrollWidth : 113
          e.scrollTop = end ? e.scrollHeight : 51
        }, end)
        assert.deepEqual(await clipped(page), {
          leftGutter: false,
          topGutter: false,
          rowGapCovered: true,
          columnGapCovered: true,
          horizontalPinned: true,
          verticalPinned: true,
        })
      }
      if (width === 390 || (width === 1440 && height === 900))
        await page.screenshot({
          path: `.native/survey-clipping-${width}-${enlarged}.png`,
          fullPage: true,
        })
    }
    assert.deepEqual(errors, [])
    console.log(
      `Survey ${width}x${height}: text bounds, first row, both-axis clipping and zoom passed`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
