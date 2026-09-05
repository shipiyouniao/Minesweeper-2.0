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
        'Activation cancels the pulse. The first End turn only charges up; you then have a full escape turn before the next End turn launches the knight. Clear the gold route and the outlined 3×3 blast zone. Blocking the anchor cancels the crash. Passing through you deals 5 base damage.',
        '启动后停止脉冲。第一次结束回合只蓄力，再给你一个完整回合撤离，第二次结束回合才冲锋。避开金色路线与标出的 3×3 爆区；占住锚点会阻止撞锚。冲锋经过角色造成 5 点基础伤害。',
        '起動で磁力停止。最初のターン終了は溜めのみ。その後1ターン退避でき、次の終了で突進。金色の経路と3×3の爆破範囲を避けよう。錨上にいると衝突失敗。突進接触は基礎5ダメージ。',
      ),
      t(
        'A crash opens the entire 3×3 zone, destroys its mines and blocking terrain, and leaves walkable craters. Numbers update to count remaining mines. The knight takes 6 damage plus 1 per detonated mine (at most 3 extra), always retaining 1 HP, then exposes its core for three turns. Anyone in the zone takes 5 base blast damage, separately from charge damage. Defense and bracing reduce each hit to a minimum of 1. Ordinary player mine hits still leave impassable mines.',
        '撞锚揭开整个 3×3 区域，炸毁地雷与阻路地形，留下可通行弹坑，数字随剩余地雷更新。骑士受到 6 点伤害，每颗引爆的雷追加 1 点、最多追加 3 点，至少剩 1 生命，随后核心暴露三回合。爆区内角色另受一次 5 点基础爆炸伤害；冲锋和爆炸分别计算防御减免，最低各 1 点。普通踩雷仍会留下不可通行的雷。',
        '衝突で3×3を開き、地雷と障害物を破壊。クレーターは通行可能で数字は残る地雷数に更新。騎士に6＋爆破地雷1個につき1（追加最大3）ダメージ、HPは最低1残り、コアは3ターン露出。範囲内では突進とは別に基礎5の爆発ダメージ。防護と防御で各最低1まで軽減。通常の地雷接触では地雷が残り通行不可。',
      ),
      common.help.at(-1)!,
    ],
  }
}

/** Label the phase without asking the player to decode a paragraph during a turn. */
export function magneticStatus(language: Language, encounter: MagneticEncounter): string {
  if (encounter.health === 0) return battleText(language, 'Defeated', '已击败', '撃破済み')
  if (encounter.forecast.kind === 'charge')
    if (encounter.turn < encounter.forecast.resolvesOn)
      return battleText(
        language,
        'Charging · one full escape turn after End turn',
        '蓄力中 · 结束回合后还有一整回合撤离',
        '溜め中 · ターン終了後に1ターン退避可能',
      )
    else
      return battleText(
        language,
        'Charge at End turn · leave the route and 3×3 blast zone',
        '本回合结束时冲锋 · 撤出路线与 3×3 爆区',
        'ターン終了で突進 · 経路と3×3爆破範囲から退避',
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
