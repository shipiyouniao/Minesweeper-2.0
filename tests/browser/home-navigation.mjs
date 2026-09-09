import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
const errors = []
mkdirSync('.native/home-screenshots', { recursive: true })

/** Assert usable geometry, including the fixed dock's relationship to the real viewport. */
async function checkLayout(page) {
  const layout = await page.evaluate(() => {
    const host = document.querySelector('.ruleset-host')
    const header = document.querySelector('.site-header').getBoundingClientRect()
    const dock = document.querySelector('.action-dock')
    const dockBox = dock?.getBoundingClientRect()
    return {
      url: location.search,
      width: innerWidth,
      height: innerHeight,
      overflow: host.scrollWidth > host.clientWidth + 1,
      headerLeft: header.left,
      headerRight: header.right,
      dock: dockBox
        ? { left: dockBox.left, right: dockBox.right, top: dockBox.top, bottom: dockBox.bottom }
        : null,
      hostBottom: host.getBoundingClientRect().bottom,
      brokenImages: [...document.images]
        .filter((image) => image.complete && !image.naturalWidth)
        .map((image) => image.src),
    }
  })
  assert.equal(layout.overflow, false, JSON.stringify(layout))
  assert.ok(layout.headerLeft >= 0 && layout.headerRight <= layout.width, JSON.stringify(layout))
  assert.deepEqual(layout.brokenImages, [])
  if (layout.dock) {
    assert.ok(Math.abs(layout.dock.bottom - layout.height) < 2, JSON.stringify(layout))
    assert.ok(
      layout.dock.left >= 0 && layout.dock.right <= layout.width + 1,
      JSON.stringify(layout),
    )
    assert.ok(layout.hostBottom <= layout.dock.top + 1, JSON.stringify(layout))
  }
}

/** Read only the public board annotations; navigation must preserve the player's marks. */
async function flags(page) {
  return page.locator('.board .cell.flagged').evaluateAll((cells) =>
    cells.map((cell) => ({
      side: cell.closest('[data-side]')?.getAttribute('data-side') ?? 'a',
      index: cell.getAttribute('data-cell'),
    })),
  )
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}?lang=en`)
  assert.equal(await page.locator('[data-menu="home"]').count(), 1)
  assert.equal(await page.locator('.board, .ruleset-tabs').count(), 0)
  await page.locator('.destination-free').focus()
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('.free-mode-card').count(), 4)
  assert.ok(
    await page
      .locator('[data-route-heading]')
      .evaluate((element) => element === document.activeElement),
  )

  for (const mode of ['classic', 'twin', 'sonar', 'survey']) {
    await page.locator(`.free-mode-card[href*="ruleset=${mode}"]`).click()
    await page.locator('.board .cell').first().waitFor()
    if (mode !== 'survey') await page.locator('.board .cell').first().click()
    await page.locator('.board .cell.hidden').first().click({ button: 'right' })
    const marked = await flags(page)
    assert.ok(marked.length > 0, mode)
    await checkLayout(page)
    await page.locator('.route-back').click()
    assert.equal(await page.locator('[data-menu="free"]').count(), 1)
    assert.equal(await page.locator('.action-dock, .board, dialog').count(), 0)
    await page.goBack()
    await page.locator('.board .cell').first().waitFor({ state: 'attached' })
    assert.deepEqual(await flags(page), marked, `${mode} history restore`)
    await page.goForward()
    await page.locator(`.free-mode-card[href*="ruleset=${mode}"]`).click()
    assert.deepEqual(await flags(page), marked, `${mode} re-entry`)
    await page.locator('.route-back').click()
  }

  // Settings are shared across menus and games without silently changing a saved puzzle.
  await page.locator('.language-trigger').click()
  await page.locator('[data-language="zh"]').click()
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN')
  await page.locator('[data-home-sound]').click()
  await page.locator('.free-mode-card[href*="ruleset=classic"]').click()
  assert.equal(await page.locator('#sound-button').getAttribute('aria-pressed'), 'false')
  await page.locator('.brand').click()
  assert.equal(await page.title(), 'Minefarer')
  assert.equal(await page.locator('[data-home-sound]').getAttribute('aria-pressed'), 'false')
  await page.reload()
  assert.equal(await page.locator('[data-menu="home"]').count(), 1)
  await page.close()

  // A direct difficulty link overrides preferences and remains the active save after menu visits.
  for (const route of ['mode=expert', 'ruleset=classic&mode=expert']) {
    const linkedPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    linkedPage.on('pageerror', (error) => errors.push(error.message))
    await linkedPage.goto(`${base}?lang=en`)
    await linkedPage.evaluate(() => {
      localStorage.setItem('minesweeper.v3.preference.difficulty', JSON.stringify('easy'))
    })
    await linkedPage.goto(`${base}?${route}&lang=en`)
    assert.equal(await linkedPage.locator('.board .cell').count(), 480)
    await linkedPage.locator('.board .cell').first().click({ button: 'right' })
    const marked = await flags(linkedPage)
    assert.equal(marked.length, 1)
    await linkedPage.locator('.route-back').click()
    await linkedPage.locator('.free-mode-card[href*="ruleset=classic"]').click()
    assert.equal(await linkedPage.locator('.board .cell').count(), 480)
    assert.deepEqual(await flags(linkedPage), marked, `${route} directory restore`)
    await linkedPage.goBack()
    await linkedPage.goBack()
    assert.equal(await linkedPage.locator('.board .cell').count(), 480)
    assert.deepEqual(await flags(linkedPage), marked, `${route} history restore`)
    await linkedPage.close()
  }

  // Sample each layout family at phone, tablet, desktop and 4K sizes in all locales.
  for (const width of [320, 390, 800, 1440, 3840]) {
    for (const language of ['en', 'zh', 'ja']) {
      const context = await browser.newContext({
        viewport: { width, height: width === 3840 ? 2160 : 950 },
        reducedMotion: 'reduce',
        hasTouch: width < 500,
      })
      const layoutPage = await context.newPage()
      layoutPage.on('pageerror', (error) => errors.push(error.message))
      for (const route of [
        '',
        'page=free&',
        'ruleset=classic&',
        'ruleset=expedition&',
        'ruleset=twin&',
        'ruleset=sonar&',
        'ruleset=survey&',
      ]) {
        await layoutPage.goto(`${base}?${route}lang=${language}`)
        await checkLayout(layoutPage)
        if (route === 'page=free&') {
          const links = layoutPage.locator('.free-mode-card')
          assert.equal(await links.count(), 4)
          assert.ok(
            await links.evaluateAll((items) =>
              items.every((item) => {
                const rect = item.getBoundingClientRect()
                return rect.left >= 0 && rect.right <= innerWidth
              }),
            ),
          )
        }
        if (
          language === 'zh' &&
          [390, 1440, 3840].includes(width) &&
          ['', 'page=free&', 'ruleset=expedition&'].includes(route)
        ) {
          const name = route === '' ? 'home' : route === 'page=free&' ? 'free' : 'camp'
          await layoutPage.screenshot({ path: `.native/home-screenshots/${name}-${width}.png` })
        }
      }
      // Long press and scrolling remain available after the glass styling is applied.
      if (width === 390 && language === 'zh') {
        await layoutPage.goto(`${base}?ruleset=expedition&lang=zh`)
        await layoutPage.locator('[data-control="start"]').tap()
        assert.equal(await layoutPage.locator('.title-trigger').count(), 0)
        await checkLayout(layoutPage)
        await layoutPage.locator('.board .cell.hidden').first().scrollIntoViewIfNeeded()
        await layoutPage.mouse.wheel(0, 400)
        await checkLayout(layoutPage)
      }
      await context.close()
    }
    console.log(`Navigation and glass layouts: ${width}px, three languages passed`)
  }
  assert.deepEqual(errors, [])
  console.log(
    'Home, free directory, all saved games, history, settings and responsive docks passed.',
  )
} finally {
  await browser.close()
}
