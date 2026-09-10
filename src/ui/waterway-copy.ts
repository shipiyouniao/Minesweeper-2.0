import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { WaterwaySceneId } from '../types/waterway.js'
import type { SignalLine } from '../types/signal-story.js'

/** Name each fixed chamber independently of its growing board dimensions. */
export function waterwayFloorName(language: Language, floor: number): string {
  return floor === 1
    ? message(language, 'waterway.floor-1')
    : floor === 2
      ? message(language, 'waterway.floor-2')
      : message(language, 'waterway.floor-3')
}

/** Short conversations follow physical discoveries; the beacon is found on site. */
export function waterwayLines(language: Language, scene: WaterwaySceneId): readonly SignalLine[] {
  switch (scene) {
    case 'waterway-entry':
      return [
        { speaker: 'nia', text: message(language, 'waterway.entry-1') },
        { speaker: 'player', text: message(language, 'waterway.entry-2') },
        { speaker: 'nia', text: message(language, 'waterway.entry-3') },
      ]
    case 'waterway-drained':
      return [
        { speaker: 'nia', text: message(language, 'waterway.drained-1') },
        { speaker: 'player', text: message(language, 'waterway.drained-2') },
        { speaker: 'nia', text: message(language, 'waterway.drained-3') },
      ]
    case 'waterway-locks':
      return [
        { speaker: 'nia', text: message(language, 'waterway.locks-1') },
        { speaker: 'player', text: message(language, 'waterway.locks-2') },
        { speaker: 'nia', text: message(language, 'waterway.locks-3') },
      ]
    case 'waterway-call':
      return [
        { speaker: 'player', text: message(language, 'waterway.call-1') },
        { speaker: 'nia', text: message(language, 'waterway.call-2') },
        { speaker: 'player', text: message(language, 'waterway.call-3') },
      ]
    case 'waterway-found':
      return [
        { speaker: 'nia', text: message(language, 'waterway.found-1') },
        { speaker: 'player', text: message(language, 'waterway.found-2') },
        { speaker: 'guardian', text: message(language, 'waterway.found-3') },
        { speaker: 'player', text: message(language, 'waterway.found-4') },
        { speaker: 'guardian', text: message(language, 'waterway.found-5') },
        { speaker: 'nia', text: message(language, 'waterway.found-6') },
        { speaker: 'guardian', text: message(language, 'waterway.found-7') },
        { speaker: 'player', text: message(language, 'waterway.found-8') },
        { speaker: 'nia', text: message(language, 'waterway.found-9') },
      ]
    case 'waterway-camp':
      return [
        { speaker: 'lumi', text: message(language, 'waterway.camp-1') },
        { speaker: 'nia', text: message(language, 'waterway.camp-2') },
        { speaker: 'player', text: message(language, 'waterway.camp-3') },
        { speaker: 'lumi', text: message(language, 'waterway.camp-4') },
      ]
  }
}
