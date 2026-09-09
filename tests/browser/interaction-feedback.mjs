import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { battleFixture } from './battle-fixtures.mjs'
import { defeatBattle } from '../../.native/tests/tests/battle-helpers.js'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'
import { battleInteractionEffects } from '../../.native/app/ui/battle-interactions.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/Minesweeper-2.0/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
await mkdir('.native/interaction-feedback', { recursive: true })
const verified = new Set()
try {
  for (const seed of [48, 49, 50, 51, 60, 53, 54]) {
    const fixture = battleFixture(seed).entered
    let run = fixture.run
    const actions = [...fixture.save.journal.actions]
    const cases = []
    for (const action of defeatBattle(run)) {
      const next = actExpedition(run, action)
      assert.deepEqual(battleInteractionEffects(run, run), [])
      assert.deepEqual(battleInteractionEffects(null, next), [])
      const effects = battleInteractionEffects(run, next)
      if (action.type === 'end-turn') assert.deepEqual(effects, [])
      const fresh = effects.filter((effect) => !verified.has(effect.kind))
      if (fresh.length) {
        cases.push({
          action,
          effects: fresh,
          save: { ...fixture.save, journal: { ...fixture.save.journal, actions: [...actions] } },
        })
        for (const effect of fresh) verified.add(effect.kind)
      }
      actions.push(action)
      run = next
    }
    const context = await browser.newContext({
      viewport: { width: seed === 49 ? 390 : 1440, height: 1000 },
    })
    await context.addInitScript(() => {
      const save = sessionStorage.getItem('interaction-fixture')
      if (save) {
        localStorage.setItem('minesweeper.variants.v1.expedition', save)
        sessionStorage.removeItem('interaction-fixture')
      }
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const entry of cases) {
      await page.goto(`${base}?ruleset=expedition&lang=zh`)
      await page.evaluate(
        (save) => sessionStorage.setItem('interaction-fixture', JSON.stringify(save)),
        entry.save,
      )
      await page.reload()
      await page.locator('.tactical-controls').waitFor()
      const skip = page.locator('[data-scene="skip"]')
      if (await skip.isVisible()) await skip.click()
      await page.evaluate(() => {
        window.interactionKinds = []
        new MutationObserver((records) => {
          for (const record of records)
            for (const node of record.addedNodes) {
              if (!(node instanceof Element)) continue
              const effects = [...node.querySelectorAll('.interaction-fx')]
              if (node.matches('.interaction-fx')) effects.push(node)
              for (const effect of effects) {
                window.interactionKinds.push(effect.className)
                for (const animation of effect.getAnimations()) {
                  animation.pause()
                  animation.currentTime = 300
                }
              }
            }
        }).observe(document.querySelector('.variant-content'), { childList: true, subtree: true })
      })
      if (entry.action.type === 'interact')
        await page.locator(`[data-side="a"] [data-cell="${entry.action.index}"]`).click()
      else if (entry.action.type === 'attune' || entry.action.type === 'sonar') {
        await page.locator(`[data-control="${entry.action.type}"]`).click()
        await page.locator(`[data-side="a"] [data-cell="${entry.action.index}"]`).click()
      } else await page.locator(`[data-control="${entry.action.type}"]`).click()
      await page.waitForFunction(() => window.interactionKinds.length > 0)
      const classes = await page.evaluate(() => window.interactionKinds.join(' '))
      for (const effect of entry.effects)
        assert.ok(classes.includes('interaction-' + effect.kind), classes)
      await page.screenshot({ path: `.native/interaction-feedback/${entry.effects[0].kind}.png` })
      await page.evaluate(() => {
        for (const effect of document.querySelectorAll('.interaction-fx'))
          for (const animation of effect.getAnimations()) animation.play()
      })
      await page.waitForFunction(() => document.querySelectorAll('.interaction-fx').length === 0)
    }
    assert.deepEqual(errors, [])
    await context.close()
  }
  for (const kind of [
    'web-cut',
    'nest-break',
    'power-down',
    'seal-break',
    'rift',
    'anchor-on',
    'hourglass',
    'sonar',
    'echo-open',
    'crystal',
  ])
    assert.ok(verified.has(kind), kind)
  console.log(
    'Verified accepted interactions, no redraw/turn replay, animation cleanup: ' +
      [...verified].join(', '),
  )
} finally {
  await browser.close()
}
