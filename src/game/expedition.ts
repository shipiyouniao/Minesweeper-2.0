import { act, neighbors, randomIndex } from './engine.js'
import { adjacentSteps, placedBoard, shuffled } from './variant-board.js'
import { approachPath, connectedFloor, walkingPath } from './dungeon-path.js'
import type { Config, Game } from '../types/game.js'
import type {
  Camp,
  Departure,
  Equipment,
  Expedition,
  ExpeditionAction,
  Profession,
  Relic,
  Upgrade,
} from '../types/variants.js'

export const FLOOR_COUNT = 5
export const EMPTY_CAMP: Camp = { supplies: 0, upgrades: [], completed: 0 }
export const UPGRADES: readonly Upgrade[] = ['surveyor', 'engineer', 'workshop', 'archive']
export const EQUIPMENT: readonly Equipment[] = ['probe', 'scanner', 'guard']

/** Fixed one-time prices keep camp progression finite and predictable. */
export function upgradeCost(upgrade: Upgrade): number {
  return upgrade === 'archive' ? 45 : upgrade === 'workshop' ? 30 : 20
}

/** A shield costs two loadout points; information tools cost one each. */
export function equipmentCost(equipment: Equipment): number {
  return equipment === 'guard' ? 2 : 1
}

/** Check departure choices against actual camp unlocks and the shared three-point budget. */
export function allowedDeparture(
  camp: Camp,
  profession: Profession,
  equipment: readonly Equipment[],
): boolean {
  return (
    (profession === 'explorer' || camp.upgrades.includes(profession)) &&
    (equipment.length === 0 || camp.upgrades.includes('workshop')) &&
    new Set(equipment).size === equipment.length &&
    equipment.reduce((total, item) => total + equipmentCost(item), 0) <= 3
  )
}

/** Purchase an unowned camp facility without modifying the original camp. */
export function buyUpgrade(camp: Camp, upgrade: Upgrade): Camp {
  const cost = upgradeCost(upgrade)
  return camp.upgrades.includes(upgrade) || camp.supplies < cost
    ? camp
    : { ...camp, supplies: camp.supplies - cost, upgrades: [...camp.upgrades, upgrade] }
}

/** Carve a hidden monotone route before shuffling all remaining eligible mine positions. */
function createFloor(departure: Departure, floor: number): Expedition {
  const width = 9
  const config = { width, height: 9, mines: 13 + floor * 2 }
  const seed = (departure.seed + Math.imul(floor, 0x9e3779b9)) >>> 0
  const next = randomIndex(seed)
  const safe = new Set([0, ...neighbors(config, 0)])
  let x = 0
  let y = 0

  while (x < 8 || y < 8) {
    if (x === 8 || (y < 8 && next(2) === 0)) y++
    else x++
    safe.add(y * width + x)
  }

  const indices = Array.from({ length: 81 }, (_, index) => index)
  const game = connectedPlacement(config, indices, safe, seed)
  const connected = connectedFloor(game)
  const walls = indices.filter((index) => !game.cells[index]?.mine && !connected.has(index))
  const treasures = shuffled(
    indices.filter((index) => index > 10 && index < 80 && connected.has(index)),
    seed ^ 0xa710,
  ).slice(0, 3)

  return {
    departure,
    floor,
    game: {
      ...game,
      phase: 'playing',
      cells: game.cells.map((cell, index) =>
        walls.includes(index) ? { ...cell, visibility: 'hidden' } : cell,
      ),
    },
    exit: 80,
    walls,
    player: 0,
    treasures,
    collected: [],
    relics: [],
    offers: [],
    scannedRows: [],
    probes: 0,
    scans: 0,
    shields: 0,
    loot: 0,
    steps: 0,
    phase: 'exploring',
  }
}

/** Shuffle exact mine sets until every hazard borders the reachable floor, with a finite fallback. */
function connectedPlacement(
  config: Config,
  indices: readonly number[],
  safe: ReadonlySet<number>,
  seed: number,
): Game {
  const eligible = indices.filter((index) => !safe.has(index))
  for (let attempt = 0; attempt < 128; attempt++) {
    const mines = new Set(
      shuffled(eligible, (seed ^ 0x51ed) + Math.imul(attempt, 0x45d9f3b)).slice(0, config.mines),
    )
    const game = placedBoard(config, mines, seed, 0)
    const floor = connectedFloor(game)
    if (
      [...mines].every((index) =>
        adjacentSteps(game, index).some((neighbor) => floor.has(neighbor)),
      )
    )
      return game
  }

  // Even rows remain safe corridors. The reserved monotone route joins them;
  // every odd-row mine has a safe vertical neighbor. At least 24 slots remain.
  const candidates = eligible.filter((index) => Math.floor(index / config.width) % 2 === 1)
  const mines = new Set(shuffled(candidates, seed ^ 0xc011).slice(0, config.mines))
  return placedBoard(config, mines, seed, 0)
}

/** Start a run with bounded career tools and the selected equipment allocation. */
export function createExpedition(departure: Departure): Expedition {
  const run = createFloor(departure, 1)

  return {
    ...run,
    probes:
      (departure.profession === 'explorer' ? 2 : 1) + Number(departure.equipment.includes('probe')),
    scans:
      (departure.profession === 'surveyor' ? 2 : 1) +
      Number(departure.equipment.includes('scanner')),
    shields:
      Number(departure.profession === 'engineer') + Number(departure.equipment.includes('guard')),
  }
}

/** Find every revealed safe cell connected to the entrance by orthogonal steps. */
export function reachableCells(run: Expedition): Set<number> {
  const found = new Set<number>([0])
  const queue = [0]

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]
    if (index === undefined) continue

    for (const other of adjacentSteps(run.game, index)) {
      const cell = run.game.cells[other]
      if (
        !found.has(other) &&
        !run.walls.includes(other) &&
        cell &&
        !cell.mine &&
        cell.visibility === 'revealed'
      ) {
        found.add(other)
        queue.push(other)
      }
    }
  }

  return found
}

/** Only covered cells bordering the connected explored area can extend the route. */
export function frontierCells(run: Expedition): Set<number> {
  const frontier = new Set<number>()
  for (const index of reachableCells(run)) {
    for (const other of adjacentSteps(run.game, index)) {
      if (!run.walls.includes(other) && run.game.cells[other]?.visibility === 'hidden')
        frontier.add(other)
    }
  }
  return frontier
}

/** Award treasures physically visited along this walk; revealing one does not collect it. */
function collectTreasures(run: Expedition, path: readonly number[]): Expedition {
  const collected = run.treasures.filter(
    (index) => run.collected.includes(index) || path.includes(index),
  )
  const fresh = collected.filter((index) => !run.collected.includes(index)).length

  return { ...run, collected, loot: run.loot + fresh * (run.relics.includes('purse') ? 9 : 6) }
}

/** Offer up to three distinct unowned relics, deterministically for this floor. */
function relicOffers(run: Expedition): Relic[] {
  const pool: readonly Relic[] = run.departure.archive
    ? ['lantern', 'lens', 'aegis', 'purse', 'compass', 'salvage']
    : ['lantern', 'lens', 'aegis', 'purse']

  return shuffled(
    pool.filter((relic) => !run.relics.includes(relic)),
    run.departure.seed ^ run.floor,
  ).slice(0, 3)
}

/** Reveal a route frontier, consuming a shield on a mine without changing its clues. */
function revealFrontier(run: Expedition, index: number): Expedition {
  if (!frontierCells(run).has(index)) return run
  const path = approachPath(run, index)
  if (!path) return run
  const cell = run.game.cells[index]
  if (!cell) return run
  const approached = collectTreasures({ ...run, player: path.at(-1) ?? run.player }, path)

  if (cell.mine && run.shields > 0) {
    // A protected mine stays a mine and is flagged. The safe route still needs discovery.
    return {
      ...approached,
      game: act(run.game, { type: 'flag', index }),
      shields: run.shields - 1,
      steps: run.steps + 1,
    }
  }

  const game = revealDungeon(run, index)
  return finishAtExit(
    collectTreasures(
      {
        ...approached,
        game,
        player: cell.mine ? approached.player : index,
        phase: game.phase === 'lost' ? 'lost' : 'exploring',
        steps: run.steps + 1,
      },
      cell.mine ? [] : [index],
    ),
  )
}

/** Reveal blank regions without ever revealing wall terrain or changing mine clues. */
function revealDungeon(run: Expedition, index: number): Game {
  const cells = [...run.game.cells]
  const queue = [index]

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const target = queue[cursor]
    if (target === undefined || run.walls.includes(target)) continue
    const cell = cells[target]
    if (!cell || cell.visibility !== 'hidden') continue
    cells[target] = { ...cell, visibility: 'revealed' }
    if (cell.mine) return { ...run.game, cells, phase: 'lost', exploded: target }
    if (cell.adjacent === 0) queue.push(...neighbors(run.game.config, target))
  }

  return { ...run.game, cells, phase: 'playing' }
}

/** Walk through known floor cells and enter the stairs only after physically arriving. */
function movePlayer(run: Expedition, index: number): Expedition {
  const path = walkingPath(run, index)
  if (!path || (path.length === 1 && index !== run.exit)) return run
  const moved = collectTreasures({ ...run, player: index, steps: run.steps + 1 }, path)
  return finishAtExit(moved)
}

/** Commit an exit reward only for a living explorer that actually reached the stairs. */
function finishAtExit(run: Expedition): Expedition {
  if (run.phase !== 'exploring' || run.player !== run.exit) return run

  return {
    ...run,
    loot: run.loot + 12,
    phase: run.floor === FLOOR_COUNT ? 'won' : 'reward',
    offers: relicOffers(run),
  }
}

/** Carry the build between floors while resetting local clues, treasures and route geometry. */
function takeRelic(run: Expedition, relic: Relic): Expedition {
  if (run.phase !== 'reward' || !run.offers.includes(relic)) return run
  const relics = [...run.relics, relic]
  const next = createFloor(run.departure, run.floor + 1)
  let result: Expedition = {
    ...next,
    relics,
    loot: run.loot,
    steps: run.steps,
    probes: Math.min(4, run.probes + Number(relics.includes('lantern'))),
    scans: Math.min(4, run.scans + Number(relics.includes('lens'))),
    shields: Math.min(2, run.shields + Number(relic === 'aegis')),
  }

  // Compass exposes a fixed, advertised safe exit clue without connecting it to the entrance.
  if (relics.includes('compass')) {
    result = { ...result, game: revealDungeon(result, result.exit) }
  }

  return result
}

/** Pure expedition transition, including explicit extraction and inter-floor reward selection. */
export function actExpedition(run: Expedition, action: ExpeditionAction): Expedition {
  if (run.phase === 'lost' || run.phase === 'won' || run.phase === 'retreated') return run
  if (action.type === 'retreat') return { ...run, phase: 'retreated' }
  if (action.type === 'relic') return takeRelic(run, action.relic)
  if (run.phase !== 'exploring') return run

  switch (action.type) {
    case 'reveal':
      return revealFrontier(run, action.index)
    case 'move':
      return movePlayer(run, action.index)
    case 'flag': {
      if (run.walls.includes(action.index)) return run
      const game = act(run.game, { type: 'flag', index: action.index })
      return game === run.game ? run : { ...run, game, steps: run.steps + 1 }
    }
    case 'scan':
      if (
        !Number.isInteger(action.row) ||
        action.row < 0 ||
        action.row >= 9 ||
        run.scans === 0 ||
        run.scannedRows.includes(action.row)
      )
        return run
      return {
        ...run,
        scans: run.scans - 1,
        scannedRows: [...run.scannedRows, action.row],
        steps: run.steps + 1,
      }
    case 'probe': {
      if (run.probes === 0 || !Number.isInteger(action.row) || action.row < 0 || action.row >= 9)
        return run
      const index = [...frontierCells(run)].find(
        (candidate) => Math.floor(candidate / 9) === action.row && !run.game.cells[candidate]?.mine,
      )
      if (index === undefined) return run
      // Tools reveal information at a distance; they never teleport the character.
      return {
        ...run,
        game: revealDungeon(run, index),
        probes: run.probes - 1,
        steps: run.steps + 1,
      }
    }
  }
}

/** Settle secured loot: success/extraction retain everything, defeat retains a bounded fraction. */
export function expeditionEarnings(run: Expedition): number {
  if (run.phase === 'won') return run.loot + 30
  if (run.phase === 'retreated') return run.loot
  if (run.phase === 'lost')
    return Math.floor(run.loot * (run.relics.includes('salvage') ? 0.75 : 0.5))
  return 0
}
