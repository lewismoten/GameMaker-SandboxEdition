// Level 7, the Sugar Room: the Pantry's tiles in pink and white. Ants pour out of the sugar
// ovens, a sugar belt carries you one way only, the panels take turns across the bottom hall,
// and two of its floorboards are mousetraps (they look like floorboards). The sugar is not on
// its rug: it hid under the stove from the tax man, and the gap under the stove (I) is the way
// out, for Sir Reginald (rooms/stove.ts).
import type { RoomSpec } from '../room';

export const L07: RoomSpec = {
  file: 'sugar',
  level: 7,
  name: 'The Sugar Room',
  style: 'kitchen',
  theme: 'sugar',
  ingredient: 7,
  // the sugar hid under the stove from the tax man: its gap is the way out, and the chicken goes in
  exitTile: 'stoveGap',
  song: 'sugar',
  card: ['Ants only steal points.', 'The belt only goes one way.', 'Two boards are not boards.'],
  born: { s: { kind: 'ant', reach: 2, speed: 1 } },
  rows: [
    '##################################',
    '#Z@..#...._....._....._....#$$$$$#',
    '#....>......HH......HH...........#',
    '#.T..#..$...............$..#..k..#',
    '########.#################v#######',
    '#.$.####.#################.#######',
    '#...####EEEEEEEEEEEE.C####.#######',
    '#.+.################.#####.#######',
    '#..........m...a....b......#.....#',
    '#...........,..a....b...m..L..I..#',
    '##################################',
  ],
};
