import { placedBoard } from './variant-board.js'
import { combatStats } from './combat-build.js'
import { bastionIntent } from './tactical-intents.js'
import type { DungeonLayout } from '../types/dungeon-generation.js'
import type { Expedition } from '../types/variants.js'

/** Authored once, including the two defense controls and the player's truthful opening. */
export const GUARDIAN_ROWS: readonly string[] = [
  '.*.......*...',
  '.........***.',
  '.*...*.*.....',
  'B.....*....**',
  '.............',
  '..*....*..*..',
  '....*..*.....',
  '...*.........',
  '**...*.......',
  '#*.....S.*..*',
  '##*..*...*...',
]
export const GUARDIAN_PYLONS: readonly number[] = [41, 19]
const OPENING: readonly number[] = [97, 98, 99, 110, 111, 112, 123, 124, 125, 136, 137, 138]

/** Rebuild ordinary eight-neighbor clues from fixed hazards; the guardian occupies safe ground. */
export function guardianLayout(): DungeonLayout {
  const symbols = GUARDIAN_ROWS.join('')
  const mines = new Set([...symbols].flatMap((symbol, index) => (symbol === '*' ? [index] : [])))
  const entrance = symbols.indexOf('S')
  const exit = symbols.indexOf('B')
  const walls = [...symbols].flatMap((symbol, index) =>
    symbol === '#' || symbol === 'B' ? [index] : [],
  )
  const game = placedBoard(
    { width: GUARDIAN_ROWS[0]!.length, height: GUARDIAN_ROWS.length, mines: mines.size },
    mines,
    0,
    entrance,
  )

  return {
    game: {
      ...game,
      cells: game.cells.map((cell, index) => ({
        ...cell,
        visibility: OPENING.includes(index) ? 'revealed' : 'hidden',
      })),
    },
    entrance,
    exit,
    walls,
    treasures: [],
  }
}

/** Enter the authored final floor with the actual equipment and two selected floor relics. */
export function enterChapterGuardian(run: Expedition): Expedition {
  if (run.departure.campaign !== 'northwest-bastion-v1' || run.floor !== 3) return run
  return {
    ...run,
    phase: 'boss',
    encounter: {
      kind: 'bastion',
      pattern: 'pursuit',
      priorDiscoveries: 0,
      boss: run.exit,
      health: 40,
      maxHealth: 40,
      lastDamage: 0,
      turn: 1,
      points: combatStats(run).actions,
      braced: false,
      turnTriggers: [],
      event: 'entered',
      pylons: GUARDIAN_PYLONS.map((index) => ({ index, active: true })),
      mechanisms: GUARDIAN_PYLONS.map((index, order) => ({
        index,
        active: true,
        effect: order === 0 ? 'weaken' : 'extend',
      })),
      exposedUntil: 0,
      intent: {
        ...bastionIntent(run.game.config, run.walls, run.exit, run.entrance, 1),
        damage: 5,
      },
    },
  }
}
