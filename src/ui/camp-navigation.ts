import { UPGRADES, upgradeCost } from '../game/camp-progression.js'
import { parseCombatEquipment, parseCombatPurchase } from '../game/combat-build.js'
import { parseRelicPack } from '../game/relic-packs.js'
import { PROFESSIONS } from '../game/professions.js'
import type { CampCommand, CampPage, CampScreen, ShopCategory } from '../types/camp-navigation.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'
import type { Upgrade } from '../types/variants.js'
import { combatSprite } from './combat-build-copy.js'
import { professionSprite } from './profession-presentation.js'

/** Decode screen names without accepting arbitrary DOM attributes as state. */
export function parseCampPage(value: string | undefined): CampPage | null {
  switch (value) {
    case 'overview':
    case 'professions':
    case 'equipment':
    case 'route':
    case 'shop':
      return value
    default:
      return null
  }
}

/** Keep filter identifiers finite and independent of translated labels. */
export function parseShopCategory(value: string | undefined): ShopCategory | null {
  switch (value) {
    case 'all':
    case 'professions':
    case 'equipment':
    case 'relics':
    case 'camp':
      return value
    default:
      return null
  }
}

/** Classify licenses by their effect so filtering never hides a purchase from All. */
export function shopCategory(item: Upgrade): ShopCategory {
  if (PROFESSIONS.some((profession) => profession === item)) return 'professions'
  if (parseCombatEquipment(item)) return 'equipment'
  if (parseRelicPack(item) || item === 'archive' || item === 'battle-manual') return 'relics'
  return 'camp'
}

/** Sort a display copy, preserving catalog order for equal-price items. */
export function shopItems(category: ShopCategory): Upgrade[] {
  return UPGRADES.filter((item) => category === 'all' || shopCategory(item) === category).sort(
    (a, b) => upgradeCost(a) - upgradeCost(b),
  )
}

/** Resolve existing artwork through typed catalog entries. */
export function shopSprite(item: Upgrade): DungeonSprite {
  const profession = PROFESSIONS.find((career) => career === item)
  if (profession) return professionSprite(profession)

  const combat = parseCombatPurchase(item)
  if (combat) return combatSprite(combat)

  return parseRelicPack(item) ?? (item === 'workshop' ? 'workshop' : 'archive')
}

/** Reconcile selection with each filter without purchasing or selecting a profession. */
export function navigateCamp(screen: CampScreen, command: CampCommand): CampScreen {
  switch (command.type) {
    case 'camp-page':
      return { ...screen, page: command.value }
    case 'shop-category': {
      const items = shopItems(command.value)
      return {
        page: 'shop',
        category: command.value,
        selected: items.includes(screen.selected) ? screen.selected : (items[0] ?? screen.selected),
      }
    }
    case 'shop-item':
      return {
        page: 'shop',
        category: shopItems(screen.category).includes(command.value) ? screen.category : 'all',
        selected: command.value,
      }
  }
}
