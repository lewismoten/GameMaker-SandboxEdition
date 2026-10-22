// Level 2, the Larder: swing doors that only push one way (so the spoon is a round trip), a
// rolling pin on its beat, and a corridor of hidden mousetraps under a sign that says there is
// nothing down here.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

export const L02: RoomSpec = {
  file: 'larder',
  level: 2,
  name: 'The Larder',
  style: 'cellar',
  theme: 'larder',
  ingredient: 2,
  song: 'larder',
  card: ['Kitchen doors swing one way.', 'Rolling pins keep rolling.', 'Mind where you step.'],
  signs: { Q: 'signNotHere', R: 'signNorth' },
  legend: {
    '1': { mon: (b) => KINDS.pin(b, [[8, 0, 2], [-8, 0, 2]]) },
    '2': { mon: (b) => KINDS.pin(b, [[0, 4, 2], [0, -4, 2]]) },
    '3': { mon: (b) => KINDS.mouse(b) },
  },
  rows: [
    '##############################',
    '#Z@..#..$...$...$#$$.$$#.....#',
    '#....%...........#.....%..k..#',
    '#.T..#..B.....B..#..+..#..H..#',
    '#....#############v#####^#####',
    '#.......1....................#',
    '#....###QQ##########.#########',
    '##.###...........#...2....####',
    '#...#.mmm.mmmm.m.#........####',
    '#.$.#.m........m.#..HH...$####',
    '#...#.mmmm.mmmmm.#..HH....####',
    '##.##.........m..#........####',
    '#.......3........<....3...####',
    '#.....###########RRR####L#####',
    '#.....#..........#........####',
    '#..p..#..CCC.....#....I...####',
    '##############################',
  ],
};
