import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** One bounded public-information turn plan used by the acceptance player. */
export interface BattleTestPlan {
  readonly run: Expedition
  readonly actions: readonly ExpeditionAction[]
}
