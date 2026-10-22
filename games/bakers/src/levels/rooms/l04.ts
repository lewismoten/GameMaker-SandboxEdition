// Level 4, the Bakehouse: the Pantry's tiles, red hot. The bread dough in the top hall is
// proofing, and after forty seconds it rises right across the shortcut (a riser: a block that
// changes by itself and ends solid). Burners take turns being hot, the ovens fire, and a
// dough belt runs to the wall.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

export const L04: RoomSpec = {
  file: 'bakehous',
  level: 4,
  name: 'The Bakehouse',
  style: 'kitchen',
  theme: 'bakehouse',
  ingredient: 4,
  song: 'bakery',
  card: ['The dough is rising.', 'Hurry, or go the long way.', 'Burners glow before they burn.'],
  signs: { Q: 'signDough' },
  born: { s: { kind: 'fireball', reach: 3, speed: 3 } },
  legend: {
    '1': { mon: (b) => KINDS.mouse(b) },
  },
  rows: [
    '##################################',
    '#Z@.....CC..r.......r.....CC....$#',
    '#...........r..H....r.........k.$#',
    '#.T.....CC..r.......r.....CC....$#',
    '#.######.###QQ##.###########.##.##',
    '#.....hhh....hhh........hhh......#',
    '#####.####_########_######.#######',
    '#...#.#..........................#',
    '#.+.#.#.EEEEEEEEEE.C......1......#',
    '#...#.#..........................#',
    '#...#.#####.##########.######L####',
    '#.......a....b....hhh..#.......I.#',
    '##################################',
  ],
};
