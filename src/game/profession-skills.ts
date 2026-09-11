import { currentWaymark, mobilityReady, riftLandings, useMobilitySkill } from './mobility-skills.js'
import { rescueLandings, useRescueSkill } from './rescue-skill.js'
import { available, claim } from './relic-effects.js'
import { inspectArea } from './dungeon-discovery.js'
import { neighbors } from './engine.js'
import { revealDungeon } from './dungeon-reveal.js'
import type { Expedition } from '../types/variants.js'
import type { SkillAvailability } from '../types/profession.js'

/** Select a remaining chest or combat mechanism, breaking equal distances by index for replay. */
function excavationTarget(run: Expedition): number | null {
  const width = run.game.config.width
  const row = Math.floor(run.player / width)
  const column = run.player % width
  const remaining =
    run.encounter?.kind === 'tide'
      ? [run.encounter.core]
      : run.encounter?.kind === 'matrix'
        ? [run.encounter.regions[run.encounter.phase - 1]!.indices[4]!]
        : run.encounter?.kind === 'brood'
          ? run.encounter.nests.filter((center) =>
              [center, ...neighbors(run.game.config, center)].some(
                (index) =>
                  run.game.cells[index]?.visibility !== 'revealed' &&
                  !run.confirmedMines.includes(index),
              ),
            )
          : run.encounter?.kind === 'mirror'
            ? run.encounter[run.encounter.active].seal.active
              ? [run.encounter[run.encounter.active].seal.index]
              : []
            : run.encounter?.kind === 'magnetic'
              ? run.encounter.anchors
                  .filter((anchor) => !anchor.calibrated)
                  .map((anchor) => anchor.index)
              : run.encounter?.kind === 'clock'
                ? run.encounter.hourglasses
                    .filter((glass) => !glass.used)
                    .map((glass) => glass.index)
                : run.encounter?.kind === 'echo'
                  ? [...run.encounter.bodies]
                  : run.encounter
                    ? run.encounter.pylons
                        .filter((pylon) => pylon.active)
                        .map((pylon) => pylon.index)
                    : run.treasures.filter((index) => !run.collected.includes(index))

  remaining.sort((a, b) => {
    const first = Math.abs(Math.floor(a / width) - row) + Math.abs((a % width) - column)
    const second = Math.abs(Math.floor(b / width) - row) + Math.abs((b % width) - column)
    return first - second || a - b
  })

  return remaining[0] ?? null
}

/** Derive a clipped footprint from the pawn; keyboard focus never selects the skill's origin. */
export function professionSkillArea(run: Expedition): number[] {
  const profession = run.departure.profession
  if (profession === 'rescuer') return rescueLandings(run)
  if (profession === 'riftwalker') return riftLandings(run)
  if (profession === 'waymarker') return [currentWaymark(run) ?? run.player]
  if (profession === 'engineer' || profession === 'alchemist') return []
  const center = profession === 'archaeologist' ? excavationTarget(run) : run.player
  if (center === null) return []
  const { width, height } = run.game.config
  const row = Math.floor(center / width)
  const column = center % width

  if (profession === 'surveyor') {
    return Array.from({ length: height }, (_, other) => other * width + column)
  }

  const radius = profession === 'sentinel' ? 2 : 1
  const area: number[] = []
  for (let y = Math.max(0, row - radius); y <= Math.min(height - 1, row + radius); y++) {
    for (let x = Math.max(0, column - radius); x <= Math.min(width - 1, column + radius); x++) {
      area.push(y * width + x)
    }
  }
  return area
}

/** Recognize useful scouting using public visibility and discoveries, never hidden mine values. */
function hasSkillInformation(run: Expedition): boolean {
  return professionSkillArea(run).some((index) => {
    if (run.walls.includes(index) || run.confirmedMines.includes(index)) return false
    if (run.game.cells[index]?.visibility === 'revealed') return false

    // Excavation also opens previously surveyed safe clues; other skills only confirm knowledge.
    return run.departure.profession === 'archaeologist' || !run.surveyedCells.includes(index)
  })
}

/** Explain the same eligibility checks to both the rules and the localized control. */
export function professionSkillAvailability(run: Expedition): SkillAvailability {
  if (run.phase !== 'exploring' && run.phase !== 'boss') return 'inactive'
  if (run.skillUsed) return 'used'
  if (run.departure.profession === 'rescuer')
    return rescueLandings(run).length ? 'ready' : 'no-corridor'
  if (run.departure.profession === 'waymarker' || run.departure.profession === 'riftwalker')
    return mobilityReady(run)
      ? 'ready'
      : run.departure.profession === 'waymarker'
        ? 'blocked-anchor'
        : 'no-passage'

  switch (run.departure.profession) {
    case 'engineer':
      return run.scans > 0 && run.shields < 2 ? 'ready' : 'resources'
    case 'alchemist':
      return run.shields > 0 && run.probes < 4 && run.scans < 4 ? 'ready' : 'resources'
    case 'sentinel':
      if (run.shields === 0) return 'resources'
      break
  }

  return hasSkillInformation(run) ? 'ready' : 'no-information'
}

/** Resolve one career action; the expedition transition handles physical landing rewards. */
export function useProfessionSkill(run: Expedition, index?: number): Expedition {
  if (
    index !== undefined &&
    run.departure.profession !== 'riftwalker' &&
    run.departure.profession !== 'rescuer'
  )
    return run
  if (professionSkillAvailability(run) !== 'ready') return run
  let result = run
  if (run.departure.profession === 'rescuer') {
    result = useRescueSkill(run, index)
    if (result === run) return run
  } else if (
    run.departure.profession === 'waymarker' ||
    run.departure.profession === 'riftwalker'
  ) {
    result = useMobilitySkill(run, index)
    if (result === run || !result.skillUsed) return result
  } else
    switch (run.departure.profession) {
      case 'engineer':
        result = { ...run, scans: run.scans - 1, shields: run.shields + 1 }
        break
      case 'alchemist':
        result = { ...run, shields: run.shields - 1, probes: run.probes + 1, scans: run.scans + 1 }
        break
      default: {
        const area = professionSkillArea(run)
        result = inspectArea(run, area)

        if (run.departure.profession === 'archaeologist') {
          let game = result.game
          for (const index of area) {
            if (!run.walls.includes(index) && !game.cells[index]?.mine) {
              game = revealDungeon({ ...result, game }, index)
            }
          }
          result = { ...result, game }
        }

        if (run.departure.profession === 'sentinel')
          result = { ...result, shields: run.shields - 1 }
      }
    }

  if (available(result, 'pulse-coil')) {
    const row = Math.floor(result.player / result.game.config.width)
    result = inspectArea(
      claim(result, 'pulse-coil'),
      Array.from(
        { length: result.game.config.width },
        (_, x) => row * result.game.config.width + x,
      ),
    )
  }
  return {
    ...result,
    probes: Math.min(4, result.probes + Number(run.departure.equipment.includes('field-radio'))),
    skillUsed: true,
    steps: run.steps + 1,
  }
}
