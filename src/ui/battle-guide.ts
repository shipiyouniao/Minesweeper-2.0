import { guidanceStyles } from './guidance-styles.js'
import { message } from '../i18n.js'
import { battleCopy } from './battle-presentation.js'

import type { BattleGuideStep } from '../types/guidance.js'
import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'
import { spriteImage } from './dungeon-sprites.js'
import { bossSprite } from './tactical-sprites.js'

/** Three illustrated actions describe the fight; detailed reference stays collapsed. */
export function battleGuide(language: Language, run: Expedition): string {
  const boss = run.encounter
  if (!boss) return ''

  const steps: readonly BattleGuideStep[] =
    boss.kind === 'tide'
      ? [
          { text: message(language, 'tide.deduce'), prop: 'tide-core', symbol: '2' },
          { text: message(language, 'tide.anchor-hint'), prop: 'tide-anchor', symbol: '⚓' },
          { text: message(language, 'tide.fight'), prop: 'tidekeeper', symbol: '→' },
        ]
      : boss.kind === 'matrix'
        ? [
            { text: message(language, 'matrix.deduce'), prop: 'matrix-observe', symbol: '1 1' },
            { text: message(language, 'matrix.calibrate'), prop: 'attune', symbol: '◇' },
            { text: message(language, 'matrix.fight'), prop: 'matrix-overseer', symbol: '→' },
          ]
        : boss.kind === 'echo'
          ? [
              { text: message(language, 'echo.locate'), prop: 'sonar', symbol: '◎' },
              { text: message(language, 'echo.shell'), prop: 'echo-warden', symbol: '↗' },
              { text: message(language, 'echo.fight'), prop: 'bastion-strike', symbol: '→' },
            ]
          : boss.kind === 'bastion'
            ? [
                {
                  text: message(language, 'battle-guide.flag-the-mines-around-both-pylons-then'),
                  prop: 'bastion-pylon',
                  symbol: '⚑',
                },
                {
                  text: message(language, 'battle-guide.approach-the-core-and-activate-it-to'),
                  prop: 'bastion-core',
                  symbol: '↗',
                },
                {
                  text:
                    boss.pattern === 'pursuit'
                      ? message(language, 'finale.guardian-pressure')
                      : message(language, 'battle-guide.strike-while-exposed-leave-the-red-cells'),
                  prop: 'bastion-strike',
                  symbol: '→',
                },
              ]
            : boss.kind === 'brood'
              ? [
                  {
                    text: message(language, 'battle-guide.flag-nearby-mines-and-destroy-a-nest'),
                    prop: 'brood-nest',
                    symbol: '⚑',
                  },
                  {
                    text: message(language, 'battle-guide.fewer-nests-mean-less-armor-and-healing'),
                    prop: 'brood-queen',
                    symbol: '→',
                  },
                  {
                    text: message(language, 'battle-guide.clear-eggs-before-they-hatch-and-avoid'),
                    prop: 'brood-egg',
                    symbol: '×',
                  },
                ]
              : boss.kind === 'mirror'
                ? [
                    {
                      text: message(language, 'battle-guide.compare-the-boards-a-mine-on-one'),
                      prop: 'mirror-rift',
                      symbol: '⇄',
                    },
                    {
                      text: message(language, 'battle-guide.disable-a-seal-to-expose-the-twin'),
                      prop: 'mirror-seal',
                      symbol: '⇄',
                    },
                    {
                      text: message(
                        language,
                        'battle-guide.strike-switch-realms-strike-the-other-twin',
                      ),
                      prop: 'mirror-dusk',
                      symbol: '⇄',
                    },
                  ]
                : boss.kind === 'magnetic'
                  ? [
                      {
                        text: message(language, 'battle-guide.open-a-route-to-an-anchor-then'),
                        prop: 'magnetic-anchor',
                        symbol: '→',
                      },
                      {
                        text: message(
                          language,
                          'battle-guide.use-the-preparation-turn-to-leave-the',
                        ),
                        prop: 'magnetic-anchor',
                        symbol: '↗',
                      },
                      {
                        text: message(
                          language,
                          'battle-guide.the-crash-breaks-its-armor-approach-and',
                        ),
                        prop: 'magnetic-knight',
                        symbol: '→',
                      },
                    ]
                  : [
                      {
                        text: message(
                          language,
                          'battle-guide.approach-a-revealed-hourglass-and-return-a',
                        ),
                        prop: 'clock-hourglass',
                        symbol: '↗',
                      },
                      {
                        text: message(
                          language,
                          'battle-guide.strike-then-leave-your-echo-it-repeats',
                        ),
                        prop: 'player',
                        symbol: '→',
                      },
                      {
                        text: message(
                          language,
                          'battle-guide.leave-the-marked-cells-before-the-countdown',
                        ),
                        prop: 'clock-hourglass',
                        symbol: '↗',
                      },
                    ]
  const copy = battleCopy(language, boss.kind)
  return `<article class="battle-guide ${guidanceStyles['battle-guide']} battle-guide-visual"><header class="battle-guide-hero ${guidanceStyles['battle-guide-hero']}">${spriteImage(bossSprite(boss))}<div><h3>${copy.name}</h3><p>${message(language, 'battle-guide.three-moves-to-learn-the-fight')}</p></div></header><ol class="boss-picture-steps ${guidanceStyles['boss-picture-steps']}">${steps
    .map(
      (entry, index) =>
        `<li><div class="boss-mini-board ${guidanceStyles['boss-mini-board']}" aria-hidden="true">${Array.from(
          { length: 15 },
          (_, cell) => {
            const retreat =
              (boss.kind === 'clock' && index > 0) ||
              (boss.kind === 'magnetic' && index === 1) ||
              (index === 2 && boss.kind !== 'mirror')
            const pursuit = boss.kind === 'bastion' && boss.pattern === 'pursuit' && index === 2
            const danger =
              retreat && (pursuit ? [2, 5, 6, 7, 8, 9, 12] : [6, 7, 8, 11, 12, 13]).includes(cell)
            return `<span class="${danger ? 'mini-danger' : ''} ${boss.kind === 'clock' && index === 1 && cell === 7 ? 'mini-echo' : ''}">${cell === (pursuit ? 1 : retreat ? 0 : 5) ? spriteImage('player') : cell === 7 ? spriteImage(entry.prop) : cell === 9 ? spriteImage(bossSprite(boss)) : retreat && cell === (pursuit ? 6 : 5) ? '↑' : !retreat && (cell === 6 || cell === 8) ? entry.symbol : danger && cell === 12 ? '!' : ''}</span>`
          },
        ).join('')}</div><p><b>${index + 1}</b>${entry.text}</p></li>`,
    )
    .join(
      '',
    )}</ol><p class="boss-cost-line ${guidanceStyles['boss-cost-line']}">${message(language, 'battle-guide.move-1-cell-reveal-1-strike-2')}</p><details class="battle-guide-rules ${guidanceStyles['battle-guide-rules']}"><summary>${message(language, 'battle-guide.full-rules')}</summary>${copy.help.map((line) => `<p>${line}</p>`).join('')}</details></article>`
}
