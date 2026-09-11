import { message } from '../i18n.js'
import type { StoryDialogueBeat, StoryViewState } from '../types/story.js'
import { storyDialogueEvent } from '../game/story-events.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'

/** Finished narrative events have no residual panel on the board. */
export function storyDialogueTemplate(state: StoryViewState): string {
  if (!storyDialogueEvent(state)) return ''
  return `<dialog class="story-dialogue" aria-labelledby="story-speaker-name"><div class="story-speakers"><span data-story-speaker="player">${spriteImage(professionSprite(state.run ? 'explorer' : state.loadout.profession))}</span><span data-story-speaker="lumi"><img class="story-guide" src="${import.meta.env.BASE_URL}assets/story/guide.png" alt="" draggable="false"></span></div><div class="story-dialogue-copy"><strong id="story-speaker-name" data-story-speaker-name></strong><p role="status" data-story-dialogue-line></p><button class="story-dialogue-next" data-story-action="dialogue">${message(state.language, 'story.dialogue-next')} →</button></div></dialog>`
}

/** Brief exchanges respond to the scene while the current teaching objective stays beside them. */
export function storyDialogue(state: StoryViewState): readonly StoryDialogueBeat[] {
  const { language, run } = state
  const event = storyDialogueEvent(state)
  if (event === 'quarry-brake')
    return [
      { speaker: 'player', line: message(language, 'story.brake-scene-1'), gesture: 'point' },
      { speaker: 'lumi', line: message(language, 'story.brake-scene-2'), gesture: 'steady' },
    ]

  if (event === 'quarry-release')
    return [
      { speaker: 'player', line: message(language, 'story.release-scene-1'), gesture: 'nod' },
      { speaker: 'lumi', line: message(language, 'story.release-scene-2'), gesture: 'point' },
    ]

  if (event === 'quarry-winch')
    return [
      { speaker: 'lumi', line: message(language, 'story.winch-scene-1'), gesture: 'point' },
      { speaker: 'player', line: message(language, 'story.winch-scene-2'), gesture: 'steady' },
    ]

  if (event === 'quarry-lead')
    return [{ speaker: 'lumi', line: message(language, 'story.quarry-lead'), gesture: 'point' }]

  if (event === 'spindle-found')
    return [{ speaker: 'lumi', line: message(language, 'story.spindle-found'), gesture: 'offer' }]

  if (event === 'lift-repaired')
    return [
      { speaker: 'player', line: message(language, 'story.lift-fixed'), gesture: 'nod' },
      { speaker: 'lumi', line: message(language, 'story.lift-answer'), gesture: 'point' },
    ]

  if (event === 'tower-arrival')
    return [{ speaker: 'lumi', line: message(language, 'story.tower-arrival'), gesture: 'point' }]

  if (event === 'north-road-start')
    return [
      { speaker: 'lumi', line: message(language, 'story.north-start-1'), gesture: 'point' },
      { speaker: 'player', line: message(language, 'story.north-start-2'), gesture: 'nod' },
    ]

  if (event === 'north-road-found')
    return [
      { speaker: 'player', line: message(language, 'story.north-found-1'), gesture: 'point' },
      { speaker: 'lumi', line: message(language, 'story.north-found-2'), gesture: 'steady' },
    ]

  if (event === 'north-road-report')
    return [
      { speaker: 'player', line: message(language, 'story.north-report-1'), gesture: 'nod' },
      { speaker: 'lumi', line: message(language, 'story.north-report-2'), gesture: 'point' },
    ]

  if (!run) {
    if (storyDialogueEvent(state) === 'road')
      return [{ speaker: 'lumi', line: message(language, 'story.road-line'), gesture: 'point' }]

    if (state.conversation === 'guide' || state.progress.completed.includes('meet-guide'))
      return [
        { speaker: 'player', line: message(language, 'story.home-question'), gesture: 'nod' },
        { speaker: 'lumi', line: message(language, 'story.guide-line'), gesture: 'steady' },
        { speaker: 'player', line: message(language, 'story.go-together'), gesture: 'offer' },
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

  // The event also owns restored beats and actions completed ahead of the suggested order.
  if (event === 'wake')
    return [
      { speaker: 'player', line: message(language, 'story.where-am-i'), gesture: 'wake' },
      { speaker: 'lumi', line: message(language, 'story.wake-line'), gesture: 'greet' },
    ]

  if (event === 'flag')
    return [
      {
        speaker: 'lumi',
        line:
          message(language, 'story.flag-line') +
          ' ' +
          (state.touchInput
            ? message(language, 'story.flag-touch')
            : message(language, 'story.flag-mouse')),
        gesture: 'point',
      },
    ]

  if (event === 'open')
    return [
      {
        speaker: 'lumi',
        line:
          message(language, 'story.open-line') +
          ' ' +
          (state.touchInput
            ? message(language, 'story.chord-touch')
            : message(language, 'story.chord-mouse')),
        gesture: 'point',
      },
    ]

  return event === 'travel'
    ? [{ speaker: 'lumi', line: message(language, 'story.travel-line'), gesture: 'nod' }]
    : []
}
