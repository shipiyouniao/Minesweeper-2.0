import { message } from '../i18n.js'

import type { Language } from '../types/localization.js'
import type { MilestoneId } from '../types/milestones.js'
import type { VariantDescription } from '../types/variant-ui.js'

/** Goals describe counted actions and finite rewards consistently in all locales. */
export function milestoneCopy(language: Language, id: MilestoneId): VariantDescription {
  switch (id) {
    case 'bastion-flawless':
      return {
        name: message(language, 'milestone-copy.untouched-bulwark'),
        note: message(language, 'milestone-copy.defeat-the-bastion-without-losing-health-revival'),
      }
    case 'mirror-flawless':
      return {
        name: message(language, 'milestone-copy.beyond-the-mirror'),
        note: message(language, 'milestone-copy.defeat-both-twins-without-losing-health-revival'),
      }
    case 'clock-no-glass':
      return {
        name: message(language, 'milestone-copy.against-the-clock'),
        note: message(language, 'milestone-copy.defeat-the-clock-boss-using-exactly-one'),
      }
    case 'magnetic-demolition':
      return {
        name: message(language, 'milestone-copy.demolition-expert'),
        note: message(language, 'milestone-copy.lure-a-charge-into-at-least-one'),
      }
    case 'brood-nest-spared':
      return {
        name: message(language, 'milestone-copy.into-the-nest'),
        note: message(language, 'milestone-copy.defeat-the-queen-while-leaving-at-least'),
      }

    case 'hunt-bastion':
      return {
        name: message(language, 'milestone-copy.break-the-bastion'),
        note: message(language, 'milestone-copy.defeat-this-boss-once'),
      }
    case 'hunt-brood':
      return {
        name: message(language, 'milestone-copy.queen-hunt'),
        note: message(language, 'milestone-copy.defeat-this-boss-once'),
      }
    case 'hunt-mirror':
      return {
        name: message(language, 'milestone-copy.twin-hunt'),
        note: message(language, 'milestone-copy.defeat-this-boss-once'),
      }
    case 'hunt-magnetic':
      return {
        name: message(language, 'milestone-copy.magnet-hunt'),
        note: message(language, 'milestone-copy.defeat-this-boss-once'),
      }
    case 'hunt-clock':
      return {
        name: message(language, 'milestone-copy.clock-hunt'),
        note: message(language, 'milestone-copy.defeat-this-boss-once'),
      }
    case 'web-untouched':
      return {
        name: message(language, 'milestone-copy.web-walker'),
        note: message(language, 'milestone-copy.defeat-the-brood-queen-without-clearing-any'),
      }
    case 'field-unscathed':
      return {
        name: message(language, 'milestone-copy.master-of-magnetism'),
        note: message(language, 'milestone-copy.defeat-the-magnetic-boss-without-being-pushed'),
      }

    case 'trail-apprentice':
      return {
        name: message(language, 'milestone-copy.trail-apprentice'),
        note: message(language, 'milestone-copy.total-60-new-safe-squares-visited'),
      }
    case 'trail-guide':
      return {
        name: message(language, 'milestone-copy.trail-guide'),
        note: message(language, 'milestone-copy.total-150-new-safe-squares-visited'),
      }
    case 'cache-runner':
      return {
        name: message(language, 'milestone-copy.cache-runner'),
        note: message(language, 'milestone-copy.total-10-chests-collected'),
      }
    case 'cache-seeker':
      return {
        name: message(language, 'milestone-copy.cache-seeker'),
        note: message(language, 'milestone-copy.total-25-chests-collected'),
      }
    case 'skill-student':
      return {
        name: message(language, 'milestone-copy.skill-student'),
        note: message(language, 'milestone-copy.total-10-successful-profession-skills'),
      }
    case 'skill-adept':
      return {
        name: message(language, 'milestone-copy.skill-adept'),
        note: message(language, 'milestone-copy.total-25-successful-profession-skills'),
      }
    case 'deep-route':
      return {
        name: message(language, 'milestone-copy.return-route'),
        note: message(language, 'milestone-copy.total-12-floors-cleared'),
      }
    case 'deep-descent':
      return {
        name: message(language, 'milestone-copy.deep-descent'),
        note: message(language, 'milestone-copy.total-25-floors-cleared'),
      }
    case 'boss-challenger':
      return {
        name: message(language, 'milestone-copy.boss-challenger'),
        note: message(language, 'milestone-copy.total-3-bosses-defeated'),
      }
    case 'first-victory':
      return {
        name: message(language, 'milestone-copy.homeward-bound'),
        note: message(language, 'milestone-copy.total-1-expedition-victory'),
      }
    case 'long-road':
      return {
        name: message(language, 'milestone-copy.long-road'),
        note: message(language, 'milestone-copy.total-500-new-safe-squares-visited'),
      }
    case 'world-walker':
      return {
        name: message(language, 'milestone-copy.world-walker'),
        note: message(language, 'milestone-copy.total-1500-new-safe-squares-visited'),
      }
    case 'treasure-vault':
      return {
        name: message(language, 'milestone-copy.treasure-vault'),
        note: message(language, 'milestone-copy.total-75-chests-collected'),
      }
    case 'treasure-legend':
      return {
        name: message(language, 'milestone-copy.treasure-legend'),
        note: message(language, 'milestone-copy.total-200-chests-collected'),
      }
    case 'skill-master':
      return {
        name: message(language, 'milestone-copy.skill-master'),
        note: message(language, 'milestone-copy.total-75-successful-profession-skills'),
      }
    case 'skill-legend':
      return {
        name: message(language, 'milestone-copy.skill-legend'),
        note: message(language, 'milestone-copy.total-200-successful-profession-skills'),
      }
    case 'depth-pioneer':
      return {
        name: message(language, 'milestone-copy.rift-pioneer'),
        note: message(language, 'milestone-copy.total-50-floors-cleared'),
      }
    case 'depth-legend':
      return {
        name: message(language, 'milestone-copy.depth-legend'),
        note: message(language, 'milestone-copy.total-150-floors-cleared'),
      }
    case 'relic-museum':
      return {
        name: message(language, 'milestone-copy.relic-museum'),
        note: message(language, 'milestone-copy.total-20-different-relics-acquired'),
      }
    case 'abyss-veteran':
      return {
        name: message(language, 'milestone-copy.abyss-veteran'),
        note: message(language, 'milestone-copy.total-5-abyss-victories'),
      }
    case 'first-steps':
      return {
        name: message(language, 'milestone-copy.first-footsteps'),
        note: message(language, 'milestone-copy.visit-20-new-safe-squares-across-expeditions'),
      }
    case 'treasure-scout':
      return {
        name: message(language, 'milestone-copy.treasure-scout'),
        note: message(language, 'milestone-copy.collect-3-treasure-chests-across-expeditions'),
      }
    case 'field-practice':
      return {
        name: message(language, 'milestone-copy.field-practice'),
        note: message(language, 'milestone-copy.successfully-use-a-profession-skill-3-times'),
      }
    case 'floor-runner':
      return {
        name: message(language, 'milestone-copy.beyond-the-entrance'),
        note: message(language, 'milestone-copy.clear-5-floors-across-expeditions'),
      }
    case 'first-boss':
      return {
        name: message(language, 'milestone-copy.first-challenger'),
        note: message(language, 'milestone-copy.defeat-your-first-boss'),
      }
    case 'veteran':
      return {
        name: message(language, 'milestone-copy.seasoned-explorer'),
        note: message(language, 'milestone-copy.win-3-expeditions-existing-camp-victories-count'),
      }
    case 'relic-curator':
      return {
        name: message(language, 'milestone-copy.relic-curator'),
        note: message(
          language,
          'milestone-copy.acquire-8-different-relics-across-expeditions-offers',
        ),
      }
    case 'boss-slayer':
      return {
        name: message(language, 'milestone-copy.boss-hunter'),
        note: message(language, 'milestone-copy.defeat-10-bosses-across-expeditions'),
      }
    case 'four-legends':
      return {
        name: message(language, 'milestone-copy.four-legends'),
        note: message(language, 'milestone-copy.defeat-four-different-boss-families'),
      }
    case 'abyss-clear':
      return {
        name: message(language, 'milestone-copy.into-the-abyss'),
        note: message(language, 'milestone-copy.win-an-expedition-on-abyss-difficulty'),
      }
  }
}
