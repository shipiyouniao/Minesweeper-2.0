import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { RailSceneId } from '../types/floor-rail.js'
import type { SignalLine } from '../types/signal-story.js'

/** Short exchanges give the rescue its own stakes and a visible homecoming. */
export function railLines(language: Language, scene: RailSceneId): readonly SignalLine[] {
  switch (scene) {
    case 'rail-camp':
      return [
        { speaker: 'toma', text: message(language, 'rail.camp-1') },
        { speaker: 'player', text: message(language, 'rail.camp-2') },
        { speaker: 'toma', text: message(language, 'rail.camp-3') },
      ]
    case 'rail-entry':
      return [
        { speaker: 'toma', text: message(language, 'rail.entry-1') },
        { speaker: 'player', text: message(language, 'rail.entry-2') },
        { speaker: 'toma', text: message(language, 'rail.entry-3') },
        { speaker: 'player', text: message(language, 'rail.entry-4') },
      ]
    case 'rail-brakes':
      return [
        { speaker: 'toma', text: message(language, 'rail.brakes-1') },
        { speaker: 'player', text: message(language, 'rail.brakes-2') },
        { speaker: 'toma', text: message(language, 'rail.brakes-3') },
      ]
    case 'rail-rescue':
      return [
        { speaker: 'player', text: message(language, 'rail.rescue-1') },
        { speaker: 'toma', text: message(language, 'rail.rescue-2') },
        { speaker: 'player', text: message(language, 'rail.rescue-3') },
      ]
    case 'rail-home':
      return [
        { speaker: 'toma', text: message(language, 'rail.home-1') },
        { speaker: 'player', text: message(language, 'rail.home-2') },
        { speaker: 'toma', text: message(language, 'rail.home-3') },
        { speaker: 'player', text: message(language, 'rail.home-4') },
      ]
  }
}
