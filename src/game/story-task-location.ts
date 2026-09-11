import type { StoryProgress, StoryScene, StoryTask } from '../types/story.js'

/** Task locations follow accepted world outcomes and remain independent of atlas display order. */
export function storyTaskLocation(progress: StoryProgress, task: StoryTask): StoryScene['id'] {
  switch (task) {
    case 'rescue-toma':
      return 'quarry-yard'
    case 'restore-west-line':
    case 'reach-tower':
      return 'tower-landing'
    case 'open-blockade':
      return progress.facts?.includes('west-shortcut') ? 'blockade-pass' : 'northwest-bridge'
    case 'survey-ridge':
    case 'find-beacon':
    case 'survey-road':
      return 'north-road'
    case 'repair-lift':
      return progress.facts?.includes('spindle-secured') ? 'north-road' : 'quarry-machine'
    case 'lost-satchel':
      return 'trail'
    default:
      return 'camp'
  }
}
