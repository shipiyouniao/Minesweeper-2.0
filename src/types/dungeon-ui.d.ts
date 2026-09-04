/** Generated raster assets used by terrain, landmarks, character and tool controls. */
export type DungeonSprite =
  'player' | 'entrance' | 'exit' | 'treasure' | 'wall' | 'probe' | 'scanner' | 'shield' | 'mine'

/** Tools with an explicit row target; no implicit focus-derived target exists. */
export type RowTool = 'probe' | 'scan'

/** One owned pointer drag, independent from a keyboard-selected tool. */
export interface ToolDrag {
  readonly pointerId: number
  readonly tool: RowTool
  readonly originX: number
  readonly originY: number
  moved: boolean
}
