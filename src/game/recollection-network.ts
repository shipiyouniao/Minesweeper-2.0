import { randomIndex } from './engine.js'
import { shuffled } from './variant-board.js'
import type { RecollectionFeed, RecollectionPowerPlan } from '../types/recollection.js'
import type { FloorPower, PowerFeed } from '../types/floor-power.js'

/** Grow a seeded forest: every selector has two useful branches and dependencies never cycle. */
export function planRecollectionPower(seed: number, width: number): RecollectionPowerPlan {
  const next = randomIndex(seed ^ 0x72c017)
  const count = width <= 9 ? 2 + next(2) : width <= 13 ? 2 + next(3) : 3 + next(2)
  const junctions: (RecollectionFeed | null)[] = [null]
  const terminals: RecollectionFeed[] = [
    { node: 0, branch: 0 },
    { node: 0, branch: 1 },
  ]
  const depths = [1]

  for (let node = 1; node < count; node++) {
    // The second node always introduces a dependency. Later nodes may start a second circuit.
    const independent =
      node > 1 && junctions.filter((input) => input === null).length < 2 && next(4) === 0
    const eligible = terminals.filter((feed) => depths[feed.node]! < 3)
    const input = independent ? null : eligible[next(eligible.length)]!
    if (input) terminals.splice(terminals.indexOf(input), 1)
    junctions.push(input)
    depths.push(input ? depths[input.node]! + 1 : 1)
    terminals.push({ node, branch: 0 }, { node, branch: 1 })
  }

  return { junctions, receivers: shuffled(terminals, seed ^ 0xe1ec7) }
}

/** Resolve abstract connections once; the existing power engine owns all later interactions. */
export function placeRecollectionPower(
  plan: RecollectionPowerPlan,
  sites: readonly number[],
): FloorPower {
  /** A feed references a real selector cell after placement, never an ordinal in gameplay. */
  const feed = (input: RecollectionFeed): PowerFeed => ({
    junction: sites[input.node]!,
    branch: input.branch,
  })
  return {
    purpose: 'restoration',
    junctions: plan.junctions.map((input, node) => ({
      index: sites[node]!,
      input: input ? feed(input) : null,
      selected: null,
    })),
    doors: [],
    receivers: plan.receivers.map((input, ordinal) => ({
      index: sites[plan.junctions.length + ordinal]!,
      input: feed(input),
      recorded: false,
    })),
  }
}
