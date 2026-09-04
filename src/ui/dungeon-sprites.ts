import type { DungeonSprite } from '../types/dungeon-ui.js'

/** Resolve project-owned generated assets correctly under the GitHub Pages base path. */
export function spriteUrl(sprite: DungeonSprite): string {
  return `${import.meta.env.BASE_URL}assets/dungeon/${sprite}.png`
}

/** Render a decorative sprite; the owning control supplies its localized accessible label. */
export function spriteImage(sprite: DungeonSprite, className = 'dungeon-sprite'): string {
  return `<img class="${className}" src="${spriteUrl(sprite)}" alt="" draggable="false" width="64" height="64" />`
}
