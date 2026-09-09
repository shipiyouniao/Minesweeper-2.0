import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { battleFixture } from './battle-fixtures.mjs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.GAME_URL || 'http://127.0.0.1:5173/minefarer/'
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' })
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: 950 },
      hasTouch: width === 390,
    })
    await page.goto(base)
    const result = await page.evaluate(async () => {
      const { DialogueReveal } = await import('./.native/app/ui/dialogue-reveal.js')
      const { notesForCue } = await import('./.native/app/audio/cues.js')
      const calls = []
      const sound = {
        enabled: true,
        play: (cue) => calls.push(cue),
        unlock() {},
        stop() {},
        dispose() {},
        setEnabled() {},
      }
      const reveal = new DialogueReveal(sound)
      const p = document.createElement('p')
      document.body.append(p)
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      p.textContent = '你，好！'
      reveal.start(p, '你，好！', 'dialogue-player', 'zh')
      await wait(420)
      const player = [...calls]
      calls.length = 0
      p.textContent = '来吧'
      reveal.start(p, '来吧', 'dialogue-boss', 'zh')
      await wait(150)
      const boss = [...calls]
      calls.length = 0
      p.textContent = 'abcdefghijklmnopqrstuvwxyz'
      reveal.start(p, p.textContent, 'dialogue-player', 'en')
      const height = p.offsetHeight
      await wait(65)
      const partial = p.querySelector('[data-dialogue-text]').textContent.length
      const finished = reveal.finish()
      const count = calls.length
      await wait(120)
      const stable = calls.length === count && p.offsetHeight === height
      const second = reveal.finish()
      reveal.start(p, '取消这段', 'dialogue-boss', 'zh')
      reveal.cancel()
      await wait(120)
      const cancelled = calls.length === count
      const completedClicks = []
      for (const ending of ['字', '！']) {
        p.textContent = ending
        reveal.start(p, ending, 'dialogue-player', 'zh')
        completedClicks.push(
          await new Promise((resolve) => {
            const observer = new MutationObserver(() => {
              if (p.querySelector('[data-dialogue-text]').textContent !== ending) return
              observer.disconnect()
              resolve(reveal.finish())
            })
            observer.observe(p, { subtree: true, childList: true, characterData: true })
          }),
        )
      }
      p.remove()
      return {
        player,
        boss,
        partial,
        finished,
        second,
        stable,
        cancelled,
        completedClicks,
        distinct:
          notesForCue('dialogue-player')[0].frequency !== notesForCue('dialogue-boss')[0].frequency,
      }
    })
    assert.deepEqual(
      result.completedClicks,
      [false, false],
      'a fully visible line must advance immediately, including punctuation',
    )
    assert.deepEqual(result.player, ['dialogue-player', 'dialogue-player'])
    assert.deepEqual(result.boss, ['dialogue-boss', 'dialogue-boss'])
    assert.ok(result.partial > 0 && result.partial < 26)
    assert.ok(
      result.finished && !result.second && result.stable && result.cancelled && result.distinct,
    )
    await page.addInitScript(
      (save) => localStorage.setItem('minesweeper.variants.v1.expedition', JSON.stringify(save)),
      battleFixture(51).entered.save,
    )
    await page.goto(`${base}?ruleset=expedition&lang=zh`)
    await page.locator('[data-dialogue-text]').waitFor()
    const advance = page.locator('[data-scene="next"]')
    // Restart a line after layout settles; animation scrolling must not race its short duration.
    await advance.click()
    await advance.click()
    await page.locator('[data-scene="previous"]').click()
    const footer = await page.locator('.prologue-footer > span').innerText()
    await advance.dispatchEvent('click')
    assert.equal(await page.locator('.prologue-footer > span').innerText(), footer)
    const line = page.locator('[data-dialogue-line]')
    assert.equal(
      await page.locator('[data-dialogue-text]').textContent(),
      await line.getAttribute('aria-label'),
    )
    await advance.click()
    assert.notEqual(await page.locator('.prologue-footer > span').innerText(), footer)
    await page.locator('[data-scene="skip"]').click()
    await page.locator('.prologue-dialog').waitFor({ state: 'detached' })
    assert.equal(await page.locator('.prologue-dialog').count(), 0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.locator('[data-control="prologue"]').click()
    assert.equal(await page.locator('[data-dialogue-text]').count(), 0)
    const accessible = await page.evaluate(async () => {
      const { DialogueReveal } = await import('./.native/app/ui/dialogue-reveal.js')
      let completed = 0
      const reveal = new DialogueReveal({ play() {} })
      const line = document.createElement('p')
      for (const text of ['第一句', '第二句'])
        reveal.start(line, text, 'dialogue-player', 'zh', () => completed++)
      return { completed, text: line.textContent, label: line.getAttribute('aria-label') }
    })
    assert.deepEqual(accessible, { completed: 2, text: '第二句', label: '第二句' })
    await page.close()
  }
  console.log(
    'Dialogue: per-letter speaker cues, completion, cancellation, layout, touch and reduced motion passed.',
  )
} finally {
  await browser.close()
}
