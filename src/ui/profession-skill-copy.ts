import type { Language } from '../types/localization.js'
import type { Profession } from '../types/variants.js'
import type { VariantDescription } from '../types/variant-ui.js'
import type { SkillAvailability } from '../types/profession.js'

/** Pick one complete translation without dynamic dictionaries or fallback keys. */
function text(language: Language, en: string, zh: string, ja: string): string {
  return language === 'zh' ? zh : language === 'ja' ? ja : en
}

/** Explain the active skill separately from the concise starting-resource card. */
export function professionSkillCopy(
  language: Language,
  profession: Profession,
): VariantDescription {
  switch (profession) {
    case 'explorer':
      return {
        name: text(language, 'Trail light', '探路灯', '道しるべ'),
        note: text(
          language,
          'Confirm mines and safe cells in the 3×3 area around your character.',
          '侦察角色周围 3×3，标出地雷和安全格。',
          'キャラクター周囲3×3の地雷と安全なマスを判定。',
        ),
      }
    case 'surveyor':
      return {
        name: text(language, 'Column survey', '纵向测绘', '縦列測量'),
        note: text(
          language,
          'Confirm mines and safe cells in your character’s entire column.',
          '侦察角色所在整列，标出地雷和安全格。',
          'キャラクターがいる縦列全体の地雷と安全なマスを判定。',
        ),
      }
    case 'engineer':
      return {
        name: text(language, 'Field repair', '战地修护', '野外修理'),
        note: text(
          language,
          'Spend 1 scan to gain 1 shield. Shield cap: 2.',
          '消耗 1 次扫描，获得 1 点护盾；护盾上限 2。',
          '走査1回を消費してシールド+1。上限2。',
        ),
      }
    case 'archaeologist':
      return {
        name: text(language, 'Excavate', '寻宝发掘', '発掘'),
        note: text(
          language,
          'Scout the nearest uncollected chest’s 3×3 area: open safe clues and mark mines. Walk there to collect it. Relic rewards offer up to 4 choices.',
          '侦察最近未收集宝箱周围 3×3，揭开安全格并标雷。走到宝箱才能领取。遗物奖励最多四选一。',
          '最寄りの未回収宝箱の周囲3×3を偵察し、安全なマスを開いて地雷をマーク。回収には移動が必要。遺物候補は最大4つ。',
        ),
      }
    case 'alchemist':
      return {
        name: text(language, 'Transmute', '炼成', '錬成'),
        note: text(
          language,
          'Spend 1 shield to gain 1 probe and 1 scan. Both tools need room below their cap of 4.',
          '消耗 1 点护盾，获得 1 探针和 1 次扫描；两种道具都须低于上限 4。',
          'シールド1を消費し、探針と走査を各+1。両方とも上限4未満が必要。',
        ),
      }
    case 'sentinel':
      return {
        name: text(language, 'Watchtower', '守望之眼', '見張りの眼'),
        note: text(
          language,
          'Spend 1 shield to confirm mines and safe cells in the 5×5 area around your character.',
          '消耗 1 点护盾，侦察角色周围 5×5，标出地雷和安全格。',
          'シールド1を消費してキャラクター周囲5×5の地雷と安全なマスを判定。',
        ),
      }
  }
}

/** Present a short actionable availability message using only public resources and knowledge. */
export function professionSkillStatus(language: Language, status: SkillAvailability): string {
  switch (status) {
    case 'ready':
      return text(language, 'Use · once per floor', '使用 · 每层一次', '使用 · 各階1回')
    case 'used':
      return text(
        language,
        'Used · refreshes next floor',
        '本层已用 · 下一层恢复',
        '使用済み · 次の階で回復',
      )
    case 'resources':
      return text(
        language,
        'Check the cost and resource caps',
        '资源不足或已达上限',
        '必要資源と上限を確認',
      )
    case 'no-information':
      return text(
        language,
        'No new information here · reposition or explore',
        '这里没有新信息 · 移动或继续探索',
        '新情報なし · 移動または探索を続ける',
      )
    case 'inactive':
      return text(language, 'Available during exploration', '探索时可用', '探索中に使用可能')
  }
}
