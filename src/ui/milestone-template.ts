import { MILESTONES, milestoneProgress, milestoneValue } from '../game/milestones.js'
import { parseTitle } from '../game/title-effects.js'
import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { Camp } from '../types/variants.js'
import { combatSprite } from './combat-build-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { milestoneCopy } from './milestone-copy.js'
import { professionSprite } from './profession-presentation.js'
import { relicSprite } from './relic-presentation.js'
import { titleEffectCopy } from './title-copy.js'
import { equipmentCopy, professionCopy, relicCopy, variantCopy } from './variant-copy.js'

/** Count completed unclaimed goals for the selected camp navigation badge. */
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
  const claimed = milestoneProgress(camp).claimed
  const number = new Intl.NumberFormat(language)
  return `<p class="milestone-summary" role="status">${message(language, 'milestone-template.ready-to-claim')} · ${milestoneReadyCount(camp, kind)}</p>
    <div class="milestone-grid">${MILESTONES.filter((entry) => entry.kind === kind)
      .map((entry) => {
        const copy = milestoneCopy(language, entry.id)
        const value = Math.min(entry.target, milestoneValue(camp, entry))
        const done = claimed.includes(entry.id)
        const ready = value >= entry.target
        const reward = entry.reward
        const title = parseTitle(entry.id)
        const description =
          reward?.kind === 'profession'
            ? professionCopy(language, reward.id)
            : reward?.kind === 'equipment'
              ? equipmentCopy(language, reward.id)
              : reward
                ? relicCopy(language, reward.id)
                : null
        const sprite =
          reward?.kind === 'profession'
            ? professionSprite(reward.id)
            : reward?.kind === 'equipment'
              ? combatSprite(reward.id)
              : reward
                ? relicSprite(reward.id)
                : 'treasure'
        return `<article class="milestone-card ${done ? 'is-claimed' : ready ? 'is-ready' : ''}" data-milestone="${entry.id}">
        <div class="milestone-heading">${spriteImage(sprite)}<div><p class="eyebrow">${done ? message(language, 'milestone-template.claimed') : ready ? message(language, 'milestone-template.completed') : message(language, 'milestone-template.in-progress')}</p><h2>${copy.name}</h2></div></div>
        <p>${copy.note}</p><div class="milestone-progress"><progress max="${entry.target}" value="${value}" aria-label="${copy.name}"></progress><span>${number.format(value)} / ${number.format(entry.target)}</span></div>
        <div class="milestone-reward">${title ? `<span class="title-reward">✦ ${message(language, 'milestone-template.title')} · ${copy.name}</span><p class="title-reward-effect">${titleEffectCopy(language, title)}</p>` : ''}<strong>+${number.format(entry.supplies)} ${variantCopy(language).supplies}</strong>${description ? `<h3>${description.name}</h3><p>${description.note}</p>` : ''}</div>
        <button class="${ready && !done ? 'primary-button' : 'text-button'}" data-control="claim-milestone:${entry.id}" data-focus-fallback="camp-page:${kind}" ${done || !ready ? 'disabled' : ''}>${done ? message(language, 'milestone-template.claimed') : ready ? message(language, 'milestone-template.claim-reward') : message(language, 'milestone-template.keep-exploring')}</button>
      </article>`
      })
      .join('')}</div>`
}
