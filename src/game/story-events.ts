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
  'north-road-start',
  'north-road-found',
  'north-road-report',
  'quarry-lead',
  'spindle-found',
  'lift-repaired',
  'tower-arrival',
]

/** Stable event identity is independent of translated wording, portraits and DOM lifetime. */
export function storyDialogueEvent(state: StoryViewState): StoryDialogueId | null {
  const run = state.run
  if (state.service || run?.phase === 'fallen' || state.feedback === 'hurt') return null
  const seenEvents = state.progress.dialogue?.completed ?? []
  if (state.progress.completed.includes('survey-road') && !seenEvents.includes('quarry-lead'))
    return 'quarry-lead'
  if (run && run.floor >= 3) {
    if (state.progress.facts?.includes('lift-restored') && !seenEvents.includes('lift-repaired'))
      return 'lift-repaired'
    if (
      run.collected &&
      run.board.scene.id === 'quarry-machine' &&
      !seenEvents.includes('spindle-found')
    )
      return 'spindle-found'
    if (state.progress.facts?.includes('tower-reached') && !seenEvents.includes('tower-arrival'))
      return 'tower-arrival'
    if (run.floor > 3) return null
  }
  if (run?.board.scene.id === 'north-road') {
    const seen = state.progress.dialogue?.completed ?? []
    if (!seen.includes('north-road-start')) return 'north-road-start'
    return state.progress.facts?.includes('lift-discovered') && !seen.includes('north-road-found')
      ? 'north-road-found'
      : null
  }
  if (
    !run &&
    state.conversation === 'guide' &&
    state.progress.facts?.includes('lift-discovered') &&
    !state.progress.dialogue?.completed.includes('north-road-report')
  )
    return 'north-road-report'
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
