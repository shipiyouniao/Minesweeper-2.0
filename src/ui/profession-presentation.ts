import type { Profession } from '../types/variants.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'

/** Keep camp portraits and the walking pawn aligned with the saved profession. */
export function professionSprite(profession: Profession): DungeonSprite {
  switch (profession) {
    case 'explorer':
      return 'player'
    case 'surveyor':
      return 'surveyor'
    case 'engineer':
      return 'engineer'
  }
}
