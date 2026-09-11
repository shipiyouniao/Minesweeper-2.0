import { authoredPowerLayout } from './authored-power-layout.js'
import type { AuthoredPowerFloor, PowerDungeonLayout } from '../types/floor-power.js'

export const WATERWAY_GATE = 81

/** Fixed drainage chambers: terrain, mines and wiring are authored together, never seeded at runtime. */
export const WATERWAY_FLOORS: readonly AuthoredPowerFloor[] = [
  {
    rows: [
      '###############',
      '#...*...***...#',
      '#.......*.....#',
      '#...**O...**.*#',
      '#*.....*......#',
      '#.........*.**#',
      '####A##########',
      '#......*.....*#',
      '#*.......**...#',
      '#**...*...#####',
      '#.....J*..#...#',
      '#...*.*...B.*.#',
      '#.S...*.*.#.E.#',
      '#.........#.*.#',
      '###############',
    ],
    power: {
      junctions: [
        {
          index: 156,
          input: null,
          selected: null,
        },
      ],
      doors: [
        {
          index: 94,
          input: {
            junction: 156,
            branch: 0,
          },
        },
        {
          index: 175,
          input: {
            junction: 156,
            branch: 1,
          },
        },
      ],
      receivers: [
        {
          index: 51,
          input: {
            junction: 156,
            branch: 0,
          },
          recorded: false,
        },
      ],
      purpose: 'drainage',
    },
  },
  {
    rows: [
      '#################',
      '#..****#.**....*#',
      '#..O..*#...**.*.#',
      '#*.....#*..P....#',
      '#*..K*.#...*....#',
      '#.....*#*.......#',
      '#......#*.......#',
      '####A#####B######',
      '#.......*.......#',
      '#**.*....*...*.*#',
      '#...*..**.......#',
      '#*.....J.*.*#####',
      '#....*......#.*.#',
      '#*...*......D.*.#',
      '#..S..****..#.E.#',
      '#*.......*.*#...#',
      '#################',
    ],
    power: {
      junctions: [
        {
          index: 194,
          input: null,
          selected: null,
        },
        {
          index: 72,
          input: {
            junction: 194,
            branch: 0,
          },
          selected: null,
        },
      ],
      doors: [
        {
          index: 123,
          input: {
            junction: 194,
            branch: 0,
          },
        },
        {
          index: 129,
          input: {
            junction: 72,
            branch: 1,
          },
        },
        {
          index: 233,
          input: {
            junction: 194,
            branch: 1,
          },
        },
      ],
      receivers: [
        {
          index: 37,
          input: {
            junction: 72,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 62,
          input: {
            junction: 72,
            branch: 1,
          },
          recorded: false,
        },
      ],
      purpose: 'drainage',
    },
  },
  {
    rows: [
      '###################',
      '#.......*##*#*#*.*#',
      '#..O.*...##****...#',
      '#.*....**#*...P*..#',
      '#....K...##**.....#',
      '#....**..#***...*.#',
      '#*....**.#......Q.#',
      '####A########B#####',
      '#..*.*.*...*....*.#',
      '#..*....**...*....#',
      '#....*.......*.*.*#',
      '#.*.....J.....#####',
      '#....*.*......#.**#',
      '#......**...*.D.*.#',
      '#*..S.**.*.**.#.E.#',
      '#............*#.*.#',
      '###################',
    ],
    power: {
      junctions: [
        {
          index: 217,
          input: null,
          selected: null,
        },
        {
          index: 81,
          input: {
            junction: 217,
            branch: 0,
          },
          selected: null,
        },
      ],
      doors: [
        {
          index: 137,
          input: {
            junction: 217,
            branch: 0,
          },
        },
        {
          index: 146,
          input: {
            junction: 81,
            branch: 1,
          },
        },
        {
          index: 261,
          input: {
            junction: 217,
            branch: 1,
          },
        },
      ],
      receivers: [
        {
          index: 41,
          input: {
            junction: 81,
            branch: 0,
          },
          recorded: false,
        },
        {
          index: 71,
          input: {
            junction: 81,
            branch: 1,
          },
          recorded: false,
        },
        {
          index: 130,
          input: {
            junction: 81,
            branch: 1,
          },
          recorded: false,
        },
      ],
      purpose: 'drainage',
    },
  },
]

/** Load the selected chamber without changing any neighboring cell's authored clue. */
export function waterwayLayout(floor: number): PowerDungeonLayout {
  const content = WATERWAY_FLOORS[floor - 1]
  if (!content) throw new RangeError('Waterway floor is outside the authored stage')

  return authoredPowerLayout(content)
}
