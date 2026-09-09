import { message, translations } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { StoryTask, StoryViewState } from '../types/story.js'
import { storyMap } from './story-map.js'

export function storyTaskName(language: Language, id: StoryTask): string {
  return id === 'reach-camp'
    ? message(language, 'story.main-task')
    : id === 'lost-satchel'
      ? message(language, 'story.side-task')
      : message(language, 'story.meet-task')
}

function quest(state: StoryViewState, id: StoryTask): string {
  const lang = state.language
  const done = state.progress.completed.includes(id)
  const pinned = state.progress.pinned?.includes(id)
  const description =
    id === 'reach-camp'
      ? message(lang, 'story.quest-main-detail')
      : id === 'lost-satchel'
        ? message(lang, 'story.quest-side-detail')
        : message(lang, 'story.quest-guide-detail')
  const place = id === 'lost-satchel' ? message(lang, 'story.trail') : message(lang, 'story.camp')
  return `<details class="story-quest" data-task="${id}"><summary><strong>${storyTaskName(lang, id)}</strong><small>${done ? message(lang, 'story.done') : message(lang, 'story.pending')}</small></summary><div class="story-quest-bubble"><p>${description}</p>${id === 'reach-camp' && !done && state.run?.floor === 0 && state.run.inspected && !state.run.practicedFlag ? `<p data-story-flag-guidance>${state.touchInput ? message(lang, 'story.flag-touch') : message(lang, 'story.flag-mouse')}</p>` : ''}${id === 'lost-satchel' && !done && state.run?.collected ? `<p>${message(lang, 'story.satchel-found')}</p>` : ''}<p class="story-quest-place">${message(lang, 'story.quest-location', { place })}</p>${done ? '' : `<button data-story-action="pin" data-task="${id}" aria-pressed="${!!pinned}">${pinned ? message(lang, 'story.unpin') : message(lang, 'story.pin')}</button>`}</div></details>`
}

export function pinnedStoryTasks(state: StoryViewState): string {
  const ids = (state.progress.pinned ?? []).filter(
    (id) => state.progress.accepted?.includes(id) && !state.progress.completed.includes(id),
  )
  return `<section class="story-tasks"><h2>${message(state.language, 'story.tasks')}</h2>${ids.length ? ids.map((id) => quest(state, id)).join('') : `<p>${message(state.language, 'story.no-quests')}</p>`}</section>`
}

export function storyQuestPanel(state: StoryViewState): string {
  if (!state.panel) return ''
  const lang = state.language
  const accepted = state.progress.accepted ?? []
  const title = state.panel === 'tasks' ? message(lang, 'story.tasks') : message(lang, 'story.map')
  const content =
    state.panel === 'tasks'
      ? accepted.length
        ? accepted.map((id) => quest(state, id)).join('')
        : `<p>${message(lang, 'story.no-accepted')}</p>`
      : !state.progress.mapOwned
        ? `<p>${message(lang, 'story.no-map')}</p>`
        : storyMap(state)
  return `<section class="story-quest-panel ${state.panel === 'map' && state.progress.mapOwned ? 'story-atlas' : ''} glass-panel" aria-label="${title}"><header><h2>${title}</h2><button data-story-action="close-panel" aria-label="${translations[lang].close}">×</button></header>${content}</section>`
}
