import type { AtlasTile } from '../types/atlas.js'

/** A shared percentage bleed covers subpixel seams without stretching the tile's geography. */
export const ATLAS_TILE_BLEED = 0.15

/** Crop a visible tile from one world source; roads are independently derived from travel data. */
export function atlasTerrain(tile: AtlasTile): string {
  const width = 800 / tile.divisions
  const height = 460 / tile.divisions
  const bleedX = ATLAS_TILE_BLEED * 8,
    bleedY = ATLAS_TILE_BLEED * 4.6
  const viewBox = `${tile.column * width - bleedX} ${tile.row * height - bleedY} ${width + bleedX * 2} ${height + bleedY * 2}`
  const trees = [
    [62, 216],
    [89, 241],
    [130, 258],
    [145, 283],
    [191, 220],
    [196, 286],
    [222, 261],
    [373, 292],
    [410, 331],
    [460, 294],
    [52, 396],
    [175, 421],
  ]
    .map(([x, y]) => `<path d="M${x! - 10} ${y}l10-27 10 27h-6l8 12h-24l8-12Z"/>`)
    .join('')

  return `<svg class="atlas-terrain" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true"><rect width="800" height="460" fill="#c9dbd8"/><path d="M-20-20H694Q735 17 719 60T746 158Q766 190 751 216T776 282Q798 336 745 373T684 479H-20Z" fill="#e3e4c9" stroke="#a3b7a2" stroke-width="3"/><path d="M0 139Q105 139 179 183T321 218Q349 252 300 280T296 356Q239 397 122 385T0 451Z" fill="#b6c9a7"/><path d="M374 272Q421 242 462 278T526 346Q472 384 415 374T345 321Z" fill="#cad3b2"/><path d="M543-10Q554 74 520 135T529 220Q568 269 628 299T662 381L695 470" fill="none" stroke="#a0c3c4" stroke-width="18"/><path d="M543-10Q554 74 520 135T529 220Q568 269 628 299T662 381L695 470" fill="none" stroke="#d5e4d9" stroke-width="5"/><g fill="#bac5a7" stroke="#9caa90" stroke-width="2"><path d="m58 113 36-68 39 68-39-16Z"/><path d="m111 95 36-68 42 68-41-20Z"/><path d="m264 40 28-49 33 49-33-10Z"/><path d="m641 361 27-49 33 49-33-10Z"/></g><g fill="#77976d" opacity=".6">${trees}</g><path d="M759 408q22-9 47 1M752 419q23-8 47 1M752 95q23-8 47 1" fill="none" stroke="#a7c4c4" stroke-width="2"/></svg>`
}
