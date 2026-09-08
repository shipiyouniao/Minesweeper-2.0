import { message } from '../i18n.js'

import type { Language } from '../types/localization.js'
import type { TitleId } from '../types/titles.js'

/** Describe the equipped title's exact condition and bounded reward in every supported locale. */
export function titleEffectCopy(language: Language, title: TitleId): string {
  switch (title) {
    case 'matrix-precise':
      return message(language, 'matrix.precise-effect')
    case 'bastion-flawless':
      return message(language, 'title-copy.defense-1-while-braced')
    case 'mirror-flawless':
      return message(language, 'title-copy.gain-1-shield-when-entering-a-boss')
    case 'echo-flawless':
      return message(language, 'echo.flawless-effect')
    case 'echo-precise':
      return message(language, 'echo.precise-effect')
    case 'clock-no-glass':
      return message(language, 'title-copy.every-third-boss-turn-starts-with-1')
    case 'magnetic-demolition':
      return message(language, 'title-copy.attack-2-while-the-magnetic-knight-is')
    case 'brood-nest-spared':
      return message(language, 'title-copy.attack-2-against-the-brood-queen-while')
    case 'web-untouched':
      return message(language, 'title-copy.defense-1-in-the-brood-queen-battle')
    case 'field-unscathed':
      return message(language, 'title-copy.depart-with-1-extra-probe-up-to')
    case 'veteran':
      return message(language, 'title-copy.maximum-health-1-for-this-expedition')
    case 'relic-curator':
      return message(language, 'title-copy.with-fewer-than-3-relics-reward-offers')
    case 'boss-slayer':
      return message(language, 'title-copy.attack-1-against-a-boss-at-half')
    case 'four-legends':
      return message(language, 'title-copy.recover-2-health-when-entering-a-boss')
    case 'abyss-clear':
      return message(language, 'title-copy.attack-1-while-your-health-is-at')
    case 'long-road':
      return message(language, 'title-copy.the-first-chest-each-floor-restores-1')
    case 'world-walker':
      return message(language, 'title-copy.the-first-turn-of-each-boss-battle')
    case 'treasure-vault':
      return message(language, 'title-copy.the-first-two-chests-of-the-expedition')
    case 'treasure-legend':
      return message(language, 'title-copy.the-third-chest-of-the-expedition-grants')
    case 'skill-master':
      return message(language, 'title-copy.completing-your-profession-skill-restores-1-health')
    case 'skill-legend':
      return message(language, 'title-copy.completing-your-profession-skill-in-battle-refunds')
    case 'depth-pioneer':
      return message(language, 'title-copy.depart-with-1-extra-scanner-up-to')
    case 'depth-legend':
      return message(language, 'title-copy.entering-floors-4-and-7-each-adds')
    case 'relic-museum':
      return message(language, 'title-copy.with-3-or-more-relics-reward-offers')
    case 'abyss-veteran':
      return message(language, 'title-copy.defense-1-while-your-health-is-at')
  }
}
