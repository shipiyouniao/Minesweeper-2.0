import { message } from '../i18n.js'
import type { StoryDialogueBeat, StoryViewState } from '../types/story.js'

/** Brief exchanges respond to the scene while the current teaching objective stays beside them. */
export function storyDialogue(state: StoryViewState): readonly StoryDialogueBeat[] {
  const { language, run } = state
  if (!run) {
    if (state.conversation === 'road')
      return [{ speaker: 'lumi', line: message(language, 'story.road-line'), gesture: 'point' }]
    if (state.conversation === 'guide' || state.progress.completed.includes('meet-guide'))
      return [
        { speaker: 'player', line: message(language, 'story.home-question'), gesture: 'nod' },
        { speaker: 'lumi', line: message(language, 'story.guide-line'), gesture: 'steady' },
      ]
    return [
      ...(state.progress.completed.includes('lost-satchel')
        ? [
            {
              speaker: 'player' as const,
              line: message(language, 'story.return-bag'),
              gesture: 'offer' as const,
            },
          ]
        : []),
      { speaker: 'lumi', line: message(language, 'story.arrival-line'), gesture: 'greet' },
      { speaker: 'player', line: message(language, 'story.thanks'), gesture: 'nod' },
    ]
  }
  if (run.phase === 'fallen')
    return [{ speaker: 'lumi', line: message(language, 'story.fallen'), gesture: 'steady' }]
  if (state.feedback === 'hurt')
    return [{ speaker: 'lumi', line: message(language, 'story.hurt'), gesture: 'steady' }]
  if (run.floor === 1 && run.collected)
    return [
      { speaker: 'player', line: message(language, 'story.found-bag'), gesture: 'nod' },
      { speaker: 'lumi', line: message(language, 'story.keep-bag'), gesture: 'nod' },
    ]
  if (run.floor === 1)
    return [
      { speaker: 'player', line: message(language, 'story.other-world'), gesture: 'nod' },
      { speaker: 'lumi', line: message(language, 'story.trail-line'), gesture: 'point' },
    ]
  if (run.floor === 2)
    return [{ speaker: 'lumi', line: message(language, 'story.approach-line'), gesture: 'greet' }]
  if (!run.inspected)
    return [
      { speaker: 'player', line: message(language, 'story.where-am-i'), gesture: 'wake' },
      { speaker: 'lumi', line: message(language, 'story.wake-line'), gesture: 'greet' },
    ]
  if (!run.practicedFlag)
    return [{ speaker: 'lumi', line: message(language, 'story.flag-line'), gesture: 'point' }]
  if (!run.practicedReveal)
    return [{ speaker: 'lumi', line: message(language, 'story.open-line'), gesture: 'point' }]
  return [{ speaker: 'lumi', line: message(language, 'story.travel-line'), gesture: 'nod' }]
}
