import assert from 'node:assert/strict'
import test from 'node:test'
import { createExpedition } from '../src/game/expedition.js'
import { enterEncounter } from '../src/game/encounter-roster.js'
import { encounterTier } from '../src/game/encounter-tiers.js'
import { RECOLLECTION_BOSSES, RECOLLECTION_FLOORS } from '../src/game/recollection.js'
import { generateRecollectionFloor } from '../src/game/recollection-layout.js'
import { expeditionConfig, expeditionFloors } from '../src/game/variant-difficulty.js'
import { CURRENT_DEPARTURE } from './helpers.js'
import type { Game } from '../src/types/game.js'

/** Measure hazard placement independently of character positions, names and rendering. */
function mineSignature(game: Game): string {
  return game.cells.map((cell) => Number(cell.mine)).join('')
}

const samples = Number(process.env['RECOLLECTION_RANDOM_SEEDS'] ?? 16)
assert.ok(Number.isInteger(samples) && samples >= 16 && samples <= 512)

test('every Recollection floor and boss family retains varied minefields at every difficulty', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    for (const kind of RECOLLECTION_FLOORS)
      for (
        let floor = 1;
        floor <= expeditionFloors({ ...CURRENT_DEPARTURE, difficulty });
        floor++
      ) {
        const mines = new Set<string>(),
          starts = new Set<number>(),
          exits = new Set<number>()
        for (let seed = 0; seed < samples; seed++) {
          const config = expeditionConfig({ ...CURRENT_DEPARTURE, difficulty }, floor)
          const layout = generateRecollectionFloor(kind, seed, config)
          mines.add(mineSignature(layout.game))
          starts.add(layout.entrance)
          exits.add(layout.exit)
          assert.equal(layout.game.cells.filter((cell) => cell.mine).length, config.mines)
          assert.equal(layout.treasures.length, 3)
        }
        assert.ok(
          mines.size >= samples * 0.9,
          `${difficulty}/${kind}/${floor}: repeated minefields`,
        )
        assert.ok(
          starts.size >= 4 && exits.size >= 4,
          `${difficulty}/${kind}/${floor}: fixed endpoints`,
        )
        console.log(`${difficulty}/${kind}/${floor}: ${mines.size}/${samples} distinct minefields`)
      }
    for (const kind of RECOLLECTION_BOSSES) {
      const primary = new Set<string>(),
        secondary = new Set<string>()
      for (let seed = 0; seed < samples; seed++) {
        const departure = {
          ...CURRENT_DEPARTURE,
          seed,
          difficulty,
          recollection: { floors: ['ordinary'] as const, bosses: [kind] },
        }
        const run = enterEncounter({
          ...createExpedition(departure),
          floor: encounterTier(difficulty).floors[0]!,
        })
        assert.equal(run.encounter!.kind, kind)
        primary.add(mineSignature(run.game))
        if (run.encounter?.kind === 'mirror') secondary.add(mineSignature(run.encounter.other.game))
        assert.equal(run.game.cells.filter((cell) => cell.mine).length, run.game.config.mines)
      }
      assert.ok(primary.size >= samples * 0.9, `${difficulty}/${kind}: primary terrain degenerated`)
      if (kind === 'mirror')
        assert.ok(
          secondary.size >= samples * 0.9,
          `${difficulty}/${kind}: second board degenerated`,
        )
      console.log(
        `${difficulty}/${kind}: ${primary.size}/${samples} distinct minefields${kind === 'mirror' ? `; second board ${secondary.size}/${samples}` : ''}`,
      )
    }
  }
})
