import { mirrorName, mirrorDefense } from './mirror-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { battleText } from './combat-build-copy.js'
import type { Language } from '../types/localization.js'
import type { MirrorEncounter } from '../types/mirror.js'

/** Show separate health pools and defense states with distinct generated character artwork. */
export function mirrorHeader(language: Language, encounter: MirrorEncounter): string {
  return `<div class="mirror-heading"><h3>${battleText(language, 'Mirror Twins', '镜像双子', '鏡像の双子')}</h3><div class="mirror-enemies">${(
    ['dawn', 'dusk'] as const
  )
    .map(
      (side) =>
        `<div class="mirror-enemy ${encounter.active === side ? 'is-active' : ''} ${encounter[side].health === 0 ? 'is-defeated' : ''}" data-realm="${side}">${spriteImage(side === 'dawn' ? 'mirror-dawn' : 'mirror-dusk')}<div><strong>${mirrorName(language, side)} · ${encounter[side].health}/${encounter[side].maxHealth}</strong><p>${mirrorDefense(language, encounter, side)}</p></div></div>`,
    )
    .join(
      '',
    )}</div><p class="mirror-beat">${encounter.turn % 3 === 0 ? battleText(language, 'Recharging · no enemy attacks this turn', '蓄能回合 · 双方本回合不攻击', '蓄力中 · このターンは敵の攻撃なし') : battleText(language, 'Attacks resolve at End turn · both recharge every third turn', '结束回合时结算攻击 · 每第三回合双方蓄能', 'ターン終了で攻撃判定 · 3ターンごとに両者が蓄力')}</p></div>`
}
