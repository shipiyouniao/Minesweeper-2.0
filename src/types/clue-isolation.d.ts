import type { Game } from './game.js'

/** Minimal public board surface shared by world mechanisms and expedition relays. */
export interface ClueBoard {
  readonly game: Game
  readonly walls: readonly number[]
}
