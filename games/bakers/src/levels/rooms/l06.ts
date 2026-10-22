// Level 6, the Tea Room: the Spice Parlor's paneling in rose, and the Redcoats are here. Toy
// soldiers march up and down across the hall on their beats; one touch and Doc Leo plays dead,
// but a squawk of the rubber chicken sends them off under a white flag for a while. A teapot
// lets off steam, the doors swing one way, and Gwinn is somewhere she should not be.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

const beat: [number, number, number][] = [
  [0, 2, 1],
  [0, -2, 1],
];

export const L06: RoomSpec = {
  file: 'tearoom',
  level: 6,
  name: 'The Tea Room',
  style: 'parlor',
  theme: 'tearoom',
  ingredient: 6,
  song: 'tearoom',
  card: ['Redcoats! Squawk at them.', 'They do not like rubber', 'chickens. Nobody does.'],
  born: { w: { kind: 'steam', reach: 5, speed: 2 } },
  legend: {
    '1': { mon: (b) => KINDS.redcoat(b, beat) },
  },
  rows: [
    '################################',
    '#Z@..#...1.....1.....1....#...k#',
    '#....>......HH......HH....>....#',
    '#.T..#............[.......#....#',
    '#.##########.################v##',
    '#.$.....$......<..........#....#',
    '#.##########.#######.#######L###',
    '#..+.#.........G..........#..I.#',
    '################################',
  ],
};
