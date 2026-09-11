import type { CampSite } from '../types/story.js'
import { spriteImage } from './dungeon-sprites.js'

/** The scene and atlas use one guide sprite with the same accessibility and drag behavior. */
export function storyGuideImage(): string {
  return `<img class="story-guide" src="${import.meta.env.BASE_URL}assets/story/guide.png" alt="" width="128" height="128" draggable="false">`
}

/** A facility's content record selects its artwork in every presentation. */
export function campSiteImage(site: CampSite): string {
  return site.destination === 'guide' ? storyGuideImage() : spriteImage(site.sprite)
}
