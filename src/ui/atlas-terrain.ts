import type { AtlasLevel, AtlasTile } from '../types/atlas.js'

/** Render an exact source rectangle at any tile level; SVG keeps the authored art crisp. */
export function atlasTerrain(level: AtlasLevel, powered: boolean, tile: AtlasTile): string {
  const width = 800 / tile.divisions
  const height = 460 / tile.divisions
  const viewBox = `${tile.column * width} ${tile.row * height} ${width} ${height}`

  return level === 'world' ? worldTerrain(viewBox) : regionTerrain(powered, viewBox)
}

/** Coastline and distant, uncharted land give the known region a place in the world. */
function worldTerrain(viewBox: string): string {
  return `<svg class="atlas-terrain" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true"><rect width="800" height="460" fill="#c3d8d5"/><path d="M-20 92 Q80 6 174 70 T335 26 Q405 56 393 133 Q474 178 419 226 Q435 300 368 335 L313 441 Q241 470 207 403 Q117 403 103 318 Q17 287 33 224Z" fill="#dce0bd" stroke="#829f8a" stroke-width="3"/><path d="M481-20 Q518 87 588 88 Q650 143 783 66 L830 0M513 151 Q466 208 557 260 Q622 326 724 273 Q815 293 836 170 L804 99 Q688 155 619 121Z" fill="#d3d9c6" stroke="#9bac9b" stroke-width="2"/><path d="M48 162 Q162 95 218 180 T327 150 L359 231 Q252 340 176 303 T77 253Z" fill="#7a9c79" opacity=".6"/><path d="M299 71 Q252 152 300 214 T306 347" fill="none" stroke="#88b7c0" stroke-width="13"/><g fill="#b0bba0" stroke="#829582" stroke-width="2"><path d="m102 111 34-64 35 64-32-19Z"/><path d="m149 134 40-73 37 73-37-25Z"/><path d="m326 112 27-49 32 49-32-12Z"/></g><path d="M39 361q44-20 81 6M475 349q78-23 158 3M501 365q55-13 112 2M642 415q58-19 115-2" fill="none" stroke="#97bcbf" stroke-width="3"/></svg>`
}

/** Regional roads and the persistent western bridge share one authored vector source across tile levels. */
function regionTerrain(powered: boolean, viewBox: string): string {
  return `<svg class="atlas-terrain" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true"><rect width="800" height="460" fill="#e3e4c9"/><path d="M360 0 Q387 68 360 135 T330 235" fill="none" stroke="#9dbfc0" stroke-width="22"/><g class="atlas-west-route ${powered ? 'is-powered' : ''}" data-west-route="${powered}"><path d="M648 216 Q565 196 495 147 T336 106 Q246 80 168 83" fill="none" stroke="#f8f1d5" stroke-width="15"/><path d="M648 216 Q565 196 495 147 T336 106 Q246 80 168 83" fill="none" stroke="#8b9163" stroke-width="3" stroke-dasharray="6 6"/><path class="atlas-west-bridge" d="M352 107 l37 8 M352 99 l39 9" stroke="#8a7256" stroke-width="7"/></g><path d="M0 28Q154 68 217 1L406 0Q398 109 290 175T0 270ZM0 396Q169 357 232 460H0ZM421 460Q455 377 589 392T800 303V460Z" fill="#b9cbaa"/><path d="M713-10Q540 97 562 181T729 352L770 470" fill="none" stroke="#9dbfc0" stroke-width="26"/><path d="M713-10Q540 97 562 181T729 352L770 470" fill="none" stroke="#cee0d8" stroke-width="10"/><path d="M136 336 Q219 327 304 221 T488 304 Q553 299 569 213 T640 129" fill="none" stroke="#f8f1d5" stroke-width="18"/><path d="M136 336 Q219 327 304 221 T488 304 Q553 299 569 213 T640 129" fill="none" stroke="#a08b60" stroke-width="3" stroke-dasharray="7 7"/><path d="m544 223 39 10m-36-18 38 10" stroke="#8a7256" stroke-width="6"/><g fill="#829b76" opacity=".65">${[
    [75, 80],
    [123, 124],
    [190, 95],
    [360, 75],
    [417, 103],
    [719, 350],
    [664, 393],
    [344, 371],
    [72, 420],
  ]
    .map(([x, y]) => `<path d="M${x! - 16} ${y}l16-40 16 40h-10l13 18h-38l13-18Z"/>`)
    .join('')}</g></svg>`
}
