import { placedBoard, shuffled, adjacentSteps } from './variant-board.js'
import { neighbors } from './engine.js'
import { solveBattle } from './battle-arena.js'
import type { Config } from '../types/game.js'
import type { BattleLayout } from '../types/combat-build.js'

/** Protect a central bypass ring; accept only connected, publicly deducible safe terrain. */
export function generateClock(config: Config, seed: number): BattleLayout {
  const indices = Array.from({ length: config.width * config.height }, (_, index) => index)
  const boss = Math.floor(config.height / 2) * config.width + Math.floor(config.width / 2)
  const entrance = config.width + 1
  const protectedCells = new Set([
    boss,
    entrance,
    ...neighbors(config, boss),
    ...neighbors(config, entrance),
  ])
  for (let attempt = 0; attempt < 512; attempt++) {
    const draw = ((attempt < 256 ? seed : 0xc10c) + Math.imul(attempt % 256, 0x45d9f3b)) >>> 0
    const mines = new Set(
      shuffled(
        indices.filter((index) => !protectedCells.has(index)),
        draw,
      ).slice(0, config.mines),
    )
    const placed = placedBoard(config, mines, draw, entrance)
    if (adjacentSteps(placed, boss).some((index) => placed.cells[index]?.visibility === 'revealed'))
      continue

    const reached = new Set([entrance]),
      queue = [entrance]
    for (const index of queue)
      for (const other of adjacentSteps(placed, index)) {
        if (other !== boss && !mines.has(other) && !reached.has(other)) {
          reached.add(other)
          queue.push(other)
        }
      }

    if (!neighbors(config, boss).every((index) => reached.has(index))) continue

    const walls = indices.filter((index) => !mines.has(index) && !reached.has(index))
    const game = {
      ...placed,
      cells: placed.cells.map((cell, index) =>
        walls.includes(index) ? { ...cell, visibility: 'hidden' as const } : cell,
      ),
    }
    const solved = solveBattle(game, walls, entrance)
    if ([...reached].some((index) => solved.cells[index]?.visibility !== 'revealed')) continue

    const objectives = shuffled(
      [...reached].filter(
        (index) =>
          game.cells[index]?.visibility === 'hidden' &&
          game.cells[index]!.adjacent > 0 &&
          !protectedCells.has(index),
      ),
      draw ^ 0x51a7,
    ).slice(0, 3)
    if (objectives.length === 3) return { game, walls, entrance, boss, objectives }
  }

  throw new Error('No verified clock arena for the supported tier')
}
