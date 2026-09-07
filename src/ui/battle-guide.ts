import { battleCopy } from './battle-presentation.js'
import { battleText } from './combat-build-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { bossSprite } from './tactical-sprites.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'
import type { BattleGuideStep } from '../types/guidance.js'

/** Three illustrated actions describe the fight; detailed reference stays collapsed. */
export function battleGuide(language: Language, run: Expedition): string {
  const boss = run.encounter
  if (!boss) return ''
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const step = (
    en: string,
    zh: string,
    ja: string,
    prop: DungeonSprite,
    symbol: string,
  ): BattleGuideStep => ({ text: t(en, zh, ja), prop, symbol })
  const steps =
    boss.kind === 'bastion'
      ? [
          step(
            'Flag the mines around both pylons, then disable them.',
            '先给两座塔周围的雷插旗，再关闭塔。',
            '両方の塔の周囲に旗を立て、塔を停止。',
            'bastion-pylon',
            '⚑',
          ),
          step(
            'Approach the core and activate it to open an attack window.',
            '靠近核心并启动，打开攻击窗口。',
            'コアに接近して起動し、攻撃の隙を作る。',
            'bastion-core',
            '↗',
          ),
          step(
            'Strike while exposed; leave the red cells before ending your turn.',
            '趁破绽攻击，结束回合前离开红格。',
            '隙に攻撃。終了前に赤いマスから退避。',
            'bastion-strike',
            '→',
          ),
        ]
      : boss.kind === 'brood'
        ? [
            step(
              'Flag nearby mines and destroy a nest to remove immunity.',
              '给巢穴周围的雷插旗，拆巢解除免伤。',
              '巣の周囲に旗を立て、破壊して無敵を解除。',
              'brood-nest',
              '⚑',
            ),
            step(
              'Fewer nests mean less armor and healing. Approach and strike.',
              '巢穴越少，护甲和回血越弱。靠近女王攻击。',
              '巣が減ると防護と回復も低下。接近して攻撃。',
              'brood-queen',
              '→',
            ),
            step(
              'Clear eggs before they hatch, and avoid the marked attacks.',
              '虫卵可以提前清理，落脚时避开攻击预告。',
              '卵は孵化前に除去可能。攻撃予告を避ける。',
              'brood-egg',
              '×',
            ),
          ]
        : boss.kind === 'mirror'
          ? [
              step(
                'Compare the boards: a mine on one side means safety on the other.',
                '对照两块棋盘：一边是雷，另一边就是安全格。',
                '両盤面を比較。一方が地雷なら他方は安全。',
                'mirror-rift',
                '⇄',
              ),
              step(
                'Disable a seal to expose the twin in the opposite realm.',
                '关掉这边的封印，才能攻击另一边的双子。',
                'こちらの封印を解除し、反対側の双子を攻撃。',
                'mirror-seal',
                '⇄',
              ),
              step(
                'Strike, switch realms, strike the other twin. Check both forecasts.',
                '打一下就换边，交替攻击；两边的预告都要看。',
                '一撃ごとに転移して交互に攻撃。両側の予告を確認。',
                'mirror-dusk',
                '⇄',
              ),
            ]
          : boss.kind === 'magnetic'
            ? [
                step(
                  'Open a route to an anchor, then activate it to lure the boss.',
                  '揭开通向锚点的路，启动锚点引诱首领。',
                  '錨まで道を開き、起動してボスを誘導。',
                  'magnetic-anchor',
                  '→',
                ),
                step(
                  'Use the preparation turn to leave the anchor’s 3 × 3 blast area.',
                  '趁蓄力的回合，撤出锚点周围 3 × 3 爆炸区。',
                  '溜めのターンに錨の3 × 3爆発範囲から退避。',
                  'magnetic-anchor',
                  '↗',
                ),
                step(
                  'The crash breaks its armor. Approach and strike before it recovers.',
                  '撞击后护甲破开，趁恢复前靠近攻击。',
                  '衝突で装甲が破れる。回復前に接近して攻撃。',
                  'magnetic-knight',
                  '→',
                ),
              ]
            : [
                step(
                  'Approach a revealed hourglass and return a spell to break the barrier.',
                  '靠近已揭开的沙漏，转送法术，解除首领护罩。',
                  '開いた砂時計に接近。術を返送して障壁を解除。',
                  'clock-hourglass',
                  '↗',
                ),
                step(
                  'Strike, then leave your echo. It repeats the full damage at turn end.',
                  '打完离开残影格，回合结束追加等额伤害。',
                  '攻撃後に残像から離れると、終了時に同じダメージで追撃。',
                  'player',
                  '→',
                ),
                step(
                  'Leave the marked cells before the countdown reaches zero.',
                  '看准倒计时，在法术落下前离开标记格。',
                  '残りターンを確認し、発動前に印から退避。',
                  'clock-hourglass',
                  '↗',
                ),
              ]
  const copy = battleCopy(language, boss.kind)
  return `<article class="battle-guide battle-guide-visual"><header class="battle-guide-hero">${spriteImage(bossSprite(boss))}<div><h3>${copy.name}</h3><p>${t('Three moves to learn the fight', '看懂这三步就能开打', '3つの手順で戦い方を覚える')}</p></div></header><ol class="boss-picture-steps">${steps
    .map(
      (entry, index) =>
        `<li><div class="boss-mini-board" aria-hidden="true">${Array.from(
          { length: 15 },
          (_, cell) => {
            const retreat =
              (boss.kind === 'clock' && index > 0) ||
              (boss.kind === 'magnetic' && index === 1) ||
              (index === 2 && boss.kind !== 'mirror')
            const danger = retreat && [6, 7, 8, 11, 12, 13].includes(cell)
            return `<span class="${danger ? 'mini-danger' : ''} ${boss.kind === 'clock' && index === 1 && cell === 7 ? 'mini-echo' : ''}">${cell === (retreat ? 0 : 5) ? spriteImage('player') : cell === 7 ? spriteImage(entry.prop) : cell === 9 ? spriteImage(bossSprite(boss)) : retreat && cell === 5 ? '↑' : !retreat && (cell === 6 || cell === 8) ? entry.symbol : danger && cell === 12 ? '!' : ''}</span>`
          },
        ).join('')}</div><p><b>${index + 1}</b>${entry.text}</p></li>`,
    )
    .join(
      '',
    )}</ol><p class="boss-cost-line">${t('Move 1 / cell · Reveal +1 · Strike 2 · Brace 1 · Flag 0 AP', '移动每格 1 点 · 揭格额外 1 点 · 攻击 2 点 · 防御 1 点 · 插旗免费', '移動1/マス · 開く+1 · 攻撃2 · 防御1 · 旗0')}</p><details class="battle-guide-rules"><summary>${t('Full rules', '详细规则', '詳しいルール')}</summary>${copy.help.map((line) => `<p>${line}</p>`).join('')}</details></article>`
}
