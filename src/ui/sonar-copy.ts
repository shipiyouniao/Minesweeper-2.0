import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { SonarMessages } from '../types/sonar-ui.js'

/** Keep instructional copy concise while giving the help dialog the complete rules. */
export function sonarCopy(language: Language): SonarMessages {
  /** Select authored copy without computed translation keys. */

  return {
    revealHint: message(language, 'sonar-copy.select-a-square-to-open-it'),
    title: message(language, 'sonar-copy.sonar'),
    intro: message(language, 'sonar-copy.scan-to-open-the-center-mines-become'),
    scan: message(language, 'sonar-copy.send-pulse'),
    charges: message(language, 'sonar-copy.pulses-left'),
    history: message(language, 'sonar-copy.echo-log'),
    empty: message(language, 'sonar-copy.your-readings-will-appear-here'),
    opening: message(language, 'sonar-copy.open-a-square-to-start'),
    aim: message(language, 'sonar-copy.choose-the-center-of-a-3-3'),
    duplicate: message(language, 'sonar-copy.already-scanned-reading-selected'),
    exhausted: message(language, 'sonar-copy.no-pulses-left-four-safe-excavations-recharge'),
    comparison: message(language, 'sonar-copy.compare-echoes'),
    compareHint: message(language, 'sonar-copy.select-two-readings-to-compare-their-regions'),
    exclusive: message(language, 'sonar-copy.exclusive-region'),
    shared: message(language, 'sonar-copy.shared-squares'),
    difference: message(language, 'sonar-copy.mine-difference-outside-the-overlap'),
    moves: message(language, 'sonar-copy.moves'),
    scans: message(language, 'sonar-copy.pulses-used'),
    reading: message(language, 'sonar-copy.echo'),
    mines: message(language, 'sonar-copy.mines'),
    help: message(language, 'sonar-copy.tutorial'),
    rankHint: message(language, 'sonar-copy.fewest-moves-first-fewer-pulses-break-ties'),
    noRecords: message(language, 'sonar-copy.your-first-clear-belongs-here'),
    recovered: message(language, 'sonar-copy.the-saved-puzzle-could-not-be-restored'),
    limit: message(language, 'sonar-copy.this-puzzle-reached-its-move-limit-start'),
    zoom: message(language, 'sonar-copy.enlarge-squares'),
    fit: message(language, 'sonar-copy.fit-board'),
    win: message(language, 'sonar-copy.every-echo-accounted-for'),
    loss: message(language, 'sonar-copy.one-echo-left-unanswered'),
    target: message(language, 'sonar-copy.scan-target'),
    helpSteps: [
      {
        title: message(language, 'sonar-copy.open-the-board'),
        note: message(language, 'sonar-copy.the-first-opening-and-its-neighbors-are'),
      },
      {
        title: message(language, 'sonar-copy.spend-a-pulse'),
        note: message(language, 'sonar-copy.choose-send-pulse-then-a-center-square'),
      },
      {
        title: message(language, 'sonar-copy.compare-two-echoes'),
        note: message(language, 'sonar-copy.select-two-log-entries-their-shared-squares'),
      },
      {
        title: message(language, 'sonar-copy.make-each-pulse-count'),
        note: message(language, 'sonar-copy.start-with-three-pulses-four-safe-excavation'),
      },
    ],
  }
}
