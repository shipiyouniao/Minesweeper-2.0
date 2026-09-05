import type { Upgrade } from './variants.js'

/** Camp screens are transient presentation state, separate from expedition saves. */
export type CampPage = 'overview' | 'professions' | 'equipment' | 'route' | 'shop'

/** Every purchase belongs to one browsing category; All combines them by price. */
export type ShopCategory = 'all' | 'professions' | 'equipment' | 'relics' | 'camp'

/** Short navigation and purchase feedback shared by the three translations. */
export type CampLabel =
  | 'back'
  | 'current'
  | 'empty'
  | 'floors'
  | 'buy'
  | 'missing'
  | 'purchaseHelp'
  | 'workshopRequired'
  | 'professionHelp'
  | 'equipmentHelp'
  | 'routeHelp'
  | 'shopHelp'
  | 'ownedCount'
  | 'loadoutBudget'

/** Keep the selected item when returning from a different camp screen. */
export interface CampScreen {
  readonly page: CampPage
  readonly category: ShopCategory
  readonly selected: Upgrade
}

/** Navigation never spends supplies or changes departure choices. */
export type CampCommand =
  | { readonly type: 'camp-page'; readonly value: CampPage }
  | { readonly type: 'shop-category'; readonly value: ShopCategory }
  | { readonly type: 'shop-item'; readonly value: Upgrade }
