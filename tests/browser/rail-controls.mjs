import { actExpedition } from '../../.native/tests/src/game/expedition.js'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readyRescue } from '../../.native/tests/tests/rail-helpers.js'
import { FakeRuntime, MemoryStorage } from '../../.native/tests/tests/helpers.js'
import { VariantRepository } from '../../.native/tests/src/persistence/variant-repository.js'
import { ExpeditionSession } from '../../.native/tests/src/application/expedition-session.js'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE)
const storage = new MemoryStorage(),
  repo = new VariantRepository(storage)
readyRescue(repo)
const session = new ExpeditionSession(repo.forCampaign('quarry-rescue'), new FakeRuntime())
session.start('explorer', [])
session.completeCampaignScene('rail-entry')
let expected = session.run
const run = session.run,
  key = 'minesweeper.variants.v1.expedition'
const browser = await chromium.launch({ channel: 'msedge' })
try {
  for (const width of [390, 1440]) {
    expected = run
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: width === 390,
    })
    const base = process.env.GAME_URL ?? 'http://127.0.0.1:4173/minefarer/'
    await page.goto(base)
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key,
      value: storage.getItem(key),
    })
    await page.goto(base + '?page=campaign&stage=quarry-rescue&lang=zh')
    const forward = page.locator('.rail-controls [data-rail-direction="forward"] svg path')
    const reverse = page.locator('.rail-controls [data-rail-direction="reverse"] svg path')
    assert.notEqual(await forward.getAttribute('d'), await reverse.getAttribute('d'))
    await page.screenshot({ path: '.native/rail-controls-' + width + '.png' })
    for (const index of [
      run.rail.drive,
      run.rail.drive,
      run.rail.reverse,
      run.rail.reverse,
      run.rail.drive,
    ]) {
      await page.locator('[data-control="rail-control:' + index + '"]').click()
      await page.waitForFunction(() => !document.querySelector('.dungeon-player.walking'))
      expected = actExpedition(expected, {
        type: expected.game.cells[index].visibility === 'revealed' ? 'interact' : 'reveal',
        index,
      })
      const positions = await page.evaluate((player) => {
        const sprite = document.querySelector('.dungeon-player').getBoundingClientRect()
        const cell = document
          .querySelector('[data-side="a"] [data-cell="' + player + '"]')
          .getBoundingClientRect()
        return {
          distance: Math.hypot(sprite.x - cell.x, sprite.y - cell.y),
          sprite: [sprite.x, sprite.y],
          cell: [cell.x, cell.y],
          transform: document.querySelector('.dungeon-player').style.transform,
        }
      }, expected.player)
      assert.ok(
        positions.distance < 2,
        'Rejected control displaced the player by ' + positions.distance + 'px',
      )
    }
    await page.close()
  }
} finally {
  await browser.close()
}
