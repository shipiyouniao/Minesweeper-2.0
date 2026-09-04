import { neighbors } from './engine.js'
import { placedBoard, shuffled } from './variant-board.js'
import { bastionIntent } from './tactical-intents.js'
import type { Departure, Expedition } from '../types/variants.js'
import { encounterTier as bastionTier } from './encounter-tiers.js'
import { openArena } from './arena-terrain.js'

export { encounterTier as bastionTier } from './encounter-tiers.js'

/** Historical departures never gain encounters when replayed by a newer application. */
export function hasBastionEncounters(departure: Departure): boolean {
  return (
    departure.rules === 'relics-v1' &&
    departure.professions === 'skills-v1' &&
    departure.encounters === 'bastion-v1'
  )
}

/** Enter combat only at authored checkpoints, after physically reaching the ordinary stairs. */
export function isBastionFloor(run: Expedition): boolean {
  return (
    hasBastionEncounters(run.departure) &&
    bastionTier(run.departure.difficulty).floors.includes(run.floor)
  )
}

/** Build two deducible ring puzzles inside one connected arena with safe routes and escape lanes. */
export function enterBastion(run: Expedition): Expedition {
  const tier = bastionTier(run.departure.difficulty)
  const { width, height } = tier.config
  const seed = (run.departure.seed ^ Math.imul(run.floor, 0x85ebca6b)) >>> 0
  const mirrored = (seed & 1) === 1
  const boss = (mirrored ? height - 2 : 1) * width + Math.floor(width / 2)
  const player = (mirrored ? 1 : height - 2) * width + Math.floor(width / 2)
  const centers = [Math.floor(height / 2) * width + 3, Math.floor(height / 2) * width + width - 4]
  const ringCells = new Set(centers.flatMap((center) => neighbors(tier.config, center)))
  const mines = new Set<number>()

  for (const center of centers) {
    // Each ring has exactly two shuffled corner mines. Its outer revealed clues distinguish them.
    const corners = [center - width - 1, center - width + 1, center + width - 1, center + width + 1]
    for (const index of shuffled(corners, seed ^ center).slice(0, 2)) mines.add(index)
  }

  const placed = placedBoard(tier.config, mines, seed, player)
  const walls = [0, width - 1, width * (height - 1), width * height - 1, boss]
  const game = openArena(placed, walls, ringCells)

  return {
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
    // Entering a room does not refill tools, skill charges, or once-per-floor relic claims.
    encounter: {
      priorDiscoveries: run.confirmedMines.length,
      kind: 'bastion',
      boss,
      pylons: centers.map((index) => ({ index, active: true })),
      health: tier.health,
      maxHealth: tier.health,
      lastDamage: 0,
      turn: 1,
      points: 3,
      braced: false,
      turnTriggers: [],
      intent: bastionIntent(game.config, walls, boss, player, 1),
      event: 'entered',
    },
  }
}
