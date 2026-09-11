import { icon } from '../icons.js'
import { message } from '../i18n.js'
import { spriteImage } from './dungeon-sprites.js'
import { guidanceStyles } from './guidance-styles.js'
import { observatoryImage, drainageImage, consoleImage } from './power-view.js'
import type { Language } from '../types/localization.js'
import type { FloorPower } from '../types/floor-power.js'

/** Explain device operation in the same illustrated modal used for boss encounters. */
export function powerGuide(language: Language, power: FloorPower): string {
  const drainage = power.purpose === 'drainage'
  const restoration = power.purpose === 'restoration'

  return `<article class="battle-guide power-guide ${guidanceStyles['battle-guide']}">
    <header class="battle-guide-hero ${guidanceStyles['battle-guide-hero']}">${restoration ? consoleImage() : drainage ? drainageImage() : observatoryImage()}<div><h3>${restoration ? message(language, 'finale.control-title') : drainage ? message(language, 'waterway.title') : message(language, 'ridge.title')}</h3><p>${restoration ? message(language, 'finale.guide-intro') : drainage ? message(language, 'waterway.guide-intro') : message(language, 'ridge.guide-intro')}</p></div></header>
    <ol class="boss-picture-steps ${guidanceStyles['boss-picture-steps']}">
      ${guideStep(1, message(language, 'ridge.guide-clear-title'), message(language, 'ridge.guide-clear'), cluePicture())}
      ${guideStep(2, message(language, 'ridge.guide-switch-title'), message(language, 'ridge.guide-switch'), routePicture(false, power.purpose))}
      ${guideStep(3, restoration ? message(language, 'finale.guide-title') : drainage ? message(language, 'waterway.guide-record-title') : message(language, 'ridge.guide-record-title'), restoration ? message(language, 'finale.guide-record') : drainage ? message(language, 'waterway.guide-record') : message(language, 'ridge.guide-record'), routePicture(true, power.purpose))}
    </ol>
    ${wiringPicture(language, power)}
    <p class="boss-cost-line ${guidanceStyles['boss-cost-line']}">${message(language, 'ridge.guide-upstream')}</p>
  </article>`
}

/** Preserve the floor's public upstream connections without exposing hidden board contents. */
function wiringPicture(language: Language, power: FloorPower): string {
  const connections = power.junctions.map((junction, ordinal) => {
    const source = junction.input
    const feed = source
      ? `${power.junctions.findIndex((entry) => entry.index === source.junction) + 1}${source.branch === 0 ? 'A' : 'B'}`
      : '⚡'

    return `<li><b class="power-guide-feed">${feed}</b><span aria-hidden="true">→</span>${spriteImage('bastion-pylon')}<span>${message(language, 'ridge.junction')} ${ordinal + 1}</span></li>`
  })

  return `<section class="power-guide-wiring"><h4>${message(language, 'ridge.guide-wiring')}</h4><ul>${connections.join('')}</ul></section>`
}

/** Keep each caption next to its illustration in both desktop and narrow layouts. */
function guideStep(number: number, title: string, text: string, picture: string): string {
  return `<li>${picture}<p><b>${number}</b><span><strong>${title}</strong>${text}</span></p></li>`
}

/** Decorative examples never expose actual hidden cells or register gameplay targets. */
function miniBoard(cells: readonly string[]): string {
  return `<div class="power-mini-board" aria-hidden="true">${cells.map((cell) => `<span>${cell}</span>`).join('')}</div>`
}

/** Show a solved neighborhood with one flagged mine and truthful ordinary clues. */
function cluePicture(): string {
  return miniBoard([
    '1',
    icon('flag'),
    '1',
    '1',
    `${spriteImage('bastion-pylon')}<small>1</small>`,
    '1',
    spriteImage('player'),
    '',
    '',
  ])
}

/** The same branch labels show the change from recording on A to opening the gate on B. */
function routePicture(recorded: boolean, purpose: FloorPower['purpose']): string {
  const drainage = purpose === 'drainage'
  const restoration = purpose === 'restoration'
  const instrument = `${restoration ? consoleImage() : drainage ? drainageImage() : observatoryImage()}<small>${recorded ? '✓ ' : ''}1A</small>`
  const gate = `${recorded ? '<i class="power-open">⌁</i>' : spriteImage('bastion-core')}<small>1B</small>`

  return miniBoard([
    '',
    '↗',
    `<i class="${recorded ? 'power-mini-off' : ''}">${instrument}</i>`,
    spriteImage('player'),
    `${spriteImage('bastion-pylon')}<small>1${recorded ? 'B' : 'A'}</small>`,
    '',
    '',
    '↘',
    `<i class="${recorded ? '' : 'power-mini-off'}">${gate}</i>`,
  ])
}
