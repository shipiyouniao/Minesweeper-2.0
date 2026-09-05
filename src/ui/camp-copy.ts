import type { CampLabel, CampPage, ShopCategory } from '../types/camp-navigation.js'
import type { Language } from '../types/localization.js'
import { battleText } from './combat-build-copy.js'
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
      return battleText(language, 'Loadout', '出发装备', '出発装備')
    case 'route':
      return battleText(language, 'Route', '远征路线', '遠征ルート')
    case 'shop':
      return battleText(language, 'Shop', '商店', 'ショップ')
  }
}

/** Keep category wording about purchasable effects rather than implementation details. */
export function shopCategoryName(language: Language, category: ShopCategory): string {
  switch (category) {
    case 'all':
      return battleText(language, 'All', '全部', 'すべて')
    case 'professions':
      return variantCopy(language).profession
    case 'equipment':
      return battleText(language, 'Equipment', '装备', '装備')
    case 'relics':
      return battleText(language, 'Relics', '遗物', '遺物')
    case 'camp':
      return variantCopy(language).facilities
  }
}

/** Supply concise instructions and feedback at the point where they are needed. */
export function campLabel(language: Language, label: CampLabel): string {
  /** Require all supported translations for each line of copy. */
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  switch (label) {
    case 'back':
      return t('Back to camp', '返回营地', 'キャンプへ戻る')
    case 'current':
      return t('Ready for departure', '出发准备', '出発の準備')
    case 'empty':
      return t('No equipment selected', '尚未携带装备', '装備未選択')
    case 'floors':
      return t('{count} floors', '{count} 层', '{count}階')
    case 'buy':
      return t('Purchase', '购买', '購入')
    case 'missing':
      return t('Need {count} more supplies', '还差 {count} 物资', '物資があと{count}必要')
    case 'purchaseHelp':
      return t(
        'Select an item to see its effect.',
        '选择商品查看效果。',
        '商品を選ぶと効果を確認できます。',
      )
    case 'workshopRequired':
      return t(
        'Unlock the Workshop to equip this on departure.',
        '需要解锁工坊，才能在出发时携带。',
        '出発時に装備するには工房の解放が必要です。',
      )
    case 'professionHelp':
      return t('Choose your explorer and skill.', '选择角色与职业技能', '冒険者とスキルを選ぶ')
    case 'equipmentHelp':
      return t('Build a three-point loadout.', '搭配 3 点出发装备', '3ポイントで装備を組む')
    case 'routeHelp':
      return t(
        'Choose board size and expedition length.',
        '选择难度、棋盘与层数',
        '難易度と階層数を選ぶ',
      )
    case 'shopHelp':
      return t(
        'Unlock careers, equipment and relics.',
        '解锁职业、装备与遗物',
        '職業・装備・遺物を解放',
      )
    case 'ownedCount':
      return t('{count} unlocked', '已解锁 {count} 项', '{count}点を解放済み')
    case 'loadoutBudget':
      return t('Loadout points', '装备预算', '装備ポイント')
  }
}
