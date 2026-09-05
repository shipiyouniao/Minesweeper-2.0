import { battleText } from './combat-build-copy.js'
import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'
import type { MagneticEncounter, MagneticProjection } from '../types/magnetic.js'

/** Describe the station puzzle and visible pulse cycle alongside the shared combat vocabulary. */
export function magneticCopy(language: Language, common: TacticalMessages): TacticalMessages {
  /** Keep complete translations together for each player-facing rule. */
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const hint = t(
    'Clear a route to an anchor. Calibrate it, lure the knight, then strike its exposed core.',
    '开路到锚点，校准后牵引骑士，趁核心暴露时攻击。',
    '錨まで道を開き、調整して騎士を誘導。露出したコアを攻撃。',
  )
  return {
    ...common,
    name: t('Magnetic Knight', '磁力骑士', '磁力の騎士'),
    hint,
    disabled: t(
      'Anchor calibrated · lure committed',
      '锚点已校准 · 牵引就绪',
      '錨を調整 · 誘導準備完了',
    ),
    help: [
      common.help[0]!,
      hint,
      t(
        'Arrows show the next magnetic pulse. Blue pulls toward the knight’s axis; coral pushes away, up to two cells. The outlined ghost shows your projected landing. A dashed amber path crosses unverified terrain; it does not reveal hidden mines.',
        '箭头显示下一次磁力脉冲：蓝色向骑士所在轴线吸引，珊瑚色向外排斥，最多两格。虚影显示预计落点；琥珀虚线路径经过未确认的格子，不会透露暗雷。',
        '矢印が次の磁力を示す。青は騎士の軸へ吸引、珊瑚色は外へ最大2マス反発。残像が予想着地点。琥珀の破線は未確認マスを通り、隠れた地雷は示さない。',
      ),
      t(
        'Brace for 1 AP to resist the whole pulse. Calibrated anchors also ground you. A mine stops you before it and deals 5 damage ignoring defense. Wall or edge collisions deal 3 base damage, reduced by defense to a minimum of 1. Every third turn has no pulse.',
        '花 1 点行动力进行防御，可抵抗整次脉冲，已校准的锚点也能稳住角色。遇雷会停在雷前并受到 5 点无视防御的伤害。撞墙或边界造成 3 点基础伤害，可被防御减免，最低 1 点。每第三回合没有脉冲。',
        '1行動力の防御で磁力を無効化。調整済みの錨でも固定できる。地雷の手前で停止し、防御を無視する5ダメージ。壁や盤端への衝突は基礎3ダメージで、防護により最低1まで軽減。3ターンごとに磁力が休止。',
      ),
      t(
        'Reveal an anchor and flag its surrounding mines. From it or an adjacent cell, click it for 1 AP. A known open route at least two cells long must connect it to the knight. Wrong calibration deals 5 damage. Later lures reuse the calibration.',
        '揭开锚点并标出周围的雷，在锚点上或相邻格点击，花 1 点启动。骑士到锚点之间需要至少两格长的已揭开通路；校准错误受到 5 点伤害。再次牵引无需重复校准。',
        '錨を開き周囲の地雷をマーク。錨上か隣からクリックし1行動力で起動。騎士から2マス以上の開いた経路が必要。調整失敗は5ダメージ。再誘導に再調整は不要。',
      ),
      t(
        'The gold route replaces this turn’s pulse. End turn pulls the knight along it. A charge hit deals 5 base damage, reduced by defense and bracing to a minimum of 1. Vacate the destination: blocking it cancels the crash. A successful crash deals 6 to the knight, leaving at least 1 HP, and exposes it for three turns without pulses. Alternate anchors to reopen the core.',
        '金色路线会替代本回合脉冲。结束回合时骑士沿线移动，撞到角色造成 5 点基础伤害，可被防御属性与防御动作减免，最低 1 点。请让出终点，占住终点会阻止撞击。撞击使骑士损失 6 生命（至少剩 1），随后暴露三回合且不放脉冲。交替使用锚点可再次破甲。',
        '金色の経路が今ターンの磁力に代わる。ターン終了で騎士が移動。突進は基礎5ダメージで、防護と防御行動により最低1まで軽減。終点を空けないと衝突失敗。成功で騎士に6ダメージ（最低1残る）、3ターン露出し磁力停止。錨を交互に使い再び露出させる。',
      ),
      common.help.at(-1)!,
    ],
  }
}

/** Label the phase without asking the player to decode a paragraph during a turn. */
export function magneticStatus(language: Language, encounter: MagneticEncounter): string {
  if (encounter.health === 0) return battleText(language, 'Defeated', '已击败', '撃破済み')
  if (encounter.forecast.kind === 'charge')
    return battleText(
      language,
      'Lure ready · clear the gold route',
      '牵引就绪 · 避开金色路线',
      '誘導準備完了 · 金色の経路を空ける',
    )
  const remaining = Math.max(0, encounter.exposedUntil - encounter.turn + 1)
  if (remaining)
    return battleText(
      language,
      `Core exposed · ${remaining} turns`,
      `核心暴露 · ${remaining} 回合`,
      `コア露出 · ${remaining}ターン`,
    )
  if (encounter.forecast.kind === 'recovery')
    return battleText(language, 'Recharge · no pulse', '蓄能 · 本回合无脉冲', '蓄力 · 磁力休止')
  const horizontal = encounter.forecast.axis === 'horizontal'
  return encounter.forecast.polarity === 'pull'
    ? battleText(
        language,
        `Attract · ${horizontal ? 'horizontal' : 'vertical'}`,
        `吸引 · ${horizontal ? '横向' : '纵向'}`,
        `吸引 · ${horizontal ? '横' : '縦'}`,
      )
    : battleText(
        language,
        `Repel · ${horizontal ? 'horizontal' : 'vertical'}`,
        `排斥 · ${horizontal ? '横向' : '纵向'}`,
        `反発 · ${horizontal ? '横' : '縦'}`,
      )
}

/** Announce a projected route using public certainty, never an unrevealed cell's actual contents. */
export function magneticLandingCopy(language: Language, projection: MagneticProjection): string {
  if (projection.anchored)
    return battleText(
      language,
      'Grounded · resist displacement',
      '已稳固 · 抵抗位移',
      '固定中 · 移動を防ぐ',
    )
  if (projection.landing === 'mine')
    return battleText(language, 'Known mine on the route', '路线经过已知雷', '経路上に確定地雷')
  if (projection.landing === 'uncertain')
    return battleText(
      language,
      'Projected route · unverified cells',
      '预计路线 · 经过未确认格',
      '予想経路 · 未確認マスあり',
    )
  if (projection.collision)
    return battleText(
      language,
      'Collision · base 3 damage, reduced by defense',
      '碰撞 · 基础 3 点伤害，防御可减免',
      '衝突 · 基礎3ダメージ、防護で軽減',
    )
  return battleText(language, 'Projected landing', '预计落点', '予想着地点')
}
