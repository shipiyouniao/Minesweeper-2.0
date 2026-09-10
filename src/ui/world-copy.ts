import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { StoryScene } from '../types/story.js'

/** Scene names are shared by physical doors, quest destinations and atlas nodes. */
export function worldSceneName(language: Language, id: StoryScene['id']): string {
  switch (id) {
    case 'awakening':
      return message(language, 'story.awakening')
    case 'trail':
      return message(language, 'story.trail')
    case 'approach':
      return message(language, 'story.approach')
    case 'camp':
      return message(language, 'story.camp')
    case 'north-road':
      return message(language, 'story.north-road')
    case 'quarry-yard':
      return message(language, 'story.quarry-yard')
    case 'quarry-passage':
      return message(language, 'story.quarry-passage')
    case 'quarry-machine':
      return message(language, 'story.quarry-machine')
    case 'tower-landing':
      return message(language, 'story.tower-landing')
    case 'northwest-bridge':
      return message(language, 'finale.bridge')
    case 'blockade-pass':
      return message(language, 'finale.pass')
  }
}
