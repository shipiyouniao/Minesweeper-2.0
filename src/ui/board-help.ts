import { message } from '../i18n.js'
import type { BoardHelpCopy } from '../types/board-help.js'
import type { Language } from '../types/localization.js'

/** Keep control instructions complete in each supported language. */
function boardHelpCopy(language: Language): BoardHelpCopy {
  return {
    keyboard: message(language, 'board-help.keyboard'),
    note: message(language, 'board-help.note'),
    chord: message(language, 'board-help.chord'),
    expeditionChord: message(language, 'board-help.expeditionChord'),
    known: message(language, 'board-help.known'),
    triggered: message(language, 'board-help.triggered'),
    extensions: message(language, 'board-help.extensions'),
    vimium: message(language, 'board-help.vimium'),
    gestures: message(language, 'board-help.gestures'),
    edge: message(language, 'board-help.edge'),
  }
}

/** Put detailed notation and extension guidance in help rather than above the board. */
export function boardHelpTemplate(language: Language, expedition = false): string {
  const t = boardHelpCopy(language)
  return `<div class="board-help"><p>${t.keyboard}</p><ul><li>${t.note}</li><li>${t.chord}</li>${expedition ? `<li>${t.expeditionChord}</li><li>${t.known}</li><li>${t.triggered}</li>` : ''}</ul><details><summary>${t.extensions}</summary><p>${t.vimium}</p><p>${t.gestures}</p><p>${t.edge}</p></details></div>`
}
