import type {
  AtlasCamera,
  AtlasDetail,
  AtlasLevel,
  AtlasPoint,
  AtlasRegion,
  AtlasTile,
  AtlasViewport,
} from '../types/atlas.js'

/** World charts allow enough magnification to inspect their embedded regional geography. */
export function atlasMaxZoom(level: AtlasLevel): number {
  return level === 'world' ? 8 : 4
}

/** Clamp translation so panning cannot expose an empty strip outside the chart. */
export function clampAtlasCamera(camera: AtlasCamera, size: AtlasViewport): AtlasCamera {
  if (camera.zoom <= 1) return { zoom: 1, x: 0, y: 0 }

  const maxX = (size.width * (camera.zoom - 1)) / 2
  const maxY = (size.height * (camera.zoom - 1)) / 2

  return {
    zoom: camera.zoom,
    x: Math.max(-maxX, Math.min(maxX, camera.x)),
    y: Math.max(-maxY, Math.min(maxY, camera.y)),
  }
}

/** Keep the geographical point beneath the cursor or pinch midpoint stable while zooming. */
export function zoomAtlas(
  camera: AtlasCamera,
  value: number,
  anchor: AtlasPoint,
  size: AtlasViewport,
  level: AtlasLevel,
): AtlasCamera {
  const zoom = Math.max(1, Math.min(atlasMaxZoom(level), value))
  return clampAtlasCamera(
    {
      zoom,
      x: anchor.x - ((anchor.x - camera.x) * zoom) / camera.zoom,
      y: anchor.y - ((anchor.y - camera.y) * zoom) / camera.zoom,
    },
    size,
  )
}

/** Coarse charts show areas; local destinations appear only when there is room to read them. */
export function atlasDetail(level: AtlasLevel, zoom: number): AtlasDetail {
  if (level === 'world') return zoom < 2 ? 'regions' : zoom < 3.5 ? 'districts' : 'places'
  return level === 'region' && zoom < 1.7 ? 'districts' : 'places'
}

/** Enumerate only intersecting quadtree tiles, including a small seam margin at tile boundaries. */
export function visibleAtlasTiles(camera: AtlasCamera, size: AtlasViewport): AtlasTile[] {
  if (size.width <= 0 || size.height <= 0) return []

  const divisions = 2 ** Math.min(3, Math.floor(Math.log2(camera.zoom)))
  const left = (0.5 - 0.5 / camera.zoom - camera.x / (size.width * camera.zoom)) * divisions
  const top = (0.5 - 0.5 / camera.zoom - camera.y / (size.height * camera.zoom)) * divisions
  const right = left + divisions / camera.zoom
  const bottom = top + divisions / camera.zoom
  const tiles: AtlasTile[] = []
  for (
    let row = Math.max(0, Math.floor(top));
    row <= Math.min(divisions - 1, Math.floor(bottom));
    row++
  ) {
    for (
      let column = Math.max(0, Math.floor(left));
      column <= Math.min(divisions - 1, Math.floor(right));
      column++
    ) {
      tiles.push({ key: `${divisions}/${column}/${row}`, divisions, column, row })
    }
  }

  return tiles
}

/** Embed the known region in the western landmass using the same transform for every marker. */
export function atlasPosition(
  point: AtlasPoint,
  level: AtlasLevel,
  region: AtlasRegion,
): AtlasPoint {
  return level === 'world'
    ? {
        x: region.x + (point.x * region.width) / 100,
        y: region.y + (point.y * region.height) / 100,
      }
    : point
}
