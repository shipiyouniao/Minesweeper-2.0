import { neighbors } from './engine.js'
import { adjacentSteps } from './variant-board.js'
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
  return { ...encounter, intent: { kind: 'swarm', targets, damage: 1 } }
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
    encounter.turn % 3 === 0
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
    for (const index of encounter.nests) {
      if (eggs.length + hatchlings.length >= 3) break
      if (
        index !== run.player &&
        !hatchlings.includes(index) &&
        !eggs.some((egg) => egg.index === index)
      )
        eggs.push({ index, turns: 2 })
    }
  }
  return forecastBrood({
    ...run,
    encounter: {
      ...encounter,
      hatchlings,
      eggs,
      turn: encounter.turn + 1,
      points: 3,
      braced: false,
      turnTriggers: [],
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
