import { milestoneProgress, ownedTitles } from '../game/milestones.js'
import { milestoneCopy } from './milestone-copy.js'
import { battleText } from './combat-build-copy.js'
import { titleEffectCopy } from './title-copy.js'
import type { TitleId } from '../types/titles.js'
import type { Camp } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** Offer claimed achievement titles and a clear option without exposing unowned choices. */
export function titleTemplate(language: Language, camp: Camp, active?: TitleId | null): string {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const titles = ownedTitles(camp)
  const selected = milestoneProgress(camp).title ?? null
  const name =
    selected && titles.includes(selected)
      ? milestoneCopy(language, selected).name
      : t('Choose a title', '佩戴称号', '称号を選ぶ')
  const label = t('Expedition title', '远征称号', '遠征の称号')
  const none = t('No title', '不佩戴', '称号なし')
  const frozen =
    active !== undefined && active !== selected
      ? `<div class="active-title" data-active-title="${active ?? 'none'}"><strong>${t('This expedition', '本局称号', '今回の称号')} · ${active ? milestoneCopy(language, active).name : none}</strong>${active ? `<p>${titleEffectCopy(language, active)}</p>` : ''}</div>`
      : ''

  return `<div class="title-cabinet"><span class="title-label" id="title-label">${label}</span><div class="title-choice"><button class="title-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="title-options" aria-labelledby="title-label title-value" aria-describedby="title-effect"><span class="title-emblem" aria-hidden="true">✦</span><span id="title-value">${name}</span><span class="title-chevron" aria-hidden="true"></span></button><div class="title-options" id="title-options" role="menu" aria-label="${label}" hidden><button type="button" role="menuitemradio" data-control="equip-title:none" aria-checked="${!selected}" tabindex="-1"><span class="title-option-icon" aria-hidden="true">—</span><span>${none}</span><span class="title-check" aria-hidden="true">✓</span></button>${titles.map((id) => `<button type="button" role="menuitemradio" data-control="equip-title:${id}" aria-checked="${selected === id}" tabindex="-1"><span class="title-option-icon" aria-hidden="true">✦</span><span><strong>${milestoneCopy(language, id).name}</strong><small>${titleEffectCopy(language, id)}</small></span><span class="title-check" aria-hidden="true">✓</span></button>`).join('')}${titles.length ? '' : `<p class="title-empty">${t('No titles earned yet', '还未获得称号', '獲得した称号はありません')}</p>`}</div></div><p class="title-effect" id="title-effect">${selected ? titleEffectCopy(language, selected) : t('Earn titles through achievements.', '完成成就获得称号。', '実績を達成して称号を獲得。')}${active !== undefined ? `<small>${t('Changes apply next departure.', '更换后，下次出发生效。', '変更は次の出発から有効。')}</small>` : ''}</p>${frozen}</div>`
}
