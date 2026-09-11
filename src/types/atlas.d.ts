import type { StoryScene } from './story.js'

/** Atlas coordinates are normalized to the chart, independent of browser pixels. */
export interface AtlasPoint {
  readonly x: number
  readonly y: number
}
export interface AtlasViewport {
  readonly width: number
  readonly height: number
}
export interface AtlasCamera {
  readonly zoom: number
  readonly x: number
  readonly y: number
}
export type AtlasLevel = 'local' | 'region' | 'world'
export type AtlasDetail = 'regions' | 'districts' | 'places'
export type AtlasDistrict = 'woodland' | 'camp' | 'quarry' | 'west'

/** Region placement maps local 0–100 coordinates into an authored world rectangle. */
export interface AtlasRegion extends AtlasPoint {
  readonly id: 'woodland'
  readonly width: number
  readonly height: number
}

/** Named locations prevent catalog insertion from silently moving unrelated markers. */
export interface AtlasPlace extends AtlasPoint {
  readonly scene: StoryScene['id']
  readonly district: AtlasDistrict
  readonly picture: 'tree' | 'lantern' | 'workshop' | 'treasure'
}

/** A visible vector tile owns one quadtree address and its source rectangle. */
export interface AtlasTile {
  readonly key: string
  readonly column: number
  readonly row: number
  readonly divisions: number
}

/** Pointer coordinates are transient input state, never persisted with the game. */
export interface AtlasPointer extends AtlasPoint {
  readonly id: number
}

/** Local diagrams keep their facility legend separate from their board markup. */
export interface AtlasMarkup {
  readonly drawing: string
  readonly landmarks: string
}

/** A gesture has one meaning at a time; a pinch can never become a location click. */
export type AtlasGesture =
  | { readonly kind: 'idle' }
  | { readonly kind: 'settling' }
  | {
      readonly kind: 'pan'
      readonly pointer: number
      readonly start: AtlasPoint
      readonly last: AtlasPoint
      readonly dragged: boolean
    }
  | { readonly kind: 'pinch'; readonly distance: number; readonly midpoint: AtlasPoint }
