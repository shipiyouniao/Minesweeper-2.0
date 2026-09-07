import { message } from '../i18n.js'
import { spriteImage } from './dungeon-sprites.js'
import { mirrorDefense, mirrorName } from './mirror-copy.js'

import type { Language } from '../types/localization.js'
import type { MirrorEncounter } from '../types/mirror.js'

/** Show separate health pools and defense states with distinct generated character artwork. */
export function mirrorHeader(language: Language, encounter: MirrorEncounter): string {
  return `<div class="mirror-heading"><h3>${message(language, 'mirror-template.mirror-twins')}</h3><div class="mirror-enemies">${(
    ['dawn', 'dusk'] as const
  )
    .map(
      (side) =>
        `<div class="mirror-enemy ${encounter.active === side ? 'is-active' : ''} ${encounter[side].health === 0 ? 'is-defeated' : ''}" data-realm="${side}">${spriteImage(side === 'dawn' ? 'mirror-dawn' : 'mirror-dusk')}<div><strong class="mirror-enemy-name">${mirrorName(language, side)}</strong><span class="mirror-enemy-health">${encounter[side].health}/${encounter[side].maxHealth}</span><p>${mirrorDefense(language, encounter, side)}</p></div></div>`,
    )
    .join(
      '',
    )}</div><p class="mirror-beat">${encounter.turn % 3 === 0 ? message(language, 'mirror-template.recharging-no-enemy-attacks-this-turn') : message(language, 'mirror-template.attacks-resolve-at-end-turn-both-recharge')}</p></div>`
}
