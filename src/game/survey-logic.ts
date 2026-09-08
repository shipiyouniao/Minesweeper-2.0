import type { Config } from '../types/game.js'
import type { SurveyDeduction, SurveyKnowledge } from '../types/survey.js'

/** Read consecutive occupied lengths; an empty line has no runs, displayed as zero. */
export function surveyRuns(mines: readonly boolean[]): readonly number[] {
  const runs: number[] = []
  let length = 0
  for (const mine of [...mines, false]) {
    if (mine) length++
    else if (length) {
      runs.push(length)
      length = 0
    }
  }
  return runs
}

/** Enumerate ordered runs separated by at least one safe square; boards have at most 16 columns. */
function linePatterns(length: number, runs: readonly number[]): readonly number[] {
  const patterns: number[] = []

  /** Place the next run while reserving space for every following run and its separator. */
  function place(run: number, start: number, mask: number): void {
    if (run === runs.length) {
      patterns.push(mask)
      return
    }
    const size = runs[run]!
    const remaining = runs.slice(run + 1).reduce((sum, value) => sum + value + 1, 0)
    for (let at = start; at + size + remaining <= length; at++)
      place(run + 1, at + size + 1, mask | (((1 << size) - 1) << at))
  }

  place(0, 0, 0)
  return patterns
}

/** Discard candidates contradicted by public safe cells or player flags. */
function compatible(pattern: number, cells: readonly SurveyKnowledge[]): boolean {
  return cells.every((cell, index) =>
    cell === 'unresolved' ? true : Boolean(pattern & (1 << index)) === (cell === 'mine'),
  )
}

/** Keep only agreements shared by every possible placement, never a preferred solution. */
function agreements(patterns: readonly number[], length: number): readonly SurveyKnowledge[] {
  let alwaysMine = (1 << length) - 1
  let sometimesMine = 0
  for (const pattern of patterns) {
    alwaysMine &= pattern
    sometimesMine |= pattern
  }
  return Array.from({ length }, (_, index) =>
    alwaysMine & (1 << index) ? 'mine' : sometimesMine & (1 << index) ? 'unresolved' : 'safe',
  )
}

/** Solve a single line for UI conflict/completion checks, using only its visible evidence. */
export function deduceSurveyLine(
  runs: readonly number[],
  cells: readonly SurveyKnowledge[],
): SurveyDeduction {
  const patterns = linePatterns(cells.length, runs).filter((pattern) => compatible(pattern, cells))
  return {
    cells: patterns.length ? agreements(patterns, cells.length) : cells,
    contradiction: patterns.length === 0,
    rounds: 1,
  }
}

/** Map a row or column to its board indices in clue-reading order. */
export function surveyIndices(config: Config, axis: 'row' | 'column', line: number): number[] {
  const length = axis === 'row' ? config.width : config.height
  return Array.from({ length }, (_, offset) =>
    axis === 'row' ? line * config.width + offset : offset * config.width + line,
  )
}

/** Alternate line intersections to a fixed point. No guesses, search branches, or mine oracle. */
export function deduceSurvey(
  config: Config,
  rows: readonly (readonly number[])[],
  columns: readonly (readonly number[])[],
  known: readonly SurveyKnowledge[],
): SurveyDeduction {
  const cells = [...known]
  const lines = (['row', 'column'] as const).flatMap((axis) =>
    (axis === 'row' ? rows : columns).map((runs, line) => ({
      indices: surveyIndices(config, axis, line),
      patterns: linePatterns(axis === 'row' ? config.width : config.height, runs),
    })),
  )
  let changed = true
  let rounds = 0
  while (changed) {
    changed = false
    rounds++
    for (const line of lines) {
      const visible = line.indices.map((index) => cells[index]!)
      line.patterns = line.patterns.filter((pattern) => compatible(pattern, visible))
      if (!line.patterns.length) return { cells, contradiction: true, rounds }
      const next = agreements(line.patterns, visible.length)
      for (const [offset, index] of line.indices.entries()) {
        if (cells[index] === 'unresolved' && next[offset] !== 'unresolved') {
          cells[index] = next[offset]!
          changed = true
        }
      }
    }
  }
  return { cells, contradiction: false, rounds }
}
