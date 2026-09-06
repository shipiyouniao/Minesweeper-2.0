import type { Ruleset } from './variants.js'
import type { BoardInputMode } from './ui.js'
import type { EncounterKind } from './tactical.js'
import type { DungeonSprite } from './dungeon-ui.js'

export interface TutorialStep {
  readonly title: string
  readonly text: string
  readonly action: 'cell' | 'inspect' | 'mode' | 'skill' | 'probe' | 'scan'
  readonly index: number
  readonly side: 'a' | 'b'
  readonly mode?: BoardInputMode
}

export interface TutorialDefinition {
  readonly mode: Ruleset
  readonly title: string
  readonly steps: readonly TutorialStep[]
  readonly ending: string
}

export interface PrologueBeat {
  readonly speaker: 'player' | 'boss' | 'scene'
  readonly line: string
  readonly focus: 'boss' | 'player' | 'objective' | 'field'
}

export interface PrologueScript {
  readonly kind: EncounterKind
  readonly title: string
  readonly subtitle: string
  readonly sprite: DungeonSprite
  readonly prop: DungeonSprite
  readonly beats: readonly PrologueBeat[]
}
