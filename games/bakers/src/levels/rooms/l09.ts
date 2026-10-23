// Level 9, the Clock Room: the parlor at midnight, and a maze of twenty chambers whose panels
// take turns: every door marked 1 is up while every door marked 2 is down, and every three
// seconds they trade, so the maze is never the same maze twice in a row. The clock hands
// (knives) sweep their chambers. The sign has the family's only cooking advice, twice: once
// by the stairs, and once over Ebenezer's lazy Susan in the east alcove, which keeps the
// spoon for the latch. Stir COUNTER clockwise: the COUNTER turns clockwise, a quarter at a
// time from XII (XII, III, VI, IX); pushed the other way it jams.
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
  card: ['The doors trade places', 'every three seconds.', 'Read the sign twice.'],
  signs: { Q: 'signStir', R: 'signStir' },
  legend: {
    '1': { mon: (b) => KINDS.knife(b, sweep) },
    // Ebenezer's lazy Susan (blocks/susan.ts): the hours by its handles, the spoon at the hub
    '{': 'susanNW',
    '}': 'susanNE',
    '(': 'susanSW',
    ')': 'susanSE',
    '*': 'susanHub',
    '0': 'susan12_0',
    '3': 'susan3_0',
    '6': 'susan6_0',
    '9': 'susan9_0',
  },
  rows: [
    '#####################################RRR##',
    '#Z@..#.....#..K..#.....#.$...#.....#.....#',
    '#..........a.....b.....a.....b.......{0}.#',
    '#.T..#..$..#.....#..,..#.....#.....#.9*3.#',
    '#QQQ####b#####a#####b#####a#####b###.(6).#',
    '######.....#1....#..K..#.....#.....#.....#',
    '######..,..b.....a.....b.....a..$..#######',
    '######.....#.....#.....#.....#.....#######',
    '########a#####b#####a#####b#####a#########',
    '######..$..#.....#.....#1....#.....#######',
    '######.....a.....b..K..a.....b.....#######',
    '######.....#.....#.....#.....#.,...#######',
    '########b#####a#####b#####a#####L#########',
    '######..+..#.....#1....#.....#.....#######',
    '######.....b.....a.....b.....#...I.#######',
    '######.....#..$..#.....#.....#.....#######',
    '##########################################',
  ],
};
