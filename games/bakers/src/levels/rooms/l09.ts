// Level 9, the Clock Room: the parlor at midnight, and a maze of twenty chambers whose panels
// take turns: every door marked 1 is up while every door marked 2 is down, and every three
// seconds they trade, so the maze is never the same maze twice in a row. The clock hands
// (knives) sweep their chambers. The sign has the family's only cooking advice.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

const sweep: [number, number, number][] = [
  [3, 0, 3],
  [-3, 0, 3],
];

export const L09: RoomSpec = {
  file: 'clock',
  level: 9,
  name: 'The Clock Room',
  style: 'parlor',
  theme: 'clock',
  ingredient: 9,
  song: 'clock',
  card: ['The doors trade places', 'every three seconds.', 'Mind the hands.'],
  signs: { Q: 'signStir' },
  legend: {
    '1': { mon: (b) => KINDS.knife(b, sweep) },
  },
  rows: [
    '####################################',
    '#Z@..#.....#..K..#.....#.$...#....k#',
    '#..........a.....b.....a.....b.....#',
    '#.T..#..$..#.....#..,..#.....#.....#',
    '#QQQ####b#####a#####b#####a#####b###',
    '######.....#1....#..K..#.....#.....#',
    '######..,..b.....a.....b.....a..$..#',
    '######.....#.....#.....#.....#.....#',
    '########a#####b#####a#####b#####a###',
    '######..$..#.....#.....#1....#.....#',
    '######.....a.....b..K..a.....b.....#',
    '######.....#.....#.....#.....#.,...#',
    '########b#####a#####b#####a#####L###',
    '######..+..#.....#1....#.....#.....#',
    '######.....b.....a.....b.....#...I.#',
    '######.....#..$..#.....#.....#.....#',
    '####################################',
  ],
};
