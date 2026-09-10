import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { SignalCopy, SignalLine, SignalSceneId } from '../types/signal-story.js'

/** Resolve concise mechanism labels from the shared, validated locale catalog. */
export function signalCopy(language: Language): SignalCopy {
  return {
    title: message(language, 'signal.title'),
    floors: [
      message(language, 'signal.floor-1'),
      message(language, 'signal.floor-2'),
      message(language, 'signal.floor-3'),
    ],
    relay: message(language, 'signal.relay'),
    gate: message(language, 'signal.gate'),
    released: message(language, 'signal.released'),
    ready: message(language, 'signal.ready'),
    solve: message(language, 'signal.solve'),
    record: message(language, 'signal.record'),
    optional: message(language, 'signal.optional'),
    continue: message(language, 'signal.continue'),
    nia: message(language, 'signal.nia'),
    player: message(language, 'signal.player'),
    lumi: message(language, 'signal.lumi'),
    guardian: message(language, 'signal.guardian'),
    complete: message(language, 'signal.complete'),
  }
}

/** Keep speaker order and outcome branches independent of the translated script. */
export function signalLines(
  language: Language,
  scene: SignalSceneId,
  recordSaved: boolean,
): readonly SignalLine[] {
  switch (scene) {
    case 'entry':
      return [
        { speaker: 'nia', text: message(language, 'signal.entry-1') },
        { speaker: 'player', text: message(language, 'signal.entry-2') },
        { speaker: 'lumi', text: message(language, 'signal.entry-3') },
      ]
    case 'connected':
      return [
        { speaker: 'nia', text: message(language, 'signal.connected-1') },
        { speaker: 'guardian', text: message(language, 'signal.connected-2') },
        { speaker: 'player', text: message(language, 'signal.connected-3') },
        { speaker: 'nia', text: message(language, 'signal.connected-4') },
      ]
    case 'archive':
      return [
        { speaker: 'nia', text: message(language, 'signal.archive-1') },
        { speaker: 'player', text: message(language, 'signal.archive-2') },
        { speaker: 'nia', text: message(language, 'signal.archive-3') },
      ]
    case 'record':
      return [
        { speaker: 'player', text: message(language, 'signal.record-1') },
        { speaker: 'nia', text: message(language, 'signal.record-2') },
      ]
    case 'prison':
      return [
        { speaker: 'nia', text: message(language, 'signal.prison-1') },
        { speaker: 'lumi', text: message(language, 'signal.prison-2') },
      ]
    case 'rescued':
      return [
        { speaker: 'guardian', text: message(language, 'signal.rescued-1') },
        { speaker: 'nia', text: message(language, 'signal.rescued-2') },
        {
          speaker: 'nia',
          text: recordSaved
            ? message(language, 'signal.rescued-3-saved')
            : message(language, 'signal.rescued-3-skipped'),
        },
      ]
    case 'camp':
      return [
        { speaker: 'nia', text: message(language, 'signal.camp-1') },
        {
          speaker: 'nia',
          text: recordSaved
            ? message(language, 'signal.camp-2-saved')
            : message(language, 'signal.camp-2-skipped'),
        },
        { speaker: 'player', text: message(language, 'signal.camp-3') },
        { speaker: 'nia', text: message(language, 'signal.camp-4') },
      ]
  }
}
