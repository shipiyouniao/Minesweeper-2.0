import { battleText } from './combat-build-copy.js'
import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'
import type { ClockEncounter, ClockSpell } from '../types/clock.js'

/** Absolute deadlines are described relative to the next explicit end-turn, never wall-clock time. */
export function clockDeadline(language: Language, remaining: number): string {
  return remaining === 1
    ? battleText(language, 'This turn end', '本次结束时触发', '今回の終了時')
    : battleText(
        language,
        `In ${remaining} turn ends`,
        `第 ${remaining} 次结束时触发`,
        `${remaining}回目の終了時`,
      )
}

export function clockSpellCopy(language: Language, spell: ClockSpell, turn: number): string {
  const name = spell.redirected
    ? battleText(
        language,
        'Returned spell · boss damage 6',
        '已转送 · 对首领造成 6 点伤害',
        '返送済み · ボスに6ダメージ',
      )
    : spell.shape === 'cross'
      ? battleText(language, 'Time mark · damage 3', '延时刻印 · 伤害 3', '時の刻印 · ダメージ3')
      : battleText(language, 'Clock hand · damage 3', '时针直线 · 伤害 3', '時計の針 · ダメージ3')
  return `#${spell.id} · ${name} · ${clockDeadline(language, spell.resolvesOn - turn + 1)}`
}

export function clockStatus(language: Language, encounter: ClockEncounter): string {
  const count = encounter.hourglasses.filter((glass) => !glass.used).length
  const phase =
    encounter.recoveryUntil >= encounter.turn
      ? battleText(
          language,
          'Recovery · no new spell',
          '恢复期 · 不施放新法术',
          '回復中 · 新規詠唱なし',
        )
      : encounter.health <= encounter.maxHealth / 2
        ? battleText(language, 'Dual countdown', '双重倒计时', '二重カウントダウン')
        : battleText(language, 'Delayed casting', '延迟施法', '遅延詠唱')
  return `${phase} · ${battleText(language, `Hourglasses ${count}/3`, `沙漏 ${count}/3`, `砂時計 ${count}/3`)}`
}

export function clockCopy(language: Language, base: TacticalMessages): TacticalMessages {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const hint = t(
    'Leave the frozen marks before their deadlines. Strike, retreat and let your echo follow up; use a revealed hourglass to return the earliest spell.',
    '按倒计时离开已锁定的刻印。攻击后撤退，残影补刀；靠近已揭开的沙漏，转送最早触发的法术。',
    '期限前に固定された刻印から退避。攻撃後に退き残像で追撃。開いた砂時計に接近し最も早い術を返送。',
  )
  return {
    ...base,
    name: t('Clock Mage · Clepsydra', '时钟法师 · 漏刻', '時計の魔術師・漏刻'),
    hint,
    disabled: t(
      'Spell returned · deadline unchanged',
      '法术已转送 · 倒计时不变',
      '術を返送 · 期限は変化なし',
    ),
    help: [
      base.help[0]!,
      hint,
      t(
        'Marks deal 3 damage after two turn ends. At half health, a line also resolves after three. Overlaps add; forecasts never chase movement. A new pattern is reduced or skipped if known walking routes cannot escape it.',
        '刻印在两次结束回合后造成 3 点伤害；半血后增加三次结束回合触发的直线攻击，重叠伤害相加。预告不会追踪移动；若已知道路无法避开新组合，则缩小或跳过新攻击。',
        '刻印は2回終了後に3ダメージ。半分以下では3回終了後の直線攻撃を追加。重複は加算、予告は追尾しない。既知の道で回避不能な新攻撃は縮小・省略。',
      ),
      t(
        'Each turn starts with a walkable echo at your feet. It repeats half the first successful strike damage (rounded down, minimum 1) at turn end, even after you move; no extra item or skill triggers. Incoming spells resolve first: a fatal hit prevents your follow-up.',
        '每回合开始在脚下留下可通行残影，回合结束重放首次有效攻击的一半伤害（向下取整，至少 1），移动后仍可补刀，不额外触发道具或技能。敌方法术先结算，玩家死亡则取消补刀。',
        '毎ターン足元に通行可能な残像。最初の有効攻撃の半分（切捨て、最低1）を終了時に追撃。移動後も有効、道具・スキルの追加発動なし。敵術が先に解決し、死亡時は追撃中止。',
      ),
      t(
        'An adjacent or occupied revealed hourglass returns the earliest hostile spell for 1 AP, once per glass. It deals 6 boss damage and prevents new casting during the following turn. Already announced spells keep their deadlines. Glasses are optional; the boss has no invulnerable phase. Mines and clues never rewind.',
        '相邻或脚下已揭开的沙漏可花 1 点转送最早触发的敌方法术，每座限用一次。命中造成 6 点首领伤害，并使下一回合不施放新法术；其他已预告法术照常结算。沙漏并非必需，首领始终可攻击。地雷和数字不会回溯。',
        '隣接または足元の開いた砂時計で最も早い敵術を1行動力で返送。各1回、ボスに6ダメージ、次ターン新規詠唱停止。既存予告は通常通り解決。砂時計は任意、ボスは常に攻撃可能。地雷と数字は巻き戻らない。',
      ),
    ],
  }
}
