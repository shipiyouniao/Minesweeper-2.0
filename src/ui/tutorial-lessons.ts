import { message } from '../i18n.js'

import type { TutorialDefinition, TutorialStep } from '../types/guidance.js'
import type { Language } from '../types/localization.js'
import type { Ruleset } from '../types/variants.js'

/** Lessons teach one ruleset on deterministic practice boards, never a live saved run. */
export function tutorialLesson(mode: Ruleset, language: Language): TutorialDefinition {
  const cell = (
    title: string,
    text: string,
    index: number,
    side: 'a' | 'b' = 'a',
    mode: TutorialStep['mode'] = 'reveal',
  ): TutorialStep => ({ title, text, action: 'cell', index, side, mode })
  const first = cell(
    message(language, 'tutorial-lessons.a-quiet-first-step'),
    message(language, 'tutorial-lessons.open-the-glowing-square-empty-ground-opens'),
    0,
  )
  const number: TutorialStep = {
    title: message(language, 'tutorial-lessons.read-the-neighborhood'),
    text: message(language, 'tutorial-lessons.select-this-1-to-inspect-its-eight'),
    action: 'inspect',
    index: 3,
    side: 'a',
  }
  const flagMode: TutorialStep = {
    title: message(language, 'tutorial-lessons.one-button-four-actions'),
    text: message(language, 'tutorial-lessons.press-the-action-button-once-to-select'),
    action: 'mode',
    index: -1,
    side: 'a',
    mode: 'flag',
  }
  const flag = cell(
    message(language, 'tutorial-lessons.leave-a-reliable-mark'),
    message(language, 'tutorial-lessons.flag-the-glowing-covered-square-a-flag'),
    4,
    'a',
    'flag',
  )
  if (mode === 'survey')
    return {
      mode,
      title: message(language, 'survey.lesson-title'),
      steps: [
        flagMode,
        cell(
          message(language, 'survey.lesson-overlap-title'),
          message(language, 'survey.lesson-overlap'),
          2,
          'a',
          'flag',
        ),
        cell(
          message(language, 'survey.lesson-column-title'),
          message(language, 'survey.lesson-column'),
          1,
          'a',
          'flag',
        ),
        cell(
          message(language, 'survey.lesson-column-title'),
          message(language, 'survey.lesson-column-right'),
          3,
          'a',
          'flag',
        ),
        {
          title: message(language, 'survey.lesson-chord-title'),
          text: message(language, 'survey.lesson-chord-mode'),
          action: 'mode',
          index: -1,
          side: 'a',
          mode: 'chord',
        },
        cell(
          message(language, 'survey.lesson-chord-title'),
          message(language, 'survey.lesson-chord'),
          2,
          'a',
          'chord',
        ),
        {
          title: message(language, 'survey.lesson-gap-title'),
          text: message(language, 'survey.lesson-reveal-mode'),
          action: 'mode',
          index: -1,
          side: 'a',
          mode: 'reveal',
        },
        {
          ...cell(
            message(language, 'survey.lesson-gap-title'),
            message(language, 'survey.lesson-gap'),
            12,
          ),
          illustration: 'survey-gaps',
        },
      ],
      ending: message(language, 'survey.lesson-ending'),
    }
  if (mode === 'sonar')
    return {
      mode,
      title: message(language, 'tutorial-lessons.sonar-read-the-echoes'),
      steps: [
        first,
        {
          title: message(language, 'tutorial-lessons.clear-the-blur'),
          text: message(
            language,
            'tutorial-lessons.most-numbered-squares-are-obscured-select-sonar',
          ),
          action: 'scan',
          index: 3,
          side: 'a',
        },
        number,
        flagMode,
        flag,
      ],
      ending: message(language, 'tutorial-lessons.start-with-3-pulses-four-successful-safe'),
    }
  if (mode === 'classic')
    return {
      mode,
      title: message(language, 'tutorial-lessons.classic-first-field'),
      steps: [
        first,
        number,
        flagMode,
        flag,
        cell(
          message(language, 'tutorial-lessons.make-a-second-deduction'),
          message(language, 'tutorial-lessons.the-revealed-1-diagonally-above-right-of'),
          16,
          'a',
          'flag',
        ),
        {
          title: message(language, 'tutorial-lessons.open-a-safe-neighborhood'),
          text: message(language, 'tutorial-lessons.cycle-to-quick-open-you-will-pass'),
          action: 'mode',
          index: -1,
          side: 'a',
          mode: 'chord',
        },
        cell(
          message(language, 'tutorial-lessons.open-the-route'),
          message(language, 'tutorial-lessons.quick-open-this-1-its-flagged-neighbor'),
          11,
          'a',
          'chord',
        ),
        cell(
          message(language, 'tutorial-lessons.finish-with-confidence'),
          message(language, 'tutorial-lessons.use-quick-open-on-this-1-its'),
          15,
          'a',
          'chord',
        ),
      ],
      ending: message(language, 'tutorial-lessons.you-read-clues-marked-mines-and-opened'),
    }
  if (mode === 'twin')
    return {
      mode,
      title: message(language, 'tutorial-lessons.twin-two-sides-of-a-clue'),
      steps: [
        first,
        number,
        flagMode,
        flag,
        {
          title: message(language, 'tutorial-lessons.bring-the-discovery-across'),
          text: message(language, 'tutorial-lessons.the-two-boards-never-have-mines-at'),
          action: 'mode',
          index: -1,
          side: 'b',
          mode: 'reveal',
        },
        cell(
          message(language, 'tutorial-lessons.test-the-other-side'),
          message(language, 'tutorial-lessons.open-the-matching-glowing-square-on-b'),
          4,
          'b',
        ),
        {
          title: message(language, 'tutorial-lessons.keep-both-boards-in-view'),
          text: message(language, 'tutorial-lessons.select-the-matching-flag-on-a-once'),
          action: 'inspect',
          index: 4,
          side: 'a',
        },
      ],
      ending: message(language, 'tutorial-lessons.alternate-between-local-clues-and-proven-mines'),
    }
  return {
    mode,
    title: message(language, 'tutorial-lessons.expedition-leave-camp'),
    steps: [
      cell(
        message(language, 'tutorial-lessons.you-are-on-the-board'),
        message(language, 'tutorial-lessons.move-to-the-glowing-open-square-your'),
        7,
      ),
      cell(
        message(language, 'tutorial-lessons.explore-from-your-route'),
        message(language, 'tutorial-lessons.reveal-this-frontier-square-your-explorer-first'),
        15,
      ),
      {
        title: message(language, 'tutorial-lessons.your-profession-has-a-skill'),
        text: message(language, 'tutorial-lessons.use-explorer-s-light-it-surveys-the'),
        action: 'skill',
        index: -1,
        side: 'a',
      },
      {
        title: message(language, 'tutorial-lessons.a-probe-looks-ahead'),
        text: message(language, 'tutorial-lessons.select-the-probe-then-the-glowing-square'),
        action: 'probe',
        index: 4,
        side: 'a',
      },
      {
        title: message(language, 'tutorial-lessons.survey-a-whole-row'),
        text: message(language, 'tutorial-lessons.select-the-scanner-then-any-glowing-square'),
        action: 'scan',
        index: 22,
        side: 'a',
      },
      cell(
        message(language, 'tutorial-lessons.reach-the-treasure'),
        message(language, 'tutorial-lessons.walk-to-the-glowing-chest-to-collect'),
        13,
      ),
      cell(
        message(language, 'tutorial-lessons.choose-when-to-descend'),
        message(language, 'tutorial-lessons.select-the-stairs-deliberately-to-leave-the'),
        24,
      ),
    ],
    ending: message(language, 'tutorial-lessons.you-can-move-scout-collect-and-descend'),
  }
}
