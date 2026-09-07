import { progressionStyles } from './progression-styles.js'
import { milestoneProgress, ownedTitles } from '../game/milestones.js'
import { message } from '../i18n.js'
import { milestoneCopy } from './milestone-copy.js'

import type { Language } from '../types/localization.js'
import type { TitleId } from '../types/titles.js'
import type { Camp } from '../types/variants.js'
import { titleEffectCopy } from './title-copy.js'

/** Offer claimed achievement titles and a clear option without exposing unowned choices. */
export function titleTemplate(language: Language, camp: Camp, active?: TitleId | null): string {
  const titles = ownedTitles(camp)
  const selected = milestoneProgress(camp).title ?? null
  const name =
    selected && titles.includes(selected)
      ? milestoneCopy(language, selected).name
      : message(language, 'title-template.choose-a-title')
  const label = message(language, 'title-template.expedition-title')
  const none = message(language, 'title-template.no-title')
  const frozen =
    active !== undefined && active !== selected
      ? `<div class="active-title ${progressionStyles['active-title']}" data-active-title="${active ?? 'none'}"><strong>${message(language, 'title-template.this-expedition')} · ${active ? milestoneCopy(language, active).name : none}</strong>${active ? `<p>${titleEffectCopy(language, active)}</p>` : ''}</div>`
      : ''

  return `<div class="title-cabinet ${progressionStyles['title-cabinet']}"><span class="title-label ${progressionStyles['title-label']}" id="title-label">${label}</span><div class="title-choice ${progressionStyles['title-choice']}"><button class="title-trigger ${progressionStyles['title-trigger']}" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="title-options" aria-labelledby="title-label title-value" aria-describedby="title-effect"><span class="title-emblem ${progressionStyles['title-emblem']}" aria-hidden="true">✦</span><span id="title-value">${name}</span><span class="title-chevron ${progressionStyles['title-chevron']}" aria-hidden="true"></span></button><div class="title-options ${progressionStyles['title-options']}" id="title-options" role="menu" aria-label="${label}" hidden><button type="button" role="menuitemradio" data-control="equip-title:none" aria-checked="${!selected}" tabindex="-1"><span class="title-option-icon ${progressionStyles['title-option-icon']}" aria-hidden="true">—</span><span>${none}</span><span class="title-check ${progressionStyles['title-check']}" aria-hidden="true">✓</span></button>${titles.map((id) => `<button type="button" role="menuitemradio" data-control="equip-title:${id}" aria-checked="${selected === id}" tabindex="-1"><span class="title-option-icon ${progressionStyles['title-option-icon']}" aria-hidden="true">✦</span><span><strong>${milestoneCopy(language, id).name}</strong><small>${titleEffectCopy(language, id)}</small></span><span class="title-check ${progressionStyles['title-check']}" aria-hidden="true">✓</span></button>`).join('')}${titles.length ? '' : `<p class="title-empty ${progressionStyles['title-empty']}">${message(language, 'title-template.no-titles-earned-yet')}</p>`}</div></div><p class="title-effect ${progressionStyles['title-effect']}" id="title-effect">${selected ? titleEffectCopy(language, selected) : message(language, 'title-template.earn-titles-through-achievements')}${active !== undefined ? `<small>${message(language, 'title-template.changes-apply-next-departure')}</small>` : ''}</p>${frozen}</div>`
}
