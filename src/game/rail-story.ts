import type { CampaignStageProgress } from '../types/campaign.js'
import type { RailSceneId } from '../types/floor-rail.js'
import type { Expedition } from '../types/variants.js'

export const RAIL_SCENES: readonly RailSceneId[] = [
  'rail-entry',
  'rail-brakes',
  'rail-rescue',
  'rail-home',
  'rail-camp',
]
export const TOMA_CAMP_CELL = 29
export const RESCUE_GATE = 25

/** The ending remains recoverable after its once-only reward has already been committed. */
export function pendingRailScene(
  run: Expedition | null,
  progress: CampaignStageProgress,
): RailSceneId | null {
  if (progress.id !== 'quarry-rescue') return null

  if (!run) return progress.cleared && !progress.scenes.includes('rail-home') ? 'rail-home' : null

  if (run.phase === 'lost' || run.phase === 'retreated') return null

  const reached: RailSceneId[] = ['rail-entry']
  if (run.floor >= 2) reached.push('rail-brakes')

  if (run.floor >= 3) reached.push('rail-rescue')

  if (run.phase === 'won') reached.push('rail-home')

  return reached.find((scene) => !progress.scenes.includes(scene)) ?? null
}
