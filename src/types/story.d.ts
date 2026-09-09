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
  readonly id: 'awakening' | 'trail' | 'approach' | 'camp'
  readonly rows: readonly string[]
  readonly clue: number | null
  readonly safeClue: number | null
  readonly teachingMine: number | null
  readonly teachingSafe: number | null
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
  | { readonly type: 'visit' | 'flag' | 'inspect'; readonly index: number }
  | { readonly type: 'continue' }
  | { readonly type: 'retry' }

/** Runtime state is rebuilt from authored content, never from serialized hidden cells. */
export interface StoryRun {
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

/** Permanent story objectives are separate from ordinary expedition milestones. */
export type StoryTask = 'reach-camp' | 'lost-satchel' | 'meet-guide'

/** One envelope commits story rewards and the shared wallet together. */
export interface StoryProgress {
  readonly arrived: boolean
  readonly completed: readonly StoryTask[]
  readonly claimed: readonly StoryTask[]
  readonly campPosition: number
  readonly journal: { readonly revision: number; readonly actions: readonly StoryAction[] } | null
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
  'none' | 'route' | 'lesson' | 'hurt' | 'flag' | 'reveal' | 'arrive' | 'saved'

/** One presentation snapshot contains only the selected scene and shared camp services. */
export interface StoryViewState {
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
  readonly exhausted: boolean
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
