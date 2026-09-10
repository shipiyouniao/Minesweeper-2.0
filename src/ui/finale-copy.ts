import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'
import type { FinaleSceneId } from '../types/chapter-finale.js'
import type { SignalLine } from '../types/signal-story.js'

/** One name per authored floor, independent of screen dimensions and current objective count. */
export function finaleFloorName(language: Language, run: Expedition): string {
  if (run.departure.campaign === 'tower-control-v1')
    return run.floor === 1
      ? message(language, 'finale.control-1')
      : run.floor === 2
        ? message(language, 'finale.control-2')
        : message(language, 'finale.control-3')
  return run.floor === 1
    ? message(language, 'finale.pass-1')
    : run.floor === 2
      ? message(language, 'finale.pass-2')
      : message(language, 'finale.pass-3')
}

/** Conversations respond to completed work; the guardian survives the repair encounter. */
export function finaleLines(language: Language, scene: FinaleSceneId): readonly SignalLine[] {
  switch (scene) {
    case 'control-entry':
      return [
        { speaker: 'nia', text: message(language, 'finale.control-entry-1') },
        { speaker: 'player', text: message(language, 'finale.control-entry-2') },
        { speaker: 'guardian', text: message(language, 'finale.control-entry-3') },
        { speaker: 'nia', text: message(language, 'finale.control-entry-4') },
      ]
    case 'control-line':
      return [
        { speaker: 'player', text: message(language, 'finale.control-line-1') },
        { speaker: 'nia', text: message(language, 'finale.control-line-2') },
        { speaker: 'player', text: message(language, 'finale.control-line-3') },
      ]
    case 'control-heart':
      return [
        { speaker: 'nia', text: message(language, 'finale.control-heart-1') },
        { speaker: 'guardian', text: message(language, 'finale.control-heart-2') },
        { speaker: 'player', text: message(language, 'finale.control-heart-3') },
      ]
    case 'control-restored':
      return [
        { speaker: 'nia', text: message(language, 'finale.control-restored-1') },
        { speaker: 'guardian', text: message(language, 'finale.control-restored-2') },
        { speaker: 'player', text: message(language, 'finale.control-restored-3') },
        { speaker: 'nia', text: message(language, 'finale.control-restored-4') },
      ]
    case 'pass-entry':
      return [
        { speaker: 'nia', text: message(language, 'finale.pass-entry-1') },
        { speaker: 'player', text: message(language, 'finale.pass-entry-2') },
      ]
    case 'pass-warning':
      return [
        { speaker: 'guardian', text: message(language, 'finale.pass-warning-1') },
        { speaker: 'player', text: message(language, 'finale.pass-warning-2') },
        { speaker: 'nia', text: message(language, 'finale.pass-warning-3') },
      ]
    case 'pass-guardian':
      return [
        { speaker: 'guardian', text: message(language, 'finale.pass-guardian-1') },
        { speaker: 'player', text: message(language, 'finale.pass-guardian-2') },
        { speaker: 'guardian', text: message(language, 'finale.pass-guardian-3') },
        { speaker: 'nia', text: message(language, 'finale.pass-guardian-4') },
      ]
    case 'pass-open':
      return [
        { speaker: 'nia', text: message(language, 'finale.pass-open-1') },
        { speaker: 'guardian', text: message(language, 'finale.pass-open-2') },
        { speaker: 'player', text: message(language, 'finale.pass-open-3') },
        { speaker: 'guardian', text: message(language, 'finale.pass-open-4') },
        { speaker: 'nia', text: message(language, 'finale.pass-open-5') },
        { speaker: 'guardian', text: message(language, 'finale.pass-open-6') },
        { speaker: 'player', text: message(language, 'finale.pass-open-7') },
        { speaker: 'guardian', text: message(language, 'finale.pass-open-8') },
        { speaker: 'player', text: message(language, 'finale.pass-open-9') },
        { speaker: 'nia', text: message(language, 'finale.pass-open-10') },
      ]
    case 'chapter-camp':
      return [
        { speaker: 'lumi', text: message(language, 'finale.chapter-camp-1') },
        { speaker: 'nia', text: message(language, 'finale.chapter-camp-2') },
        { speaker: 'player', text: message(language, 'finale.chapter-camp-3') },
        { speaker: 'lumi', text: message(language, 'finale.chapter-camp-4') },
        { speaker: 'player', text: message(language, 'finale.chapter-camp-5') },
      ]
  }
}
