import { MILESTONES, milestoneProgress, milestoneValue } from '../game/milestones.js'
import { battleText, combatSprite } from './combat-build-copy.js'
import { milestoneCopy } from './milestone-copy.js'
import { equipmentCopy, relicCopy, upgradeCopy, variantCopy } from './variant-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { relicSprite } from './relic-presentation.js'
import { shopSprite } from './camp-navigation.js'
import type { Camp } from '../types/variants.js'
import type { Language } from '../types/localization.js'

export function milestoneReadyCount(camp: Camp, kind: 'missions' | 'achievements'): number {
  return MILESTONES.filter(
    (entry) =>
      entry.kind === kind &&
      !milestoneProgress(camp).claimed.includes(entry.id) &&
      milestoneValue(camp, entry) >= entry.target,
  ).length
}

/** Keep every reward and its actual effect visible before the one-time claim. */
export function milestonesTemplate(
  language: Language,
  camp: Camp,
  kind: 'missions' | 'achievements',
): string {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const claimed = milestoneProgress(camp).claimed
  const number = new Intl.NumberFormat(language)
  return `<p class="variant-intro">${t('Progress carries across expeditions, including defeat and extraction. Claim each reward once at camp. Exclusive relics join future reward offers; equipment goes to your loadout.', '进度跨局保留，失败或撤离也不会清空。回营后每项奖励可领取一次。专属遗物加入之后远征的候选池，装备在出发装备中搭配。', '進捗は敗北・撤退後も残ります。報酬はキャンプで各1回受領。限定遺物は以後の候補に、装備は出発装備に追加。')}</p>
    <p class="milestone-summary" role="status">${t('Ready to claim', '可领取', '受領可能')} · ${milestoneReadyCount(camp, kind)}</p>
    <div class="milestone-grid">${MILESTONES.filter((entry) => entry.kind === kind)
      .map((entry) => {
        const copy = milestoneCopy(language, entry.id)
        const value = Math.min(entry.target, milestoneValue(camp, entry))
        const done = claimed.includes(entry.id)
        const ready = value >= entry.target
        const reward = entry.reward
        const description =
          reward?.kind === 'upgrade'
            ? upgradeCopy(language, reward.id)
            : reward?.kind === 'equipment'
              ? equipmentCopy(language, reward.id)
              : reward
                ? relicCopy(language, reward.id)
                : null
        const sprite =
          reward?.kind === 'upgrade'
            ? shopSprite(reward.id)
            : reward?.kind === 'equipment'
              ? combatSprite(reward.id)
              : reward
                ? relicSprite(reward.id)
                : 'treasure'
        const owned = reward?.kind === 'upgrade' && camp.upgrades.includes(reward.id)
        return `<article class="milestone-card ${done ? 'is-claimed' : ready ? 'is-ready' : ''}" data-milestone="${entry.id}">
        <div class="milestone-heading">${spriteImage(sprite)}<div><p class="eyebrow">${done ? t('Claimed', '已领取', '受領済み') : ready ? t('Completed', '已完成', '達成') : t('In progress', '进行中', '進行中')}</p><h2>${copy.name}</h2></div></div>
        <p>${copy.note}</p><div class="milestone-progress"><progress max="${entry.target}" value="${value}" aria-label="${copy.name}"></progress><span>${number.format(value)} / ${number.format(entry.target)}</span></div>
        <div class="milestone-reward"><strong>+${number.format(entry.supplies)} ${variantCopy(language).supplies}</strong>${description ? `<h3>${description.name}${owned ? ` · ${t('Already unlocked', '已拥有', '解放済み')}` : ''}</h3><p>${description.note}</p>` : ''}</div>
        <button class="${ready && !done ? 'primary-button' : 'text-button'}" data-control="claim-milestone:${entry.id}" data-focus-fallback="camp-page:${kind}" ${done || !ready ? 'disabled' : ''}>${done ? t('Claimed', '已领取', '受領済み') : ready ? t('Claim reward', '领取奖励', '報酬を受け取る') : t('Keep exploring', '继续探索', '探索を続けよう')}</button>
      </article>`
      })
      .join('')}</div>`
}
