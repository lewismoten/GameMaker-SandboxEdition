// Level 3, the Spice Parlor: the first timed panels (the 1s are up while the 2s are down, and
// then they trade), a pane of glass so clean you walk into it, a pepper pot that sneezes, and
// behind a false wall, Doc Leo's kazoo.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

export const L03: RoomSpec = {
  file: 'spices',
  level: 3,
  name: 'The Spice Parlor',
  style: 'parlor',
  theme: 'parlor',
  ingredient: 3,
  song: 'parlor',
  card: ['Panels 1 and 2 take turns.', 'Some glass is very clean.', 'Something hums behind a wall.'],
  signs: { Q: 'signStir', R: 'signCount' },
  born: { e: { kind: 'steam', reach: 5, speed: 2 } },
  legend: {
    '1': { mon: (b) => KINDS.mouse(b) },
  },
  rows: [
    '################################',
    '#Z@...#......a.........#.......#',
    '#.....#......a...H.....b...k...#',
    '#..T..#......a.........#.......#',
    '#.....####QQQ###%#######.......#',
    '#......................#####b###',
    '####.#######.######....#.......#',
    '#....#.....#.#....#....#..BB...#',
    '#.$..%..z..#.#.$..#....a.......#',
    '#....#.....#.#..$.#....#.......#',
    '######..####.###.##..###RR##L###',
    '#......................#.......#',
    '#..1....,..]........1..#...I...#',
    '#.......,..............#.......#',
    '################################',
  ],
};
