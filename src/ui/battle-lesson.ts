import { lessonSafeMove, lessonTurnSafe } from '../game/battle-lesson.js'
import { tacticalCellAction, tacticalPlan } from '../game/tactical-planning.js'
import { message } from '../i18n.js'
import { mountAnchoredLesson } from './anchored-lesson.js'
import type { BattleLesson } from '../types/battle-lesson.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** Coach the real board with real inputs; the guide never advances time or changes health. */
export function mountBattleLesson(
  root: HTMLElement,
  run: Expedition,
  language: Language,
  step: BattleLesson,
  change: (next: BattleLesson) => void,
): () => void {
  const encounter = run.encounter
  if (!encounter || step === 'done') return () => {}

  const safe = lessonSafeMove(run)
  const danger = !lessonTurnSafe(run)
  const strike = tacticalCellAction(run, encounter.boss)
  const canAttack = strike.type === 'attack' && tacticalPlan(run, strike).allowed
  let target = '[data-control="end-turn"] small'
  let copy = message(language, 'battle-lesson.points')
  switch (step) {
    case 'move':
      target = safe === null ? '[data-control="help"]' : `[data-side="a"] [data-cell="${safe}"]`
      copy =
        safe === null
          ? message(language, 'battle-lesson.no-move')
          : message(language, 'battle-lesson.move')
      break
    case 'turn':
      target = danger
        ? safe === null
          ? '[data-control="help"]'
          : `[data-side="a"] [data-cell="${safe}"]`
        : '[data-control="end-turn"]'
      copy = danger
        ? safe === null
          ? message(language, 'battle-lesson.no-move')
          : message(language, 'battle-lesson.dodge')
        : message(language, 'battle-lesson.turn')
      break
    case 'combat':
      target = '[data-control="help"]'
      copy = message(language, 'battle-lesson.combat')
      break
    case 'attack':
      target = canAttack ? '[data-control="attack"]' : '[data-control="help"]'
      copy = canAttack
        ? message(language, 'battle-lesson.attack')
        : message(language, 'battle-lesson.prepare')
      break
  }

  const panel = document.createElement('section')
  if ((step === 'combat' || (step === 'attack' && !canAttack)) && encounter.kind === 'bastion') {
    const pylon = encounter.pylons.find((entry) => entry.active)

    target = `[data-side="a"] [data-cell="${pylon?.index ?? encounter.boss}"]`
    copy = pylon
      ? message(language, 'battle-lesson.guardian-pylon')
      : strike.type === 'interact'
        ? message(language, 'battle-lesson.guardian-core')
        : message(language, 'battle-lesson.guardian-approach')
  }

  panel.className = 'campaign-lesson battle-lesson'
  panel.dataset['battleLesson'] = step
  panel.setAttribute('aria-live', 'polite')

  const heading = document.createElement('strong')

  heading.textContent = message(language, 'battle-lesson.title')

  const paragraph = document.createElement('p')

  paragraph.textContent = copy
  panel.append(heading, paragraph)
  if (step === 'points' || step === 'combat') {
    const next = document.createElement('button')

    next.type = 'button'
    next.dataset['battleNext'] = ''
    next.textContent = message(language, 'campaign.lesson-begin')
    next.addEventListener('click', () => change(step === 'points' ? 'move' : 'attack'))
    panel.append(next)
  }

  const skip = document.createElement('button')

  skip.type = 'button'
  skip.dataset['battleSkip'] = ''
  skip.textContent = message(language, 'campaign.lesson-skip')
  skip.addEventListener('click', () => change('done'))
  panel.append(skip)

  return mountAnchoredLesson(root, panel, target)
}
