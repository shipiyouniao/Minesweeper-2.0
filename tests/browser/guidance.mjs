import { battleFixture } from './battle-fixtures.mjs'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { tutorialLesson } from '../../.native/app/ui/tutorial-lessons.js'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || 'msedge',
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  hasTouch: true,
})
const page = await context.newPage()
await page.addInitScript(() => {
  const save = sessionStorage.getItem('guidance-fixture')
  if (save) {
    localStorage.setItem('minesweeper.variants.v1.expedition', save)
    sessionStorage.removeItem('guidance-fixture')
  }
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await mkdir('.native/playtest-ui', { recursive: true })
async function openBoss(kind) {
  const seed = 45 + ['bastion', 'brood', 'mirror', 'magnetic', 'clock'].indexOf(kind)
  const fixture = battleFixture(seed).entered.save
  await page.goto(`${base}?ruleset=expedition&lang=zh`)
  await page.evaluate((save) => {
    sessionStorage.clear()
    sessionStorage.setItem('guidance-fixture', JSON.stringify(save))
  }, fixture)
  await page.reload()
}
async function assets() {
  await page.waitForFunction(() =>
    [...document.images].every((img) => img.complete && img.naturalWidth > 0),
  )
}
async function screenshot(name) {
  await page.screenshot({ path: `.native/playtest-ui/${name}.png`, fullPage: true })
}
try {
  for (const language of ['zh', 'en', 'ja'])
    for (const mode of ['classic', 'twin', 'expedition']) {
      await page.setViewportSize({ width: language === 'zh' ? 390 : 1440, height: 950 })
      await page.goto(`${base}?ruleset=${mode}&tutorial=${mode}&lang=${language}`)
      assert.equal(await page.locator('dialog[open]').count(), 0)
      await page.locator('.tutorial-entry').click()
      await page.locator(`dialog[data-tutorial="${mode}"][open]`).waitFor()
      await assets()
      const formal = await page.evaluate(() => JSON.stringify(localStorage))
      const lesson = tutorialLesson(mode, language)
      for (const [number, step] of lesson.steps.entries()) {
        const next = page.locator('[data-practice="next"]')
        assert.ok(await next.isDisabled(), `${mode} step ${number} must require actual practice`)
        if (language === 'zh' && number === 0) await screenshot(`${mode}-tutorial-mobile`)
        if (step.action === 'mode') {
          for (
            let i = 0;
            i < 4 &&
            (await page.locator('[data-practice="cycle"]').getAttribute('data-mode')) !== step.mode;
            i++
          )
            await page.locator('[data-practice="cycle"]').click()
        } else if (step.action === 'skill') await page.locator('[data-practice="skill"]').click()
        else {
          if (step.action === 'probe' || step.action === 'scan')
            await page.locator(`[data-practice="${step.action}"]`).click()
          const cell = page.locator(
            `[data-practice-side="${step.side}"][data-practice-cell="${step.index}"]`,
          )
          if (language === 'zh') await cell.tap()
          else {
            await cell.focus()
            await page.keyboard.press('Enter')
          }
        }
        assert.ok(
          await next.isEnabled(),
          `${mode}/${language} step ${number}: ${await page.locator('.lesson-feedback').innerText()}`,
        )
        await next.click()
      }
      assert.equal(await page.locator('[data-practice="next"]').count(), 0)
      assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), formal)
      await page.locator('.guidance-footer [data-practice="close"]').click()
      assert.equal(await page.locator('dialog[open]').count(), 0)
      await page
        .locator(mode === 'classic' ? '[data-action="tutorial"]' : '[data-control="tutorial"]')
        .click()
      assert.equal((await page.locator('.lesson-number').innerText()).trim(), '01')
      await page.keyboard.press('Escape')
    }
  for (const kind of ['bastion', 'brood', 'mirror', 'magnetic', 'clock']) {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await openBoss(kind)
    await page.locator(`dialog[data-prologue="${kind}"][open]`).waitFor()
    await assets()
    const points = await page.locator('.tactical-points').innerText()
    const lines = []
    for (let i = 0; i < 8; i++) {
      lines.push(await page.locator('.prologue-dialogue p').innerText())
      if (i === 3) await screenshot(`${kind}-arrival`)
      if (i === 4) {
        await page.setViewportSize({ width: 390, height: 844 })
        await screenshot(`${kind}-arrival-mobile`)
      }
      await page.locator('[data-scene="next"]').click()
    }
    assert.equal(new Set(lines).size, 8)
    assert.equal(await page.locator('dialog[data-prologue][open]').count(), 0)
    assert.equal(await page.locator('.tactical-points').innerText(), points)
    assert.equal(await page.locator('.action-dock').count(), 1)
    if (kind === 'mirror') {
      for (const width of [320, 375, 380, 381, 385, 389, 390, 414]) {
        await page.setViewportSize({ width, height: 844 })
        const rows = await page
          .locator('.tactical-controls > button')
          .evaluateAll(
            (buttons) =>
              new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top))).size,
          )
        assert.equal(rows, 1, `Mirror combat controls wrapped at ${width}px`)
        const dock = await page.locator('.action-dock').boundingBox()
        const host = await page.locator('.ruleset-host').boundingBox()
        assert.ok(
          host.y + host.height <= dock.y + 1,
          `Dock covers board scroll surface at ${width}px`,
        )
      }
      await page.setViewportSize({ width: 390, height: 844 })
    }
    assert.equal(await page.locator('.run-sidebar .tactical-panel').count(), 1)
    for (const control of ['attack', 'brace', 'end-turn']) {
      assert.equal(await page.locator(`[data-control="${control}"]`).count(), 1)
      assert.equal(await page.locator(`.action-dock [data-control="${control}"]`).count(), 1)
    }
    assert.ok(await page.locator('.retreat-button').isVisible())
    assert.equal(await page.locator('.action-dock > [data-tool]').count(), 2)
    assert.equal(await page.locator('.mode-cycle').count(), 1)
    assert.equal(
      await page
        .locator('.board-controls,.board-mode-hint,.board-gesture-hint,.dungeon-legend')
        .count(),
      0,
    )
    const dock = await page.locator('.action-dock').boundingBox(),
      host = await page.locator('.ruleset-host').boundingBox()
    assert.ok(host.y + host.height <= dock.y + 1, 'scroll surface must end above dock')
    await page.locator('.ruleset-host').evaluate((el) => el.scrollTo(0, el.scrollHeight))
    const before = await page.locator('.action-dock').boundingBox()
    await page.locator('.ruleset-host').evaluate((el) => el.scrollTo(0, 0))
    assert.equal((await page.locator('.action-dock').boundingBox()).y, before.y)
    assert.equal(await page.locator('[data-relic-menu]').getAttribute('open'), null)
    await page.locator('[data-relic-menu] summary').click()
    await page.locator('[data-control="cycle-mode"]').click()
    assert.notEqual(await page.locator('[data-relic-menu]').getAttribute('open'), null)
    for (const expected of ['mark-safe', 'chord', 'reveal']) {
      await page.locator('[data-control="cycle-mode"]').focus()
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('.mode-cycle').getAttribute('data-mode'), expected)
    }
    await page.locator('.dock-skill > button').click({ force: true })
    assert.ok(await page.locator('.skill-bubble').isVisible())
    await page.locator('.dock-skill > button').click({ force: true })
    await page.locator('[data-control="prologue"]').click()
    assert.ok(await page.locator('dialog[data-prologue][open]').isVisible())
    await page.keyboard.press('Escape')
    await page.locator('.ruleset-host').evaluate((el) => el.scrollTo(0, el.scrollHeight / 2))
    await screenshot(`${kind}-dock-mobile`)
  }
  // Dock controls must still dispatch real actions after a cinematic, not only change appearance.
  await openBoss('clock')
  await page.locator('[data-scene="skip"]').click()
  for (const tool of ['probe', 'scan']) {
    const count = Number(await page.locator(`[data-tool="${tool}"] .tool-count`).innerText())
    await page.locator(`[data-tool="${tool}"]`).click()
    assert.ok(await page.locator('.dock-target-hint').isVisible())
    await page.locator('[data-side="a"] [data-cell="98"]').click()
    assert.equal(
      Number(await page.locator(`[data-tool="${tool}"] .tool-count`).innerText()),
      count - 1,
    )
  }
  // The tutorial also accepts the direct mouse shortcut, and rejected clicks cannot advance it.
  await page.goto(`${base}?ruleset=classic&tutorial=classic&lang=zh`)
  await page.locator('.tutorial-entry').click()
  await page.locator('[data-practice-cell="1"]').tap()
  assert.ok(await page.locator('[data-practice="next"]').isDisabled())
  await page.locator('[data-practice-cell="0"]').tap()
  await page.locator('[data-practice="next"]').click()
  await page.locator('[data-practice-cell="3"]').tap()
  await page.locator('[data-practice="next"]').click()
  await page.locator('[data-practice="cycle"]').tap()
  await page.locator('[data-practice="next"]').click()
  await page.locator('[data-practice-cell="4"]').click({ button: 'right' })
  assert.ok(await page.locator('[data-practice="next"]').isEnabled())
  await page.locator('[data-practice="next"]').click()
  const hold = await page.locator('[data-practice-cell="16"]').boundingBox()
  const touch = await context.newCDPSession(page)
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: hold.x + hold.width / 2, y: hold.y + hold.height / 2 }],
  })
  await page.waitForTimeout(600)
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  assert.ok(await page.locator('[data-practice="next"]').isEnabled())
  assert.deepEqual(errors, [])
  console.log(
    'Passed: all three hands-on lessons in three languages; five eight-beat arrivals; keyboard input; isolated saves; fixed combat and skill dock; relic state and mobile layout.',
  )
} finally {
  await browser.close()
}
