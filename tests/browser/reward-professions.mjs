import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import {
  EMPTY_CAMP,
  frontierCells,
  reachableCells,
} from '../../.native/tests/src/game/expedition.js'
import { claimMilestone, milestoneProgress } from '../../.native/tests/src/game/milestones.js'
import { riftLandings } from '../../.native/tests/src/game/mobility-skills.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { FakeRuntime, MemoryStorage } from '../../.native/tests/tests/helpers.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
await mkdir('.native/reward-profession-ui', { recursive: true })

function prepare(profession) {
  const storage = new MemoryStorage()
  const ready = { ...EMPTY_CAMP, milestones: { ...milestoneProgress(EMPTY_CAMP), floors: 50 } }
  const camp = claimMilestone(ready, profession === 'waymarker' ? 'deep-route' : 'depth-pioneer')
  new VariantRepository(storage).saveExpedition({ version: 4, camp, journal: null, records: [] })
  const session = new ExpeditionSession(new VariantRepository(storage), new FakeRuntime())
  assert.ok(session.start(profession, []))
  let target, origin
  if (profession === 'waymarker') {
    target = session.run.player
    assert.ok(session.dispatch({ type: 'skill' }))
    origin = [...reachableCells(session.run)].find((index) => index !== target)
    assert.ok(session.dispatch({ type: 'move', index: origin }))
  } else {
    for (let count = 0; count < 400; count++) {
      const run = session.run
      const hidden = [...frontierCells(run)].find(
        (index) => index !== run.exit && !run.game.cells[index]?.mine,
      )
      if (hidden === undefined) break
      assert.ok(session.dispatch({ type: 'reveal', index: hidden }))
    }
    for (const player of reachableCells(session.run)) {
      const run = session.run
      const candidates = riftLandings({
        ...run,
        player,
        confirmedMines: run.game.cells.flatMap((cell, index) => (cell.mine ? [index] : [])),
      })
      if (!candidates.length) continue
      origin = player
      target = candidates[0]
      if (player !== run.player) assert.ok(session.dispatch({ type: 'move', index: player }))
      assert.ok(session.dispatch({ type: 'probe', index: (player + target) / 2 }))
      break
    }
    assert.notEqual(target, undefined)
  }
  return { save: JSON.parse(storage.getItem(key)), target, origin }
}

const errors = []
try {
  for (const language of ['en', 'zh', 'ja'])
    for (const width of [390, 1440])
      for (const profession of ['waymarker', 'riftwalker']) {
        const fixture = prepare(profession)
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          hasTouch: width === 390,
          reducedMotion: 'reduce',
        })
        await context.addInitScript(
          ({ key, save }) => {
            if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save))
          },
          { key, save: fixture.save },
        )
        const page = await context.newPage()
        page.on('pageerror', (error) => errors.push(error.message))
        await page.goto(`${base}?ruleset=expedition&lang=${language}`)
        if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))) {
          await page.screenshot({
            path: '.native/reward-profession-ui/overflow.png',
            fullPage: true,
          })
          console.log(
            await page.evaluate(() =>
              [...document.querySelectorAll('body *')]
                .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
                .slice(0, 12)
                .map((element) => [
                  element.className,
                  element.getBoundingClientRect().width,
                  element.textContent.slice(0, 80),
                ]),
            ),
          )
          assert.fail(`Page overflow: ${language}/${width}/${profession}`)
        }
        assert.equal(
          await page.locator('.player-cell').getAttribute('data-cell'),
          String(fixture.origin),
        )
        const selector =
          profession === 'waymarker'
            ? '[data-control="skill"]'
            : `[data-control="skill-target:${fixture.target}"]`
        if (profession === 'riftwalker')
          assert.ok((await page.locator('.mobility-landing').count()) > 0)
        else assert.equal(await page.locator('.mobility-anchor').count(), 1)
        if (language === 'zh')
          await page.screenshot({
            path: `.native/reward-profession-ui/${profession}-${width}.png`,
            fullPage: true,
          })
        if (profession === 'riftwalker') {
          if (width === 390) await page.locator('[data-control="skill"]').tap()
          else {
            await page.locator('[data-control="skill"]').focus()
            await page.keyboard.press('Enter')
          }
          assert.ok(await page.locator('.dock-skill-panel').isVisible())
        }
        if (width === 390) await page.locator(selector).tap()
        else {
          await page.locator(selector).focus()
          await page.keyboard.press('Enter')
        }
        await page.waitForFunction(
          (target) =>
            document.querySelector('.player-cell')?.getAttribute('data-cell') === String(target),
          fixture.target,
        )
        await page.reload()
        assert.equal(
          await page.locator('.player-cell').getAttribute('data-cell'),
          String(fixture.target),
        )
        if (profession === 'riftwalker') {
          assert.equal(await page.locator('.mobility-rift').count(), 2)
          await page.locator(`[data-side="a"] [data-cell="${fixture.origin}"]`).click()
          await page.waitForFunction(
            (origin) =>
              document.querySelector('.player-cell')?.getAttribute('data-cell') === String(origin),
            fixture.origin,
          )
        } else
          assert.equal(
            await page.locator('[data-control="skill"]').getAttribute('aria-disabled'),
            'true',
          )
        await context.close()
      }
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      languages: 3,
      widths: [390, 1440],
      professions: 2,
      keyboardTouch: true,
      replay: true,
      returnPath: true,
    }),
  )
} finally {
  await browser.close()
}
