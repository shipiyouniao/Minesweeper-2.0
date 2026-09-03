import type { Icon, IconPaths } from './types/icons.js'

const paths: IconPaths = {
  chevron: '<path d="m8 10 4 4 4-4"/>',
  volume: '<path d="M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  volumeOff: '<path d="M11 4 6 8H3v8h3l5 4V4Zm5 5 6 6m0-6-6 6"/>',
  flag: '<path d="M6 21V4m0 0c4-4 8 4 13 0v10c-5 4-9-4-13 0"/><path d="M3 21h7"/>',
  mine: '<circle cx="12" cy="12" r="5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m9 5 11 7-11 7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trophy:
    '<path d="M7 3h10v5a5 5 0 0 1-10 0V3Zm5 10v7m-5 1h10M7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  pointer: '<path d="m5 3 14 10-7 1-3 7L5 3Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1"/>',
  leaf: '<path d="M20 3C9 2 3 7 5 14c2 7 15 5 15-11ZM4 21 15 10"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
}
/** Render an original decorative SVG; accessible text belongs to its parent control. */
export function icon(name: Icon): string {
  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`
}
