import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { battleFixture } from './battle-fixtures.mjs'
import { defeatBattle } from '../../.native/tests/tests/battle-helpers.js'
import { actExpedition } from '../../.native/tests/src/game/expedition.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const fixture = battleFixture(49)
let run = fixture.entered.run
let turn
for (const action of defeatBattle(run)) {
  const next = actExpedition(run, action)
  if (
    action.type === 'end-turn' &&
    !run.encounter.queenTargets.length &&
    run.encounter.orders.some(
      (order) =>
        run.encounter.hatchlings.includes(order.from) &&
        order.targets.length &&
        order.from !== order.to &&
        order.to !== run.player,
    )
  ) {
    turn = { before: run, after: next }
    break
  }
  run = next
}
assert.ok(turn, 'Legal hatchling-only turn fixture')
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
try {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    const page = await browser.newPage({ reducedMotion })
    await page.goto(base)
    const result = await page.evaluate(
      async ({ turn, objective, base }) => {
        const { animateBattleFeedback } = await import(base + '.native/app/ui/battle-feedback.js')
        const { animateBattleInteractions } = await import(
          base + '.native/app/ui/battle-interactions.js'
        )
        const root = document.createElement('div')
        root.id = 'feedback-regression'
        root.dataset.side = 'a'
        root.innerHTML = turn.before.game.cells
          .map((_, i) => `<div data-cell="${i}"></div>`)
          .join('')
        document.body.append(root)
        const sources = []
        const animate = HTMLElement.prototype.animate
        HTMLElement.prototype.animate = function (...args) {
          if (this.hasAttribute('data-cell')) sources.push(Number(this.dataset.cell))
          return animate.apply(this, args)
        }
        try {
          animateBattleFeedback(root, turn.before, turn.after)
        } finally {
          HTMLElement.prototype.animate = animate
        }
        animateBattleInteractions(root, objective.run, objective.next)
        return {
          sources,
          combat: root.querySelectorAll('.combat-fx').length,
          interactions: root.querySelectorAll('.interaction-fx').length,
          animation: getComputedStyle(root.querySelector('.interaction-fx')).animationName,
        }
      },
      { turn, objective: fixture.objective, base },
    )
    assert.ok(result.combat > 0 && result.interactions > 0)
    assert.ok(
      !result.sources.includes(turn.before.encounter.boss),
      'Queen must not wind up on hatchling-only turn',
    )
    assert.deepEqual(
      result.sources,
      turn.before.encounter.orders
        .filter(
          (order) => turn.before.encounter.hatchlings.includes(order.from) && order.targets.length,
        )
        .map((order) => (order.to === turn.after.player ? order.from : order.to)),
    )
    assert.ok(result.sources.every((index) => turn.after.encounter.hatchlings.includes(index)))
    if (reducedMotion === 'reduce') assert.equal(result.animation, 'none')
    await page.waitForFunction(
      () =>
        !document.querySelector(
          '#feedback-regression .combat-fx, #feedback-regression .interaction-fx',
        ),
      null,
      { timeout: 2500 },
    )
    // Resolve real lethal hits from controlled legal encounter states; revival can raise net HP.
    for (const [relic, health] of [
      ['second-wind', 1],
      ['abyss-hourglass', 3],
    ]) {
      const room = battleFixture(54).entered.run
      const before = {
        ...room,
        health,
        shields: 0,
        relics: [relic],
        runTriggers: [],
        encounter: {
          ...room.encounter,
          intent: { ...room.encounter.intent, targets: [room.player], damage: 10 },
        },
      }
      const after = actExpedition(before, { type: 'end-turn' })
      assert.ok(after.health >= before.health)
      assert.ok(after.runTriggers.includes(relic))
      const hit = await page.evaluate(
        async ({ before, after, base }) => {
          const { animateBattleFeedback } = await import(base + '.native/app/ui/battle-feedback.js')
          const root = document.querySelector('#feedback-regression')
          animateBattleFeedback(root, before, after)
          const result = {
            hit: !!root.querySelector('.combat-player-hit'),
            guard: !!root.querySelector('.combat-guard'),
            number: !!root.querySelector('.combat-player-damage'),
          }
          for (const layer of root.querySelectorAll('.combat-fx')) layer.remove()
          animateBattleFeedback(root, after, after)
          return { ...result, repeated: !!root.querySelector('.combat-player-hit') }
        },
        { before, after, base },
      )
      assert.deepEqual(hit, { hit: true, guard: false, number: false, repeated: false })
    }
    await page.close()
  }
  console.log(
    'Reduced-motion CSS-disabled overlays clean up; hatchling-only turns never animate the queen.',
  )
} finally {
  await browser.close()
}
