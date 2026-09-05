import { expeditionConfig, expeditionFloors } from '../src/game/variant-difficulty.js'
import { CURRENT_DEPARTURE } from './helpers.js'
import assert from 'node:assert/strict'
import test from 'node:test'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { generateDungeon } from '../src/game/dungeon-generator.js'
import { scoutExit } from '../src/game/dungeon-discovery.js'

import type { Expedition } from '../src/types/variants.js'

test('the compass scouts each new exit area without consuming tools or collecting remote treasure', () => {
  for (let seed = 0; seed < 30; seed++) {
    let run = createExpedition({
      ...CURRENT_DEPARTURE,
      seed,
      profession: 'engineer',
      equipment: [],
      archive: true,
    })
    for (let floor = 2; floor <= expeditionFloors(run.departure); floor++) {
      const reward: Expedition = { ...run, phase: 'reward', offers: ['compass', 'salvage'] }
      const relic = floor === 2 ? 'compass' : 'salvage'
      const next = actExpedition(reward, { type: 'relic', relic })
      const layout = generateDungeon(
        (seed + Math.imul(floor, 0x9e3779b9)) >>> 0,
        expeditionConfig(run.departure, floor).mines,
      )
      const area = layout.game.cells.flatMap((_, index) =>
        Math.abs((index % 9) - (layout.exit % 9)) <= 1 &&
        Math.abs(Math.floor(index / 9) - Math.floor(layout.exit / 9)) <= 1
          ? [index]
          : [],
      )
      // Expand zero cells with a coordinate oracle, including the original opening and scouted cells.
      const visible = new Set(
        layout.game.cells.flatMap((cell, index) =>
          cell.visibility === 'revealed' ||
          (area.includes(index) && !cell.mine && !layout.walls.includes(index))
            ? [index]
            : [],
        ),
      )
      for (const index of visible) {
        if (layout.game.cells[index]?.adjacent !== 0) continue
        for (let other = 0; other < 81; other++) {
          if (
            Math.abs((other % 9) - (index % 9)) <= 1 &&
            Math.abs(Math.floor(other / 9) - Math.floor(index / 9)) <= 1 &&
            !layout.walls.includes(other)
          )
            visible.add(other)
        }
      }
      for (const [index, cell] of next.game.cells.entries()) {
        assert.equal(cell.mine, layout.game.cells[index]?.mine)
        assert.equal(cell.adjacent, layout.game.cells[index]?.adjacent)
        if (!area.includes(index) || layout.walls.includes(index)) {
          assert.equal(cell.visibility, visible.has(index) ? 'revealed' : 'hidden')
          continue
        }
        assert.equal(cell.visibility, cell.mine ? 'flagged' : 'revealed')
        assert.ok(
          next.surveyedCells.includes(index) || layout.game.cells[index]?.visibility === 'revealed',
        )
        if (cell.mine) assert.equal(actExpedition(next, { type: 'flag', index }), next)
      }
      assert.equal(next.probes, run.probes)
      assert.equal(next.scans, run.scans)
      assert.equal(next.shields, run.shields)
      assert.equal(next.player, next.entrance)
      assert.equal(next.phase, 'exploring')
      assert.equal(next.loot, run.loot)
      assert.equal(next.steps, run.steps)
      assert.deepEqual(next.collected, [])
      assert.deepEqual(scoutExit(next), next)
      run = next
    }
  }
})
