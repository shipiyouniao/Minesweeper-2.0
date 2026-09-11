import { atlasDetail, visibleAtlasTiles } from './atlas-camera.js'
import { ATLAS_TILE_BLEED, atlasTerrain } from './atlas-world-terrain.js'
import type { AtlasCamera, AtlasLevel } from '../types/atlas.js'

/** Paint the visible quadtree only; unchanged addresses retain their DOM and vector assets. */
export function paintAtlasTiles(
  viewport: HTMLElement,
  level: AtlasLevel,
  camera: AtlasCamera,
): void {
  const chart = viewport.querySelector<HTMLElement>('.atlas-chart')
  const layer = chart?.querySelector<HTMLElement>('.atlas-tile-layer')
  if (!chart || !layer) return

  const tiles = visibleAtlasTiles(camera, {
    width: viewport.clientWidth,
    height: viewport.clientHeight,
  })
  const wanted = new Set(tiles.map((tile) => tile.key))
  for (const child of layer.querySelectorAll<HTMLElement>('[data-atlas-tile]')) {
    if (!wanted.has(child.dataset['atlasTile'] ?? '')) child.remove()
  }

  for (const tile of tiles) {
    if (layer.querySelector(`[data-atlas-tile="${tile.key}"]`)) continue

    const element = document.createElement('div')

    element.className = 'atlas-vector-tile'
    element.dataset['atlasTile'] = tile.key
    // Expand both the element and its source crop by the same amount to avoid hairline seams.
    element.style.cssText = `left:${(tile.column * 100) / tile.divisions - ATLAS_TILE_BLEED}%;top:${(tile.row * 100) / tile.divisions - ATLAS_TILE_BLEED}%;width:${100 / tile.divisions + ATLAS_TILE_BLEED * 2}%;height:${100 / tile.divisions + ATLAS_TILE_BLEED * 2}%`
    element.innerHTML = atlasTerrain(tile)
    layer.append(element)
  }

  const detail = atlasDetail(level, camera.zoom)

  viewport.dataset['detail'] = detail
  viewport.style.setProperty('--atlas-inverse-zoom', String(1 / camera.zoom))
  for (const markers of chart.querySelectorAll<HTMLElement>('[data-atlas-detail]')) {
    const hidden = markers.dataset['atlasDetail'] !== detail
    // Hiding a focused cluster must not strand keyboard input on a detached semantic level.
    if (hidden && markers.contains(document.activeElement)) viewport.focus({ preventScroll: true })

    markers.hidden = hidden
    markers.inert = hidden
  }
}
