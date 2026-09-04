import { campFunding } from '../game/camp-progression.js'
import type { Camp } from '../types/variants.js'
import type { Language } from '../types/localization.js'
import { upgradeCopy, variantCopy } from './variant-copy.js'

/** Show the next unlock's price and savings without estimating how many runs a player needs. */
export function campProgressTemplate(language: Language, camp: Camp): string {
  const t = variantCopy(language)
  const funding = campFunding(camp)
  if (!funding) return `<p class="variant-note">${t.campComplete}</p>`

  const number = new Intl.NumberFormat(language)
  const title = upgradeCopy(language, funding.upgrade).name
  const saved = number.format(funding.saved)
  const price = number.format(funding.price)
  const remaining = number.format(funding.remaining)
  const stage =
    funding.stage === 'early' ? t.campEarly : funding.stage === 'middle' ? t.campMiddle : t.campLate

  return `<section class="camp-funding" aria-label="${t.campGoal}">
    <p class="eyebrow">${t.campGoal} · ${stage}</p><h3>${title}</h3>
    <p class="funding-amount"><strong>${saved} / ${price}</strong><span>${t.supplies}</span></p>
    <progress max="${funding.price}" value="${funding.saved}" aria-label="${title}: ${saved} / ${price}">${funding.percent}%</progress>
    <p class="funding-summary"><span>${t.campRemaining.replace('{count}', remaining)}</span><strong>${funding.percent}%</strong></p>
    ${funding.remaining === 0 ? `<p class="variant-note">${t.campAffordable}</p>` : ''}
  </section>`
}
