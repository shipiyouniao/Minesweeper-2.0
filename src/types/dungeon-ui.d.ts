/** Generated raster assets used by terrain, landmarks, character and tool controls. */
export type DungeonSprite =
  'player' | 'entrance' | 'exit' | 'treasure' | 'wall' | 'probe' | 'scanner' | 'shield' | 'mine'

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
