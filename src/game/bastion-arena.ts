import { neighbors } from './engine.js'
import { placedBoard, shuffled } from './variant-board.js'
import { bastionIntent } from './tactical-intents.js'
import type { Departure, Expedition } from '../types/variants.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import type { BastionTier } from '../types/tactical.js'
import type { Cell, Game } from '../types/game.js'

/** Open the public arena lanes and propagate every revealed zero through its safe neighbors. */
function openArena(placed: Game, walls: readonly number[], ringCells: ReadonlySet<number>): Game {
  const cells: Cell[] = placed.cells.map((cell) => ({ ...cell, visibility: 'hidden' }))
  const queue = cells.flatMap((_, index) =>
    !ringCells.has(index) && !walls.includes(index) ? [index] : [],
  )
  const visited = new Set<number>()
  for (const index of queue) {
    const cell = cells[index]
    if (!cell || cell.mine || walls.includes(index) || visited.has(index)) continue
    visited.add(index)
    cells[index] = { ...cell, visibility: 'revealed' }
    // Rings are excluded only from direct reveal seeds, not from ordinary blank expansion.
    // Safe ring cells may open; mines always remain covered until a player earns information.
    if (cell.adjacent === 0) queue.push(...neighbors(placed.config, index))
  }
  return { ...placed, cells, phase: 'playing' }
}

/** Keep encounter schedules explicit and free of fixed ordinary-dungeon dimensions. */
export function bastionTier(difficulty: VariantDifficulty = 'standard'): BastionTier {
  switch (difficulty) {
    case 'relaxed':
      return { config: { width: 11, height: 9, mines: 4 }, health: 4, floors: [3] }
    case 'standard':
      return { config: { width: 11, height: 9, mines: 4 }, health: 4, floors: [3, 5] }
    case 'advanced':
      return { config: { width: 13, height: 11, mines: 4 }, health: 6, floors: [3, 7] }
    case 'expert':
      return { config: { width: 13, height: 11, mines: 4 }, health: 6, floors: [3, 6, 9] }
    case 'abyss':
      return { config: { width: 15, height: 13, mines: 4 }, health: 8, floors: [4, 8, 12] }
  }
}

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
