import { storyTeachingStep, storyTeachingTarget } from '../game/story.js'
import { message } from '../i18n.js'
import type { StoryViewState } from '../types/story.js'
import { mountAnchoredLesson } from './anchored-lesson.js'

/** Coach actual prologue actions without opening a modal or advancing the lesson on a button. */
export function mountStoryLesson(root: HTMLElement, state: StoryViewState): () => void {
  const { run, language } = state
  if (
    !run ||
    state.panel ||
    state.service ||
    root.querySelector('dialog.story-dialogue, dialog[open]')
  )
    return () => {}

  const step = storyTeachingStep(run)
  const target = storyTeachingTarget(run)
  const frame = root.querySelector<HTMLElement>('.story-stage')
  if (!step || target === null || !frame) return () => {}

  const panel = document.createElement('section')
  const heading = document.createElement('strong')
  const paragraph = document.createElement('p')
  const order = { inspect: 1, flag: 2, open: 3, travel: 4 }

  panel.className = 'campaign-lesson story-lesson'
  panel.dataset['storyLesson'] = step
  panel.setAttribute('role', 'status')
  heading.textContent = message(language, 'story.lesson-title', { step: order[step] })

  switch (step) {
    case 'inspect':
      paragraph.textContent = message(language, 'story.lesson-inspect')
      break
    case 'flag':
      paragraph.textContent = state.touchInput
        ? message(language, 'story.flag-touch')
        : message(language, 'story.flag-mouse')
      break
    case 'open':
      paragraph.textContent = state.touchInput
        ? message(language, 'story.lesson-open-touch')
        : message(language, 'story.lesson-open-mouse')
      break
    case 'travel':
      paragraph.textContent = message(language, 'story.lesson-travel')
      break
  }

  panel.append(heading, paragraph)

  return mountAnchoredLesson(root, panel, `[data-story-cell="${target}"]`, {
    frame,
    viewport: frame,
    dock: root.querySelector<HTMLElement>('.story-dock'),
  })
}
