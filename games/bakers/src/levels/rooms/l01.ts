// Level 1, the Pantry: walking, a squawk at a mouse, one false wall (the sign says to lean on
// things), a wooden spoon for the latch, and the sassafras root.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

export const L01: RoomSpec = {
  file: 'pantry',
  level: 1,
  name: 'The Pantry',
  style: 'kitchen',
  theme: 'pantry',
  ingredient: 1,
  song: 'pantry',
  card: ['Mice. Squawk the chicken', '(Space) and they will run.', 'Ebenezer liked a false wall.'],
  signs: { Q: 'signLean', R: 'signRedcoats' },
  legend: { '1': { mon: (b) => KINDS.mouse(b) } },
  rows: [
    '##########################',
    '#Z@...T#..........#$$+$$.#',
    '#......#..CCCC....#$$$$$.#',
    '#..C...#..........#......#',
    '#..C.......1......##QQ#%##',
    '#......#.....B....#......#',
    '#......#.................#',
    '####.###..CC......#....k.#',
    '#......#..CC...1..#..H...#',
    '#.####.#####..#########.##',
    '#......M.........M.......#',
    '#.$..#######.######LRRR###',
    '#....#..BB.......#.......#',
    '#.H..#.....$.....#..I....#',
    '##########################',
  ],
};
