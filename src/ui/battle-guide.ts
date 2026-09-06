import { battleCopy, battleStatus } from './battle-presentation.js'
import { battleText } from './combat-build-copy.js'
import { combatStats } from '../game/combat-build.js'
import { spriteImage } from './dungeon-sprites.js'
import { bossSprite } from './tactical-sprites.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** A boss-specific reference built from the same rules copy as the live combat UI. */
export function battleGuide(language: Language, run: Expedition): string {
  const boss = run.encounter
  if (!boss) return ''
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const copy = battleCopy(language, boss.kind)
  const stats = combatStats(run)
  const titles =
    boss.kind === 'bastion'
      ? [
          t('Two controls, two effects', '两座机关，各有什么用', '2つの装置の効果'),
          t('Read the attack forecast', '先看攻击范围，再决定落脚点', '攻撃予告を読む'),
        ]
      : boss.kind === 'brood'
        ? [
            t('Cut off the nests', '先拆巢穴，断掉回血和护甲', '巣の補給を断つ'),
            t('Watch the hatchlings', '留意虫卵和幼虫', '卵と幼体に注意'),
          ]
        : boss.kind === 'mirror'
          ? [
              t('Compare both boards', '对照两边的数字', '両盤面を比較'),
              t('Break the opposite seal', '封印保护的是另一侧', '反対側を守る封印'),
              t('Switch realms', '切换镜域与位置', '鏡界と位置を切り替える'),
              t('Alternate your attacks', '交替攻击，避开反射', '交互に攻撃する'),
              t('Read each realm’s forecast', '两边的攻击范围不同', '各界の予告を読む'),
            ]
          : boss.kind === 'magnetic'
            ? [
                t('Read the magnetic field', '吸引、排斥与预计落点', '磁力と着地点'),
                t('Keep your footing', '稳住角色，避免撞墙踩雷', '足場を確保する'),
                t('Activate an anchor', '怎样启动锚点', '錨を起動する'),
                t('Withdraw before the charge', '趁蓄力时间撤离', '突進前に退避'),
                t('Crash and exposed core', '撞击、爆炸与破甲', '衝突・爆発・コア露出'),
              ]
            : [
                t('Watch the countdown', '看清每道法术的倒计时', '術の残りターン'),
                t('Let the echo follow up', '残影会补上一次攻击', '残像で追撃する'),
                t('Return a spell', '用沙漏把法术送回去', '砂時計で術を返す'),
              ]
  const start = boss.kind === 'mirror' ? 1 : 2
  return `<article class="battle-guide">
    <header class="battle-guide-hero">${spriteImage(bossSprite(boss))}<div><span>${t('OPPONENT', '当前对手', '対戦相手')}</span><h3>${copy.name}</h3><p>${battleStatus(language, boss)}</p></div></header>
    <section class="battle-guide-plan"><h3>${t('How to approach this fight', '这场战斗怎么打', '攻略の方針')}</h3><p>${copy.hint}</p></section>
    <ol class="battle-guide-flow">${[t('Read the forecast', '看攻击预告', '予告を確認'), t('Act and get to safety', '行动并避开危险', '行動して退避'), t('End turn to resolve', '结束回合后结算', '終了して解決')].map((label, index) => `<li><span>${index + 1}</span>${label}</li>`).join('')}</ol>
    <div class="battle-guide-cards">${titles.map((title, index) => `<section><span class="battle-guide-number">${String(index + 1).padStart(2, '0')}</span><h3>${title}</h3><p>${copy.help[start + index]}</p></section>`).join('')}</div>
    <section class="battle-guide-costs"><h3>${t('Action costs', '行动要花多少点', '行動コスト')}</h3><div>${[
      [t('Move / cell', '移动／格', '移動／マス'), '1'],
      [t('Reveal / extra', '揭格／额外', '開く／追加'), '1'],
      [t('Strike', '攻击', '攻撃'), '2'],
      [t('Brace', '防御', '防御'), '1'],
      [t('Flag', '插旗', '旗'), '0'],
    ]
      .map(([label, cost]) => `<span>${label}<strong>${cost}</strong></span>`)
      .join(
        '',
      )}</div><p>${t('Current attack / defense / AP per turn', '当前攻击／防御／每回合行动力', '現在の攻撃／防護／毎ターン行動力')} <strong>${stats.attack} / ${stats.defense} / ${stats.actions}</strong></p></section>
    <details class="battle-guide-rules"><summary>${t('Stats and other action costs', '属性与其他行动消耗', '能力値とその他の消費')}</summary><p>${copy.help[0]}</p></details>
    <details class="battle-guide-rules"><summary>${t('Damage, shields and victory', '伤害、护盾与战斗胜利', 'ダメージ・盾・勝利')}</summary><p>${battleCopy(language, 'bastion').help.at(-1)}</p></details>
  </article>`
}
