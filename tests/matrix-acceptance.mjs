import { createExpedition, actExpedition } from '../.native/tests/src/game/expedition.js'
import { enterMatrix } from '../.native/tests/src/game/matrix-battle.js'
import { defeatMatrix } from '../.native/tests/tests/matrix-helpers.js'
import { CURRENT_DEPARTURE } from '../.native/tests/tests/helpers.js'

// Run after npm test so the measured engine and public-information player are compiled together.
const results = []
for (const seed of [6, 18, 55, 111, 209]) {
  for (const build of [
    { name: 'explorer', profession: 'explorer', equipment: [], relics: [] },
    {
      name: 'offense',
      profession: 'explorer',
      equipment: ['steel-blade'],
      relics: ['tempered-edge', 'duelist-edge'],
    },
    {
      name: 'mobility-defense',
      profession: 'sentinel',
      equipment: ['field-boots', 'plated-vest'],
      relics: ['marching-boots', 'layered-armor'],
    },
  ]) {
    const start = enterMatrix({
      ...createExpedition({
        ...CURRENT_DEPARTURE,
        seed,
        difficulty: 'standard',
        equipment: build.equipment,
        profession: build.profession,
      }),
      floor: 3,
      relics: build.relics,
      probes: 0,
      scans: 0,
      shields: 0,
    })
    const actions = defeatMatrix(start)
    const end = actions.reduce(actExpedition, start)
    results.push({
      seed,
      build: build.name,
      turns: end.encounter.turn,
      actions: actions.length,
      collected: end.encounter.collected.length,
      opened: end.game.cells.filter((c) => c.visibility === 'revealed').length,
      total: end.game.cells.length,
      health: end.health,
      boss: end.encounter.health,
    })
  }
}
console.log(JSON.stringify(results, null, 2))
