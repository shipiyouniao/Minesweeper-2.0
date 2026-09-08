import { sonarRegion } from './sonar.js'
import type { Expedition, ExpeditionAction } from '../types/variants.js'
import type { ExpeditionSonar } from '../types/echo.js'

export const EMPTY_EXPEDITION_SONAR: ExpeditionSonar = {
  charges: 0,
  progress: 0,
  loan: 0,
  loanProgress: 0,
  readings: [],
}

/** The loan never consumes, duplicates or recharges an owned instrument. */
export function expeditionSonarCharges(run: Expedition): number {
  return run.encounter?.kind === 'echo' && run.phase === 'boss' ? run.sonar.loan : run.sonar.charges
}

/** Intersect only published observations; never inspect the hidden active-core coordinate. */
export function echoCandidates(run: Expedition): readonly number[] {
  const encounter = run.encounter
  if (encounter?.kind !== 'echo') return []
  return encounter.bodies.filter((body) =>
    run.sonar.readings
      .filter((reading) => reading.phase === encounter.phase)
      .every(
        (reading) =>
          sonarRegion(run.game.config, reading.center).includes(body) === reading.resonance,
      ),
  )
}

/** A visible instrument can target covered terrain without relocating the player. */
export function canUseExpeditionSonar(run: Expedition, index: number): boolean {
  const echo = run.encounter?.kind === 'echo' ? run.encounter : null
  return (
    (run.phase === 'exploring' || run.phase === 'boss') &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < run.game.cells.length &&
    (!run.walls.includes(index) || Boolean(echo?.bodies.includes(index))) &&
    expeditionSonarCharges(run) > 0 &&
    (Boolean(echo) || run.departure.equipment.includes('sonar')) &&
    !run.sonar.readings.some(
      (reading) =>
        reading.center === index &&
        reading.realm === (run.encounter?.kind === 'mirror' ? run.encounter.active : null) &&
        reading.phase === (echo?.phase ?? null),
    )
  )
}

/** Open exactly the center, confirming a mine without triggering it or expanding a zero. */
export function useExpeditionSonar(run: Expedition, index: number): Expedition {
  if (!canUseExpeditionSonar(run, index)) return run
  const echo = run.encounter?.kind === 'echo' ? run.encounter : null
  const region = sonarRegion(run.game.config, index)
  const mine = run.game.cells[index]!.mine
  const body = Boolean(echo?.bodies.includes(index))
  const cells = body
    ? run.game.cells
    : run.game.cells.map((cell, other) =>
        other === index
          ? { ...cell, visibility: mine ? ('flagged' as const) : ('revealed' as const) }
          : cell,
      )
  return {
    ...run,
    steps: run.steps + 1,
    game: { ...run.game, cells, safeMarks: run.game.safeMarks.filter((other) => other !== index) },
    confirmedMines: mine ? [...new Set([...run.confirmedMines, index])] : run.confirmedMines,
    sonar: {
      ...run.sonar,
      charges: run.sonar.charges - Number(!echo),
      loan: run.sonar.loan - Number(Boolean(echo)),
      readings: [
        ...run.sonar.readings,
        {
          realm: run.encounter?.kind === 'mirror' ? run.encounter.active : null,
          center: index,
          mines: region.filter((other) => run.game.cells[other]?.mine).length,
          phase: echo?.phase ?? null,
          resonance: echo ? region.includes(echo.boss) : null,
        },
      ],
    },
    encounter: echo ? { ...echo, pulsesUsed: echo.pulsesUsed + 1 } : run.encounter,
  }
}

/** Count a safe player excavation once; scans, flood size, annotations and retries never recharge. */
export function rechargeExpeditionSonar(
  before: Expedition,
  after: Expedition,
  action: ExpeditionAction,
): Expedition {
  if (
    before === after ||
    (action.type !== 'reveal' && action.type !== 'chord') ||
    before.floor !== after.floor ||
    before.encounter?.kind !== after.encounter?.kind ||
    after.health < before.health ||
    after.phase === 'lost' ||
    after.triggeredMines.length > before.triggeredMines.length ||
    !after.game.cells.some(
      (cell, index) =>
        !cell.mine &&
        cell.visibility === 'revealed' &&
        before.game.cells[index]?.visibility !== 'revealed',
    )
  )
    return after
  const loan = after.encounter?.kind === 'echo'
  if (!loan && !after.departure.equipment.includes('sonar')) return after
  const threshold = loan ? 4 : 12
  const progress = (loan ? before.sonar.loanProgress : before.sonar.progress) + 1
  const charges = Math.min(
    3,
    (loan ? after.sonar.loan : after.sonar.charges) + Number(progress >= threshold),
  )
  return {
    ...after,
    sonar: {
      ...after.sonar,
      ...(loan
        ? { loan: charges, loanProgress: progress % threshold }
        : { charges, progress: progress % threshold }),
    },
  }
}

/** Most arena clues remain obscured until covered by a Sonar scan. */
export function echoObscured(run: Expedition, index: number): boolean {
  return (
    run.encounter?.kind === 'echo' &&
    run.phase === 'boss' &&
    run.game.cells[index]?.visibility === 'revealed' &&
    run.game.cells[index]!.adjacent > 0 &&
    index % 4 !== 0 &&
    !run.sonar.readings.some((reading) =>
      sonarRegion(run.game.config, reading.center).includes(index),
    )
  )
}

/** Public detonations remove physical mines; preserve observations by subtracting those known changes. */
export function refreshExpeditionReadings(before: Expedition, after: Expedition): Expedition {
  if (
    before.floor !== after.floor ||
    before.encounter?.kind !== after.encounter?.kind ||
    before.game.cells.length !== after.game.cells.length
  )
    return after
  if (
    before.encounter?.kind === 'mirror' &&
    after.encounter?.kind === 'mirror' &&
    before.encounter.active !== after.encounter.active
  )
    return after
  const removed = before.game.cells.flatMap((cell, index) =>
    cell.mine && !after.game.cells[index]?.mine ? [index] : [],
  )
  if (!removed.length) return after
  return {
    ...after,
    sonar: {
      ...after.sonar,
      readings: after.sonar.readings.map((reading) => ({
        ...reading,
        mines:
          reading.mines -
          removed.filter((index) => sonarRegion(after.game.config, reading.center).includes(index))
            .length,
      })),
    },
  }
}
