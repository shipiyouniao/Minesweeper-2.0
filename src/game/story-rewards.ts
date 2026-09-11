import type { Camp } from '../types/variants.js'
import type { CampaignSave } from '../types/campaign.js'

/** Licenses are idempotent story rewards; currency is settled separately on first clear. */
export function grantRescuer(camp: Camp): Camp {
  return camp.storyProfessions?.includes('rescuer')
    ? camp
    : { ...camp, storyProfessions: ['rescuer'] }
}

/** Completed side stories retain their reward even when the player already dismissed the ending. */
export function storyRewardCamp(camp: Camp, campaign: CampaignSave | undefined): Camp {
  return campaign?.stages.some((stage) => stage.id === 'quarry-rescue' && stage.cleared)
    ? grantRescuer(camp)
    : camp
}
