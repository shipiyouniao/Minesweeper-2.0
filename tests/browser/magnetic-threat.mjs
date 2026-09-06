import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'
import { neighbors } from '../../.native/tests/src/game/engine.js'
import { defeatMagnetic } from '../../.native/tests/tests/magnetic-helpers.js'
import { battleFixture } from './battle-fixtures.mjs'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const key = 'minesweeper.variants.v1.expedition'
const fixture = battleFixture(48).entered
let run = fixture.run
const actions = [...fixture.save.journal.actions]
for (const action of defeatMagnetic(run)) {
  run = actExpedition(run, action)
  actions.push(action)
  const forecast = run.encounter.forecast
  if (forecast.kind === 'charge' && forecast.resolvesOn === run.encounter.turn) break
}
assert.equal(run.encounter.forecast.kind, 'charge')
const { anchor, path } = run.encounter.forecast
const blast = neighbors(run.game.config, anchor)
const overlap = path.slice(1).filter((index) => index !== anchor && blast.includes(index))
assert.ok(overlap.length, 'The legal charge fixture must include overlapping damage sources')
const save = { ...fixture.save, journal: { ...fixture.save.journal, actions } }
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
})
const errors = []
try {
  for (const language of ['en', 'zh', 'ja']) {
    for (const width of [390, 2560]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: 'reduce',
      })
      await context.addInitScript(
        ({ key, save }) => localStorage.setItem(key, JSON.stringify(save)),
        { key, save },
      )
      const page = await context.newPage()
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(`${base}?ruleset=expedition&lang=${language}`)
      for (const index of overlap) {
        const cell = page.locator(`[data-side="a"] [data-cell="${index}"]`)
        assert.match(await cell.getAttribute('title'), /· 10$/)
        assert.match(await cell.getAttribute('aria-label'), /· 10$/)
      }
      const endpoint = page.locator(`[data-side="a"] [data-cell="${anchor}"]`)
      assert.match(await endpoint.getAttribute('title'), /· 5$/)
      await context.close()
    }
  }
  assert.deepEqual(errors, [])
  console.log(
    'Passed: replayed charge overlap and blocked-anchor damage labels in three languages at 390/2560px.',
  )
} finally {
  await browser.close()
}
