import type { AuthoredRailFloor } from '../types/floor-rail.js'

/** Three fixed puzzles with public rail geometry and independently authored minefields. */
export const RAIL_FLOORS: readonly AuthoredRailFloor[] = [
  {
    rows: [
      '###############',
      '#...*....*.#.*#',
      '#...*......#..#',
      '#.S........#..#',
      '#...*.*..*.#..#',
      '#.....*..*.#..#',
      '#*......*..#..#',
      '#.......*....E#',
      '#.*..*...*.#.*#',
      '#..*......*#.*#',
      '#.....**.**#*##',
      '#*.*..*....#**#',
      '#.....**...#*##',
      '#..........####',
      '###############',
    ],
    rail: {
      tracks: [
        {
          index: 108,
          neighbors: [109],
        },
        {
          index: 109,
          neighbors: [108, 110],
        },
        {
          index: 110,
          neighbors: [109, 111],
        },
        {
          index: 111,
          neighbors: [110, 112],
        },
        {
          index: 112,
          neighbors: [111, 97, 127],
        },
        {
          index: 97,
          neighbors: [112, 82],
        },
        {
          index: 82,
          neighbors: [97, 67],
        },
        {
          index: 67,
          neighbors: [82, 52],
        },
        {
          index: 52,
          neighbors: [67],
        },
        {
          index: 127,
          neighbors: [112, 142],
        },
        {
          index: 142,
          neighbors: [127, 157],
        },
        {
          index: 157,
          neighbors: [142, 172],
        },
        {
          index: 172,
          neighbors: [157],
        },
      ],
      turnouts: [
        {
          index: 112,
          stem: 111,
          branches: [97, 127],
          selected: 1,
        },
      ],
      stations: [
        {
          index: 52,
          kind: 'brake',
          requires: null,
          visited: false,
        },
      ],
      doors: [
        {
          index: 116,
          station: 52,
        },
      ],
      cart: 108,
      drive: 78,
      reverse: 79,
      previous: null,
      travel: [],
    },
  },
  {
    rows: [
      '#################',
      '#...*....#*..*..#',
      '#...*.*.*#..*#*.#',
      '#.S....*.#...*..#',
      '#......*.#.***..#',
      '#........#......#',
      '#..**...*#......#',
      '#.............**#',
      '#*......*#......#',
      '#......*.#*...###',
      '#*...*...#...*#.#',
      '#*.....**#.....E#',
      '#..*...*.#*...#.#',
      '#...*....#**..#*#',
      '#################',
    ],
    rail: {
      tracks: [
        {
          index: 121,
          neighbors: [122],
        },
        {
          index: 122,
          neighbors: [121, 123],
        },
        {
          index: 123,
          neighbors: [122, 124],
        },
        {
          index: 124,
          neighbors: [123, 125],
        },
        {
          index: 125,
          neighbors: [124, 108, 126],
        },
        {
          index: 108,
          neighbors: [125, 91],
        },
        {
          index: 91,
          neighbors: [108, 74],
        },
        {
          index: 74,
          neighbors: [91, 57],
        },
        {
          index: 57,
          neighbors: [74],
        },
        {
          index: 126,
          neighbors: [125, 127],
        },
        {
          index: 127,
          neighbors: [126, 128],
        },
        {
          index: 128,
          neighbors: [127, 129],
        },
        {
          index: 129,
          neighbors: [128, 130],
        },
        {
          index: 130,
          neighbors: [129, 131],
        },
        {
          index: 131,
          neighbors: [130, 114, 148],
        },
        {
          index: 114,
          neighbors: [131, 97],
        },
        {
          index: 97,
          neighbors: [114, 80],
        },
        {
          index: 80,
          neighbors: [97, 63],
        },
        {
          index: 63,
          neighbors: [80],
        },
        {
          index: 148,
          neighbors: [131, 165],
        },
        {
          index: 165,
          neighbors: [148, 182],
        },
        {
          index: 182,
          neighbors: [165, 199],
        },
        {
          index: 199,
          neighbors: [182],
        },
      ],
      turnouts: [
        {
          index: 125,
          stem: 124,
          branches: [108, 126],
          selected: 1,
        },
        {
          index: 131,
          stem: 130,
          branches: [114, 148],
          selected: 0,
        },
      ],
      stations: [
        {
          index: 57,
          kind: 'brake',
          requires: null,
          visited: false,
        },
        {
          index: 199,
          kind: 'brake',
          requires: null,
          visited: false,
        },
      ],
      doors: [
        {
          index: 128,
          station: 57,
        },
        {
          index: 201,
          station: 199,
        },
      ],
      cart: 121,
      drive: 88,
      reverse: 89,
      previous: null,
      travel: [],
    },
  },
  {
    rows: [
      '#################',
      '#.*...*.*.......#',
      '#...*....*.*.**.#',
      '#.***...*#**.*..#',
      '#....*...*.....*#',
      '#.S......**....*#',
      '#....*.......***#',
      '#........*.*....#',
      '#...............#',
      '#...*.........**#',
      '#...*..*........#',
      '#.*........*....#',
      '#**.............#',
      '#....**...**..###',
      '#...*##*.......E#',
      '#..**##*......#.#',
      '#################',
    ],
    rail: {
      tracks: [
        {
          index: 139,
          neighbors: [140],
        },
        {
          index: 140,
          neighbors: [139, 141],
        },
        {
          index: 141,
          neighbors: [140, 142],
        },
        {
          index: 142,
          neighbors: [141, 125, 159],
        },
        {
          index: 125,
          neighbors: [142, 108],
        },
        {
          index: 108,
          neighbors: [125, 91],
        },
        {
          index: 91,
          neighbors: [108, 74],
        },
        {
          index: 74,
          neighbors: [91, 75],
        },
        {
          index: 75,
          neighbors: [74, 76],
        },
        {
          index: 76,
          neighbors: [75, 77],
        },
        {
          index: 77,
          neighbors: [76, 78],
        },
        {
          index: 78,
          neighbors: [77, 79],
        },
        {
          index: 79,
          neighbors: [78, 80],
        },
        {
          index: 80,
          neighbors: [79, 81, 97],
        },
        {
          index: 81,
          neighbors: [80, 82],
        },
        {
          index: 82,
          neighbors: [81],
        },
        {
          index: 159,
          neighbors: [142, 176],
        },
        {
          index: 176,
          neighbors: [159, 193],
        },
        {
          index: 193,
          neighbors: [176, 210],
        },
        {
          index: 210,
          neighbors: [193, 211],
        },
        {
          index: 211,
          neighbors: [210, 212],
        },
        {
          index: 212,
          neighbors: [211, 213],
        },
        {
          index: 213,
          neighbors: [212, 214],
        },
        {
          index: 214,
          neighbors: [213, 215],
        },
        {
          index: 215,
          neighbors: [214, 216],
        },
        {
          index: 216,
          neighbors: [215, 199],
        },
        {
          index: 199,
          neighbors: [216, 182],
        },
        {
          index: 182,
          neighbors: [199, 165],
        },
        {
          index: 165,
          neighbors: [182, 148],
        },
        {
          index: 148,
          neighbors: [165, 131],
        },
        {
          index: 131,
          neighbors: [148, 114],
        },
        {
          index: 114,
          neighbors: [131, 97],
        },
        {
          index: 97,
          neighbors: [114, 80],
        },
      ],
      turnouts: [
        {
          index: 142,
          stem: 141,
          branches: [125, 159],
          selected: 0,
        },
        {
          index: 80,
          stem: 81,
          branches: [79, 97],
          selected: 0,
        },
      ],
      stations: [
        {
          index: 82,
          kind: 'passenger',
          requires: null,
          visited: false,
        },
        {
          index: 139,
          kind: 'home',
          requires: 82,
          visited: false,
        },
      ],
      doors: [
        {
          index: 252,
          station: 139,
        },
      ],
      cart: 139,
      drive: 105,
      reverse: 106,
      previous: null,
      travel: [],
    },
  },
]
