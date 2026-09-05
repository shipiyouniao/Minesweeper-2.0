import type { TacticalEncounter } from '../types/tactical.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'

/** Select the boss's own living, exposed or defeated artwork for both panel and board. */
export function bossSprite(encounter: TacticalEncounter): DungeonSprite {
  if (encounter.kind === 'magnetic') return 'magnetic-knight'
  if (encounter.kind === 'mirror')
    return encounter.active === 'dawn' ? 'mirror-dawn' : 'mirror-dusk'
  if (encounter.kind === 'brood') return encounter.health === 0 ? 'brood-defeated' : 'brood-queen'
  return encounter.health === 0
    ? 'bastion-defeated'
    : encounter.pylons.some((pylon) => pylon.active)
      ? 'bastion'
      : 'bastion-core'
}
