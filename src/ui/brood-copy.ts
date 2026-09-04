import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'
import type { BroodEncounter } from '../types/tactical.js'

/** Explain the queen's route-management puzzle independently of guardian calibration. */
export function broodCopy(language: Language): TacticalMessages {
  if (language === 'zh')
    return {
      name: '育巢女王',
      turn: '回合',
      points: '行动力',
      armor: '虫群',
      exposed: '女王可直接攻击',
      pylon: '',
      disabled: '已清除',
      danger: '预警：结束回合时虫群造成 1 点伤害',
      attack: '攻击 · 2 点',
      brace: '防御 · 1 点',
      end: '结束回合',
      hint: '靠近蛛网、虫卵或幼虫，点击花 1 点行动力清除；靠近女王攻击。',
      help: [
        '每回合 3 点行动力，移动每格 1 点，攻击女王花 2 点、基础伤害 2。蛛网、虫卵和幼虫各花 1 点清除，必须相邻；插旗免费。',
        '虫卵上的数字是距离孵化的回合数。幼虫每回合沿已揭开的安全路线移动一步，小虚影表示下一落点。孵化当回合不会攻击。',
        '条纹标出本回合的全部危险格。每三回合女王向预告的 3×3 区域吐丝，幼虫攻击下一落点及其四邻格。清除幼虫会取消它的预告。',
        '只有点击“结束回合”才推进机制。同一回合的虫群攻击合计造成 1 点伤害，防御花 1 点即可抵消。每三回合空巢会补充虫卵，虫卵与幼虫总数最多 3。',
        '蛛网挡路但不改变地雷和数字；也可以绕行。击败女王恢复全部生命、护盾 +1，再领取本层奖励。',
      ],
      excavation: '侦察最近仍有未知信息的巢位周围 3×3，揭开安全格并标雷。',
      victory: '女王已击败 · 生命全满，护盾 +1',
    }
  if (language === 'ja')
    return {
      name: '巣育ての女王',
      turn: 'ターン',
      points: '行動力',
      armor: '群れ',
      exposed: '女王は直接攻撃可能',
      pylon: '',
      disabled: '除去済み',
      danger: '予告：ターン終了時に群れから1ダメージ',
      attack: '攻撃 · 2',
      brace: '防御 · 1',
      end: 'ターン終了',
      hint: '巣網・卵・幼体に隣接して選択すると行動力1で除去。女王に接近して攻撃。',
      help: [
        '各ターン行動力3。移動1マスで1、女王への攻撃は2で基本ダメージ2。隣接する巣網・卵・幼体の除去は1。旗は無料。',
        '卵の数字は孵化までのターン数。幼体は開いた安全経路を毎ターン1マス移動。小さな残像が次の位置を示す。孵化したターンには攻撃しない。',
        '縞模様は全危険マス。女王は3ターンごとに予告した3×3へ糸を放つ。幼体は次の位置と上下左右を攻撃。幼体を倒すとその予告も消える。',
        '「ターン終了」でのみ進行。同じターンの群れの合計ダメージは1、防御1で防げる。3ターンごとに空の巣へ卵を補充し、卵と幼体は合計3体まで。',
        '巣網は移動を妨げるが地雷や数字を変えない。迂回も可能。勝利で体力全回復とシールド+1、その階の報酬を獲得。',
      ],
      excavation: '未確認情報が残る最寄りの巣の周囲3×3を偵察。安全なマスを開き地雷をマーク。',
      victory: '女王撃破 · 体力全回復、シールド+1',
    }
  return {
    name: 'Brood Queen',
    turn: 'Turn',
    points: 'Action points',
    armor: 'Brood',
    exposed: 'Queen open to strikes',
    pylon: '',
    disabled: 'Cleared',
    danger: 'Warning: 1 swarm damage at end of turn',
    attack: 'Strike · 2 AP',
    brace: 'Brace · 1 AP',
    end: 'End turn',
    hint: 'Approach a web, egg or hatchling and click it to clear for 1 AP. Approach the queen to strike.',
    help: [
      'Each turn grants 3 AP. Moving costs 1 per cell. Striking the queen costs 2 and deals 2 base damage. Clear an adjacent web, egg or hatchling for 1 AP. Flags are free.',
      'Egg numbers count turns until hatching. Hatchlings take one step along revealed safe lanes each turn. Small ghosts show their next positions. New hatchlings do not attack on their hatching turn.',
      'Stripes show all danger cells. Every third turn the queen spits silk into an announced 3×3 area. Hatchlings attack their next position and its four neighbors. Intercepting one removes its forecast.',
      'Only End turn advances combat. Combined swarm damage is capped at 1 per turn, which Brace blocks for 1 AP. Empty nests receive eggs every third turn; eggs and hatchlings together are capped at three.',
      'Webs block routes without changing mines or clues; detours remain available. Victory restores full health and grants one shield before the floor reward.',
    ],
    excavation:
      'Scout the nearest nest with undiscovered information in its 3×3 area, opening safe clues and marking mines.',
    victory: 'Queen defeated · full health, +1 shield',
  }
}

/** Keep egg countdowns and the next reinforcement check visible outside the help dialog. */
export function broodStatus(language: Language, encounter: BroodEncounter): string {
  const next = 3 - ((encounter.turn - 1) % 3)
  return language === 'zh'
    ? `虫卵 ${encounter.eggs.length} · 幼虫 ${encounter.hatchlings.length} · ${next} 回合后补卵`
    : language === 'ja'
      ? `卵 ${encounter.eggs.length} · 幼体 ${encounter.hatchlings.length} · 補充まで${next}ターン`
      : `Eggs ${encounter.eggs.length} · Hatchlings ${encounter.hatchlings.length} · Reinforcements in ${next}`
}

/** Identify an actionable occupant and its complete public cost in pointer and keyboard labels. */
export function broodCellLabel(
  language: Language,
  encounter: BroodEncounter,
  index: number,
): string {
  const egg = encounter.eggs.find((entry) => entry.index === index)
  if (egg)
    return language === 'zh'
      ? `虫卵 · ${egg.turns} 回合后孵化 · 相邻清除 1 点`
      : language === 'ja'
        ? `卵 · 孵化まで${egg.turns}ターン · 隣接除去1`
        : `Egg · hatches in ${egg.turns} turns · clear adjacent for 1 AP`
  if (encounter.webs.includes(index))
    return language === 'zh'
      ? '蛛网 · 相邻清除 1 点'
      : language === 'ja'
        ? '巣網 · 隣接除去1'
        : 'Web · clear adjacent for 1 AP'
  return language === 'zh'
    ? '幼虫 · 相邻消灭 1 点'
    : language === 'ja'
      ? '幼体 · 隣接撃破1'
      : 'Hatchling · clear adjacent for 1 AP'
}
