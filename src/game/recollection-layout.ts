import { generateDungeon } from './dungeon-generator.js'
import { adjacentSteps, shuffled } from './variant-board.js'
import { neighbors, randomIndex } from './engine.js'
import { planRecollectionPower, placeRecollectionPower } from './recollection-network.js'
import type { Config } from '../types/game.js'
import type { DungeonLayout } from '../types/dungeon-generation.js'
import type {
  RecollectionFloor,
  RecollectionLayout,
  RecollectionSelection,
} from '../types/recollection.js'

/** Rotate the selected families with a seeded offset, retaining variety even in short runs. */
export function recollectionFloorKind(
  selection: RecollectionSelection,
  seed: number,
  floor: number,
): RecollectionFloor {
  const kind = shuffled(selection.floors, seed ^ 0x7c11)[(floor - 1) % selection.floors.length]
  if (!kind) throw new Error('A recollection needs a selected floor family')
  return kind
}

/** Measure physical routes, so distant controls cannot spawn on isolated islands. */
function floorDistances(layout: DungeonLayout): ReadonlyMap<number, number> {
  const distance = new Map([[layout.entrance, 0]])
  const queue = [layout.entrance]
  for (const index of queue) {
    for (const next of adjacentSteps(layout.game, index)) {
      if (distance.has(next) || layout.walls.includes(next) || layout.game.cells[next]?.mine)
        continue
      distance.set(next, distance.get(index)! + 1)
      queue.push(next)
    }
  }
  return distance
}

/** Choose readable controls along reachable paths without replacing mine truth or floor numbers. */
function mechanismSites(layout: DungeonLayout, seed: number): readonly number[] {
  const distances = floorDistances(layout)
  const candidates = shuffled(
    [...distances.keys()].filter(
      (index) =>
        index !== layout.entrance &&
        index !== layout.exit &&
        layout.game.cells[index]!.adjacent > 0 &&
        neighbors(layout.game.config, index).every((near) => !layout.walls.includes(near)),
    ),
    seed ^ 0x41c017,
  )
  // Every control requires a real numbered neighborhood; prefer covered, distant clues.
  return candidates.sort((left, right) => {
    /** Prefer a covered clue before considering walking distance. */
    const score = (index: number): number =>
      Number(layout.game.cells[index]!.visibility === 'hidden') * 100 + (distances.get(index) ?? 0)
    return score(right) - score(left)
  })
}

/** Spread controls across the minefield instead of clustering every objective around one clue. */
function spreadMechanisms(layout: DungeonLayout, seed: number, count: number): readonly number[] {
  const candidates = [...mechanismSites(layout, seed)]
  const selected: number[] = []
  const width = layout.game.config.width
  while (selected.length < count) {
    /** Distance is measured against the closest chosen control, with seeded ties retained. */
    const score = (index: number): number =>
      Math.min(
        ...selected.map(
          (other) =>
            Math.abs((index % width) - (other % width)) +
            Math.abs(Math.floor(index / width) - Math.floor(other / width)),
        ),
      ) *
        100 +
      Number(layout.game.cells[index]!.visibility === 'hidden') * 10
    const chosen =
      selected.length === 0
        ? candidates[0]
        : candidates.reduce((best, index) => (score(index) > score(best) ? index : best))
    if (chosen === undefined) throw new Error('Accepted terrain must contain all mechanism sites')
    selected.push(chosen)
    candidates.splice(candidates.indexOf(chosen), 1)
  }
  return selected
}

/** Keep the original treasure budget when a control takes over a previously selected chest cell. */
function relocateTreasures(
  layout: DungeonLayout,
  controls: readonly number[],
  seed: number,
): readonly number[] {
  const kept = layout.treasures.filter((index) => !controls.includes(index))
  const choices = shuffled(
    [...floorDistances(layout)]
      .filter(
        ([index, distance]) =>
          index !== layout.exit &&
          distance >= 3 &&
          !controls.includes(index) &&
          !kept.includes(index),
      )
      .map(([index]) => index),
    seed ^ 0x73ea5,
  )
  return [...kept, ...choices.slice(0, layout.treasures.length - kept.length)]
}

/** Add first-chapter mechanisms to freshly generated terrain, never reuse an authored campaign board. */
export function generateRecollectionFloor(
  kind: RecollectionFloor,
  seed: number,
  config: Config,
): RecollectionLayout {
  if (kind === 'ordinary') return generateDungeon(seed, config.mines, config.width, config.height)
  const next = randomIndex(seed ^ 0x7e1a9)
  const plan = kind === 'routing' ? planRecollectionPower(seed, config.width) : null
  const count = plan
    ? plan.junctions.length + plan.receivers.length
    : config.width <= 9
      ? 2 + next(2)
      : config.width <= 13
        ? 2 + next(3)
        : 3 + next(3)
  const layout = generateDungeon(
    seed,
    config.mines,
    config.width,
    config.height,
    (candidate) => mechanismSites(candidate, seed).length >= count,
  )
  const controls = spreadMechanisms(layout, seed, count)
  const terrain = {
    ...layout,
    treasures: relocateTreasures(layout, controls, seed),
  }
  if (kind === 'relay')
    return {
      ...terrain,
      // All relays jointly release the stairs. Their approach routes stay traversable.
      circuits: {
        relays: controls.map((index) => ({
          index,
          gate: layout.exit,
          optional: false,
          active: true,
        })),
        record: null,
        recordTaken: false,
      },
    }

  return {
    ...terrain,
    power: placeRecollectionPower(plan!, controls),
  }
}
