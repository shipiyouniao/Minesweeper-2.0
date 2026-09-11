import type { Expedition } from '../types/variants.js'
import type { CampaignStageProgress } from '../types/campaign.js'
import type { ObservatorySceneId } from '../types/observatory.js'

export const OBSERVATORY_SCENES: readonly ObservatorySceneId[] = [
  'ridge-entry',
  'ridge-reading',
  'ridge-pair',
  'ridge-beacon',
  'ridge-found',
  'ridge-camp',
]

/** Narrative follows accepted readings and floor progress, never speculative map reveals. */
export function pendingObservatoryScene(
  run: Expedition | null,
  progress: CampaignStageProgress,
): ObservatorySceneId | null {
  if (progress.id !== 'ridge-observatory') return null

  if (!run)
    return progress.cleared && !progress.scenes.includes('ridge-found') ? 'ridge-found' : null

  if (run.phase === 'lost' || run.phase === 'retreated') return null

  const reached: ObservatorySceneId[] = ['ridge-entry']
  if (run.floor > 1 || run.power?.receivers.some((entry) => entry.recorded))
    reached.push('ridge-reading')

  if (run.floor >= 2) reached.push('ridge-pair')

  if (run.floor >= 3) reached.push('ridge-beacon')

  if (run.phase === 'won') reached.push('ridge-found')

  return reached.find((id) => !progress.scenes.includes(id)) ?? null
}
