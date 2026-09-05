import { battleText } from './combat-build-copy.js'
import { oppositeMirror } from '../game/mirror-state.js'
import type { Language } from '../types/localization.js'
import type { MirrorEncounter, MirrorSide } from '../types/mirror.js'
import type { TacticalMessages } from '../types/tactical-ui.js'

/** Name realms consistently across boards, controls, enemy cards and accessible labels. */
export function mirrorName(language: Language, side: MirrorSide): string {
  return side === 'dawn'
    ? battleText(language, 'Dawn', '曙光', '暁')
    : battleText(language, 'Dusk', '暮影', '宵')
}

/** Explain the twins' own deduction and turn rules while sharing the combat stat vocabulary. */
export function mirrorCopy(language: Language, common: TacticalMessages): TacticalMessages {
  /** Select complete authored translations for the encounter's short instructions. */
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const hint = t(
    'Compare both realms. Disable each seal to expose the opposite twin, then alternate your strikes.',
    '对照两侧线索，关闭封印以解除另一侧的防御，再交替攻击双子。',
    '両界の手掛かりを比較。封印を止めて反対側の守りを解除し、交互に攻撃。',
  )
  return {
    ...common,
    name: t('Mirror Twins', '镜像双子', '鏡像の双子'),
    hint,
    pylon: t(
      'Mirror seal · protects the opposite twin',
      '镜像封印 · 保护另一侧的双子',
      '鏡の封印 · 反対側の双子を防護',
    ),
    disabled: t(
      'Seal disabled · opposite twin exposed',
      '封印已关闭 · 另一侧防御解除',
      '封印停止 · 反対側の守りを解除',
    ),
    help: [
      common.help[0]!,
      t(
        'The same coordinate cannot contain a mine in both realms. Compare clues and flags; gold confirmed mines automatically mark their counterparts safe. Ordinary flags remain your own hypotheses.',
        '同一坐标不会在两个镜域同时有雷。对照数字与旗帜推理；金色确认雷会把另一侧对应格标为安全，普通旗仍只是你的判断。',
        '同じ座標に両界とも地雷があることはない。数字と旗を比較して推理。金の確定旗は反対側を安全と表示するが、通常の旗は仮説のまま。',
      ),
      t(
        'Reveal a seal, correctly flag every neighboring mine, then approach and disable it for 1 AP. Each seal protects the other realm’s twin. Incorrect calibration deals 5 damage.',
        '揭开封印、正确标出周围所有雷，再靠近花 1 点关闭。每座封印保护另一侧的双子，校准错误受到 5 点伤害。',
        '封印を開き周囲の地雷を正しくマーク。接近して1行動力で停止すると反対側の双子が露出。調整失敗は5ダメージ。',
      ),
      t(
        'Shift costs 1 AP and resumes your last position in the other realm. The comparison board is read-only. Both positions are remembered; health, tools, skills and relic limits are shared.',
        '切换镜域花 1 点，回到另一侧上次停留的位置。对照棋盘仅供查看；两侧位置分别保留，生命、道具、技能次数和遗物限制共用。',
        '1行動力で反対側の前回位置へ転移。比較盤は閲覧専用。位置は各界で保持し、体力・道具・スキル回数・遺物の制限は共有。',
      ),
      t(
        'While both twins live, striking one activates its reflection until you strike the other. Defeating one cancels its forecast; the survivor loses reflection and its future attacks increase from 5 to 7 damage.',
        '双子都存活时，受击一方会进入反射状态，攻击另一方才能解除。击败一方会取消其预告；幸存者失去反射，后续伤害从 5 提至 7。',
        '両者生存中は被弾した側が反射状態になり、相手への攻撃で解除。片方を倒すとその予告は消える。生存者は反射を失うが、以後の威力が5から7に増加。',
      ),
      t(
        'Dawn alternates rows and columns; Dusk alternates diagonals. Every third turn both recharge without attacking. Forecasts stay fixed until End turn; only your active realm can hurt you. Shifting does not end the turn.',
        '曙光交替攻击横行与纵列，暮影交替攻击两条斜线；每第三回合双方蓄能，不攻击。预告在结束回合前固定，只有当前镜域会造成伤害，切换不会自动结束回合。',
        '暁は横列・縦列、宵は斜線を交互に攻撃。3ターンごとに両者が蓄力して休む。予告はターン終了まで固定で、現在の界からだけ被弾。転移だけではターンは進まない。',
      ),
      common.help.at(-1)!,
    ],
  }
}

/** Explain each twin's current gate independently of the player's distance or remaining AP. */
export function mirrorDefense(
  language: Language,
  encounter: MirrorEncounter,
  side: MirrorSide,
): string {
  const opposite = oppositeMirror(side)
  if (encounter[side].health === 0) return battleText(language, 'Defeated', '已击败', '撃破済み')
  if (encounter[opposite].seal.active)
    return battleText(
      language,
      `Protected by ${mirrorName(language, opposite)} seal`,
      `${mirrorName(language, opposite)}封印保护中`,
      `${mirrorName(language, opposite)}の封印で防護`,
    )
  if (encounter.lastStruck === side && encounter[opposite].health > 0)
    return battleText(
      language,
      'Reflecting · strike the other twin',
      '反射中 · 攻击另一位双子',
      '反射中 · もう一方を攻撃',
    )
  return battleText(language, 'Exposed', '可攻击', '攻撃可能')
}
