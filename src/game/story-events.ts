import type { StoryDialogueId, StoryViewState } from '../types/story.js'

export const STORY_DIALOGUE_IDS: readonly StoryDialogueId[] = [
  'wake',
  'flag',
  'open',
  'travel',
  'trail',
  'satchel',
  'approach',
  'arrival',
  'guide',
  'road',
]

/** Stable event identity is independent of translated wording, portraits and DOM lifetime. */
export function storyDialogueEvent(state: StoryViewState): StoryDialogueId | null {
  const run = state.run
  if (state.service || run?.phase === 'fallen' || state.feedback === 'hurt') return null
  const active = state.progress.dialogue?.active?.id
  if (active && !state.progress.dialogue?.completed.includes(active)) {
    const scene =
      active === 'wake' || active === 'flag' || active === 'open' || active === 'travel'
        ? 0
        : active === 'trail' || active === 'satchel'
          ? 1
          : active === 'approach'
            ? 2
            : 3
    if (scene === (run?.floor ?? 3)) return active
  }
  const id: StoryDialogueId = !run
    ? state.conversation === 'road'
      ? 'road'
      : state.conversation === 'guide' || state.progress.completed.includes('meet-guide')
        ? 'guide'
        : 'arrival'
    : run.floor === 2
      ? 'approach'
      : run.floor === 1
        ? run.collected
          ? 'satchel'
          : 'trail'
        : !run.inspected
          ? 'wake'
          : !run.practicedFlag
            ? 'flag'
            : !run.practicedReveal
              ? 'open'
              : 'travel'
  return state.progress.dialogue?.completed.includes(id) ? null : id
}
