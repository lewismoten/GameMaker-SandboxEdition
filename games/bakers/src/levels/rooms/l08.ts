// Level 8, the Brewery: the Larder's stones in amber. The foam in the vat room rises over the
// shortcut after half a minute; the long way runs under kegs that pop their corks and a
// rolling pin on its beat. Gerald, the 250-year-old yeast, is on the far side. Feed Gerald.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

export const L08: RoomSpec = {
  file: 'brewery',
  level: 8,
  name: 'The Brewery',
  style: 'cellar',
  theme: 'brewery',
  ingredient: 8,
  song: 'brewery',
  card: ['The foam is rising.', 'Kegs pop their corks.', 'Gerald is expecting you.'],
  signs: { Q: 'signGerald' },
  born: { s: { kind: 'cork', reach: 2, speed: 3 }, n: { kind: 'bubble', reach: 2, speed: 2 } },
  legend: {
    '1': { mon: (b) => KINDS.pin(b, [[10, 0, 3], [-10, 0, 3]]) },
    '2': { mon: (b) => KINDS.mouse(b) },
  },
  rows: [
    '##################################',
    '#Z@..#.......r.........#........$#',
    '#....>.......r...HH....>......k..#',
    '#.T..#..$....r.........#..B..B..$#',
    '#.####.###_######.######.#####.###',
    '#..........2......1..............#',
    '#.####.###############~###########',
    '#.$..#...G...a.......b.QQ#.......#',
    '#....#.......a.......b...L..I....#',
    '##################################',
  ],
};
