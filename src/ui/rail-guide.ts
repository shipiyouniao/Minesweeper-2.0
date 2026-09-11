import { message } from '../i18n.js'
import { guidanceStyles } from './guidance-styles.js'
import { cartImage, railProp, tomaImage } from './rail-view.js'
import { spriteImage } from './dungeon-sprites.js'
import type { Language } from '../types/localization.js'

/** Connect real props with directional arrows, keeping labels outside the illustrated cells. */
function strip(cells: readonly string[], label: string): string {
  return `<figure class="rail-instruction-picture"><div class="rail-instruction-track" aria-hidden="true">${cells.map((cell, index) => `${index ? '<b class="rail-direction">→</b>' : ''}<span>${cell}</span>`).join('')}</div><figcaption>${label}</figcaption></figure>`
}

/** Each picture answers one practical question: clear, switch, press, then bring home. */
export function railGuide(language: Language): string {
  const pictures = [
    strip(
      [cartImage(), '1', '<span class="rail-covered">?</span>'],
      message(language, 'rail.diagram-clear'),
    ),
    `<figure class="rail-instruction-picture"><div class="rail-junction" aria-hidden="true"><span>${cartImage()}</span><b>→</b><span>${railProp('lever')}</span><div><span>↗ A</span><span>↘ B</span></div></div><figcaption>${message(language, 'rail.diagram-switch')}</figcaption></figure>`,
    strip(
      [
        `<span class="rail-cart-on-plate">${railProp('brake')}${cartImage()}</span>`,
        spriteImage('exit-closed'),
        spriteImage('exit'),
      ],
      message(language, 'rail.diagram-brake'),
    ),
    strip(
      [tomaImage(), cartImage(), spriteImage('entrance')],
      message(language, 'rail.diagram-home'),
    ),
  ]
  const instructions = [
    message(language, 'rail.guide-clear'),
    message(language, 'rail.guide-route'),
    message(language, 'rail.guide-brake'),
    message(language, 'rail.guide-rescue'),
  ]

  return `<article class="battle-guide rail-guide ${guidanceStyles['battle-guide']}"><header class="battle-guide-hero ${guidanceStyles['battle-guide-hero']}">${cartImage()}<div><h3>${message(language, 'rail.title')}</h3><p>${message(language, 'rail.guide-intro')}</p></div></header><ol class="boss-picture-steps ${guidanceStyles['boss-picture-steps']}">${pictures.map((picture, i) => `<li>${picture}<p><b>${i + 1}</b> ${instructions[i]}</p></li>`).join('')}</ol></article>`
}
