import {
  upgradeCost,
  TREASURE_SUPPLIES,
  PURSE_SUPPLIES,
  EXIT_SUPPLIES,
  VICTORY_SUPPLIES,
} from './camp-progression.js'
import { damageVitality, healVitality } from './vitality.js'
import { hasExpeditionHealth } from './expedition-rules.js'
import { relicPool } from './relic-packs.js'
import { applyDiscoveryRelics, applyMineRelics, applyTreasureRelics } from './relic-effects.js'
import { generateDungeon } from './dungeon-generator.js'
import { probeDungeon, scanDungeon, scoutExit } from './dungeon-discovery.js'
import { act } from './engine.js'
import { revealDungeon } from './dungeon-reveal.js'
import { adjacentSteps, shuffled } from './variant-board.js'
import { approachPath, walkingPath } from './dungeon-path.js'
import { expeditionConfig, expeditionFloors } from './variant-difficulty.js'
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

export { upgradeCost, UPGRADES } from './camp-progression.js'

export const EMPTY_CAMP: Camp = { supplies: 0, upgrades: [], completed: 0 }
export const EQUIPMENT: readonly Equipment[] = ['probe', 'scanner', 'guard']

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

/** Build fresh terrain and reset floor-local discoveries without touching permanent resources. */
function createFloor(departure: Departure, floor: number): Expedition {
  const seed = (departure.seed + Math.imul(floor, 0x9e3779b9)) >>> 0
  const config = expeditionConfig(departure, floor)
  const layout = generateDungeon(
    seed,
    config.mines,
    departure.rules === 'original' ? 'compact' : 'flood',
    config.width,
    config.height,
  )
  return {
    ...layout,
    departure,
    floor,
    player: layout.entrance,
    collected: [],
    relics: [],
    floorTriggers: [],
    runTriggers: [],
    offers: [],
    scannedRows: [],
    confirmedMines: [],
    surveyedCells: [],
    probeReport: null,
    probes: 0,
    scans: 0,
    health: hasExpeditionHealth(departure) ? 2 : 1,
    maxHealth: hasExpeditionHealth(departure) ? 2 : 1,
    shields: 0,
    loot: 0,
    steps: 0,
    phase: 'exploring',
  }
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
  const found = new Set<number>([run.entrance])
  const queue = [run.entrance]

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

  return applyTreasureRelics(run, {
    ...run,
    collected,
    loot: run.loot + fresh * (run.relics.includes('purse') ? PURSE_SUPPLIES : TREASURE_SUPPLIES),
  })
}

/** Offer up to three distinct unowned relics, deterministically for this floor. */
function relicOffers(run: Expedition): Relic[] {
  const pool = relicPool(run.departure)

  return shuffled(
    pool.filter((relic) => !run.relics.includes(relic)),
    run.departure.seed ^ run.floor,
  ).slice(0, 3)
}

/** Approach a frontier and resolve damage without changing the mine layout or safe route. */
function revealFrontier(run: Expedition, index: number): Expedition {
  if (!frontierCells(run).has(index)) return run
  const path = approachPath(run, index)
  if (!path) return run
  const cell = run.game.cells[index]
  if (!cell) return run
  const approached = collectTreasures({ ...run, player: path.at(-1) ?? run.player }, path)

  if (cell.mine) {
    const vitality = damageVitality(approached, 1)
    const reacted = applyMineRelics(approached, { ...approached, ...vitality }, index)
    const survived = reacted.health > 0

    // Survival confirms the hazard, never erases it or moves the player onto it.
    // Historical departures have one HP, preserving their original lethal-hit behavior.
    return {
      ...reacted,
      game: survived
        ? reacted.game.cells[index]?.visibility === 'flagged'
          ? reacted.game
          : act(reacted.game, { type: 'flag', index })
        : revealDungeon(reacted, index),
      confirmedMines: survived
        ? [...new Set([...reacted.confirmedMines, index])]
        : reacted.confirmedMines,
      phase: survived ? 'exploring' : 'lost',
      steps: run.steps + 1,
    }
  }

  const game = revealDungeon(run, index)
  return finishAtExit(
    collectTreasures(
      {
        ...approached,
        game,
        player: index,
        phase: game.phase === 'lost' ? 'lost' : 'exploring',
        steps: run.steps + 1,
      },
      [index],
    ),
  )
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
    // Leaving exploration makes this recovery a one-time reward, including the final exit.
    health: hasExpeditionHealth(run.departure) ? healVitality(run, 1).health : run.health,
    loot: run.loot + EXIT_SUPPLIES,
    phase: run.floor === expeditionFloors(run.departure) ? 'won' : 'reward',
    offers: relicOffers(run),
  }
}

/** Carry the build between floors while resetting local clues, treasures and route geometry. */
function takeRelic(run: Expedition, relic: Relic): Expedition {
  if (run.phase !== 'reward' || !run.offers.includes(relic)) return run

  return advanceFloor(run, relic)
}

/** Continue an exhausted catalog without granting a duplicate relic or getting stuck. */
function advanceFloor(run: Expedition, relic?: Relic): Expedition {
  const relics = relic ? [...run.relics, relic] : run.relics
  const next = createFloor(run.departure, run.floor + 1)
  let result: Expedition = {
    ...next,
    relics,
    runTriggers: run.runTriggers,
    health: run.health,
    maxHealth: run.maxHealth,
    loot: run.loot,
    steps: run.steps,
    probes: Math.min(4, run.probes + Number(relics.includes('lantern'))),
    scans: Math.min(4, run.scans + Number(relics.includes('lens'))),
    shields: Math.min(2, run.shields + Number(relic === 'aegis')),
  }

  // Old journals keep their original visibility so later recorded flag/reveal actions remain valid.
  if (relics.includes('compass')) {
    result =
      run.departure.rules === 'original'
        ? { ...result, game: revealDungeon(result, result.exit) }
        : scoutExit(result)
  }

  return result
}

/** Pure expedition transition, including explicit extraction and inter-floor reward selection. */
function transitionExpedition(run: Expedition, action: ExpeditionAction): Expedition {
  if (run.phase === 'lost' || run.phase === 'won' || run.phase === 'retreated') return run
  if (action.type === 'retreat') return { ...run, phase: 'retreated' }
  if (action.type === 'descend')
    return run.phase === 'reward' && run.offers.length === 0 ? advanceFloor(run) : run
  if (action.type === 'relic') return takeRelic(run, action.relic)
  if (run.phase !== 'exploring') return run

  switch (action.type) {
    case 'reveal':
      return revealFrontier(run, action.index)
    case 'move':
      return movePlayer(run, action.index)
    case 'flag': {
      if (run.walls.includes(action.index) || run.confirmedMines.includes(action.index)) return run
      const game = act(run.game, { type: 'flag', index: action.index })
      return game === run.game ? run : { ...run, game, steps: run.steps + 1 }
    }
    case 'sweep':
      return scanDungeon(run, action.row)
    // Replay historical count-only scans exactly, so subsequent old flag actions stay valid.
    case 'scan':
      if (
        !Number.isInteger(action.row) ||
        action.row < 0 ||
        action.row >= run.game.config.height ||
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
    case 'probe':
      return probeDungeon(run, action.index)
  }
}

/** Apply the accepted intent, then process each newly earned discovery reaction once. */
export function actExpedition(run: Expedition, action: ExpeditionAction): Expedition {
  return applyDiscoveryRelics(run, transitionExpedition(run, action), action)
}

/** Settle secured loot: success/extraction retain everything, defeat retains a bounded fraction. */
export function expeditionEarnings(run: Expedition): number {
  if (run.phase === 'won') return run.loot + VICTORY_SUPPLIES
  if (run.phase === 'retreated') return run.loot
  if (run.phase === 'lost')
    return Math.floor(run.loot * (run.relics.includes('salvage') ? 0.75 : 0.5))
  return 0
}
