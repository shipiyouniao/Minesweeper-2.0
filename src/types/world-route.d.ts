import type { StoryFact, StorySceneId } from './story.js'

/** World exits describe physical coordinates independently of the scene array's ordering. */
export interface WorldPortal {
  readonly scene: StorySceneId | 'camp'
  readonly index: number
  readonly destination: StorySceneId | 'camp'
  readonly arrival: number
  readonly requires: StoryFact
  readonly outcome?: StoryFact
}
