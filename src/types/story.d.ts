import type { CampaignSave } from './campaign.js'
import type { Game } from './game.js'
import type { Equipment, Profession } from './variants.js'
import type { CampScreen } from './camp-navigation.js'
import type { Camp } from './variants.js'
import type { Language } from './localization.js'

/** Dialogue beats are presentation only; actions still belong to the playable scene. */
export interface StoryDialogueBeat {
  readonly speaker: 'player' | 'lumi'
  readonly line: string
  readonly gesture: 'wake' | 'point' | 'nod' | 'greet' | 'offer' | 'steady'
}

/** Board reactions play after the corresponding accepted interaction. */
export type StoryReaction = 'greet' | 'collect'

/** Authored scenes share coordinates and movement without sharing a random generator. */
export interface StoryScene {
  readonly mechanisms?: readonly StoryMechanism[]
  readonly id: StorySceneId | 'camp'
  readonly rows: readonly string[]
  readonly clue: number | null
  readonly safeClue: number | null
  readonly teachingMine: number | null
  readonly teachingSafe: number | null
}

/** Authored controls release safe terrain; their numbers still describe ordinary nearby hazards. */
export interface StoryMechanism {
  readonly kind: 'brake' | 'winch'
  readonly index: number
  readonly gate: number
}

/** A scene contains truthful clues; walls and landmarks are separate from hazard truth. */
export interface StoryBoard {
  readonly scene: StoryScene
  readonly game: Game
  readonly walls: readonly number[]
  readonly entrance: number
  readonly exit: number
  readonly treasure: number | null
}

/** Only accepted player actions enter the current content revision's journal. */
export type StoryAction =
  | { readonly type: 'visit' | 'flag' | 'inspect' | 'chord' | 'operate'; readonly index: number }
  | { readonly type: 'continue' }
  | { readonly type: 'return' }
  | { readonly type: 'retry' }

/** Runtime state is rebuilt from authored content, never from serialized hidden cells. */
export interface StoryRun {
  readonly operated: readonly number[]
  readonly visited?: readonly StorySceneMemory[]
  readonly floor: number
  readonly board: StoryBoard
  readonly player: number
  readonly health: number
  readonly inspected: boolean
  readonly practicedFlag: boolean
  readonly practicedReveal: boolean
  readonly collected: boolean
  readonly rescuedSupplies: boolean
  readonly triggered: readonly number[]
  readonly phase: 'exploring' | 'arrived' | 'fallen'
}

/** Scene snapshots never recursively include the travel history. */
export type StorySceneMemory = Omit<StoryRun, 'visited'>

/** Permanent story objectives are separate from ordinary expedition milestones. */
export type StoryTask =
  | 'reach-camp'
  | 'lost-satchel'
  | 'meet-guide'
  | 'survey-road'
  | 'repair-lift'
  | 'reach-tower'
  | 'survey-ridge'
  | 'find-beacon'

/** One envelope commits story rewards and the shared wallet together. */
export type StoryCampaignMetric = 'travel' | 'chests' | 'floors' | 'bosses' | 'skills' | 'wins'
export type StoryCampaignActivity = Partial<Readonly<Record<StoryCampaignMetric, number>>>

export interface StoryProgress {
  readonly campaignActivity?: StoryCampaignActivity
  readonly world?: StoryWorldCheckpoint
  readonly facts?: readonly StoryFact[]
  readonly dialogue?: StoryDialogueProgress
  readonly accepted?: readonly StoryTask[]
  readonly pinned?: readonly StoryTask[]
  readonly mapOwned?: boolean
  readonly route?: { readonly revision: number; readonly actions: readonly StoryAction[] }
  readonly routeLegacy?: boolean
  readonly arrived: boolean
  readonly completed: readonly StoryTask[]
  readonly claimed: readonly StoryTask[]
  readonly campPosition: number
  readonly journal: { readonly revision: number; readonly actions: readonly StoryAction[] } | null
}

export type StoryDialogueId =
  | 'wake'
  | 'flag'
  | 'open'
  | 'travel'
  | 'trail'
  | 'satchel'
  | 'approach'
  | 'arrival'
  | 'guide'
  | 'road'
  | 'north-road-start'
  | 'north-road-found'
  | 'north-road-report'
  | 'quarry-lead'
  | 'spindle-found'
  | 'lift-repaired'
  | 'tower-arrival'
  | 'quarry-brake'
  | 'quarry-release'
  | 'quarry-winch'

export interface StoryDialogueProgress {
  readonly completed: readonly StoryDialogueId[]
  readonly active: { readonly id: StoryDialogueId; readonly beat: number } | null
}

/** Versioned storage DTO. Runtime aliases are confined to the decoder/encoder boundary. */
export interface LegacyStorySaveData {
  readonly schemaVersion: 2
  readonly travel: {
    readonly campReached: boolean
    readonly campPosition: number
    readonly activeJournal: StoryProgress['journal']
    readonly archivedJournal: StoryProgress['route'] | null
    readonly origin: 'prologue' | 'surveyed-legacy'
  }
  readonly quests: {
    readonly campaignActivity?: StoryCampaignActivity
    readonly facts: readonly StoryFact[]
    readonly accepted: readonly StoryTask[]
    readonly pinned: readonly StoryTask[]
    readonly completed: readonly StoryTask[]
    readonly claimed: readonly StoryTask[]
  }
  readonly inventory: { readonly mapOwned: boolean }
  readonly dialogue: StoryDialogueProgress
}

/** Camp choices are shared; starting a run still takes an immutable departure snapshot. */
export interface CampLoadout {
  readonly profession: Profession
  readonly equipment: readonly Equipment[]
}

/** Camp landmarks open existing services after physical arrival on safe paths. */
export interface CampSite {
  readonly index: number
  readonly destination:
    'professions' | 'equipment' | 'missions' | 'achievements' | 'shop' | 'guide' | 'road'
  readonly sprite:
    'workshop' | 'treasure' | 'player' | 'archive' | 'survey-notes' | 'exit' | 'guardian-crests'
}

/** A rejected action can explain its cause without revealing covered hazards. */
export type StoryFeedback =
  'none' | 'route' | 'lesson' | 'hurt' | 'flag' | 'reveal' | 'arrive' | 'saved' | 'cargo'

/** One presentation snapshot contains only the selected scene and shared camp services. */
export interface StoryViewState {
  readonly campaignCleared?: boolean
  readonly campaign?: CampaignSave
  readonly language: Language
  readonly run: StoryRun | null
  readonly board: StoryBoard
  readonly player: number
  readonly camp: Camp
  readonly loadout: CampLoadout
  readonly progress: StoryProgress
  readonly service: CampScreen | null
  readonly conversation: 'guide' | 'road' | null
  readonly flagMode: boolean
  readonly inspected: number | null
  readonly feedback: StoryFeedback
  readonly sound: boolean
  readonly storageAvailable: boolean
  readonly touchInput?: boolean
  readonly selectedTask?: StoryTask | null
  readonly panel?: 'tasks' | 'map' | null
  readonly mapLevel?: 'local' | 'region' | 'world'
  readonly mapScene?: number
  readonly mapLegend?: boolean
}

/** Touch holds track their original cell and stop when the gesture becomes a scroll. */
export interface StoryHold {
  readonly fired: boolean
  readonly index: number
  readonly pointerId: number
  readonly x: number
  readonly y: number
  readonly timer: ReturnType<typeof setTimeout>
}

/** Durable outcomes describe the fiction, independent of board coordinates or wording. */
export type StoryFact =
  | 'ridge-route'
  | 'ridge-surveyed'
  | 'beacon-recovered'
  | 'camp-reached'
  | 'satchel-secured'
  | 'satchel-delivered'
  | 'guide-met'
  | 'lift-discovered'
  | 'road-reported'
  | 'spindle-secured'
  | 'lift-restored'
  | 'tower-reached'

/** Content uses explicit prerequisite groups, never executable string expressions. */
export type StoryCondition =
  | { readonly kind: 'campaign'; readonly metric: StoryCampaignMetric; readonly target: number }
  | { readonly kind: 'fact'; readonly id: StoryFact }
  | { readonly kind: 'task'; readonly id: StoryTask }
  | { readonly kind: 'dialogue'; readonly id: StoryDialogueId }
  | { readonly kind: 'all' | 'any'; readonly conditions: readonly StoryCondition[] }

/** One catalog owns a task's identity, introduction, prerequisites, outcome and reward. */
export interface StoryTaskDefinition {
  readonly id: StoryTask
  readonly category: 'main' | 'side'
  readonly introducedBy: StoryDialogueId | 'nia-route' | 'ridge-bearing'
  readonly prerequisite: StoryCondition
  readonly objective: StoryCondition
  readonly supplies: number
}

export type StorySceneId =
  | 'awakening'
  | 'trail'
  | 'approach'
  | 'north-road'
  | 'quarry-yard'
  | 'quarry-passage'
  | 'quarry-machine'
  | 'tower-landing'

/** Only differences from authored terrain are stored; hazards and clue numbers are rebuilt. */
export interface StorySceneCheckpoint {
  readonly operated: readonly number[]
  readonly id: StorySceneId
  readonly player: number
  readonly health: number
  readonly revealed: readonly number[]
  readonly flagged: readonly number[]
  readonly triggered: readonly number[]
  readonly inspected: boolean
  readonly practicedFlag: boolean
  readonly practicedReveal: boolean
  readonly collected: boolean
  readonly rescuedSupplies: boolean
  readonly phase: StoryRun['phase']
}

export interface StoryWorldCheckpoint {
  readonly revision: number
  readonly active: StorySceneId | null
  readonly hasVisited: boolean
  readonly scenes: readonly StorySceneCheckpoint[]
}

export interface StoryWorldSaveData {
  readonly schemaVersion: 4
  readonly travel: {
    readonly campReached: boolean
    readonly campPosition: number
    readonly world: StoryWorldCheckpoint
  }
  readonly quests: LegacyStorySaveData['quests']
  readonly inventory: LegacyStorySaveData['inventory']
  readonly dialogue: StoryDialogueProgress
}

export type StorySaveData = LegacyStorySaveData | StoryWorldSaveData
