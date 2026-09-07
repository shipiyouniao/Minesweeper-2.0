import { sharedStyles } from './shared-styles.js'
import { gameplayStyles } from './gameplay-styles.js'
import { currentWaymark, riftLandings } from '../game/mobility-skills.js'
import { professionSkillAvailability } from '../game/profession-skills.js'
import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { Expedition, Profession } from '../types/variants.js'
import { spriteImage } from './dungeon-sprites.js'
import { escapeHtml } from './presentation.js'
import { professionSkillSprite } from './profession-presentation.js'
import { professionSkillCopy, professionSkillStatus } from './profession-skill-copy.js'
import { tacticalCopy } from './tactical-copy.js'

/** Show the selected career's active effect before committing to a departure. */
export function professionPreviewTemplate(language: Language, profession: Profession): string {
  const copy = professionSkillCopy(language, profession)
  return `<div class="profession-preview ${sharedStyles['profession-preview']}">${spriteImage(professionSkillSprite(profession))}<div><strong>${copy.name}</strong><p>${copy.note}</p><small>${professionSkillStatus(language, 'ready')}</small></div></div>`
}

/** Keep the skill's cost, once-per-floor state and activation together beside the inventory. */
export function professionSkillTemplate(language: Language, run: Expedition): string {
  const copy = professionSkillCopy(language, run.departure.profession)
  const note =
    run.encounter && run.departure.profession === 'archaeologist'
      ? tacticalCopy(language, run.encounter.kind).excavation
      : copy.note
  const status = professionSkillAvailability(run)
  const rift = run.departure.profession === 'riftwalker'
  const ready = status === 'ready' && (!run.encounter || run.encounter.points > 0)

  const coordinate = (index: number): string =>
    `${Math.floor(index / run.game.config.width) + 1}, ${(index % run.game.config.width) + 1}`
  const anchor = currentWaymark(run)
  const state =
    run.departure.profession === 'waymarker' && !run.skillUsed
      ? `<p>${anchor === null ? message(language, 'profession-skill-template.next-use-place-anchor') : `${message(language, 'profession-skill-template.return-anchor-row-column')}：${coordinate(anchor)}`}</p>`
      : ''
  const targets =
    rift && !run.skillUsed
      ? `<div class="skill-landings ${sharedStyles['skill-landings']}">${riftLandings(run)
          .map(
            (index) =>
              `<button class="text-button ${sharedStyles['text-button']}" data-control="skill-target:${index}" data-focus-fallback="skill-panel" ${ready ? '' : 'disabled'}>${message(language, 'profession-skill-template.cross-to')} (${coordinate(index)})</button>`,
          )
          .join('')}</div>`
      : ''
  const reason =
    status === 'ready' && !ready
      ? message(language, 'profession-skill-template.not-enough-action-points-end-your-turn')
      : professionSkillStatus(language, status)
  return `<div class="dock-skill ${gameplayStyles['dock-skill']}"><button class="dock-slot inventory-tool ${sharedStyles['inventory-tool']} skill-button" data-control="skill" ${rift ? 'data-select-target="true"' : ''} aria-disabled="${!ready}" aria-label="${copy.name}" aria-describedby="skill-tooltip">${spriteImage(professionSkillSprite(run.departure.profession))}<strong>${copy.name}</strong></button><div class="skill-bubble ${gameplayStyles['skill-bubble']}" id="skill-tooltip" role="tooltip">${escapeHtml(ready ? note : reason)}</div><div class="dock-skill-panel ${gameplayStyles['dock-skill-panel']}" hidden><section class="profession-skill ${sharedStyles['profession-skill']}" data-control="skill-panel" tabindex="-1" aria-label="${copy.name}"><strong>${copy.name}</strong><p id="skill-description">${note}</p>${state}${targets}<p role="status">${reason}</p></section></div></div>`
}
