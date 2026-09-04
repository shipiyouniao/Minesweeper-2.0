import type { Config } from './game.js'

/** Five departure choices, independent of classic mode's ranked presets. */
export type VariantDifficulty = 'relaxed' | 'standard' | 'advanced' | 'expert' | 'abyss'

/** One versioned balance entry owns geometry and the expedition density ramp. */
export interface VariantTier {
  readonly id: VariantDifficulty
  readonly twin: Config
  readonly size: number
  readonly floors: number
  readonly firstDensity: number
  readonly lastDensity: number
}
