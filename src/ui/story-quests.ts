import { message, translations } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { StoryTask, StoryViewState } from '../types/story.js'
import { storyMap } from './story-map.js'

export function storyTaskName(language: Language, id: StoryTask): string {
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

export function storyTaskScene(state: Pick<StoryViewState, 'progress'>, id: StoryTask): number {
  if (id === 'survey-ridge' || id === 'find-beacon') return 4
  if (id === 'repair-lift') return state.progress.facts?.includes('spindle-secured') ? 4 : 7
  if (id === 'reach-tower') return 8
  if (id === 'survey-road') return 4
  if (id === 'lost-satchel') return 1
  return 3
}

function quest(state: StoryViewState, id: StoryTask, expanded = false): string {
  const lang = state.language
  const done = state.progress.completed.includes(id)
  const pinned = state.progress.pinned?.includes(id)
  const description =
    id === 'find-beacon'
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
  const scene = storyTaskScene(state, id)
  const place =
    scene === 4
      ? message(lang, 'story.north-road')
      : scene === 7
        ? message(lang, 'story.quarry-machine')
        : scene === 8
          ? message(lang, 'story.tower-landing')
          : scene === 1
            ? message(lang, 'story.trail')
            : message(lang, 'story.camp')
  const detail = `<details class="story-quest" data-task="${id}"><summary><strong>${storyTaskName(lang, id)}</strong><small>${done ? message(lang, 'story.done') : message(lang, 'story.pending')}</small></summary><div class="story-quest-bubble"><p>${description}</p>${id === 'reach-camp' && !done && state.run?.floor === 0 && state.run.inspected && !state.run.practicedFlag ? `<p data-story-flag-guidance>${state.touchInput ? message(lang, 'story.flag-touch') : message(lang, 'story.flag-mouse')}</p>` : ''}${id === 'reach-camp' && !done && state.run?.floor === 0 && state.run.practicedFlag && !state.run.practicedReveal ? `<p data-story-chord-guidance>${state.touchInput ? message(lang, 'story.chord-touch') : message(lang, 'story.chord-mouse')}</p>` : ''}${id === 'lost-satchel' && !done && state.run?.collected ? `<p>${message(lang, 'story.satchel-found')}</p>` : ''}<p class="story-quest-place"><button class="story-quest-location" data-story-action="quest-map" data-task="${id}">${message(lang, 'story.quest-location', { place })}<span aria-hidden="true"> ↗</span></button></p>${done ? '' : `<button data-story-action="pin" data-task="${id}" aria-pressed="${!!pinned}">${pinned ? message(lang, 'story.unpin') : message(lang, 'story.pin')}</button>`}</div></details>`
  return expanded
    ? `<article class="story-quest-detail"><h3>${storyTaskName(lang, id)}</h3><span class="story-task-status">${done ? message(lang, 'story.done') : message(lang, 'story.pending')}</span>${detail.slice(detail.indexOf('<div class="story-quest-bubble">'), detail.lastIndexOf('</details>'))}</article>`
    : detail
}

export function pinnedStoryTasks(state: StoryViewState): string {
  const ids = (state.progress.accepted ?? []).filter(
    (id) => state.progress.pinned?.includes(id) && !state.progress.completed.includes(id),
  )
  return `<section class="story-tasks"><header><h2>${message(state.language, 'story.tasks')}</h2><button class="story-all-tasks" data-story-action="tasks">${message(state.language, 'story.all-tasks')} ↗</button></header>${ids.length ? ids.map((id) => quest(state, id)).join('') : `<p>${message(state.language, 'story.no-quests')}</p>`}</section>`
}

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
