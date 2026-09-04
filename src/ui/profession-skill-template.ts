import { professionSkillAvailability } from '../game/profession-skills.js'
import { hasProfessionSkills } from '../game/professions.js'
import type { Expedition, Profession } from '../types/variants.js'
import type { Language } from '../types/localization.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSkillSprite } from './profession-presentation.js'
import { professionSkillCopy, professionSkillStatus } from './profession-skill-copy.js'
import { tacticalCopy } from './tactical-copy.js'

/** Show the selected career's active effect before committing to a departure. */
export function professionPreviewTemplate(language: Language, profession: Profession): string {
  const copy = professionSkillCopy(language, profession)
  return `<div class="profession-preview">${spriteImage(professionSkillSprite(profession))}<div><strong>${copy.name}</strong><p>${copy.note}</p><small>${professionSkillStatus(language, 'ready')}</small></div></div>`
}

/** Keep the skill's cost, once-per-floor state and activation together beside the inventory. */
export function professionSkillTemplate(language: Language, run: Expedition): string {
  if (!hasProfessionSkills(run.departure)) return ''
  const copy = professionSkillCopy(language, run.departure.profession)
  const note =
    run.encounter && run.departure.profession === 'archaeologist'
      ? tacticalCopy(language, run.encounter.kind).excavation
      : copy.note
  const status = professionSkillAvailability(run)
  return `<section class="profession-skill" aria-label="${copy.name}"><div class="profession-skill-heading"><button class="inventory-tool skill-button" data-control="skill" aria-label="${copy.name}" aria-describedby="skill-description skill-status" ${status === 'ready' && (!run.encounter || run.encounter.points > 0) ? '' : 'disabled'}>${spriteImage(professionSkillSprite(run.departure.profession))}</button><strong>${copy.name}</strong></div><p id="skill-description">${note}</p><p id="skill-status" role="status">${professionSkillStatus(language, status)}</p></section>`
}
