import type { Vitality } from '../types/vitality.js'
import type { Language } from '../types/localization.js'
import { variantCopy } from './variant-copy.js'

/** Render health and shields together, with text equivalents for color and bar length. */
export function vitalityTemplate(
  language: Language,
  vitality: Vitality,
  legacy: boolean,
  showHint = true,
): string {
  const t = variantCopy(language)
  const value = `${vitality.health}/${vitality.maxHealth}`
  const shield = vitality.shields > 0 ? ` (+${vitality.shields})` : ''
  const description = `${t.health} ${value}, ${t.shields} ${vitality.shields}`

  return `<section class="vitality-panel ${vitality.health <= 1 ? 'vitality-low' : ''}" aria-label="${t.health}">
    <p class="vitality-heading"><span>${t.health}</span><strong aria-label="${description}">${value}<span class="vitality-shields">${shield}</span></strong></p>
    <meter class="vitality-bar" min="0" max="${vitality.maxHealth}" value="${vitality.health}" aria-label="${description}">${value}</meter>
    ${showHint ? `<p class="variant-note">${legacy ? t.legacyHealth : t.healthHint}</p>` : ''}
  </section>`
}
