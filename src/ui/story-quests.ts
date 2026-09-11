import { storyAtlasIndex } from '../game/story-atlas.js'
import { storyTaskLocation } from '../game/story-task-location.js'
import { worldSceneName } from './world-copy.js'
import { message, translations } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { StoryTask, StoryViewState } from '../types/story.js'
import { storyMap } from './story-map.js'

/** Resolve an authored task to its localized journal title. */
export function storyTaskName(language: Language, id: StoryTask): string {
  if (id === 'rescue-toma') return message(language, 'rail.task')

  if (id === 'restore-west-line') return message(language, 'finale.control-task')

  if (id === 'open-blockade') return message(language, 'finale.pass-task')

  if (id === 'find-beacon') return message(language, 'waterway.task')

  if (id === 'survey-ridge') return message(language, 'ridge.task')

  if (id === 'repair-lift') return message(language, 'story.repair-task')

  if (id === 'reach-tower') return message(language, 'story.climb-task')

  if (id === 'survey-road') return message(language, 'story.road-task')

  return id === 'reach-camp'
    ? message(language, 'story.main-task')
    : id === 'lost-satchel'
      ? message(language, 'story.side-task')
      : message(language, 'story.meet-task')
}

/** Locate a task on the atlas without moving the player or satisfying route prerequisites. */
export function storyTaskScene(state: Pick<StoryViewState, 'progress'>, id: StoryTask): number {
  return storyAtlasIndex(storyTaskLocation(state.progress, id))
}

/** Present one accepted task with its current objective, location and optional pin action. */
function quest(state: StoryViewState, id: StoryTask, expanded = false): string {
  const lang = state.language
  const done = state.progress.completed.includes(id)
  const pinned = state.progress.pinned?.includes(id)
  const description =
    id === 'rescue-toma'
      ? message(lang, 'rail.task-detail')
      : id === 'restore-west-line'
        ? message(lang, 'finale.control-detail')
        : id === 'open-blockade'
          ? message(lang, 'finale.pass-detail')
          : id === 'find-beacon'
            ? message(lang, 'waterway.task-detail')
            : id === 'survey-ridge'
              ? message(lang, 'ridge.task-detail')
              : id === 'repair-lift'
                ? state.progress.facts?.includes('spindle-secured')
                  ? message(lang, 'story.repair-return')
                  : message(lang, 'story.repair-detail')
                : id === 'reach-tower'
                  ? message(lang, 'story.climb-detail')
                  : id === 'survey-road'
                    ? message(lang, 'story.road-detail')
                    : id === 'reach-camp'
                      ? message(lang, 'story.quest-main-detail')
                      : id === 'lost-satchel'
                        ? message(lang, 'story.quest-side-detail')
                        : message(lang, 'story.quest-guide-detail')
  const place = worldSceneName(lang, storyTaskLocation(state.progress, id))
  const detail = `<div class="story-quest-bubble"><p>${description}</p>${id === 'reach-camp' && !done && state.run?.floor === 0 && state.run.inspected && !state.run.practicedFlag ? `<p data-story-flag-guidance>${state.touchInput ? message(lang, 'story.flag-touch') : message(lang, 'story.flag-mouse')}</p>` : ''}${id === 'reach-camp' && !done && state.run?.floor === 0 && state.run.practicedFlag && !state.run.practicedReveal ? `<p data-story-chord-guidance>${state.touchInput ? message(lang, 'story.chord-touch') : message(lang, 'story.chord-mouse')}</p>` : ''}${id === 'lost-satchel' && !done && state.run?.collected ? `<p>${message(lang, 'story.satchel-found')}</p>` : ''}<p class="story-quest-place"><button class="story-quest-location" data-story-action="quest-map" data-task="${id}">${message(lang, 'story.quest-location', { place })}<span aria-hidden="true"> ↗</span></button></p>${done ? '' : `<button data-story-action="pin" data-task="${id}" aria-pressed="${!!pinned}">${pinned ? message(lang, 'story.unpin') : message(lang, 'story.pin')}</button>`}</div>`

  return expanded
    ? `<article class="story-quest-detail"><h3>${storyTaskName(lang, id)}</h3><span class="story-task-status">${done ? message(lang, 'story.done') : message(lang, 'story.pending')}</span>${detail}</article>`
    : `<details class="story-quest" data-task="${id}"><summary><strong>${storyTaskName(lang, id)}</strong><small>${done ? message(lang, 'story.done') : message(lang, 'story.pending')}</small></summary>${detail}</details>`
}

/** Show unfinished pinned objectives in the scene while completed tasks remain in the journal. */
export function pinnedStoryTasks(state: StoryViewState): string {
  const ids = (state.progress.accepted ?? []).filter(
    (id) => state.progress.pinned?.includes(id) && !state.progress.completed.includes(id),
  )
  return `<section class="story-tasks"><header><h2>${message(state.language, 'story.tasks')}</h2><button class="story-all-tasks" data-story-action="tasks">${message(state.language, 'story.all-tasks')} ↗</button></header>${ids.length ? ids.map((id) => quest(state, id)).join('') : `<p>${message(state.language, 'story.no-quests')}</p>`}</section>`
}

/** Compose the task journal or owned atlas without constructing a gameplay session. */
export function storyQuestPanel(state: StoryViewState): string {
  if (!state.panel) return ''

  const lang = state.language
  const accepted = state.progress.accepted ?? []
  const ordered = [
    ...accepted.filter((id) => !state.progress.completed.includes(id)),
    ...accepted.filter((id) => state.progress.completed.includes(id)),
  ]
  const title = state.panel === 'tasks' ? message(lang, 'story.tasks') : message(lang, 'story.map')
  const content =
    state.panel === 'tasks'
      ? accepted.length
        ? `<div class="story-journal-layout"><nav class="story-journal-list" aria-label="${title}">${ordered.map((id) => `<button data-story-action="select-task" data-task="${id}" aria-pressed="${id === (ordered.includes(state.selectedTask!) ? state.selectedTask : ordered[0])}"><strong>${storyTaskName(lang, id)}</strong><small>${state.progress.completed.includes(id) ? message(lang, 'story.done') : message(lang, 'story.pending')}</small></button>`).join('')}</nav>${quest(state, ordered.includes(state.selectedTask!) ? state.selectedTask! : ordered[0]!, true)}</div>`
        : `<p>${message(lang, 'story.no-accepted')}</p>`
      : !state.progress.mapOwned
        ? `<p>${message(lang, 'story.no-map')}</p>`
        : storyMap(state)

  return `<section class="story-quest-panel ${state.panel === 'tasks' ? 'story-journal' : state.progress.mapOwned ? 'story-atlas' : ''} glass-panel" aria-label="${title}"><header><h2>${title}</h2><button data-story-action="close-panel" aria-label="${translations[lang].close}">×</button></header>${content}</section>`
}
