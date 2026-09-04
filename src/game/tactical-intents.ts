import type { Config } from '../types/game.js'
import type { TacticalIntent } from '../types/tactical.js'

/** Snapshot an announced attack; later movement cannot retarget the current turn's danger. */
export function bastionIntent(
  config: Config,
  walls: readonly number[],
  boss: number,
  player: number,
  turn: number,
): TacticalIntent {
  const kind = turn % 3 === 1 ? 'row' : turn % 3 === 2 ? 'column' : 'cross'
  const origin = kind === 'cross' ? boss : player
  const row = Math.floor(origin / config.width)
  const column = origin % config.width
  const targets = Array.from({ length: config.width * config.height }, (_, index) => index).filter(
    (index) => {
      if (walls.includes(index)) return false
      const sameRow = Math.floor(index / config.width) === row
      const sameColumn = index % config.width === column
      return kind === 'row' ? sameRow : kind === 'column' ? sameColumn : sameRow || sameColumn
    },
  )
  return { kind, targets, damage: 1 }
}
