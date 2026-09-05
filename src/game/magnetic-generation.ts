import { generateBattle } from './battle-arena.js'
import { adjacentSteps } from './variant-board.js'
import type { Config, Game } from '../types/game.js'
import type { BattleLayout } from '../types/combat-build.js'

/** Check all safe floor remains connected with a station occupied by the moving knight. */
function connectedWithout(game: Game, walls: readonly number[], blocked: number): boolean {
  const excluded = new Set([...walls, blocked])
  const safe = game.cells.flatMap((cell, index) =>
    !cell.mine && !excluded.has(index) ? [index] : [],
  )
  const allowed = new Set(safe)
  const start = safe[0]
  if (start === undefined) return false
  const reached = new Set([start])
  const queue = [start]
  for (const index of queue) {
    for (const next of adjacentSteps(game, index)) {
      if (reached.has(next) || !allowed.has(next)) continue
      reached.add(next)
      queue.push(next)
    }
  }
  return reached.size === safe.length
}

/** Reuse shuffled, publicly solvable arenas and reject stations that would create a choke point. */
export function generateMagnetic(config: Config, seed: number): BattleLayout {
  for (let attempt = 0; attempt < 64; attempt++) {
    const candidate = generateBattle(
      config,
      ((attempt < 32 ? seed : 0x4d6167) + Math.imul(attempt % 32, 0x9e3779b9)) >>> 0,
      2,
    )
    const terrain = candidate.walls.filter((index) => index !== candidate.boss)
    if (candidate.objectives.every((index) => connectedWithout(candidate.game, terrain, index)))
      return candidate
  }
  throw new Error('No connected magnetic arena for the supported tier')
}
