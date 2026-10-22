// Level 13, the Vault: the WORKS in gold. Everything Ebenezer ever built, once more: Redcoats
// on their beats, a field of live plates, a latch, a clock hand, the panels, and in the middle
// the Vault itself, whose door has twelve keyholes. It counts your twelve ingredients, gives
// them back, and opens. And somewhere a sign says THIRTEEN OF SOMETHING, next to a wall.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

export const L13: RoomSpec = {
  file: 'vault',
  level: 13,
  name: 'The Vault',
  style: 'works',
  theme: 'vault',
  ingredient: 13,
  song: 'vault',
  card: ['Twelve keyholes.', 'You have twelve ingredients.', 'Do the math.'],
  signs: { Q: 'signThirteen' },
  legend: {
    '1': { mon: (b) => KINDS.redcoat(b, [[0, 2, 1], [0, -2, 1]]) },
    '2': { mon: (b) => KINDS.knife(b, [[0, 4, 3], [0, -4, 3]]) },
    '3': { mon: (b) => KINDS.redcoat(b, [[-4, 0, 1], [4, 0, 1]], 'h') },
    V: 'vault',
  },
  rows: [
    '######################################',
    '#Z@..#...1...1....#.......hhhh.....k.#',
    '#....>............>.......hhhh.......#',
    '#.T..#...........$#.......hhhh.......#',
    '############QQQ%##################v###',
    '###############D###..................#',
    '###################L##################',
    '#....................................#',
    '#.........b....##########.2..........#',
    '#.........b....#........#............#',
    '#....p....b....#...I....V......3.....#',
    '#.........b....#........#............#',
    '#+........b....##########....$.......#',
    '######################################',
  ],
};
