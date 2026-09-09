import { connectedFloor } from './dungeon-path.js'
import { placedBoard } from './variant-board.js'
import { buildStoryBoard } from './story.js'
import type { DungeonLayout } from '../types/dungeon-generation.js'

/** Three fixed layouts with staggered mine clusters and caches on separate routes. */
export const CAMPAIGN_FLOORS: readonly (readonly string[])[] = [
  [
    '....*....',
    '.S.*.*...',
    '.........',
    '...*..T..',
    '.....*...',
    '.*......*',
    '........*',
    '.*T...*E.',
    '*.......*',
  ],
  [
    '.T...*.S.',
    '..*......',
    '.........',
    '**...*...',
    '*......*.',
    '.....*..*',
    '....*...*',
    '.E..*..T.',
    '.....**..',
  ],
  [
    '.*....*..',
    '........*',
    '.E.....T.',
    '*.*....*.',
    '*........',
    '....**...',
    '.*T*.....',
    '.**.*....',
    '....*.S..',
  ],
]

/** Rebuild hidden terrain from content rather than a generator seed or serialized mine bits. */
export function campaignLayout(floor: number): DungeonLayout {
  const rows = CAMPAIGN_FLOORS[floor - 1]
  if (!rows) throw new RangeError('Unknown campaign floor')
  const board = buildStoryBoard({
    id: 'camp',
    rows,
    clue: null,
    safeClue: null,
    teachingMine: null,
    teachingSafe: null,
  })
  const mines = new Set(board.game.cells.flatMap((cell, index) => (cell.mine ? [index] : [])))
  const game = placedBoard(board.game.config, mines, 0, board.entrance)
  const reachable = connectedFloor(game, board.entrance)
  return {
    game: {
      ...game,
      phase: 'playing',
    },
    entrance: board.entrance,
    exit: board.exit,
    walls: game.cells.flatMap((cell, index) =>
      !cell.mine && !reachable.has(index) ? [index] : [],
    ),
    treasures: [...rows.join('')].flatMap((symbol, index) => (symbol === 'T' ? [index] : [])),
  }
}
