import { recordStoryCampaign } from '../game/story-quests.js'
import { grantRescuer } from '../game/story-rewards.js'
import { advanceBattleLesson } from '../game/battle-lesson.js'
import type { BattleLesson } from '../types/battle-lesson.js'
import { campaignProgress, campaignStage, updateCampaign } from '../game/campaign-catalog.js'
import type { CampaignStage, CampaignStageProgress } from '../types/campaign.js'
import type { CampaignSceneId } from '../types/campaign.js'
import { recordStoryFacts } from '../game/story-quests.js'
import { EXPEDITION_RULES_REVISION } from '../persistence/expedition-format.js'
import { addVariantRecord } from '../game/variant-difficulty.js'
import { ownedRelicPacks } from '../game/relic-packs.js'
import { ownedCombatTraining } from '../game/combat-build.js'
import {
  advanceMilestones,
  claimMilestone,
  ownedMilestoneRelics,
  ownedTitles,
  milestoneProgress,
  equipTitle,
} from '../game/milestones.js'
import type { MilestoneId } from '../types/milestones.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import {
  actExpedition,
  allowedDeparture,
  buyUpgrade,
  createExpedition,
  EMPTY_CAMP,
  expeditionEarnings,
} from '../game/expedition.js'
import { MAX_ACTIONS } from '../persistence/variant-decoders.js'
import type {
  Camp,
  Departure,
  Equipment,
  Expedition,
  ExpeditionAction,
  ExpeditionSave,
  Profession,
  Upgrade,
  VariantRecord,
} from '../types/variants.js'
import type { SessionRuntime } from '../types/session.js'
import { VariantRepository } from '../persistence/variant-repository.js'
import type { CampLoadout } from '../types/story.js'

/** Owns a replayable expedition and atomically settles its permanent camp progress. */
export class ExpeditionSession {
  private readonly repository: VariantRepository
  private readonly runtime: SessionRuntime
  private save: ExpeditionSave
  private current: Expedition | null = null

  /** Restore validated intents, recomputing hidden layout and all earned resources. */
  constructor(repository: VariantRepository, runtime: SessionRuntime) {
    this.repository = repository
    this.runtime = runtime
    this.save = repository.expedition() ?? {
      version: 4,
      camp: EMPTY_CAMP,
      journal: null,
      records: [],
    }
    // Commit the camp credit and removal of the obsolete journal in one storage write.
    if (repository.migrated || repository.recovered) this.commit()
    const journal = this.save.journal
    if (!journal) return

    if (
      allowedDeparture(this.save.camp, journal.departure.profession, journal.departure.equipment) &&
      (journal.departure.title === null ||
        ownedTitles(this.camp).includes(journal.departure.title)) &&
      (!journal.departure.archive || this.save.camp.upgrades.includes('archive')) &&
      journal.departure.packs.every((pack) => this.save.camp.upgrades.includes(pack)) &&
      journal.departure.training.every((training) => this.save.camp.upgrades.includes(training)) &&
      (journal.departure.milestoneRelics ?? []).every((relic) =>
        ownedMilestoneRelics(this.camp).includes(relic),
      ) &&
      (!journal.departure.battleRelics || this.save.camp.upgrades.includes('battle-manual'))
    ) {
      let run = createExpedition(journal.departure)
      let valid = true
      for (const action of journal.actions) {
        const next = actExpedition(run, action)
        if (next === run) {
          valid = false
          break
        }
        run = next
      }
      if (valid && (run.phase === 'exploring' || run.phase === 'boss' || run.phase === 'reward'))
        this.current = run
    }

    if (!this.current) {
      repository.recovered = true
      this.save = { ...this.save, journal: null }
      this.commit()
    }
  }

  /** Read the immutable run snapshot; null means the camp screen. */
  get run(): Expedition | null {
    return this.current
  }

  /** Campaign uses the same controls with an independent attempt slot. */
  get campaignMode(): boolean {
    return this.repository.campaignMode
  }

  /** Resolve content from the selected repository slot, never from a mutable menu choice. */
  get stage(): CampaignStage {
    return campaignStage(this.repository.campaignStage)
  }

  /** Read the selected stage's progress without duplicating its authoritative save record. */
  get stageProgress(): CampaignStageProgress {
    return campaignProgress(this.save.campaign, this.stage.id)
  }

  /** A completed performance is durable; unfinished lines can replay after re-entry. */
  completeCampaignScene(id: CampaignSceneId): void {
    if (!this.campaignMode || this.stageProgress.scenes.includes(id)) return
    this.refreshShared()
    this.save = {
      ...this.save,
      campaign: updateCampaign(this.save.campaign, {
        ...this.stageProgress,
        scenes: [...this.stageProgress.scenes, id],
      }),
    }
    this.commit()
  }

  /** Tutorial state is independent of consumable resources and survives world return. */
  get campaignLesson(): number {
    let step = this.stageProgress.lesson
    const actions = this.save.journal?.actions ?? []
    if (
      step === 1 &&
      actions.some(
        (action) => action.type === 'probe' || action.type === 'sweep' || action.type === 'sonar',
      )
    )
      step = 2
    if (step === 2 && actions.some((action) => action.type === 'skill')) step = 3
    return step
  }

  /** Start or dismiss the first-floor practice without granting tools or changing the run. */
  setCampaignLesson(step: number): void {
    if (!this.campaignMode || !this.current) return
    this.refreshShared()
    this.save = {
      ...this.save,
      campaign: updateCampaign(this.save.campaign, {
        ...this.stageProgress,
        lesson: step === 0 ? 0 : step === 1 ? 1 : 4,
      }),
    }
    this.commit()
  }

  /** Read permanent progress separately from temporary run resources. */
  get camp(): Camp {
    return this.save.camp
  }

  /** Reuse camp choices across the story board and temporary roguelite entrance. */
  get loadout(): CampLoadout {
    const loadout = this.save.loadout
    return loadout && allowedDeparture(this.camp, loadout.profession, loadout.equipment)
      ? loadout
      : { profession: 'explorer', equipment: [] }
  }

  /** Persist future departure choices without altering a current run. */
  selectLoadout(loadout: CampLoadout): void {
    this.refreshShared()
    if (this.current || !allowedDeparture(this.camp, loadout.profession, loadout.equipment)) return
    this.save = { ...this.save, loadout }
    this.commit()
  }

  /** Return up to ten outcomes per difficulty, separate from other rulesets. */
  get records(): readonly VariantRecord[] {
    return this.save.records
  }

  /** Restore the last departure choice without changing an active run's rules. */
  get difficulty(): VariantDifficulty {
    return this.current?.departure.difficulty ?? this.save.difficulty ?? 'standard'
  }

  /** Persist a camp choice only when no expedition is active. */
  selectDifficulty(difficulty: VariantDifficulty): void {
    this.refreshShared()
    if (this.current) return

    this.save = { ...this.save, difficulty }
    this.commit()
  }

  /** Reserve the final journal slot for extraction when the recovery budget is exhausted. */
  get atMoveLimit(): boolean {
    return (this.save.journal?.actions.length ?? 0) >= MAX_ACTIONS - 1
  }

  /** Begin only from camp, with a verified career and affordable equipment allocation. */
  start(
    profession: Profession,
    equipment: readonly Equipment[],
    difficulty: VariantDifficulty = this.difficulty,
  ): boolean {
    this.refreshShared()
    if (this.current || !allowedDeparture(this.camp, profession, equipment)) return false
    if (
      this.repository.campaignMode &&
      (this.stageProgress.cleared ||
        (this.stage.prerequisite !== null &&
          !campaignProgress(this.save.campaign, this.stage.prerequisite).cleared) ||
        !this.save.story?.completed.includes(this.stage.entryTask) ||
        (this.stage.entrance.fact !== null &&
          !this.save.story.facts?.includes(this.stage.entrance.fact)) ||
        this.save.story.world?.active !== this.stage.entrance.scene ||
        (this.stage.entrance.index !== null &&
          this.save.story.world?.scenes.find((scene) => scene.id === this.stage.entrance.scene)
            ?.player !== this.stage.entrance.index))
    )
      return false
    const departure: Departure = {
      ...(this.repository.campaignMode ? { campaign: this.stage.revision } : {}),
      title: milestoneProgress(this.camp).title ?? null,
      training: ownedCombatTraining(this.camp),
      battleRelics: this.camp.upgrades.includes('battle-manual'),
      packs: ownedRelicPacks(this.camp),
      milestoneRelics: ownedMilestoneRelics(this.camp),
      difficulty: this.repository.campaignMode ? 'relaxed' : difficulty,
      seed: this.repository.campaignMode ? 0 : this.runtime.randomSeed(),
      profession,
      equipment: [...equipment],
      archive: this.camp.upgrades.includes('archive'),
    }
    this.current = createExpedition(departure)
    this.save = {
      ...this.save,
      ...(this.campaignMode
        ? {
            campaign: updateCampaign(this.save.campaign, {
              ...this.stageProgress,
              journal: null,
              records: this.stageProgress.records,
              cleared: false,
              lesson: this.stage.lesson ? 0 : 4,
              scenes: this.stageProgress.scenes,
            }),
          }
        : {}),
      difficulty,
      journal: {
        departure,
        actions: [],
        rulesRevision: EXPEDITION_RULES_REVISION,
        returnSupplies: 0,
      },
    }
    this.commit()
    return true
  }

  /** Apply a legal intent and settle terminal outcomes in the same persistence write. */
  dispatch(action: ExpeditionAction): boolean {
    this.refreshShared()
    const run = this.current
    const journal = this.save.journal
    if (
      !run ||
      !journal ||
      (journal.actions.length >= MAX_ACTIONS - 1 && action.type !== 'retreat')
    )
      return false
    const next = actExpedition(run, action)
    if (next === run) return false
    this.current = next
    const progressedCamp = advanceMilestones(this.camp, run, next)
    const camp = run.encounter
      ? {
          ...progressedCamp,
          battleLesson: advanceBattleLesson(this.camp.battleLesson ?? 'points', run, next, action),
        }
      : progressedCamp
    const lesson = this.campaignLesson
    const nextLesson =
      !this.campaignMode || run.floor !== 1
        ? lesson
        : lesson === 1 &&
            (action.type === 'probe' || action.type === 'sweep' || action.type === 'sonar')
          ? 2
          : lesson === 2 && action.type === 'skill'
            ? 3
            : lesson === 3 &&
                (action.type === 'reveal' || action.type === 'move') &&
                run.surveyedCells.includes(action.index)
              ? 4
              : lesson
    this.save = {
      ...this.save,
      ...(this.campaignMode
        ? {
            campaign: updateCampaign(this.save.campaign, {
              ...this.stageProgress,
              journal,
              records: this.save.records,
              lesson: nextLesson,
            }),
          }
        : {}),
      camp,
      ...(this.campaignMode && this.save.story
        ? {
            story: recordStoryCampaign(
              this.save.story,
              milestoneProgress(this.camp),
              milestoneProgress(camp),
            ),
          }
        : {}),
      journal: {
        ...journal,
        actions: [...journal.actions, action],
        // A future release can bank extraction without retaining this release's game engine.
        returnSupplies: expeditionEarnings({ ...next, phase: 'retreated' }),
      },
    }

    if (next.phase === 'lost' || next.phase === 'won' || next.phase === 'retreated') {
      const earned = this.repository.campaignMode
        ? next.phase === 'won' && !this.stageProgress.cleared
          ? this.stage.reward
          : 0
        : expeditionEarnings(next)
      const record: VariantRecord = {
        difficulty: next.departure.difficulty,
        date: this.runtime.date(),
        outcome: next.phase,
        steps: next.steps,
        depth: next.floor,
        earned,
      }
      this.save = {
        ...this.save,
        version: 4,
        ...(this.repository.campaignMode
          ? {
              campaign: updateCampaign(this.save.campaign, {
                ...this.stageProgress,
                journal: null,
                records: this.save.records,
                cleared: this.stageProgress.cleared || next.phase === 'won',
                lesson: this.campaignLesson,
                recordSaved:
                  this.stageProgress.recordSaved || (next.phase === 'won' && !!next.signalRecord),
              }),
            }
          : {}),
        difficulty: this.difficulty,
        journal: null,
        camp: {
          ...(this.campaignMode && this.stage.id === 'quarry-rescue' && next.phase === 'won'
            ? grantRescuer(this.camp)
            : this.camp),
          supplies: Math.min(Number.MAX_SAFE_INTEGER, this.camp.supplies + earned),
          completed: this.camp.completed + Number(next.phase === 'won'),
        },
        records: addVariantRecord(this.save.records, record),
        ...(this.campaignMode && this.stage.outcome && next.phase === 'won' && this.save.story
          ? {
              story: recordStoryFacts(this.save.story, [this.stage.outcome]),
            }
          : {}),
      }
    }

    this.commit()
    return true
  }

  /** Persist coach progress independently from the accepted gameplay journal. */
  setBattleLesson(step: BattleLesson): void {
    this.refreshShared()
    this.save = { ...this.save, camp: { ...this.camp, battleLesson: step } }
    this.commit()
  }

  /** Return from the terminal result to camp without awarding anything a second time. */
  returnToCamp(): boolean {
    if (!this.current || this.save.journal) return false
    this.current = null
    return true
  }

  /** Permanent purchases are permitted only at camp, never halfway through replay. */
  purchase(upgrade: Upgrade): boolean {
    this.refreshShared()
    if (this.current) return false
    const camp = buyUpgrade(this.camp, upgrade)
    if (camp === this.camp) return false
    this.save = { ...this.save, camp }
    this.commit()
    return true
  }

  /** Choose titles only at camp; the current expedition's loadout stays read-only. */
  equipTitle(id: MilestoneId | null): boolean {
    this.refreshShared()
    if (this.current) return false

    const camp = equipTitle(this.camp, id)
    if (camp === this.camp) return false
    this.save = { ...this.save, camp }
    this.commit()
    return true
  }

  /** Claim only at camp so new unlocks cannot rewrite an active departure snapshot. */
  claim(id: MilestoneId): boolean {
    this.refreshShared()
    if (this.current) return false
    const camp = claimMilestone(this.camp, id)
    if (camp === this.camp) return false
    this.save = { ...this.save, camp }
    this.commit()
    return true
  }

  /** Read shared progress before an intent so another entrance's purchases and story survive. */
  private refreshShared(): void {
    const latest = this.repository.expedition()
    if (!latest) return
    this.save = {
      ...this.save,
      camp: latest.camp,
      ...(latest.campaign ? { campaign: latest.campaign } : {}),
      ...(latest.story ? { story: latest.story } : {}),
      ...(latest.loadout ? { loadout: latest.loadout } : {}),
    }
  }

  /** Commit a synchronous intent after shared progress was refreshed at its boundary. */
  private commit(): void {
    this.repository.saveExpedition(this.save)
  }

  /** A lifecycle checkpoint has no new rewards and must preserve the newest shared progress. */
  persist(): void {
    this.refreshShared()
    this.commit()
  }
}
