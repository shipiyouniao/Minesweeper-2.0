import type { Expedition } from '../types/variants.js'
import type { SignalSceneId } from '../types/signal-story.js'
import type { CampaignStageProgress } from '../types/campaign.js'

export const NIA_CAMP_CELL = 33
export const SIGNAL_SCENES: readonly SignalSceneId[] = [
  'entry',
  'connected',
  'archive',
  'record',
  'prison',
  'rescued',
  'camp',
]

/** Emit only reached story beats; replaying an unfinished attempt cannot repeat completed beats. */
export function pendingSignalScene(
  run: Expedition | null,
  progress: CampaignStageProgress,
): SignalSceneId | null {
  if (!run && progress.id === 'tower-relay' && progress.cleared)
    return progress.scenes.includes('rescued') ? null : 'rescued'
  if (
    !run ||
    run.departure.campaign !== 'tower-relay-v1' ||
    run.phase === 'lost' ||
    run.phase === 'retreated'
  )
    return null
  const reached: SignalSceneId[] = ['entry']
  if (run.floor > 1 || run.circuits?.relays[0]?.active === false) reached.push('connected')
  if (run.floor >= 2) reached.push('archive')
  if (run.signalRecord) reached.push('record')
  if (run.floor >= 3) reached.push('prison')
  if (run.phase === 'won') reached.push('rescued')
  return reached.find((id) => !progress.scenes.includes(id)) ?? null
}
