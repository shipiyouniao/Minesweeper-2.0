import type { Expedition } from '../types/variants.js'
import type { CampaignStageProgress } from '../types/campaign.js'
import type { WaterwaySceneId } from '../types/waterway.js'

export const WATERWAY_SCENES: readonly WaterwaySceneId[] = [
  'waterway-entry',
  'waterway-drained',
  'waterway-locks',
  'waterway-call',
  'waterway-found',
  'waterway-camp',
]

/** Dialogue reacts to real drainage progress; failure never plays a successful ending. */
export function pendingWaterwayScene(
  run: Expedition | null,
  progress: CampaignStageProgress,
): WaterwaySceneId | null {
  if (progress.id !== 'old-waterway') return null
  if (!run)
    return progress.cleared && !progress.scenes.includes('waterway-found') ? 'waterway-found' : null
  if (run.phase === 'lost' || run.phase === 'retreated') return null

  const reached: WaterwaySceneId[] = ['waterway-entry']
  if (run.floor > 1 || run.power?.receivers.some((entry) => entry.recorded))
    reached.push('waterway-drained')
  if (run.floor >= 2) reached.push('waterway-locks')
  if (run.floor >= 3) reached.push('waterway-call')
  if (run.phase === 'won') reached.push('waterway-found')
  return reached.find((scene) => !progress.scenes.includes(scene)) ?? null
}
