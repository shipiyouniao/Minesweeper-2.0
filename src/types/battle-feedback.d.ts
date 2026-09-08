import type { DungeonSprite } from './dungeon-ui.js'

/** Public changes that can be illustrated without consulting hidden layouts. */
export interface BattleInteractionEffect {
  readonly index: number
  readonly kind:
    | 'web-cut'
    | 'nest-break'
    | 'egg-break'
    | 'hatchling-clear'
    | 'power-down'
    | 'core-open'
    | 'seal-break'
    | 'rift'
    | 'anchor-on'
    | 'hourglass'
    | 'sonar'
    | 'echo-open'
    | 'crystal'
    | 'empty'
  readonly sprite: DungeonSprite | null
}
