import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { StorySession } from '../../.native/tests/src/application/story-session.js'
import { CampSession } from '../../.native/tests/src/application/camp-session.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { MemoryStorage } from '../../.native/tests/tests/helpers.js'
import { deduceMines } from '../../.native/tests/src/game/mine-deduction.js'
import { storyPath } from '../../.native/tests/src/game/story.js'
import { clueIsolated } from '../../.native/tests/src/game/clue-isolation.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({ channel: 'msedge' })
mkdirSync('.native/story-screenshots', { recursive: true })

/** Decode a copy of the saved state for public-clue planning; all live changes use UI input. */
async function read(page) {
  const storage = new MemoryStorage()
  storage.setItem(key, await page.evaluate((key) => localStorage.getItem(key), key))
  return new StorySession(new CampSession(new VariantRepository(storage)))
}

/** Finish the current line before advancing, including chained on-site quest conversations. */
async function finish(page) {
  for (let i = 0; i < 40 && (await page.locator('dialog.story-dialogue[open]').count()); i++)
    await page.locator('[data-story-action="dialogue"]').click()
  assert.equal(await page.locator('dialog.story-dialogue[open]').count(), 0)
}

/** Keep visible and occupied clues readable, with no board overflow on mobile. */
async function inspect(page) {
  const result = await page.evaluate(() => ({
    width: innerWidth,
    right: document.querySelector('.story-board').getBoundingClientRect().right,
    leaks: [...document.querySelectorAll('.story-cell.is-covered')].filter((cell) =>
      Number(cell.dataset.number),
    ).length,
  }))
  assert.equal(result.leaks, 0)
  assert.ok(result.right <= result.width + 1)
}

try {
  for (const width of process.env.FRONT_WIDTH ? [Number(process.env.FRONT_WIDTH)] : [1440, 390])
    for (const lang of ['zh', 'en', 'ja']) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        hasTouch: width === 390,
        reducedMotion: 'reduce',
      })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      let operations = 0
      await page.goto(`${base}?page=story&lang=${lang}`)
      await finish(page)
      const visit = async (index) => {
        const target = page.locator(`[data-story-cell="${index}"]`)
        if (width === 390) await target.tap()
        else await target.click()
        await finish(page)
      }
      const solve = async () => {
        for (let turn = 0; turn < 160; turn++) {
          const { run } = await read(page)
          assert.ok(run)
          if (!run.inspected && run.board.scene.clue !== null) {
            await visit(run.board.scene.clue)
            continue
          }
          const known = deduceMines(run.board.game, run.board.walls)
          const mine = known.mines.find(
            (index) => run.board.game.cells[index].visibility === 'hidden',
          )
          if (mine !== undefined) {
            const cell = page.locator(`[data-story-cell="${mine}"]`)
            if (width === 390) {
              await cell.scrollIntoViewIfNeeded()
              const box = await cell.boundingBox()
              const cdp = await page.context().newCDPSession(page)
              await cdp.send('Input.dispatchTouchEvent', {
                type: 'touchStart',
                touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
              })
              await page.waitForTimeout(560)
              await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
              await cdp.detach()
            } else await cell.click({ button: 'right' })
            await finish(page)
            continue
          }
          const safe = known.safe.find(
            (index) =>
              index !== run.board.exit &&
              index !== run.board.entrance &&
              run.board.game.cells[index].visibility === 'hidden' &&
              storyPath(run.board, run.player, index),
          )
          if (safe !== undefined) {
            await visit(safe)
            continue
          }
          const control = run.board.scene.mechanisms?.find(
            (control) =>
              !run.operated.includes(control.index) && clueIsolated(run.board, control.index),
          )
          if (control) {
            const animate = width === 1440 && lang === 'zh'
            if (animate) await page.emulateMedia({ reducedMotion: 'no-preference' })
            const target = page.locator(`[data-story-mechanism="${control.index}"]`)
            if (width === 1440) {
              await target.focus()
              await target.press('Enter')
            } else await target.tap()
            if (animate) {
              await page.waitForFunction(
                (gate) =>
                  document.querySelector(`[data-story-gate="${gate}"] img`)?.getAnimations()
                    .length > 0,
                control.gate,
              )
              assert.equal(await page.locator('dialog.story-dialogue[open]').count(), 0)
            }
            await page
              .locator(`[data-story-mechanism="${control.index}"][data-operated="true"]`)
              .waitFor()
            await finish(page)
            await page.emulateMedia({ reducedMotion: 'reduce' })
            operations++
            await page.reload()
            await page
              .locator(`[data-story-mechanism="${control.index}"][data-operated="true"]`)
              .waitFor()
            assert.equal(await page.locator('dialog.story-dialogue[open]').count(), 0)
            continue
          }
          await inspect(page)
          return
        }
        throw new Error('Public deduction stopped making progress')
      }

      for (let floor = 0; floor < 3; floor++) {
        await solve()
        let { run } = await read(page)
        assert.equal(run.floor, floor)
        if (floor === 1 && width === 1440) await visit(run.board.treasure)
        await visit(run.board.exit)
      }
      assert.equal((await read(page)).run, null)
      await visit(51)
      assert.equal((await read(page)).camp.story.mapOwned, true)
      await visit(13)
      await solve()
      await visit(42)
      const found = await read(page)
      assert.ok(found.camp.story.completed.includes('survey-road'))
      assert.ok(found.camp.story.accepted.includes('repair-lift'))
      assert.ok(!found.camp.story.facts.includes('road-reported'))
      await visit(75)
      for (let floor = 4; floor <= 6; floor++) {
        if (floor === 4 || floor === 6) {
          assert.equal(await page.locator('.story-stage [data-task-mechanism]').count(), 0)
          await page.locator('[data-story-action="tasks"]').click()
          await page.locator('[data-story-action="select-task"][data-task="repair-lift"]').click()
          await page.locator('.story-quest-panel [data-task-mechanism]').waitFor()
          await page.locator('[data-story-action="close-panel"]').click()
        }
        await solve()
        const { run } = await read(page)
        assert.equal(run.floor, floor)
        if (floor === 6) {
          await visit(run.board.exit)
          assert.equal((await read(page)).run.floor, 6)
          assert.ok(await page.locator('.story-notice').count())
          await visit(run.board.treasure)
        }
        if (lang === 'zh')
          await page.screenshot({
            path: `.native/story-screenshots/front-quarry-${floor}-${width}.png`,
          })
        await visit(run.board.exit)
      }
      assert.equal(operations, 2)
      const hauled = await read(page)
      assert.equal(hauled.run.floor, 3)
      assert.equal(hauled.run.player, 42)
      assert.ok(!hauled.camp.story.facts.includes('lift-restored'))
      await visit(42)
      assert.ok((await read(page)).camp.story.completed.includes('repair-lift'))
      await visit(42)
      await visit(34)
      assert.equal((await read(page)).run.floor, 7)
      assert.equal((await read(page)).run.health, 3)
      await page.locator('[data-story-campaign]').click()
      await page.locator('.campaign-lesson').waitFor()
      assert.equal(new URL(page.url()).searchParams.get('page'), 'campaign')
      assert.deepEqual(errors, [])
      console.log(
        `Fresh prologue -> camp -> on-site discovery -> two quarry mechanisms -> haul shortcut -> campaign: ${width}px ${lang}, no damage`,
      )
      await page.close()
    }
} finally {
  await browser.close()
}
