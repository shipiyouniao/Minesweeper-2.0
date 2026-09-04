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
    case 'archaeologist':
    case 'alchemist':
    case 'sentinel':
      return profession
  }
}

/** Each career owns a distinct generated skill icon, independent from its walking portrait. */
export function professionSkillSprite(profession: Profession): DungeonSprite {
  switch (profession) {
    case 'explorer':
      return 'skill-explorer'
    case 'surveyor':
      return 'skill-surveyor'
    case 'engineer':
      return 'skill-engineer'
    case 'archaeologist':
      return 'skill-archaeologist'
    case 'alchemist':
      return 'skill-alchemist'
    case 'sentinel':
      return 'skill-sentinel'
  }
}
