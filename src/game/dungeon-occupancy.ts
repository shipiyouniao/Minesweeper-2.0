import type { Expedition } from '../types/variants.js'

/** Dynamic occupants block walking separately from permanent terrain and hidden mines. */
export function occupied(run: Expedition, index: number): boolean {
  const encounter = run.encounter
  return (
    run.walls.includes(index) ||
    (encounter?.kind === 'brood' &&
      (encounter.webs.includes(index) ||
        encounter.hatchlings.includes(index) ||
        encounter.eggs.some((egg) => egg.index === index)))
  )
}
