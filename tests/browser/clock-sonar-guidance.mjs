import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { tutorialLesson } from '../../.native/app/ui/tutorial-lessons.js'
import { createExpedition } from '../../.native/app/game/expedition.js'
import { enterEncounter } from '../../.native/app/game/encounter-roster.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
await mkdir('.native/clock-sonar-ui', { recursive: true })
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
try {
  for (const width of [390, 1280])
    for (const language of ['zh', 'en', 'ja']) {
      const context = await browser.newContext({
        viewport: { width, height: 950 },
        hasTouch: width === 390,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.addInitScript(() => {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem(
            'minesweeper.sonar.v1',
            JSON.stringify({
              version: 2,
              difficulty: 'easy',
              seed: 31,
              actions: [],
              records: [],
              settled: false,
            }),
          )
          sessionStorage.setItem('seeded', '1')
        }
      })
      await page.goto(`${base}?ruleset=sonar&lang=${language}`)
      await page.locator('[data-cell="0"]').click()
      assert.ok((await page.locator('.sonar-obscured').count()) > 0)
      const target = await page.locator('.sonar-obscured').first().getAttribute('data-cell')
      assert.equal(await page.locator(`[data-cell="${target}"]`).getAttribute('data-number'), null)
      const label = await page.locator(`[data-cell="${target}"]`).getAttribute('aria-label')
      assert.ok(
        label.includes(`${Math.floor(Number(target) / 9) + 1},`),
        'masked labels retain row',
      )
      assert.ok(label.includes(`${(Number(target) % 9) + 1}:`), 'masked labels retain column')
      const tool = await page.locator('[data-control="scan"]').boundingBox()
      const destination = await page.locator(`[data-cell="${target}"]`).boundingBox()
      const start = { x: tool.x + tool.width / 2, y: tool.y + tool.height / 2 }
      const end = {
        x: destination.x + destination.width / 2,
        y: destination.y + destination.height / 2,
      }
      if (width === 390) {
        const cdp = await context.newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ ...start, id: 1 }],
        })
        for (let i = 1; i <= 12; i++)
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [
              {
                x: start.x + ((end.x - start.x) * i) / 12,
                y: start.y + ((end.y - start.y) * i) / 12,
                id: 1,
              },
            ],
          })
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      } else {
        await page.mouse.move(start.x, start.y)
        await page.mouse.down()
        await page.mouse.move(end.x, end.y, { steps: 12 })
        await page.mouse.up()
      }
      await page.waitForTimeout(750)

      assert.equal(
        await page
          .locator(`[data-cell="${target}"]`)
          .evaluate((el) => el.classList.contains('sonar-obscured')),
        false,
      )
      await page.reload()
      assert.equal(
        await page
          .locator(`[data-cell="${target}"]`)
          .evaluate((el) => el.classList.contains('sonar-obscured')),
        false,
      )
      const save = await page.evaluate(() => localStorage.getItem('minesweeper.sonar.v1'))
      await page.locator('.tutorial-entry').click()
      for (const step of tutorialLesson('sonar', language).steps) {
        if (step.action === 'mode') await page.locator('[data-practice="cycle"]').click()
        else {
          if (step.action === 'scan') await page.locator('[data-practice="scan"]').click()
          const cell = page.locator(`[data-practice-cell="${step.index}"]`)
          if (width === 390) await cell.tap()
          else {
            await cell.focus()
            await page.keyboard.press('Enter')
          }
        }
        assert.equal(await page.locator('[data-practice="next"]').isEnabled(), true, step.title)
        if (language === 'zh' && step.action === 'scan')
          await page.screenshot({ path: `.native/clock-sonar-ui/tutorial-${width}.png` })
        await page.locator('[data-practice="next"]').click()
      }
      await page.locator('[data-practice="close"]').last().click()
      assert.equal(await page.evaluate(() => localStorage.getItem('minesweeper.sonar.v1')), save)
      if (language === 'zh')
        await page.screenshot({ path: `.native/clock-sonar-ui/sonar-${width}.png`, fullPage: true })
      // Earn a fourth reading through real excavations, then recall it from the log.
      const excavationTargets = await page.evaluate(async () => {
        const { createSonar, actSonar } = await import('/minefarer/.native/app/game/sonar.js')
        const journal = JSON.parse(localStorage.getItem('minesweeper.sonar.v1'))
        let state = journal.actions.reduce(actSonar, createSonar(journal.seed))
        const targets = []
        while (state.excavations < 4) {
          const index = state.game.cells.findIndex(
            (cell) => !cell.mine && cell.visibility === 'hidden',
          )
          if (index < 0) throw new Error('Fixture needs four excavations')
          targets.push(index)
          state = actSonar(state, { type: 'reveal', index })
        }
        return targets
      })
      for (const index of excavationTargets) await page.locator(`[data-cell="${index}"]`).click()
      const mineCenter = await page.evaluate(async () => {
        const { createSonar, actSonar } = await import('/minefarer/.native/app/game/sonar.js')
        const journal = JSON.parse(localStorage.getItem('minesweeper.sonar.v1'))
        const state = journal.actions.reduce(actSonar, createSonar(journal.seed))
        return state.game.cells.findIndex(
          (cell, index) => cell.mine && index !== 60 && index !== 61,
        )
      })
      for (const index of [60, 61, mineCenter]) {
        await page.locator('[data-control="scan"]').click()
        await page.locator(`[data-cell="${index}"]`).click()
      }
      const gold = page.locator(`[data-cell="${mineCenter}"]`)
      assert.equal(await gold.evaluate((el) => el.classList.contains('sonar-confirmed-mine')), true)
      const beforeGoldClick = await page.evaluate(() =>
        localStorage.getItem('minesweeper.sonar.v1'),
      )
      await gold.click({ button: 'right' })
      assert.equal(
        await page.evaluate(() => localStorage.getItem('minesweeper.sonar.v1')),
        beforeGoldClick,
      )
      await page.reload()
      assert.equal(await gold.evaluate((el) => el.classList.contains('sonar-confirmed-mine')), true)
      // Reload clears presentation selection; select the fourth reading explicitly.
      if ((await page.locator('[data-sonar-reading="3"]').getAttribute('aria-pressed')) === 'false')
        await page.locator('[data-sonar-reading="3"]').click()
      const fourthReading = page.locator('[data-sonar-reading="3"]')
      assert.equal(await fourthReading.getAttribute('aria-pressed'), 'true')
      for (const region of await page.locator('.sonar-overlay g').all()) {
        const paint = await region.locator('rect').evaluate((el) => ({
          fill: getComputedStyle(el).fill,
          color: getComputedStyle(el).getPropertyValue('--echo-color').trim(),
        }))
        assert.ok(paint.color, 'every scan region must have a palette, including reading four')
        assert.notEqual(paint.fill, 'rgb(0, 0, 0)')
      }
      assert.ok(
        await fourthReading.evaluate((el) =>
          getComputedStyle(el).getPropertyValue('--echo-color').trim(),
        ),
      )
      await fourthReading.click()
      assert.equal(await fourthReading.getAttribute('aria-pressed'), 'false')
      for (let seed = 0; seed < 6; seed++) {
        const run = enterEncounter({
          ...createExpedition({
            seed,
            title: null,
            difficulty: 'standard',
            profession: 'explorer',
            equipment: [],
            training: [],
            archive: false,
            packs: [],
            battleRelics: false,
          }),
          floor: 3,
        })
        const html = await page.evaluate(
          async ({ language, run }) =>
            (await import('/minefarer/.native/app/ui/battle-guide.js')).battleGuide(language, run),
          { language, run },
        )
        await page.evaluate((html) => {
          const dialog = document.createElement('dialog')
          dialog.id = 'guide-test'
          dialog.className = 'variant-dialog'
          dialog.innerHTML = html
          document.body.append(dialog)
          dialog.showModal()
        }, html)
        assert.equal(await page.locator('#guide-test .boss-picture-steps li').count(), 3)
        assert.equal(
          await page.locator('#guide-test').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          true,
        )
        await page.waitForFunction(() =>
          [...document.querySelectorAll('#guide-test img')].every((img) => img.complete),
        )
        assert.ok(
          await page
            .locator('#guide-test img')
            .evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0)),
        )
        if (language === 'zh')
          await page.screenshot({
            path: `.native/clock-sonar-ui/guide-${run.encounter.kind}-${width}.png`,
          })
        await page.locator('#guide-test').evaluate((el) => el.remove())
      }
      const lastSafe = await page.evaluate(async () => {
        const { createSonar, actSonar } = await import('/minefarer/.native/app/game/sonar.js')
        let state = actSonar(createSonar(31), { type: 'reveal', index: 0 })
        const reserved = state.game.cells.findIndex(
          (cell) => !cell.mine && cell.adjacent > 0 && cell.visibility === 'hidden',
        )
        const actions = [
          { type: 'reveal', index: 0 },
          { type: 'flag', index: reserved },
        ]
        state = actSonar(state, actions[1])
        while (state.game.cells.some((cell) => !cell.mine && cell.visibility === 'hidden')) {
          const index = state.game.cells.findIndex(
            (cell) => !cell.mine && cell.visibility === 'hidden',
          )
          if (index < 0) throw new Error('Final-scan fixture requires safe cells')
          const action = { type: 'reveal', index }
          actions.push(action)
          state = actSonar(state, action)
        }
        actions.push({ type: 'flag', index: reserved })
        state = actSonar(state, actions.at(-1))
        localStorage.setItem(
          'minesweeper.sonar.v1',
          JSON.stringify({
            version: 2,
            difficulty: 'easy',
            seed: 31,
            actions,
            records: [],
            settled: false,
          }),
        )
        sessionStorage.setItem('final-scan-fixture', localStorage.getItem('minesweeper.sonar.v1'))
        return state.game.cells.findIndex((cell) => !cell.mine && cell.visibility === 'hidden')
      })
      await page.addInitScript(() => {
        const fixture = sessionStorage.getItem('final-scan-fixture')
        if (fixture) {
          localStorage.setItem('minesweeper.sonar.v1', fixture)
          sessionStorage.removeItem('final-scan-fixture')
        }
      })
      await page.reload()
      await page.locator('[data-control="scan"]').click()
      await page.locator(`[data-cell="${lastSafe}"]`).click()
      assert.equal(
        await page.locator('dialog[open]').count(),
        1,
        'a final scan opens the result dialog',
      )
      assert.equal(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem('minesweeper.sonar.v1')).records.length,
        ),
        1,
      )
      assert.deepEqual(errors, [])
      console.log(
        `${width}px ${language}: sonar masking, scan reload, interactive tutorial and all five illustrated guides passed`,
      )
      await context.close()
    }
} finally {
  await browser.close()
}
