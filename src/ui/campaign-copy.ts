import { message } from '../i18n.js'
import { signalCopy } from './signal-copy.js'
import type { CampaignStageId } from '../types/campaign.js'
import type { Language } from '../types/localization.js'

/** Keep stage names identical in world entrances, headings and result navigation. */
export function campaignName(language: Language, stage: CampaignStageId): string {
  switch (stage) {
    case 'tower-galleries':
      return message(language, 'campaign.title')
    case 'tower-relay':
      return signalCopy(language).title
    case 'ridge-observatory':
      return message(language, 'ridge.title')
    case 'tower-control':
      return message(language, 'finale.control-title')
    case 'northwest-bastion':
      return message(language, 'finale.pass-title')
    case 'old-waterway':
      return message(language, 'waterway.title')
  }
}
