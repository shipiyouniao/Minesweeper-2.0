import { upgradeCost } from './camp-progression.js'
import { enterEncounter, isEncounterFloor } from './encounter-roster.js'
import { occupied } from './dungeon-occupancy.js'
import { actBattle } from './battle-turns.js'
import { shareMirrorKnowledge } from './mirror-state.js'
import { professionResources, professionOfferCount } from './professions.js'
import { useProfessionSkill } from './profession-skills.js'
import {
  TREASURE_SUPPLIES,
  PURSE_SUPPLIES,
  EXIT_SUPPLIES,
  expeditionReward,
} from './expedition-rewards.js'
import {
  COMBAT_EQUIPMENT,
  damageExpedition,
  healExpedition,
  startingHealth,
  parseCombatEquipment,
} from './combat-build.js'
import { relicPool } from './relic-packs.js'
import { applyDiscoveryRelics, applyDamageRelics, applyTreasureRelics } from './relic-effects.js'
import { applyToolRelics, recordTravel } from './exploration-relics.js'
import { generateDungeon } from './dungeon-generator.js'
import { probeDungeon, scanDungeon, scoutExit } from './dungeon-discovery.js'
import { act } from './engine.js'
import { revealDungeon } from './dungeon-reveal.js'
import { chordExpedition } from './dungeon-chord.js'
import { adjacentSteps, shuffled } from './variant-board.js'
import { approachPath, walkingPath } from './dungeon-path.js'
import { expeditionConfig, expeditionFloors } from './variant-difficulty.js'
import type {
  Camp,
  Departure,
  Equipment,
  Expedition,
  ExpeditionAction,
  ExitIntent,
  Profession,
  Relic,
  Upgrade,
} from '../types/variants.js'

export { upgradeCost, UPGRADES } from './camp-progression.js'

export const EMPTY_CAMP: Camp = { supplies: 0, upgrades: [], completed: 0 }
export const EQUIPMENT: readonly Equipment[] = ['probe', 'scanner', 'guard', ...COMBAT_EQUIPMENT]

/** Reserve two points for shields and heavy combat gear; other equipment costs one. */
export function equipmentCost(equipment: Equipment): number {
  return equipment === 'guard' ||
    equipment === 'steel-blade' ||
    equipment === 'plated-vest' ||
    equipment === 'field-boots'
    ? 2
    : 1
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
    equipment.every(
      (item) => !parseCombatEquipment(item) || camp.upgrades.includes(parseCombatEquipment(item)!),
    ) &&
    // Do not spend loadout points on protection already at the departure cap.
    (!equipment.includes('guard') || professionResources(profession).shields < 2) &&
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
  const layout = generateDungeon(seed, config.mines, config.width, config.height)
  return {
    ...layout,
    encounter: null,
    departure,
    floor,
    player: layout.entrance,
    travelled: [layout.entrance],
    priorTravel: 0,
    collected: [],
    relics: [],
    floorTriggers: [],
    runTriggers: [],
    skillUsed: false,
    offers: [],
    scannedRows: [],
    confirmedMines: [],
    triggeredMines: [],
    surveyedCells: [],
    probeReport: null,
    probes: 0,
    scans: 0,
    health: startingHealth(departure),
    maxHealth: startingHealth(departure),
    shields: 0,
    loot: 0,
    steps: 0,
    phase: 'exploring',
  }
}

/** Start a run with bounded career tools and the selected equipment allocation. */
export function createExpedition(departure: Departure): Expedition {
  const run = createFloor(departure, 1)
  const resources = professionResources(departure.profession)

  return {
    ...run,
    probes: resources.probes + Number(departure.equipment.includes('probe')),
    scans: resources.scans + Number(departure.equipment.includes('scanner')),
    shields: Math.min(2, resources.shields + Number(departure.equipment.includes('guard'))),
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
        !occupied(run, other) &&
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
      if (!occupied(run, other) && run.game.cells[other]?.visibility === 'hidden')
        frontier.add(other)
    }
  }
  return frontier
}

/** Award treasures physically visited along this walk; revealing one does not collect it. */
function collectTreasures(run: Expedition, path: readonly number[]): Expedition {
  // Append new chests in walking order so first-chest effects follow the actual route.
  const collected = [
    ...new Set([...run.collected, ...path.filter((index) => run.treasures.includes(index))]),
  ]
  const fresh = collected.filter((index) => !run.collected.includes(index)).length

  return applyTreasureRelics(
    run,
    recordTravel(
      {
        ...run,
        collected,
        loot:
          run.loot + fresh * (run.relics.includes('purse') ? PURSE_SUPPLIES : TREASURE_SUPPLIES),
      },
      path,
    ),
  )
}

/** Offer distinct unowned relics within the career's limit, deterministically for this floor. */
function relicOffers(run: Expedition): Relic[] {
  const pool = relicPool(run.departure)

  return shuffled(
    pool.filter((relic) => !run.relics.includes(relic)),
    run.departure.seed ^ run.floor,
  ).slice(0, professionOfferCount(run.departure))
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
    const vitality = damageExpedition(approached, 5)
    const reacted = applyDamageRelics(approached, { ...approached, ...vitality }, index)
    const survived = reacted.health > 0

    // Survival confirms the hazard, never erases it or moves the player onto it.
    return {
      ...reacted,
      triggeredMines: [...new Set([...reacted.triggeredMines, index])],
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

  // A chest reached on the approach may have surveyed clues; preserve those discoveries.
  const game = revealDungeon(approached, index)
  return collectTreasures(
    {
      ...approached,
      game,
      player: index,
      phase: game.phase === 'lost' ? 'lost' : 'exploring',
      steps: run.steps + 1,
    },
    [index],
  )
}

/** Walk through known floor cells; the action orchestrator owns explicit stair entry. */
function movePlayer(run: Expedition, index: number): Expedition {
  const path = walkingPath(run, index)
  if (!path || (path.length === 1 && index !== run.exit)) return run
  return collectTreasures({ ...run, player: index, steps: run.steps + 1 }, path)
}

/** Commit an exit reward only for a living explorer that actually reached the stairs. */
function finishAtExit(run: Expedition): Expedition {
  if (run.phase !== 'exploring' || run.player !== run.exit) return run
  if (!run.encounter && isEncounterFloor(run)) return enterEncounter(run)
  return completeFloor(run)
}

/** Grant one ordinary exit payment after an unguarded exit or a defeated guardian. */
function completeFloor(run: Expedition): Expedition {
  return {
    ...run,
    // Leaving exploration makes this recovery a one-time reward, including the final exit.
    health: healExpedition(run, 1).health,
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

  if (relics.includes('compass')) result = scoutExit(result)

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
    case 'skill':
      return useProfessionSkill(run)
    case 'reveal':
      return revealFrontier(run, action.index)
    case 'move':
      return movePlayer(run, action.index)
    case 'mark-safe':
    case 'flag': {
      if (
        occupied(run, action.index) ||
        run.confirmedMines.includes(action.index) ||
        run.surveyedCells.includes(action.index)
      )
        return run
      const game = act(run.game, { type: action.type, index: action.index })
      return game === run.game ? run : { ...run, game, steps: run.steps + 1 }
    }
    case 'sweep':
      return scanDungeon(run, action.row)
    case 'probe':
      return probeDungeon(run, action.index)
    default:
      return run
  }
}

/** Apply the accepted intent, then process each newly earned discovery reaction once. */
export function actExpedition(run: Expedition, action: ExpeditionAction): Expedition {
  if (action.type === 'chord') return chordExpedition(run, action.index, revealForBatch)
  return applyExpedition(run, action, 'enter')
}

/** Retain normal movement, damage and discovery while requiring an explicit stair entry. */
function revealForBatch(run: Expedition, action: ExpeditionAction): Expedition {
  return applyExpedition(run, action, 'stay')
}

/** Share post-action reactions between direct actions and each quick-open reveal. */
function applyExpedition(
  run: Expedition,
  action: ExpeditionAction,
  exitIntent: ExitIntent,
): Expedition {
  let next =
    run.phase === 'boss'
      ? actBattle(run, action, transitionExpedition)
      : transitionExpedition(run, action)

  if (
    exitIntent === 'enter' &&
    run.phase === 'exploring' &&
    next !== run &&
    (action.type === 'move' || action.type === 'reveal') &&
    action.index === run.exit
  )
    next = finishAtExit(next)

  // Combat completion is the only way to collect the guarded floor's ordinary exit reward.
  if (next.phase === 'boss' && next.encounter?.health === 0) {
    next = completeFloor({
      ...next,
      health: next.maxHealth,
      shields: Math.min(2, next.shields + 1),
    })
  }
  return shareMirrorKnowledge(applyDiscoveryRelics(run, applyToolRelics(run, next, action), action))
}

/** Settle secured loot: success/extraction retain everything, defeat retains a bounded fraction. */
export function expeditionEarnings(run: Expedition): number {
  return expeditionReward(run).total
}
