import { authoredPowerLayout } from './authored-power-layout.js'
import { guardianLayout } from './chapter-guardian.js'
import type { AuthoredPowerFloor, PowerDungeonLayout } from '../types/floor-power.js'
import type { DungeonLayout } from '../types/dungeon-generation.js'

/** These authored rooms restore physical routes; a departure seed never replaces their mines. */
export const CONTROL_FLOORS: readonly AuthoredPowerFloor[] = [
  {
    rows: [
      '#################',
      '#**...*##......*#',
      '#...*..*#.....*##',
      '#.S.*...A...*O**#',
      '#...*...#.....*##',
      '#.*.....#...*.*##',
      '#.*.....#....*###',
      '#.......#*..*#**#',
      '#..*J...#########',
      '#*......#....*..#',
      '#.*....*#.......#',
      '#.....**#....*..#',
      '#.**....#..*.P..#',
      '#.*.*...B..*..**#',
      '#....*..#.....E.#',
      '#*.***..#.......#',
      '#################',
    ],
    power: {
      junctions: [
        {
          index: 140,
          input: null,
          selected: null,
        },
      ],
      doors: [
        {
          index: 59,
          input: {
            junction: 140,
            branch: 0,
          },
        },
        {
          index: 229,
          input: {
            junction: 140,
            branch: 1,
          },
        },
      ],
      receivers: [
        {
          index: 64,
          input: {
            junction: 140,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 217,
          input: {
            junction: 140,
            branch: 1,
          },
          recorded: false,
        },
      ],
      purpose: 'restoration',
    },
  },
  {
    rows: [
      '###################',
      '#.....*..#....**..#',
      '#...*.*..#...*....#',
      '#.S......A.....O..#',
      '#....*...#...*..*.#',
      '#*......*#.....K.*#',
      '#.*.**...#.*....P.#',
      '#.**...**#..*.....#',
      '#...J....##########',
      '#....**..#*#*...*.#',
      '#.*.*....#.**..**.#',
      '#.**...*.#...*....#',
      '#.....*..#...**Q.*#',
      '#*...***.B..*.....#',
      '#.*...*..#......E.#',
      '#....**.*#.......*#',
      '###################',
    ],
    power: {
      junctions: [
        {
          index: 156,
          input: null,
          selected: null,
        },
        {
          index: 110,
          input: {
            junction: 156,
            branch: 0,
          },
          selected: null,
        },
      ],
      doors: [
        {
          index: 66,
          input: {
            junction: 156,
            branch: 0,
          },
        },
        {
          index: 256,
          input: {
            junction: 156,
            branch: 1,
          },
        },
      ],
      receivers: [
        {
          index: 72,
          input: {
            junction: 156,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 130,
          input: {
            junction: 110,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 243,
          input: {
            junction: 156,
            branch: 1,
          },
          recorded: false,
        },
      ],
      purpose: 'restoration',
    },
  },
  {
    rows: [
      '###################',
      '#........#.*...*..#',
      '#...***..#.....*..#',
      '#.S..**..A.....O.*#',
      '#.......*#.......*#',
      '#........#*....K..#',
      '#.*......#.....***#',
      '#.***....#...*..P.#',
      '#....*.*.#.**#*...#',
      '#...J.*..##########',
      '#**.*....#...**.**#',
      '#...*.*..#......**#',
      '#..*...**#........#',
      '#*....**.#......**#',
      '####.....#...*.Q..#',
      '#*##...*.B...*...*#',
      '####**...#...*.*E.#',
      '####***..#*.*...*.#',
      '###################',
    ],
    power: {
      junctions: [
        {
          index: 175,
          input: null,
          selected: null,
        },
        {
          index: 110,
          input: {
            junction: 175,
            branch: 0,
          },
          selected: null,
        },
      ],
      doors: [
        {
          index: 66,
          input: {
            junction: 175,
            branch: 0,
          },
        },
        {
          index: 294,
          input: {
            junction: 175,
            branch: 1,
          },
        },
      ],
      receivers: [
        {
          index: 72,
          input: {
            junction: 175,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 149,
          input: {
            junction: 110,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 281,
          input: {
            junction: 175,
            branch: 1,
          },
          recorded: false,
        },
      ],
      purpose: 'restoration',
    },
  },
]

/** The approach teaches the same local clue isolation used by the guardian's shield pylons. */
export const BLOCKADE_FLOORS: readonly AuthoredPowerFloor[] = [
  {
    rows: [
      '#################',
      '#.....**#.......#',
      '#....*..#.......#',
      '#.S.....A...*O.*#',
      '#.....*.#.*...*.#',
      '#......*#*......#',
      '#..*...*##*.**..#',
      '#...J...#########',
      '#.....*.#...**..#',
      '#*......#.***.*.#',
      '#....*..#....P..#',
      '#**.....B......*#',
      '#....*..#.....E*#',
      '#*.***..#...*.*##',
      '#################',
    ],
    power: {
      junctions: [
        {
          index: 123,
          input: null,
          selected: null,
        },
      ],
      doors: [
        {
          index: 59,
          input: {
            junction: 123,
            branch: 0,
          },
        },
        {
          index: 195,
          input: {
            junction: 123,
            branch: 1,
          },
        },
      ],
      receivers: [
        {
          index: 64,
          input: {
            junction: 123,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 183,
          input: {
            junction: 123,
            branch: 1,
          },
          recorded: false,
        },
      ],
      purpose: 'restoration',
    },
  },
  {
    rows: [
      '###################',
      '#....****#.*..**.*#',
      '#........#........#',
      '#.S.*.*..A..*..O.*#',
      '#........#....*...#',
      '#.*......#..*.*K..#',
      '#....*...#....*.P.#',
      '#....*.*.#..*.*.*.#',
      '#...J.**.##########',
      '#........#******###',
      '#.......*#.*...*###',
      '#..*.*..*#......**#',
      '#.......*#.....Q..#',
      '#.*..*...B........#',
      '#*...*..*#.*..*.E.#',
      '#........#*#*...**#',
      '###################',
    ],
    power: {
      junctions: [
        {
          index: 156,
          input: null,
          selected: null,
        },
        {
          index: 110,
          input: {
            junction: 156,
            branch: 0,
          },
          selected: null,
        },
      ],
      doors: [
        {
          index: 66,
          input: {
            junction: 156,
            branch: 0,
          },
        },
        {
          index: 256,
          input: {
            junction: 156,
            branch: 1,
          },
        },
      ],
      receivers: [
        {
          index: 72,
          input: {
            junction: 156,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 130,
          input: {
            junction: 110,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 243,
          input: {
            junction: 156,
            branch: 1,
          },
          recorded: false,
        },
      ],
      purpose: 'restoration',
    },
  },
]

/** Resolve one fixed control room without sharing mutable operation state between attempts. */
export function controlLayout(floor: number): PowerDungeonLayout {
  const room = CONTROL_FLOORS[floor - 1]
  if (!room) throw new RangeError('Missing control room')

  return authoredPowerLayout(room)
}

/** The final floor is the guardian arena itself, not a random encounter behind a second exit. */
export function blockadeLayout(floor: number): DungeonLayout {
  if (floor === 3) return guardianLayout()

  const room = BLOCKADE_FLOORS[floor - 1]
  if (!room) throw new RangeError('Missing blockade approach')

  return authoredPowerLayout(room)
}
