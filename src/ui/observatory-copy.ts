import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { ObservatorySceneId } from '../types/observatory.js'
import type { SignalLine } from '../types/signal-story.js'
import type { FloorPower, PowerReadiness } from '../types/floor-power.js'

/** Mechanism feedback is short enough to read while keeping the board in view. */
export function powerHint(
  language: Language,
  state: PowerReadiness,
  purpose: FloorPower['purpose'] = 'observation',
): string {
  switch (state) {
    case 'covered':
      return message(language, 'ridge.covered')
    case 'clue':
      return message(language, 'ridge.clue')
    case 'unpowered':
      return message(language, 'ridge.unpowered')
    case 'recorded':
      return purpose === 'drainage'
        ? message(language, 'waterway.recorded')
        : message(language, 'ridge.recorded')
    case 'ready':
      return message(language, 'ridge.ready')
  }
}

/** Use literal locale keys so every authored floor remains covered by translation checks. */
export function observatoryFloorName(language: Language, floor: number): string {
  return floor === 1
    ? message(language, 'ridge.floor-1')
    : floor === 2
      ? message(language, 'ridge.floor-2')
      : message(language, 'ridge.floor-3')
}

/** Script answers follow the observation just made; the ending gives a usable destination. */
export function observatoryLines(
  language: Language,
  scene: ObservatorySceneId,
): readonly SignalLine[] {
  switch (scene) {
    case 'ridge-entry':
      return [
        { speaker: 'nia', text: message(language, 'ridge.entry-1') },
        { speaker: 'player', text: message(language, 'ridge.entry-2') },
        { speaker: 'nia', text: message(language, 'ridge.entry-3') },
      ]
    case 'ridge-reading':
      return [
        { speaker: 'nia', text: message(language, 'ridge.reading-1') },
        { speaker: 'player', text: message(language, 'ridge.reading-2') },
        { speaker: 'nia', text: message(language, 'ridge.reading-3') },
      ]
    case 'ridge-pair':
      return [
        { speaker: 'nia', text: message(language, 'ridge.pair-1') },
        { speaker: 'player', text: message(language, 'ridge.pair-2') },
        { speaker: 'nia', text: message(language, 'ridge.pair-3') },
      ]
    case 'ridge-beacon':
      return [
        { speaker: 'nia', text: message(language, 'ridge.beacon-1') },
        { speaker: 'player', text: message(language, 'ridge.beacon-2') },
        { speaker: 'nia', text: message(language, 'ridge.beacon-3') },
      ]
    case 'ridge-found':
      return [
        { speaker: 'nia', text: message(language, 'ridge.found-1') },
        { speaker: 'player', text: message(language, 'ridge.found-2') },
        { speaker: 'nia', text: message(language, 'ridge.found-3') },
        { speaker: 'player', text: message(language, 'ridge.found-4') },
        { speaker: 'nia', text: message(language, 'ridge.found-5') },
      ]
    case 'ridge-camp':
      return [
        { speaker: 'nia', text: message(language, 'ridge.camp-1') },
        { speaker: 'player', text: message(language, 'ridge.camp-2') },
        { speaker: 'nia', text: message(language, 'ridge.camp-3') },
      ]
  }
}
