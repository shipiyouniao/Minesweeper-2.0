import { storyTaskReward } from '../game/story-quests.js'
import { STORY_REVISION } from '../game/story-content.js'
import { campaignProgress, updateCampaign } from '../game/campaign-catalog.js'
import type { CampaignStageProgress } from '../types/campaign.js'
import { allowedDeparture, buyUpgrade, EMPTY_CAMP } from '../game/expedition.js'
import { claimMilestone, equipTitle } from '../game/milestones.js'
import { VariantRepository } from '../persistence/variant-repository.js'
import type { MilestoneId } from '../types/milestones.js'
import type { CampLoadout, StoryProgress, StoryTask } from '../types/story.js'
import type { Camp, ExpeditionSave, Upgrade } from '../types/variants.js'

export const EMPTY_STORY: StoryProgress = {
  facts: [],
  dialogue: { completed: [], active: null },
  accepted: [],
  pinned: [],
  mapOwned: false,
  arrived: false,
  completed: [],
  claimed: [],
  campPosition: 31,
  journal: null,
}

/** Own shared camp mutations, preserving both independent attempts in the existing namespace. */
export class CampSession {
  private readonly repository: VariantRepository

  /** Normalize legacy envelopes before a new story write can bypass their settlement. */
  constructor(repository: VariantRepository) {
    this.repository = repository
    this.read()
  }

  /** Always read the latest whole envelope before applying a permanent mutation. */
  private read(): ExpeditionSave {
    const save = this.repository.expedition() ?? {
      version: 4,
      camp: EMPTY_CAMP,
      journal: null,
      records: [],
    }
    if (this.repository.migrated || this.repository.recovered) this.repository.saveExpedition(save)
    return save
  }

  /** Return the same wallet, licenses and milestones used by the roguelite. */
  get camp(): Camp {
    return this.read().camp
  }

  /** A rescued resident and optional record are permanent stage outcomes in the shared camp. */
  get signalRescue(): CampaignStageProgress {
    return campaignProgress(this.read().campaign, 'tower-relay')
  }

  /** Recover an interrupted ending without rebuilding the retired run or repeating settlement. */
  completeSignalRescue(): void {
    const save = this.read()
    const progress = campaignProgress(save.campaign, 'tower-relay')
    if (!progress.cleared || progress.scenes.includes('rescued')) return
    this.repository.saveExpedition({
      ...save,
      campaign: updateCampaign(save.campaign, {
        ...progress,
        scenes: [...progress.scenes, 'rescued'],
      }),
    })
  }

  /** Story attempts never borrow the roguelite journal slot. */
  get story(): StoryProgress {
    return this.read().story ?? EMPTY_STORY
  }

  /** Fall back only when a saved selection cannot be equipped under current camp rules. */
  get loadout(): CampLoadout {
    const save = this.read()
    const loadout = save.loadout
    return loadout && allowedDeparture(save.camp, loadout.profession, loadout.equipment)
      ? loadout
      : { profession: 'explorer', equipment: [] }
  }

  /** Choose the next departure without changing an already active challenge snapshot. */
  selectLoadout(loadout: CampLoadout): boolean {
    const save = this.read()
    if (!allowedDeparture(save.camp, loadout.profession, loadout.equipment)) return false
    this.repository.saveExpedition({ ...save, loadout })
    return true
  }

  /** Purchase through the shared catalog and price table. */
  purchase(upgrade: Upgrade): boolean {
    return this.changeCamp((camp) => buyUpgrade(camp, upgrade))
  }

  /** Ordinary rewards stay idempotent across camp entry points. */
  claim(id: MilestoneId): boolean {
    return this.changeCamp((camp) => claimMilestone(camp, id))
  }

  /** Camp title selection affects only future departures. */
  title(id: MilestoneId | null): boolean {
    return this.changeCamp((camp) => equipTitle(camp, id))
  }

  /** Commit a pure permanent transition beside the latest story and challenge journals. */
  private changeCamp(change: (camp: Camp) => Camp): boolean {
    const save = this.read()
    const camp = change(save.camp)
    if (camp === save.camp) return false
    this.repository.saveExpedition({ ...save, camp })
    return true
  }

  /** Retire old terrain once; camp access is restored without paying a second arrival reward. */
  retireStoryWorld(active: boolean): void {
    const save = this.read()
    const story = save.story ?? EMPTY_STORY
    const progress = {
      ...story,
      arrived: true,
      journal: null,
      world: { revision: STORY_REVISION, active: null, hasVisited: false, scenes: [] },
      facts: [...new Set([...(story.facts ?? []), 'camp-reached' as const])],
      completed: [...new Set([...story.completed, 'reach-camp' as const])],
      claimed: [...new Set([...story.claimed, 'reach-camp' as const])],
      dialogue: { completed: story.dialogue?.completed ?? [], active: null },
    }
    delete progress.route
    delete progress.routeLegacy
    this.repository.saveExpedition({
      ...save,
      story: progress,
      camp: {
        ...save.camp,
        supplies: Math.min(Number.MAX_SAFE_INTEGER, save.camp.supplies + (active ? 200 : 0)),
      },
    })
  }

  /** Claim completed story rewards and checkpoint shared progress in one storage write. */
  saveStory(story: StoryProgress, compensation = 0): void {
    const save = this.read()
    const previous = save.story ?? EMPTY_STORY
    const claimed = [...previous.claimed]
    let earned = compensation
    for (const id of story.completed) {
      if (claimed.includes(id)) continue
      claimed.push(id)
      earned += storyTaskReward(id)
    }
    const completed: StoryTask[] = [...new Set([...previous.completed, ...story.completed])]
    this.repository.saveExpedition({
      ...save,
      story: { ...story, arrived: story.arrived || previous.arrived, completed, claimed },
      camp: {
        ...save.camp,
        supplies: Math.min(Number.MAX_SAFE_INTEGER, save.camp.supplies + earned),
      },
    })
  }
}
