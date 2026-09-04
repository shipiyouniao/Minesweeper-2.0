/** Generated raster assets used by terrain, landmarks, character and tool controls. */
export type DungeonSprite =
  | 'workshop'
  | 'archive'
  | 'bastion'
  | 'bastion-defeated'
  | 'bastion-core'
  | 'bastion-pylon'
  | 'bastion-pylon-off'
  | 'bastion-strike'
  | 'bastion-intent'
  | 'player'
  | 'survey-notes'
  | 'guardian-crests'
  | 'survival-charms'
  | 'prospector-seals'
  | 'surveyor'
  | 'engineer'
  | 'archaeologist'
  | 'alchemist'
  | 'sentinel'
  | 'skill-explorer'
  | 'skill-surveyor'
  | 'skill-engineer'
  | 'skill-archaeologist'
  | 'skill-alchemist'
  | 'skill-sentinel'
  | 'entrance'
  | 'exit'
  | 'treasure'
  | 'wall'
  | 'probe'
  | 'scanner'
  | 'shield'
  | 'mine'

/** Tools with an explicit area or row target; no implicit focus-derived target exists. */
export type DungeonTool = 'probe' | 'scan'

/** One owned pointer drag, independent from a keyboard-selected tool. */
export interface ToolDrag {
  readonly pointerId: number
  readonly tool: DungeonTool
  readonly originX: number
  readonly originY: number
  moved: boolean
}
