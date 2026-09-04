import type { Game } from './game.js'

/** Preserve old journal openings while new expeditions use normal blank-region expansion. */
export type DungeonOpening = 'compact' | 'flood'

/** Generated terrain and public landmarks, independent of run resources. */
export interface DungeonLayout {
  readonly game: Game
  readonly entrance: number
  readonly exit: number
  readonly walls: readonly number[]
  readonly treasures: readonly number[]
}
