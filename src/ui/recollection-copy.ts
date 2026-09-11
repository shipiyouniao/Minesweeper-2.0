import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { SignalLine } from '../types/signal-story.js'
import type {
  RecollectionFloor,
  RegionalPerformanceId,
  RecollectionFloorCopy,
} from '../types/recollection.js'
import type { EncounterKind } from '../types/tactical.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'

/** Familiar chapter mechanisms keep concise names and concrete actions in every locale. */
export function recollectionFloorCopy(
  language: Language,
  kind: RecollectionFloor,
): RecollectionFloorCopy {
  switch (kind) {
    case 'ordinary':
      return {
        name: message(language, 'recollection.ordinary'),
        note: message(language, 'recollection.ordinary-note'),
      }
    case 'relay':
      return {
        name: message(language, 'recollection.relay'),
        note: message(language, 'recollection.relay-note'),
      }
    case 'routing':
      return {
        name: message(language, 'recollection.routing'),
        note: message(language, 'recollection.routing-note'),
      }
  }
}

/** Catalog portraits do not need fabricated tactical state merely to choose a sprite. */
export function recollectionBossSprite(kind: EncounterKind): DungeonSprite {
  switch (kind) {
    case 'bastion':
      return 'bastion'
    case 'brood':
      return 'brood-queen'
    case 'mirror':
      return 'mirror-dawn'
    case 'magnetic':
      return 'magnetic-knight'
    case 'clock':
      return 'clock-mage'
    case 'echo':
      return 'echo-warden'
    case 'matrix':
      return 'matrix-overseer'
    case 'tide':
      return 'tidekeeper'
  }
}

/** Follow the ferry clue through a short camp exchange, with the existing voiced cast. */
export function regionalLines(
  language: Language,
  scene: RegionalPerformanceId,
): readonly SignalLine[] {
  if (scene === 'reed-arrival')
    return [
      { speaker: 'player', text: message(language, 'recollection.arrival-1') },
      { speaker: 'nia', text: message(language, 'recollection.arrival-2') },
      { speaker: 'nia', text: message(language, 'recollection.arrival-3') },
      { speaker: 'player', text: message(language, 'recollection.arrival-4') },
      { speaker: 'nia', text: message(language, 'recollection.arrival-5') },
      { speaker: 'nia', text: message(language, 'recollection.arrival-6') },
    ]
  return [
    { speaker: 'player', text: message(language, 'recollection.light-1') },
    { speaker: 'nia', text: message(language, 'recollection.light-2') },
    { speaker: 'player', text: message(language, 'recollection.light-3') },
    { speaker: 'nia', text: message(language, 'recollection.light-4') },
    { speaker: 'player', text: message(language, 'recollection.light-5') },
  ]
}

/** The same generated lantern appears on its physical pier and in the preparation screen. */
export function recollectionLantern(): string {
  return `<img class="recollection-lantern" src="${import.meta.env.BASE_URL}assets/story/recollection-lantern.png" alt="" width="128" height="128" draggable="false">`
}
