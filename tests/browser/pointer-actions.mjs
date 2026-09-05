import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import {
  act,
  createGame,
  PRESETS,
  neighbors,
  chordTargets,
  snapshot,
} from '../../.native/tests/src/game/engine.js'
import { actTwin, createTwin } from '../../.native/tests/src/game/twin.js'
import { actExpedition, createExpedition } from '../../.native/tests/src/game/expedition.js'
import { EXPEDITION_RULES_REVISION } from '../../.native/tests/src/persistence/expedition-format.js'
import { battleFixture } from './battle-fixtures.mjs'
import { withChord } from './annotation-fixtures.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:4173/Minesweeper-2.0/'
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})

/** Find a legal numbered chord and place its correct flags through ordinary engine actions. */
function prepareNumber(game, apply) {
  const index = game.cells.findIndex(
    (cell, index) =>
      cell.visibility === 'revealed' &&
      cell.adjacent > 0 &&
      neighbors(game.config, index).some(
        (other) => game.cells[other].visibility === 'hidden' && !game.cells[other].mine,
      ),
  )
  assert.ok(index >= 0)
  for (const other of neighbors(game.config, index))
    if (game.cells[other].mine) game = apply({ type: 'flag', index: other })
  assert.ok(chordTargets(game, index).length)
  return { game, index }
}

/** Use real current save envelopes; the browser only receives replayable public actions. */
function fixtures() {
  let classic = act(createGame(PRESETS.easy, 42), { type: 'reveal', index: 10 })
  const a = prepareNumber(classic, (action) => (classic = act(classic, action)))
  const list = [
    {
      ruleset: 'classic',
      side: null,
      key: 'minesweeper.v3.game.easy',
      game: a.game,
      index: a.index,
      save: { version: 1, game: snapshot(a.game), elapsed: 0 },
      expected: snapshot(act(a.game, { type: 'chord', index: a.index })),
    },
  ]
  for (const side of ['a', 'b']) {
    const actions = [{ side: 'a', type: 'reveal', index: 30 }]
    let twin = actTwin(createTwin(44, 'standard'), actions[0])
    const b = prepareNumber(twin[side], (action) => {
      actions.push({ ...action, side })
      twin = actTwin(twin, { ...action, side })
      return twin[side]
    })
    list.push({
      ruleset: 'twin',
      side,
      key: 'minesweeper.variants.v1.twin',
      game: b.game,
      index: b.index,
      save: {
        version: 1,
        rules: 'difficulty-v1',
        difficulty: 'standard',
        seed: 44,
        actions,
        records: [],
        settled: false,
      },
    })
  }
  for (const seed of [42, 43, 44]) {
    const c = withChord(battleFixture(seed).entered)
    list.push({
      ruleset: 'expedition',
      side: 'a',
      key: 'minesweeper.variants.v1.expedition',
      game: c.run.game,
      run: c.run,
      index: c.index,
      save: c.save,
    })
  }
  // Both forms of safety must work through mouse and touch with insufficient adjacent flags.
  for (const entry of [
    { action: { type: 'mark-safe', index: 5 }, index: 4, opened: 5 },
    { action: { type: 'probe', index: 30 }, index: 19, opened: 31 },
  ]) {
    const departure = {
      seed: 42,
      difficulty: 'standard',
      profession: 'explorer',
      equipment: [],
      archive: false,
      packs: [],
      training: [],
      battleRelics: false,
    }
    const run = actExpedition(createExpedition(departure), entry.action)
    const flags = neighbors(run.game.config, entry.index).filter(
      (index) => run.game.cells[index].visibility === 'flagged',
    ).length
    assert.ok(flags < run.game.cells[entry.index].adjacent)
    list.push({
      ruleset: 'expedition',
      side: 'a',
      key: 'minesweeper.variants.v1.expedition',
      game: run.game,
      run,
      index: entry.index,
      opened: entry.opened,
      save: {
        version: 4,
        camp: { supplies: 0, upgrades: [], completed: 0 },
        records: [],
        journal: {
          rulesRevision: EXPEDITION_RULES_REVISION,
          returnSupplies: 0,
          departure,
          actions: [entry.action],
        },
      },
    })
  }
  return list
}

const cases = fixtures()
const errors = []
await mkdir(new URL('../../.native/pointer-ui/', import.meta.url), { recursive: true })
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: mobile ? 390 : 1280, height: 844 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: 'reduce',
    })
    await context.addInitScript(() => {
      const fixture = sessionStorage.getItem('pointer-fixture')
      if (fixture) {
        const { key, save } = JSON.parse(fixture)
        localStorage.setItem(key, JSON.stringify(save))
        sessionStorage.removeItem('pointer-fixture')
      }
    })
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    const cdp = await context.newCDPSession(page)

    /** Restore after pagehide has checkpointed the preceding game, inside an isolated context. */
    async function seed(fixture, language = 'zh') {
      await page.goto(`${base}?ruleset=${fixture.ruleset}&lang=${language}&mode=easy`)
      await page.evaluate(
        (fixture) =>
          sessionStorage.setItem(
            'pointer-fixture',
            JSON.stringify({ key: fixture.key, save: fixture.save }),
          ),
        fixture,
      )
      await page.reload()
      const resume = page.locator('#pause-cover:not([hidden]) [data-action="pause"]')
      if (await resume.count()) await tap(resume)
    }

    /** Use a native primary click or touchscreen tap, never a keyboard event. */
    async function tap(locator) {
      if (mobile) await locator.tap()
      else await locator.click()
    }

    /** Hold a captured screen coordinate through a DOM redraw and verify no scroll jump. */
    async function secondary(locator) {
      if (!mobile) {
        await locator.click({ button: 'right' })
        return
      }
      await locator.scrollIntoViewIfNeeded()
      const box = await locator.boundingBox()
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }
      const before = await page.evaluate(() => scrollY)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
      await page.waitForTimeout(550)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - before) < 2,
        'a hold must not shift the page',
      )
    }

    /** Inspect only the persistent application boundary after input has settled. */
    async function saved(fixture) {
      return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), fixture.key)
    }

    for (const fixture of cases) {
      const grid = fixture.side ? `[data-side="${fixture.side}"]` : '#board'
      const attribute = fixture.side ? 'data-control' : 'data-action'
      const target = fixture.game.cells.findIndex(
        (cell, index) =>
          cell.visibility === 'hidden' &&
          !fixture.game.safeMarks.includes(index) &&
          (!fixture.run ||
            (!fixture.run.walls.includes(index) &&
              !fixture.run.surveyedCells.includes(index) &&
              index !== fixture.run.exit &&
              !fixture.run.treasures.includes(index))),
      )
      assert.ok(target >= 0)
      const cell = page.locator(`${grid} [data-cell="${target}"]`)
      await seed(fixture)
      const modes = page.locator('.board-controls')
      const board = page.locator(grid)
      assert.ok((await modes.boundingBox()).y < (await board.boundingBox()).y)
      for (const button of await modes.locator('button').all())
        assert.ok((await button.boundingBox()).height >= 44)

      // The complete mark cycle must work without touching mode buttons or a keyboard.
      await secondary(cell)
      assert.match(
        await cell.getAttribute('class'),
        /flagged/,
        `${fixture.ruleset}/${fixture.index}/${mobile}: first flag`,
      )
      await secondary(cell)
      assert.match(
        await cell.getAttribute('class'),
        /suspected-safe/,
        `${fixture.ruleset}/${fixture.side}/${mobile}: hold cycle`,
      )
      assert.doesNotMatch(await cell.getAttribute('class'), /flagged/)
      await secondary(cell)
      assert.doesNotMatch(await cell.getAttribute('class'), /suspected-safe|flagged/)

      // Explicit selection remains a complete click/tap workflow, including removing a note.
      await tap(page.locator(`[${attribute}="safe-mode"]`))
      await tap(cell)
      assert.match(
        await cell.getAttribute('class'),
        /suspected-safe/,
        `${fixture.ruleset}/${fixture.side}/${mobile}: mode tap after hold`,
      )
      await tap(cell)
      assert.doesNotMatch(await cell.getAttribute('class'), /suspected-safe/)

      for (const gesture of ['secondary', 'mode']) {
        await seed(fixture)
        const number = page.locator(`${grid} [data-cell="${fixture.index}"]`)
        if (gesture === 'mode') {
          await tap(page.locator(`[${attribute}="chord-mode"]`))
          await tap(number)
        } else await secondary(number)
        if (gesture === 'mode')
          assert.equal(
            await page.evaluate(() => document.activeElement.dataset.cell),
            String(fixture.index),
            'pointer actions must retain the selected cell focus',
          )
        const value = await saved(fixture)
        if (fixture.ruleset === 'classic') assert.deepEqual(value.game, fixture.expected)
        else
          assert.deepEqual((value.journal?.actions ?? value.actions).at(-1), {
            ...(fixture.ruleset === 'twin' ? { side: fixture.side } : {}),
            type: 'chord',
            index: fixture.index,
          })
        if (fixture.run) {
          const expected = actExpedition(fixture.run, { type: 'chord', index: fixture.index })
          assert.equal(
            await page.locator(`${grid} .suspected-safe`).count(),
            expected.game.safeMarks.length,
          )
        }
        if (fixture.opened !== undefined)
          assert.match(
            await page.locator(`${grid} [data-cell="${fixture.opened}"]`).getAttribute('class'),
            /revealed/,
          )
      }
      if (fixture.ruleset === 'expedition' && fixture.run.encounter?.kind === 'bastion') {
        await page.screenshot({
          path: new URL(
            `../../.native/pointer-ui/${mobile ? 'touch' : 'mouse'}.png`,
            import.meta.url,
          ).pathname.replace(/^\/(\w:)/, '$1'),
          fullPage: true,
        })
      }
    }
    await context.close()
  }
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      pointerOnly: true,
      modes: 3,
      twinSides: 2,
      bosses: 3,
      nativeTouch: true,
      markCycle: true,
      explicitButtons: true,
      directChord: true,
      safeTargetsWithoutMatchingFlags: true,
      errors,
    }),
  )
} finally {
  await browser.close()
}
