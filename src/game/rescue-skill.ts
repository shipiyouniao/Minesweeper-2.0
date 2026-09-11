import { occupied } from './dungeon-occupancy.js'
import type { Expedition } from '../types/variants.js'

/** A rescue rope follows a cleared straight corridor; it never discovers hidden terrain. */
export function rescueLandings(run: Expedition): number[] {
  const { width, height } = run.game.config
  const row = Math.floor(run.player / width)
  const column = run.player % width
  const landings: number[] = []

  for (const [dy, dx] of [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ] as const) {
    for (let distance = 1; distance <= 4; distance++) {
      const y = row + dy * distance
      const x = column + dx * distance
      if (x < 0 || y < 0 || x >= width || y >= height) break
      const index = y * width + x
      const cell = run.game.cells[index]!
      // Stop at the first obstruction; farther squares cannot be reached through it.
      if (
        cell.visibility !== 'revealed' ||
        cell.mine ||
        occupied(run, index) ||
        index === run.encounter?.boss
      )
        break
      if (distance >= 2) landings.push(index)
    }
  }
  return landings
}

/** Invalid targets are a complete no-op, including shields, steps and once-per-floor use. */
export function useRescueSkill(run: Expedition, index?: number): Expedition {
  if (index === undefined || !rescueLandings(run).includes(index)) return run
  return { ...run, player: index, shields: Math.min(2, run.shields + 1) }
}
