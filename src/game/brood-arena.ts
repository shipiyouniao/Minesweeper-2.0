import { neighbors } from './engine.js'
import { placedBoard, shuffled } from './variant-board.js'
import { encounterTier } from './encounter-tiers.js'
import { openArena } from './arena-terrain.js'
import { forecastBrood } from './brood-turns.js'
import type { Expedition } from '../types/variants.js'

/** Build a connected silk nest with deducible mine pockets and multiple clear approach lanes. */
export function enterBrood(run: Expedition): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const { width, height } = tier.config
  const seed = (run.departure.seed ^ Math.imul(run.floor, 0x27d4eb2d)) >>> 0
  const middle = Math.floor(width / 2)
  const mirror = (seed & 1) === 1
  const boss = (mirror ? height - 2 : 1) * width + middle
  const player = (mirror ? 1 : height - 2) * width + middle
  const centers = [Math.floor(height / 2) * width + 3, Math.floor(height / 2) * width + width - 4]
  const rings = new Set(centers.flatMap((index) => neighbors(tier.config, index)))
  const mines = new Set<number>()
  for (const center of centers) {
    const corners = [center - width - 1, center - width + 1, center + width - 1, center + width + 1]
    for (const index of shuffled(corners, seed ^ center).slice(0, 2)) mines.add(index)
  }
  const walls = [0, width - 1, width * (height - 1), width * height - 1, boss]
  const game = openArena(placedBoard(tier.config, mines, seed, player), walls, rings)
  const nests = centers.map((center) => center + (mirror ? -2 : 2) * width)
  const webs = [boss - 1, boss + 1, Math.floor(height / 2) * width + middle]
  const result: Expedition = {
    ...run,
    game,
    walls,
    entrance: player,
    exit: boss,
    player,
    travelled: [player],
    priorTravel: run.priorTravel + Math.max(0, run.travelled.length - 1),
    treasures: [],
    collected: [],
    scannedRows: [],
    confirmedMines: [],
    surveyedCells: [],
    probeReport: null,
    phase: 'boss',
    encounter: {
      kind: 'brood',
      boss,
      priorDiscoveries: run.confirmedMines.length,
      health: tier.health + 2,
      maxHealth: tier.health + 2,
      lastDamage: 0,
      turn: 1,
      points: 3,
      braced: false,
      turnTriggers: [],
      event: 'entered',
      nests,
      webs,
      eggs: nests.map((index) => ({ index, turns: 2 })),
      hatchlings: [],
      orders: [],
      queenTargets: [],
      intent: { kind: 'swarm', targets: [], damage: 1 },
    },
  }
  return forecastBrood(result)
}
