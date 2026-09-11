import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import { campPageName } from './camp-copy.js'
import { recollectionLantern } from './recollection-copy.js'
import type { CampSite } from '../types/story.js'
import { spriteImage } from './dungeon-sprites.js'

/** The scene and atlas use one guide sprite with the same accessibility and drag behavior. */
export function storyGuideImage(): string {
  return `<img class="story-guide" src="${import.meta.env.BASE_URL}assets/story/guide.png" alt="" width="128" height="128" draggable="false">`
}

/** A facility's content record selects its artwork in every presentation. */
export function campSiteImage(site: CampSite): string {
  if (site.destination === 'recollection') return recollectionLantern()

  return site.destination === 'guide' ? storyGuideImage() : spriteImage(site.sprite)
}

/** Keep the persistent camp's landmarks aligned with their existing service names. */
export function storySiteName(language: Language, site: CampSite): string {
  if (site.destination === 'recollection') return message(language, 'recollection.lantern')

  if (site.destination === 'guide') return message(language, 'story.guide')

  if (site.destination === 'road') return message(language, 'story.road')

  return campPageName(language, site.destination)
}
