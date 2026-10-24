// Level 12, the Cistern: the WORKS under water-blue light. A wall of glass you cannot see, a
// wall you can walk through, a downpipe that carries Doc Leo to the bottom whether he likes it
// or not, and two spoon latches in a row (the second spoon is between them).
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

export const L12: RoomSpec = {
  file: 'cistern',
  level: 12,
  name: 'The Cistern',
  style: 'works',
  theme: 'cistern',
  ingredient: 12,
  song: 'cistern',
  card: ['The glass is very clean.', 'The downpipe goes down.', 'Two latches. Two spoons.'],
  legend: {
    '1': {
      mon: (b) =>
        KINDS.pin(b, [
          [4, 0, 2],
          [-4, 0, 2],
        ]),
    },
    '2': {
      mon: (b) =>
        KINDS.knife(b, [
          [0, 2, 2],
          [0, -2, 2],
        ]),
    },
  },
  rows: [
    '####################################',
    '#Z@..#..........#...........#k.....#',
    '#....>....1.....>.....,.....%......#',
    '#.T..#..........#..,,,,.....#......#',
    '##############################S#####',
    '##############################S#####',
    '##############################S#####',
    '#.........#.........#..............#',
    '#.........#...2.....#.........#....#',
    '#..I......L.........L..$...........#',
    '#..+......#....k....#..............#',
    '####################################',
  ],
};
