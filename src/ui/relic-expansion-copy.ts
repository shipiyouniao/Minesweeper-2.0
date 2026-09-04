import type { Language } from '../types/localization.js'
import type { ExpansionRelic, RelicPack } from '../types/relic-packs.js'
import type { VariantDescription } from '../types/variant-ui.js'
import { journeyPackCopy, journeyRelicCopy } from './journey-relic-copy.js'

/** Require a complete name and effect in every supported language. */
function description(
  language: Language,
  enName: string,
  zhName: string,
  jaName: string,
  enNote: string,
  zhNote: string,
  jaNote: string,
): VariantDescription {
  if (language === 'zh') return { name: zhName, note: zhNote }
  if (language === 'ja') return { name: jaName, note: jaNote }
  return { name: enName, note: enNote }
}

/** Describe trigger conditions and limits where players select a relic. */
export function expansionRelicCopy(language: Language, relic: ExpansionRelic): VariantDescription {
  switch (relic) {
    case 'field-notes':
      return description(
        language,
        'Field notes',
        '勘探笔记',
        '調査ノート',
        'Confirm 3 mines on a floor to gain 1 probe. Once per floor; cap 4.',
        '每层确认 3 颗雷后，补充 1 根探针。每层一次，上限 4。',
        '同じ階で地雷を3個確定すると探針+1。各階1回、上限4。',
      )
    case 'rangefinder':
      return description(
        language,
        'Rangefinder',
        '测距镜',
        '測距器',
        'A probe confirming 2 new mines grants 1 scan. Once per floor; cap 4.',
        '一次探针新确认至少 2 颗雷，补充 1 次扫描。每层一次，上限 4。',
        '探針1回で新たに地雷を2個確定すると走査+1。各階1回、上限4。',
      )
    case 'reactive-shell':
      return description(
        language,
        'Reactive shell',
        '反应甲片',
        '反応装甲',
        'The first shielded mine hit each floor surveys its surrounding 3×3 area.',
        '每层首次用护盾挡雷时，侦察该雷周围 3×3 区域。',
        '各階で最初に地雷をシールドで防ぐと、その周囲3×3を調査。',
      )
    case 'rescue-ribbon':
      return description(
        language,
        'Rescue ribbon',
        '救援绶带',
        '救援リボン',
        'Survive health damage to gain 1 shield. Once per expedition; cap 2.',
        '扣血后存活，获得 1 层护盾。每局一次，上限 2。',
        'HPダメージを受けて生存するとシールド+1。遠征中1回、上限2。',
      )
    case 'field-dressing':
      return description(
        language,
        'Field dressing',
        '行军绷带',
        '応急包帯',
        'The first chest collected each floor restores 1 HP, up to maximum health.',
        '每层收集的第一个宝箱恢复 1 点生命，不超过生命上限。',
        '各階で最初に回収する宝箱でHPを1回復。最大HPまで。',
      )
    case 'second-wind':
      return description(
        language,
        'Second wind',
        '余烬护符',
        '再起のお守り',
        'Survive one lethal hit with 1 HP. Once per expedition.',
        '受到致命伤害时保留 1 点生命。每局一次。',
        '致命的なダメージをHP1で耐える。遠征中1回。',
      )
    case 'supply-cache':
      return description(
        language,
        'Supply cache',
        '补给暗格',
        '補給の隠し箱',
        'The first chest collected each floor grants 1 scan, up to 4.',
        '每层收集的第一个宝箱补充 1 次扫描，上限 4。',
        '各階で最初に回収する宝箱で走査+1、上限4。',
      )
    case 'cache-guard':
      return description(
        language,
        'Cache guard',
        '寻宝护印',
        '宝探しの護符',
        'Collect all 3 chests on a floor to gain 1 shield. Once per floor; cap 2.',
        '收集本层全部 3 个宝箱后获得 1 层护盾。每层一次，上限 2。',
        '同じ階の宝箱3個を全て回収するとシールド+1。各階1回、上限2。',
      )
    default:
      return journeyRelicCopy(language, relic)
  }
}

/** A purchase adds options to later reward offers, never an immediate free relic. */
export function relicPackCopy(language: Language, pack: RelicPack): VariantDescription {
  switch (pack) {
    case 'survey-notes':
      return description(
        language,
        'Surveyor notes',
        '勘探手记包',
        '調査手記パック',
        'Add Field notes and Rangefinder to future offers: turn new discoveries into tools.',
        '将勘探笔记、测距镜加入后续遗物池：利用新发现补充道具。',
        '調査ノートと測距器を遺物候補に追加。新しい発見で道具を補充。',
      )
    case 'guardian-crests':
      return description(
        language,
        'Guardian crests',
        '守护纹章包',
        '守護紋章パック',
        'Add Reactive shell and Rescue ribbon: shield reconnaissance and emergency protection.',
        '将反应甲片、救援绶带加入后续遗物池：护盾侦察与受伤保护。',
        '反応装甲と救援リボンを追加。シールドで調査し、負傷時に防護。',
      )
    case 'survival-charms':
      return description(
        language,
        'Survival charms',
        '生存护符包',
        '生存護符パック',
        'Add Field dressing and Second wind: chest healing and one lethal-hit recovery.',
        '将行军绷带、余烬护符加入后续遗物池：宝箱治疗与一次绝境生还。',
        '応急包帯と再起のお守りを追加。宝箱で回復し、致命傷に一度耐える。',
      )
    case 'prospector-seals':
      return description(
        language,
        'Prospector seals',
        '寻宝印记包',
        '採掘印章パック',
        'Add Supply cache and Cache guard: recover scans and earn protection by collecting chests.',
        '将补给暗格、寻宝护印加入后续遗物池：收集宝箱补充扫描和护盾。',
        '補給の隠し箱と宝探しの護符を追加。宝箱の回収で走査と防護を獲得。',
      )
    default:
      return journeyPackCopy(language, pack)
  }
}
