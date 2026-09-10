import type { FloorPower } from './floor-power.js'

export interface ObservatoryFloor {
  readonly rows: readonly string[]
  readonly power: FloorPower
}

export type ObservatorySceneId =
  'ridge-entry' | 'ridge-reading' | 'ridge-pair' | 'ridge-beacon' | 'ridge-found' | 'ridge-camp'
