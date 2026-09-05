import { neighbors } from './engine.js'
import { adjacentSteps } from './variant-board.js'
import { shuffled } from './variant-board.js'
import { combatStats, hasCombatBuild } from './combat-build.js'
import type { Expedition } from '../types/variants.js'
import type { BroodEncounter, BroodOrder } from '../types/tactical.js'

/** Use only revealed safe lanes; reserve destinations so two hatchlings never overlap. */
function hatchlingStep(run: Expedition, origin: number, reserved: ReadonlySet<number>): number {
  const encounter = run.encounter
  if (encounter?.kind !== 'brood') return origin
  const parents = new Map<number, number>([[origin, origin]])
  const queue = [origin]
  for (const current of queue) {
    if (adjacentSteps(run.game, current).includes(run.player)) {
      if (hasCombatBuild(run.departure)) {
        const path = [current]
        while (path[0] !== origin) path.unshift(parents.get(path[0]!) ?? origin)
        return path[Math.min(2, path.length - 1)]!
      }
      let next = current
      while (parents.get(next) !== origin && next !== origin) next = parents.get(next) ?? origin
      return next
    }
    for (const index of adjacentSteps(run.game, current)) {
      const cell = run.game.cells[index]
      if (
        parents.has(index) ||
        reserved.has(index) ||
        index === run.player ||
        run.walls.includes(index) ||
        (hasCombatBuild(run.departure) && encounter.nests.includes(index)) ||
        encounter.webs.includes(index) ||
        encounter.eggs.some((egg) => egg.index === index) ||
        (encounter.hatchlings.includes(index) && index !== origin) ||
        !cell ||
        cell.mine ||
        cell.visibility !== 'revealed'
      )
        continue
      parents.set(index, current)
      queue.push(index)
    }
  }
  return origin
}

/** Recompute the displayed union after interception, keeping each surviving source's forecast frozen. */
export function broodIntent(encounter: BroodEncounter): BroodEncounter {
  const targets = [
    ...new Set([
      ...encounter.queenTargets,
      ...encounter.orders
        .filter((order) => encounter.hatchlings.includes(order.from))
        .flatMap((order) => order.targets),
    ]),
  ]
  return {
    ...encounter,
    intent: { kind: 'swarm', targets, damage: encounter.destroyedNests ? 5 : 1 },
  }
}

/** Announce one committed swarm step and a queen burst every third turn; waiting never advances it. */
export function forecastBrood(run: Expedition): Expedition {
  const encounter = run.encounter
  if (encounter?.kind !== 'brood') return run
  const reserved = new Set<number>()
  const orders: BroodOrder[] = encounter.hatchlings.map((from) => {
    const to = hatchlingStep(run, from, reserved)
    reserved.add(to)
    return {
      from,
      to,
      targets: [to, ...adjacentSteps(run.game, to)].filter((index) => !run.walls.includes(index)),
    }
  })
  const queenTargets =
    encounter.turn % (hasCombatBuild(run.departure) && encounter.nests.length === 0 ? 2 : 3) === 0
      ? [run.player, ...neighbors(run.game.config, run.player)].filter(
          (index) => !run.walls.includes(index),
        )
      : []
  return { ...run, encounter: broodIntent({ ...encounter, orders, queenTargets }) }
}

/** Advance survivors, hatch visible eggs, then place bounded replacement eggs on free nest squares. */
export function advanceBrood(run: Expedition): Expedition {
  const encounter = run.encounter
  if (encounter?.kind !== 'brood' || run.phase !== 'boss') return run
  const hatchlings = encounter.orders
    .filter((order) => encounter.hatchlings.includes(order.from))
    .map((order) => (order.to === run.player ? order.from : order.to))
  const eggs = encounter.eggs
    .filter((egg) => egg.turns > 1)
    .map((egg) => ({ ...egg, turns: egg.turns - 1 }))
  for (const egg of encounter.eggs) {
    if (egg.turns === 1 && hatchlings.length < 3) hatchlings.push(egg.index)
  }
  // At most three living creatures plus eggs. Occupied nests never displace the player or another entity.
  if (encounter.turn % 3 === 0) {
    const sites = hasCombatBuild(run.departure)
      ? shuffled(
          [...new Set(encounter.nests.flatMap((nest) => neighbors(run.game.config, nest)))].filter(
            (index) =>
              run.game.cells[index]?.visibility === 'revealed' &&
              !run.game.cells[index]?.mine &&
              !run.walls.includes(index) &&
              !encounter.webs.includes(index) &&
              !encounter.nests.includes(index),
          ),
          run.departure.seed ^ encounter.turn,
        )
      : encounter.nests
    for (const index of sites) {
      if (eggs.length + hatchlings.length >= 3) break
      if (
        index !== run.player &&
        !hatchlings.includes(index) &&
        !eggs.some((egg) => egg.index === index)
      )
        eggs.push({ index, turns: 2 })
    }
  }
  const result: Expedition = {
    ...run,
    encounter: {
      ...encounter,
      hatchlings,
      eggs,
      turn: encounter.turn + 1,
      points: 3,
      braced: false,
      turnTriggers: [],
      ...(hasCombatBuild(run.departure)
        ? { health: Math.min(encounter.maxHealth, encounter.health + encounter.nests.length * 3) }
        : {}),
    },
  }
  return forecastBrood({
    ...result,
    encounter: {
      ...result.encounter!,
      points: hasCombatBuild(run.departure) ? combatStats(result).actions : 3,
    },
  })
}

/** Adjacent clearing always costs one AP, changes occupancy only, and never spends information tools. */
export function clearBrood(run: Expedition, index: number): Expedition {
  const encounter = run.encounter
  if (encounter?.kind !== 'brood') return run
  const event = encounter.webs.includes(index)
    ? 'web-cut'
    : encounter.eggs.some((egg) => egg.index === index)
      ? 'egg-crushed'
      : 'hatchling-cleared'
  return {
    ...run,
    encounter: broodIntent({
      ...encounter,
      event,
      webs: encounter.webs.filter((cell) => cell !== index),
      eggs: encounter.eggs.filter((egg) => egg.index !== index),
      hatchlings: encounter.hatchlings.filter((cell) => cell !== index),
    }),
  }
}
