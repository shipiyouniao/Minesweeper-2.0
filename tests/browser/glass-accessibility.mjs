import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })

/** Inspect rendered surfaces, so cascade order is tested after styles are bundled. */
async function surface(page, selector) {
  return page.locator(selector).evaluate((element) => ({
    color: getComputedStyle(element).backgroundColor,
    blur: getComputedStyle(element).backdropFilter,
    animation: getComputedStyle(element).animationName,
  }))
}

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-transparency', value: 'reduce' },
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ],
  })
  await page.goto(`${base}?lang=en`)
  assert.equal(
    await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches),
    true,
  )
  assert.deepEqual(await surface(page, '.destination-free'), {
    color: 'rgb(247, 250, 247)',
    blur: 'none',
    animation: 'none',
  })
  assert.equal((await surface(page, '.destination-expedition')).color, 'rgb(36, 59, 52)')
  await page.locator('.destination-free').click()
  await page.locator('.free-mode-card[href*="ruleset=classic"]').click()
  assert.equal((await surface(page, '.action-dock')).color, 'rgb(237, 244, 237)')
  assert.equal((await surface(page, '.action-dock')).blur, 'none')
  await page.locator('[data-action="tutorial"]').click()
  assert.equal((await surface(page, 'dialog[open]')).color, 'rgb(247, 250, 247)')
  assert.equal((await surface(page, 'dialog[open]')).blur, 'none')

  // Restoring the preference restores glass without changing application state or reloading.
  await session.send('Emulation.setEmulatedMedia', { features: [] })
  assert.match((await surface(page, 'dialog[open]')).color, /^rgba/)
  assert.match((await surface(page, '.action-dock')).blur, /blur\(22px\)/)
  console.log(
    'Reduced transparency and motion: opaque menus, dock and tutorial; glass restores live.',
  )
} finally {
  await browser.close()
}
