import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'
import type { TacticalPlan, TacticalEncounter, EncounterKind } from '../types/tactical.js'
import { battleCopy } from './battle-presentation.js'
import { broodCopy } from './brood-copy.js'

/** Keep each language's combat vocabulary and instructions complete and independently readable. */
function legacyTacticalCopy(language: Language, kind: EncounterKind = 'bastion'): TacticalMessages {
  if (kind === 'brood') return broodCopy(language)
  if (language === 'zh')
    return {
      name: '堡垒守卫',
      turn: '回合',
      points: '行动力',
      armor: '护盾机关',
      exposed: '核心已暴露',
      pylon: '护盾机关 · 相邻时点击校准',
      disabled: '机关已关闭',
      danger: '预警：结束回合时受到 1 点伤害',
      attack: '攻击 · 2 点',
      brace: '防御 · 1 点',
      end: '结束回合',
      hint: '先标出机关周围的雷，靠近并点击机关。关闭两座机关后攻击守卫。',
      help: [
        '每回合 3 点行动力。移动每格 1 点，揭格另花 1 点；道具、技能、机关与防御各 1 点，攻击 2 点，插旗免费。',
        '根据数字标出机关周围两颗雷，相邻时点击机关关闭护盾。错误校准消耗行动力并造成 1 点伤害。关闭两座机关后，靠近守卫攻击，基础伤害为 2 点，遗物可提供加成。',
        '条纹区域是本回合的攻击预告。只有点击“结束回合”才结算攻击；防御可抵消本回合 1 点攻击伤害。横行、纵列、十字攻击依次循环。',
        '击败守卫后恢复全部生命并获得 1 点护盾，再领取本层奖励。进入战斗不会恢复本层已用的技能。',
      ],
      excavation: '侦察最近未关闭机关周围 3×3，揭开安全格并标雷。',
      victory: '守卫已击败 · 生命全满，护盾 +1',
    }
  if (language === 'ja')
    return {
      name: '城塞の守護者',
      turn: 'ターン',
      points: '行動力',
      armor: 'シールド装置',
      exposed: 'コア露出',
      pylon: 'シールド装置 · 隣接して調整',
      disabled: '装置停止',
      danger: '予告：ターン終了時に1ダメージ',
      attack: '攻撃 · 2',
      brace: '防御 · 1',
      end: 'ターン終了',
      hint: '装置周囲の地雷をマークし、隣接して装置を選択。2基を止めて守護者を攻撃。',
      help: [
        '各ターン行動力3。移動1マスにつき1、開く操作は追加1。道具・スキル・装置・防御は1、攻撃は2。旗は無料。',
        '数字から装置周囲の地雷2個を特定し、隣接して装置を調整。誤った調整は行動力を消費し1ダメージ。2基停止後、隣接攻撃の基本ダメージは2。遺物で強化できる。',
        '縞模様は攻撃予告。「ターン終了」でのみ攻撃を解決。防御はそのターンの攻撃ダメージを1軽減。横列・縦列・十字が順に繰り返される。',
        '勝利で体力全回復とシールド+1、その階の報酬を獲得。戦闘開始では使用済みスキルは回復しない。',
      ],
      excavation: '最寄りの稼働装置周囲3×3を偵察し、安全なマスを開いて地雷をマーク。',
      victory: '守護者撃破 · 体力全回復、シールド+1',
    }
  return {
    name: 'Bastion Guardian',
    turn: 'Turn',
    points: 'Action points',
    armor: 'Shield pylons',
    exposed: 'Core exposed',
    pylon: 'Shield pylon · calibrate while adjacent',
    disabled: 'Pylon disabled',
    danger: 'Warning: 1 damage at end of turn',
    attack: 'Strike · 2 AP',
    brace: 'Brace · 1 AP',
    end: 'End turn',
    hint: 'Flag each pylon’s mines, then approach and click it. Disable both pylons to strike the guardian.',
    help: [
      'Each turn grants 3 AP. Moving costs 1 per cell; revealing costs 1 extra. Tools, skills, calibration and brace cost 1; attacks cost 2. Flags are free.',
      'Deduce the two mines around each pylon from the clues. Calibrate from an adjacent cell. Incorrect calibration costs the action and deals 1 damage. Disable both pylons, then strike the adjacent guardian for 2 base damage, enhanced by applicable relics.',
      'Striped cells show the current attack. Only End turn resolves it. Brace blocks 1 attack damage this turn. Attacks cycle through a row, a column and a cross.',
      'Victory restores all health and grants 1 shield before the floor reward. Entering combat does not refresh a spent floor skill.',
    ],
    excavation: 'Scout the nearest active pylon’s 3×3 area, opening safe clues and marking mines.',
    victory: 'Guardian defeated · full health, +1 shield',
  }
}

/** Explain a public action preview without inspecting the mine layout. */
export function tacticalPlanCopy(language: Language, plan: TacticalPlan): string {
  const zh = language === 'zh'
  const ja = language === 'ja'
  switch (plan.reason) {
    case 'window':
      return zh
        ? '靠近并点击核心，花 1 点启动'
        : ja
          ? '隣接してコアを1行動力で起動'
          : 'Approach and click the core to prime it for 1 AP'
    case 'nests':
      return zh
        ? '先推理并摧毁巢穴，削弱女王护甲'
        : ja
          ? '巣を推理して破壊し女王の防護を弱める'
          : 'Deduce and destroy nests to weaken the queen first'
    case 'ready':
      return zh
        ? `消耗 ${plan.cost} 点行动力`
        : ja
          ? `行動力 ${plan.cost}`
          : `Cost: ${plan.cost} AP`
    case 'points':
      return zh
        ? `需要 ${plan.cost} 点行动力 · 请缩短路线或结束回合`
        : ja
          ? `行動力${plan.cost}が必要 · 経路を短くするかターン終了`
          : `Needs ${plan.cost} AP · shorten the route or end your turn`
    case 'armor':
      return zh
        ? '先关闭两座护盾机关'
        : ja
          ? '先に2基の装置を停止'
          : 'Disable both shield pylons first'
    case 'adjacent':
      return zh
        ? '请移动到目标相邻格'
        : ja
          ? '対象に隣接するマスへ移動'
          : 'Move next to the target first'
    case 'flags':
      return zh
        ? '先标出目标周围的全部地雷'
        : ja
          ? '対象周囲の全地雷をマーク'
          : 'Flag all mines around the target first'
    case 'used':
      return zh
        ? '该操作已完成，或目标已清除'
        : ja
          ? '操作済み、または対象除去済み'
          : 'Already used, or the target is cleared'
    default:
      return zh ? '选择可到达的格子' : ja ? '到達可能なマスを選択' : 'Choose a reachable cell'
  }
}

/** Announce the latest accepted tactical outcome in a compact status line. */
export function tacticalEventCopy(language: Language, encounter: TacticalEncounter): string {
  const zh = language === 'zh'
  const ja = language === 'ja'
  const revised =
    encounter.kind === 'bastion' ? Boolean(encounter.mechanisms) : Boolean(encounter.destroyedNests)
  if (revised && encounter.event === 'braced')
    return zh
      ? '已防御 · 本回合敌方伤害减少 3'
      : ja
        ? '防御中 · 敵のダメージを3軽減'
        : 'Braced · reduce enemy damage by 3 this turn'
  if (revised && encounter.event === 'misfire')
    return zh
      ? '校准错误 · 受到 5 点伤害'
      : ja
        ? '調整失敗 · 5ダメージ'
        : 'Calibration failed · 5 damage'
  switch (encounter.event) {
    case 'nest-destroyed':
      return zh
        ? '巢穴已摧毁 · 停止补卵，女王护甲与回血降低'
        : ja
          ? '巣を破壊 · 補充停止、女王の防護と回復減少'
          : 'Nest destroyed · supply stopped, queen armor and regeneration reduced'
    case 'window-opened':
      return zh
        ? '核心已启动 · 破甲窗口开启'
        : ja
          ? 'コア起動 · 露出開始'
          : 'Core primed · strike window open'
    case 'braced':
      return zh
        ? '已防御 · 本回合攻击减伤 1'
        : ja
          ? '防御中 · 今ターンの攻撃を1軽減'
          : 'Braced · block 1 attack damage this turn'
    case 'disabled':
      return tacticalCopy(language, encounter.kind).disabled
    case 'misfire':
      return zh
        ? '校准错误 · 受到 1 点伤害'
        : ja
          ? '調整失敗 · 1ダメージ'
          : 'Calibration failed · 1 damage'
    case 'struck':
      return zh
        ? `攻击命中 · 造成 ${encounter.lastDamage} 点伤害`
        : ja
          ? `攻撃命中 · ${encounter.lastDamage}ダメージ`
          : `Strike landed · ${encounter.lastDamage} damage`
    case 'hit':
      return zh ? '敌方攻击命中' : ja ? '敵の攻撃が命中' : 'Enemy attack hit'
    case 'evaded':
      return zh ? '已避开或挡住攻击' : ja ? '攻撃を回避または防御' : 'Attack avoided or blocked'
    case 'defeated':
      return tacticalCopy(language, encounter.kind).victory
    case 'web-cut':
      return zh ? '蛛网已清除 · 路线开放' : ja ? '巣網を除去 · 通行可能' : 'Web cleared · lane open'
    case 'egg-crushed':
      return zh
        ? '虫卵已摧毁 · 孵化取消'
        : ja
          ? '卵を破壊 · 孵化を阻止'
          : 'Egg destroyed · hatching prevented'
    case 'hatchling-cleared':
      return zh
        ? '幼虫已消灭 · 攻击预告取消'
        : ja
          ? '幼体を撃破 · 予告取消'
          : 'Hatchling intercepted · attack cancelled'
    default:
      if (revised)
        return zh
          ? '战斗进行中 · 留意攻击预告'
          : ja
            ? '戦闘中 · 攻撃予告を確認'
            : 'Battle in progress · watch the attack forecast'
      return tacticalCopy(language, encounter.kind, revised).hint
  }
}

/** Select the exact instruction set captured by the current departure. */
export function tacticalCopy(
  language: Language,
  kind: EncounterKind = 'bastion',
  revised = false,
): TacticalMessages {
  const base = legacyTacticalCopy(language, kind)
  return revised ? battleCopy(language, kind, base) : base
}
