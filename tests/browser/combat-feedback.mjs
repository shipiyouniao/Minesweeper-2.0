import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { battleFixture } from './battle-fixtures.mjs'
import { defeatBattle } from '../../.native/tests/tests/battle-helpers.js'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'
import { battleThreat } from '../../.native/tests/src/game/combat-build.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
await mkdir('.native/combat-feedback', { recursive: true })
try {
  for (const seed of [48, 49, 50, 51, 60, 53, 54]) {
    const fixture = battleFixture(seed).entered
    let run = fixture.run
    const actions = [...fixture.save.journal.actions]
    const cases = []
    for (const action of defeatBattle(run)) {
      const next = actExpedition(run, action)
      const attack = action.type === 'attack' && next.encounter.health < run.encounter.health
      const turn =
        action.type === 'end-turn' &&
        run.game.cells.some((_, i) => battleThreat(run.encounter, i, run.game.config) > 0)
      const kind = attack ? 'attack' : turn ? 'end-turn' : null
      if (kind && !cases.some((entry) => entry.kind === kind))
        cases.push({
          kind,
          save: { ...fixture.save, journal: { ...fixture.save.journal, actions: [...actions] } },
        })
      actions.push(action)
      run = next
      if (cases.length === 2) break
    }
    assert.equal(cases.length, 2, fixture.run.encounter.kind)
    if (seed === 54) {
      let waiting = fixture.run
      const waits = [...fixture.save.journal.actions]
      for (let count = 0; count < 15; count++) {
        const next = actExpedition(waiting, { type: 'end-turn' })
        if (next.health < waiting.health) {
          cases.push({
            kind: 'end-turn',
            save: { ...fixture.save, journal: { ...fixture.save.journal, actions: [...waits] } },
            hurt: true,
          })
          break
        }
        waiting = next
        waits.push({ type: 'end-turn' })
      }
      assert.ok(
        cases.some((entry) => entry.hurt),
        'Expected a legal incoming hit fixture',
      )
    }
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await context.addInitScript(() => {
      const save = sessionStorage.getItem('combat-fixture')
      if (save) {
        localStorage.setItem('minesweeper.variants.v1.expedition', save)
        sessionStorage.removeItem('combat-fixture')
      }
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const entry of cases) {
      await page.goto(`${base}?ruleset=expedition&lang=zh`)
      await page.evaluate(
        ({ key, save }) => sessionStorage.setItem('combat-fixture', JSON.stringify(save)),
        {
          key,
          save: entry.save,
        },
      )
      await page.reload()
      await page.locator('.tactical-controls').waitFor()
      const skip = page.locator('[data-scene="skip"]')
      if (await skip.isVisible()) await skip.click()
      await page.evaluate(() => {
        window.effectClasses = []
        new MutationObserver((records) => {
          for (const record of records)
            for (const node of record.addedNodes) {
              if (!(node instanceof Element)) continue
              const effects = [...node.querySelectorAll('.combat-fx')]
              if (node.matches('.combat-fx')) effects.push(node)
              for (const effect of effects) window.effectClasses.push(effect.className)
            }
        }).observe(document.querySelector('.variant-content'), { childList: true, subtree: true })
      })
      if (fixture.run.encounter.kind === 'magnetic' && entry.kind === 'end-turn') {
        await page.evaluate(() => {
          window.sawMagneticPerformance = false
          new MutationObserver(() => {
            if (document.querySelector('.magnetic-performing')) window.sawMagneticPerformance = true
          }).observe(document.querySelector('.variant-content'), {
            attributes: true,
            subtree: true,
          })
        })
        await page.locator('[data-control="end-turn"]').click()
        await page.waitForFunction(
          () => window.sawMagneticPerformance && !document.querySelector('.magnetic-performing'),
        )
        assert.deepEqual(await page.evaluate(() => window.effectClasses), [])
        continue
      }
      await page.locator(`[data-control="${entry.kind}"]`).click()
      await page.waitForFunction(() => window.effectClasses.length > 0)
      const classes = await page.evaluate(() => window.effectClasses.join(' '))
      assert.ok(
        classes.includes(
          entry.kind === 'attack' ? 'combat-slash' : `combat-${fixture.run.encounter.kind}`,
        ),
        classes,
      )
      if (entry.hurt) assert.ok(classes.includes('combat-player-hit'), classes)
      await page.evaluate(() => {
        for (const effect of document.querySelectorAll('.combat-fx'))
          for (const animation of effect.getAnimations()) {
            animation.pause()
            animation.currentTime = 450
          }
      })
      await page.screenshot({
        path: `.native/combat-feedback/${fixture.run.encounter.kind}-${entry.kind}.png`,
      })
      await page.evaluate(() => {
        for (const effect of document.querySelectorAll('.combat-fx'))
          for (const animation of effect.getAnimations()) animation.play()
      })
      await page.waitForFunction(() => document.querySelectorAll('.combat-fx').length === 0)
    }
    assert.deepEqual(errors, [])
    await context.close()
    console.log(fixture.run.encounter.kind + ': attack, ground impact and cleanup verified')
  }
} finally {
  await browser.close()
}
