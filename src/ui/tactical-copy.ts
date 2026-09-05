import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'
import type { TacticalPlan, TacticalEncounter, EncounterKind } from '../types/tactical.js'
import { battleCopy } from './battle-presentation.js'

/** Explain a public action preview without inspecting the mine layout. */
export function tacticalPlanCopy(language: Language, plan: TacticalPlan): string {
  const zh = language === 'zh'
  const ja = language === 'ja'
  switch (plan.reason) {
    case 'mirror-seal':
      return zh
        ? '先关闭另一侧镜域的封印'
        : ja
          ? '先に反対側の封印を停止'
          : 'Disable the seal in the opposite realm first'
    case 'reflection':
      return zh
        ? '反射中 · 切换镜域，攻击另一位双子'
        : ja
          ? '反射中 · 転移してもう一方を攻撃'
          : 'Reflection active · shift and strike the other twin'
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
  if (encounter.event === 'braced')
    return zh
      ? '已防御 · 本回合敌方伤害减少 3'
      : ja
        ? '防御中 · 敵のダメージを3軽減'
        : 'Braced · reduce enemy damage by 3 this turn'
  if (encounter.event === 'misfire')
    return zh
      ? '校准错误 · 受到 5 点伤害'
      : ja
        ? '調整失敗 · 5ダメージ'
        : 'Calibration failed · 5 damage'
  switch (encounter.event) {
    case 'shifted':
      return zh
        ? '已切换镜域 · 继续本回合'
        : ja
          ? '転移完了 · 同じターンを続行'
          : 'Realm shifted · the turn continues'
    case 'twin-fallen':
      return zh
        ? '一位双子已倒下 · 幸存者后续攻击增强'
        : ja
          ? '片方を撃破 · 生存者の次の攻撃が強化'
          : 'One twin defeated · the survivor’s future attacks intensify'
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
    case 'disabled':
      return tacticalCopy(language, encounter.kind).disabled
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
      return zh
        ? '战斗进行中 · 留意攻击预告'
        : ja
          ? '戦闘中 · 攻撃予告を確認'
          : 'Battle in progress · watch the attack forecast'
  }
}

/** Present the current combat rules for either released boss. */
export function tacticalCopy(
  language: Language,
  kind: EncounterKind = 'bastion',
): TacticalMessages {
  return battleCopy(language, kind)
}
