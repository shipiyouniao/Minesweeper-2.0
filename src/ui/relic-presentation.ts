import { RELIC_PACKS } from '../game/relic-packs.js'
import { combatSprite } from './combat-build-copy.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'
import type { Relic } from '../types/variants.js'

/** Link each reward to its theme illustration while names distinguish the two effects. */
export function relicSprite(relic: Relic): DungeonSprite {
  const pack = RELIC_PACKS.find((entry) => entry.relics.some((candidate) => candidate === relic))
  if (pack) return pack.id
  switch (relic) {
    case 'tempered-edge':
    case 'layered-armor':
    case 'tactics-hourglass':
      return combatSprite(relic)
    case 'lantern':
      return 'probe'
    case 'lens':
      return 'scanner'
    case 'aegis':
      return 'shield'
    case 'compass':
      return 'exit'
    default:
      return 'treasure'
  }
}
