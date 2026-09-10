import { campaignLayout } from './campaign-layout.js'
import { signalLayout } from './signal-layout.js'
import { observatoryLayout } from './observatory-layout.js'
import { waterwayLayout } from './waterway-layout.js'
import type { CampaignRevision } from '../types/campaign.js'
import type { DungeonLayout } from '../types/dungeon-generation.js'

/** Resolve authored providers before the shared expedition engine creates an attempt. */
export function campaignFloor(revision: CampaignRevision, floor: number): DungeonLayout {
  switch (revision) {
    case 'tower-road-v4':
      return campaignLayout(floor)
    case 'tower-relay-v1':
      return signalLayout(floor)
    case 'ridge-observatory-v1':
      return observatoryLayout(floor)
    case 'old-waterway-v1':
      return waterwayLayout(floor)
  }
}
