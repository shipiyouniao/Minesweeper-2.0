import { message } from '../i18n.js'
import type { CampLabel, CampPage, ShopCategory } from '../types/camp-navigation.js'
import type { Language } from '../types/localization.js'

import { variantCopy } from './variant-copy.js'

/** Name a destination consistently in its entry card, heading and navigation. */
export function campPageName(language: Language, page: CampPage): string {
  const t = variantCopy(language)
  switch (page) {
    case 'overview':
      return t.camp
    case 'professions':
      return t.profession
    case 'equipment':
      return message(language, 'camp-copy.loadout')
    case 'missions':
      return message(language, 'camp-copy.missions')
    case 'achievements':
      return message(language, 'camp-copy.achievements')
    case 'shop':
      return message(language, 'camp-copy.shop')
  }
}

/** Keep category wording about purchasable effects rather than implementation details. */
export function shopCategoryName(language: Language, category: ShopCategory): string {
  switch (category) {
    case 'all':
      return message(language, 'camp-copy.all')
    case 'professions':
      return variantCopy(language).profession
    case 'equipment':
      return message(language, 'camp-copy.equipment')
    case 'relics':
      return message(language, 'camp-copy.relics')
    case 'camp':
      return variantCopy(language).facilities
  }
}

/** Supply concise instructions and feedback at the point where they are needed. */
export function campLabel(language: Language, label: CampLabel): string {
  switch (label) {
    case 'back':
      return message(language, 'camp-copy.back-to-camp')
    case 'current':
      return message(language, 'camp-copy.ready-for-departure')
    case 'empty':
      return message(language, 'camp-copy.no-equipment-selected')
    case 'buy':
      return message(language, 'camp-copy.purchase')
    case 'purchaseHelp':
      return message(language, 'camp-copy.select-an-item-to-see-its-effect')
    case 'workshopRequired':
      return message(language, 'camp-copy.unlock-the-workshop-before-buying-and-equipping')
    case 'professionHelp':
      return message(language, 'camp-copy.choose-your-explorer-and-skill')
    case 'equipmentHelp':
      return message(language, 'camp-copy.build-a-three-point-loadout')
    case 'routeHelp':
      return message(language, 'camp-copy.choose-board-size-and-expedition-length')
    case 'shopHelp':
      return message(language, 'camp-copy.unlock-careers-equipment-and-relics')
    case 'loadoutBudget':
      return message(language, 'camp-copy.loadout-points')
  }
}
