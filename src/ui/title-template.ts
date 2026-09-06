import { milestoneProgress, ownedTitles } from '../game/milestones.js'
import { milestoneCopy } from './milestone-copy.js'
import { battleText } from './combat-build-copy.js'
import type { Camp } from '../types/variants.js'
import type { Language } from '../types/localization.js'

export function titleTemplate(language: Language, camp: Camp): string {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const titles = ownedTitles(camp)
  const selected = milestoneProgress(camp).title
  const name =
    selected && titles.includes(selected)
      ? milestoneCopy(language, selected).name
      : t('Choose a title', '佩戴称号', '称号を選ぶ')
  return `<details class="title-cabinet"><summary><span class="title-emblem" aria-hidden="true">✦</span><span><small>${t('Expedition title', '远征称号', '遠征の称号')}</small><strong>${name}</strong></span><span aria-hidden="true">⌄</span></summary><div class="title-options"><p>${t('Earn titles by claiming achievements.', '领取成就，解锁对应称号。', '実績を受領して称号を獲得。')}</p>${titles.map((id) => `<button data-control="equip-title:${id}" aria-pressed="${selected === id}">✦ ${milestoneCopy(language, id).name}</button>`).join('')}${titles.length ? `<button data-control="equip-title:none" aria-pressed="${!selected}">${t('No title', '不佩戴', '称号なし')}</button>` : ''}</div></details>`
}
