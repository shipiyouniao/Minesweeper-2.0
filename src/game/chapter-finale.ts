import type { Expedition } from '../types/variants.js'
import type { CampaignStageProgress } from '../types/campaign.js'
import type { FinaleSceneId } from '../types/chapter-finale.js'

export const CONTROL_SCENES: readonly FinaleSceneId[] = [
  'control-entry',
  'control-line',
  'control-heart',
  'control-restored',
]
export const BLOCKADE_SCENES: readonly FinaleSceneId[] = [
  'pass-entry',
  'pass-warning',
  'pass-guardian',
  'pass-open',
  'chapter-camp',
]

/** Reach scenes from accepted outcomes, including an ending interrupted after atomic settlement. */
export function pendingFinaleScene(
  run: Expedition | null,
  progress: CampaignStageProgress,
): FinaleSceneId | null {
  const control = progress.id === 'tower-control'
  if (!control && progress.id !== 'northwest-bastion') return null

  const ending = control ? 'control-restored' : 'pass-open'
  if (!run) return progress.cleared && !progress.scenes.includes(ending) ? ending : null

  if (run.phase === 'lost' || run.phase === 'retreated') return null

  const scenes: FinaleSceneId[] = [control ? 'control-entry' : 'pass-entry']
  if (run.floor >= 2) scenes.push(control ? 'control-line' : 'pass-warning')

  if (run.floor >= 3) scenes.push(control ? 'control-heart' : 'pass-guardian')

  if (run.phase === 'won') scenes.push(ending)

  return scenes.find((scene) => !progress.scenes.includes(scene)) ?? null
}
