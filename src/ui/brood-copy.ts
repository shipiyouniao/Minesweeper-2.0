import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { BroodEncounter } from '../types/tactical.js'

/** Identify an actionable occupant and its complete public cost in pointer and keyboard labels. */
export function broodCellLabel(
  language: Language,
  encounter: BroodEncounter,
  index: number,
): string {
  const egg = encounter.eggs.find((entry) => entry.index === index)
  if (egg)
    return message(language, 'brood-copy.egg-hatches-in-turns-clear-adjacent-for', {
      p0: egg.turns,
    })

  if (encounter.webs.includes(index))
    return message(language, 'brood-copy.web-clear-adjacent-for-1-ap')

  return message(language, 'brood-copy.hatchling-clear-adjacent-for-1-ap')
}
