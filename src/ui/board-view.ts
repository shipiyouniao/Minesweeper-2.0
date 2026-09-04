import type { NavigationKey, NavigationResult } from '../types/ui.js'
import type { Config, Game } from '../types/game.js'
import type { Messages } from '../types/localization.js'
import { cellContent, moveFocus } from './presentation.js'

/** Owns the board DOM and its roving keyboard focus, never the game rules. */
export class BoardView {
  private readonly root: HTMLElement
  private readonly config: Config
  private readonly cells: HTMLButtonElement[] = []
  private focusedIndex: number

  /** Build one accessible grid for the current dimensions. */
  constructor(root: HTMLElement, config: Config, focusedIndex = 0) {
    this.root = root
    this.config = config
    this.focusedIndex = focusedIndex
    this.build()
  }

  /** Preserve the focused cell when only the surrounding language changes. */
  get focusIndex(): number {
    return this.focusedIndex
  }

  /** Paint visible cell information while leaving covered clues out of the DOM. */
  render(game: Game, paused: boolean, messages: Messages): void {
    const ended = game.phase === 'won' || game.phase === 'lost'

    for (const [index, button] of this.cells.entries()) {
      const cell = game.cells[index]

      if (!cell) {
        continue
      }

      const showMine = ended && cell.mine
      const wrongFlag = ended && !cell.mine && cell.visibility === 'flagged'
      const content = cellContent(cell, ended, messages)

      button.className = `cell ${cell.visibility}${showMine ? ' mine' : ''}${wrongFlag ? ' wrong' : ''}${index === game.exploded ? ' exploded' : ''}`
      button.dataset['state'] = cell.visibility
      button.dataset['number'] = cell.visibility === 'revealed' ? String(cell.adjacent) : ''
      button.innerHTML = content.html
      button.setAttribute(
        'aria-label',
        `${messages.row} ${Math.floor(index / game.config.width) + 1}, ${messages.column} ${(index % game.config.width) + 1}: ${content.label}`,
      )
      button.setAttribute('aria-disabled', String(paused || ended))
    }

    // Inert prevents keyboard interaction with the board hidden by the pause cover.
    this.root.inert = paused
  }

  /** Keep exactly one cell in the tab order after mouse or keyboard focus changes. */
  rememberFocus(index: number): void {
    if (!this.cells[index]) {
      return
    }

    this.focusedIndex = index

    for (const [cellIndex, button] of this.cells.entries()) {
      button.tabIndex = cellIndex === index ? 0 : -1
    }
  }

  /** Apply a recognized navigation key and let the browser scroll the cell into view. */
  navigate(index: number, key: NavigationKey): NavigationResult {
    const next = moveFocus(this.config, index, key)
    const cell = this.cells[next]

    if (!cell) {
      return 'unavailable'
    }

    if (next === index) return 'edge'

    cell.focus({ preventScroll: false })
    return 'moved'
  }

  /** Allocate rows and buttons once per board instead of rebuilding them on each move. */
  private build(): void {
    this.root.style.setProperty('--columns', String(this.config.width))
    this.root.classList.toggle('dense', this.config.width > 9)

    for (let row = 0; row < this.config.height; row++) {
      const line = document.createElement('div')
      line.className = 'board-row'
      line.setAttribute('role', 'row')

      for (let column = 0; column < this.config.width; column++) {
        const index = row * this.config.width + column
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'cell'
        button.dataset['cell'] = String(index)
        button.setAttribute('role', 'gridcell')
        button.tabIndex = index === this.focusedIndex ? 0 : -1

        this.cells.push(button)
        line.append(button)
      }

      this.root.append(line)
    }
  }
}
