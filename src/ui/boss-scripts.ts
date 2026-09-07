import { message } from '../i18n.js'

import type { PrologueScript } from '../types/guidance.js'
import type { Language } from '../types/localization.js'
import type { EncounterKind } from '../types/tactical.js'

/** Character dialogue hints at counterplay without prescribing a button sequence. */
export function bossScript(kind: EncounterKind, language: Language): PrologueScript {
  if (kind === 'bastion')
    return {
      kind,
      title: message(language, 'boss-scripts.bastion-guardian'),
      subtitle: message(language, 'boss-scripts.the-door-that-learned-to-breathe'),
      sprite: 'bastion',
      prop: 'bastion-pylon',
      beats: [
        {
          speaker: 'scene',
          focus: 'field',
          line: message(language, 'boss-scripts.beyond-the-stairs-something-immense-draws-a'),
        },
        {
          speaker: 'boss',
          focus: 'boss',
          line: message(language, 'boss-scripts.no-one-passes-the-walls-remember-every'),
        },
        {
          speaker: 'player',
          focus: 'boss',
          line: message(language, 'boss-scripts.my-blade-rings-against-its-armor-not'),
        },
        {
          speaker: 'scene',
          focus: 'objective',
          line: message(language, 'boss-scripts.the-amber-light-brightens-the-guardian-s'),
        },
        {
          speaker: 'player',
          focus: 'objective',
          line: message(language, 'boss-scripts.one-feeds-the-blows-the-other-keeps'),
        },
        {
          speaker: 'boss',
          focus: 'field',
          line: message(language, 'boss-scripts.you-watch-the-lamps-instead-of-the'),
        },
        {
          speaker: 'player',
          focus: 'player',
          line: message(language, 'boss-scripts.then-i-will-read-the-floor-before'),
        },
        {
          speaker: 'scene',
          focus: 'boss',
          line: message(language, 'boss-scripts.the-guardian-settles-its-weight-both-lights'),
        },
      ],
    }
  if (kind === 'brood')
    return {
      kind,
      title: message(language, 'boss-scripts.brood-queen'),
      subtitle: message(language, 'boss-scripts.a-hunger-with-many-mouths'),
      sprite: 'brood-queen',
      prop: 'brood-nest',
      beats: [
        {
          speaker: 'scene',
          focus: 'field',
          line: message(language, 'boss-scripts.a-thread-catches-your-sleeve-then-another'),
        },
        {
          speaker: 'boss',
          focus: 'boss',
          line: message(language, 'boss-scripts.quiet-feet-warm-blood-you-have-come'),
        },
        {
          speaker: 'player',
          focus: 'boss',
          line: message(language, 'boss-scripts.the-wound-i-made-is-closing-something'),
        },
        {
          speaker: 'scene',
          focus: 'objective',
          line: message(language, 'boss-scripts.an-egg-rolls-from-the-nearest-nest'),
        },
        {
          speaker: 'player',
          focus: 'objective',
          line: message(language, 'boss-scripts.the-nests-are-more-than-nurseries-if'),
        },
        {
          speaker: 'boss',
          focus: 'field',
          line: message(language, 'boss-scripts.cut-the-silk-if-you-like-my'),
        },
        {
          speaker: 'player',
          focus: 'player',
          line: message(language, 'boss-scripts.i-can-see-their-shadows-gathering-ahead'),
        },
        {
          speaker: 'scene',
          focus: 'boss',
          line: message(language, 'boss-scripts.the-queen-lifts-herself-from-the-floor'),
        },
      ],
    }
  if (kind === 'mirror')
    return {
      kind,
      title: message(language, 'boss-scripts.mirror-twins'),
      subtitle: message(language, 'boss-scripts.an-answer-on-the-other-side'),
      sprite: 'mirror-dawn',
      prop: 'mirror-dusk',
      beats: [
        {
          speaker: 'scene',
          focus: 'field',
          line: message(language, 'boss-scripts.your-reflection-takes-one-more-step-after'),
        },
        {
          speaker: 'boss',
          focus: 'boss',
          line: message(language, 'boss-scripts.which-of-us-did-you-come-to'),
        },
        {
          speaker: 'player',
          focus: 'field',
          line: message(language, 'boss-scripts.the-rooms-share-a-shape-but-not'),
        },
        {
          speaker: 'scene',
          focus: 'objective',
          line: message(language, 'boss-scripts.a-seal-glows-in-the-amber-room'),
        },
        {
          speaker: 'player',
          focus: 'objective',
          line: message(language, 'boss-scripts.their-protection-comes-from-the-other-room'),
        },
        {
          speaker: 'boss',
          focus: 'boss',
          line: message(language, 'boss-scripts.a-repeated-blow-is-only-an-invitation'),
        },
        {
          speaker: 'player',
          focus: 'player',
          line: message(language, 'boss-scripts.then-i-change-partners-remember-where-i'),
        },
        {
          speaker: 'scene',
          focus: 'field',
          line: message(language, 'boss-scripts.the-mirror-clears-two-paths-wait-and'),
        },
      ],
    }
  if (kind === 'magnetic')
    return {
      kind,
      title: message(language, 'boss-scripts.magnetic-knight'),
      subtitle: message(language, 'boss-scripts.borrow-the-enemy-s-strength'),
      sprite: 'magnetic-knight',
      prop: 'magnetic-anchor',
      beats: [
        {
          speaker: 'scene',
          focus: 'field',
          line: message(language, 'boss-scripts.the-needle-in-your-compass-turns-sideways'),
        },
        {
          speaker: 'boss',
          focus: 'boss',
          line: message(language, 'boss-scripts.even-your-footsteps-belong-to-my-field'),
        },
        {
          speaker: 'player',
          focus: 'player',
          line: message(language, 'boss-scripts.my-boots-slide-before-i-lift-them'),
        },
        {
          speaker: 'scene',
          focus: 'objective',
          line: message(language, 'boss-scripts.a-buried-anchor-answers-the-pulse-with'),
        },
        {
          speaker: 'player',
          focus: 'objective',
          line: message(language, 'boss-scripts.those-scars-it-has-been-drawn-here'),
        },
        {
          speaker: 'boss',
          focus: 'field',
          line: message(language, 'boss-scripts.i-hear-that-little-anchor-singing-when'),
        },
        {
          speaker: 'player',
          focus: 'player',
          line: message(language, 'boss-scripts.the-pull-is-gathering-not-striking-yet'),
        },
        {
          speaker: 'scene',
          focus: 'boss',
          line: message(language, 'boss-scripts.the-knight-closes-its-fists-for-an'),
        },
      ],
    }
  return {
    kind,
    title: message(language, 'boss-scripts.clock-mage-clepsydra'),
    subtitle: message(language, 'boss-scripts.a-moment-left-behind'),
    sprite: 'clock-mage',
    prop: 'clock-hourglass',
    beats: [
      {
        speaker: 'scene',
        focus: 'field',
        line: message(language, 'boss-scripts.the-last-grain-of-sand-falls-upward'),
      },
      {
        speaker: 'boss',
        focus: 'boss',
        line: message(language, 'boss-scripts.do-not-hurry-i-have-already-reserved'),
      },
      {
        speaker: 'scene',
        focus: 'field',
        line: message(language, 'boss-scripts.a-mark-appears-beneath-your-feet-you'),
      },
      {
        speaker: 'player',
        focus: 'player',
        line: message(language, 'boss-scripts.it-has-chosen-a-place-and-a'),
      },
      {
        speaker: 'scene',
        focus: 'player',
        line: message(language, 'boss-scripts.your-hand-drops-but-the-outline-it'),
      },
      {
        speaker: 'player',
        focus: 'objective',
        line: message(language, 'boss-scripts.something-of-each-strike-stays-behind-and'),
      },
      {
        speaker: 'boss',
        focus: 'objective',
        line: message(language, 'boss-scripts.touch-my-clocks-if-you-must-borrowed'),
      },
      {
        speaker: 'player',
        focus: 'boss',
        line: message(language, 'boss-scripts.then-send-its-spell-back-to-shatter'),
      },
    ],
  }
}
