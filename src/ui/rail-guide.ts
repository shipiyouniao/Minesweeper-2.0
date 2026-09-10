import { message } from '../i18n.js'
import { guidanceStyles } from './guidance-styles.js'
import { cartImage, tomaImage } from './rail-view.js'
import type { Language } from '../types/localization.js'

/** Three illustrated steps explain clearance, reversible routing and the passenger's return trip. */
export function railGuide(language: Language): string {
  const pictures = [
    `<span>1</span><span>⚑</span><span>1</span><span>${cartImage()}</span><span>→ 1</span><span>?</span>`,
    `<span>⑂ A</span><span>→</span><span>▣ ✓</span><span>↶</span><span>${cartImage()}</span><span>⑂ B</span>`,
    `<span>${tomaImage()}</span><span>→</span><span>${cartImage()}</span><span>↶</span><span>→</span><span>⌂ ✓</span>`,
  ]
  return `<article class="battle-guide rail-guide ${guidanceStyles['battle-guide']}"><header class="battle-guide-hero ${guidanceStyles['battle-guide-hero']}">${cartImage()}<div><h3>${message(language, 'rail.title')}</h3><p>${message(language, 'rail.guide-intro')}</p></div></header><ol class="boss-picture-steps ${guidanceStyles['boss-picture-steps']}">${pictures.map((picture, i) => `<li><div class="rail-mini-board" aria-hidden="true">${picture}</div><p><b>${i + 1}</b> ${i === 0 ? message(language, 'rail.guide-clear') : i === 1 ? message(language, 'rail.guide-route') : message(language, 'rail.guide-rescue')}</p></li>`).join('')}</ol></article>`
}
