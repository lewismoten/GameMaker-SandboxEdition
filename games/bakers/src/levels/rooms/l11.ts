// Level 11, the Lightning Loft: the WORKS in a thunderstorm. Dr. Franklin's kite line comes in
// through the roof and every floor plate in the loft is live on the same beat: dark, glowing,
// then crackling. Cross the field of plates while they are dark (it takes the whole beat). The
// spoon room's door is on a timer, and the kite throws sparks.
import type { RoomSpec } from '../room';

export const L11: RoomSpec = {
  file: 'loft',
  level: 11,
  name: 'The Lightning Loft',
  style: 'works',
  theme: 'loft',
  ingredient: 11,
  song: 'loft',
  card: ['The plates go live together.', 'Cross while they are dark.', 'The door opens when ready.'],
  signs: { Q: 'signKite' },
  born: { e: { kind: 'spark', reach: 4, speed: 3 } },
  rows: [
    '##################################',
    '#Z@..#.hhhhhh.#.].........#.....$#',
    '#....>.hhhhhh.>..QQ.......o..k...#',
    '#.T..#.hhhhhh.#...........#.....$#',
    '#.############################v###',
    '#......hhh.........hhh...........#',
    '#####.##########################L#',
    '#.$..........p.......#...........#',
    '#.....+..............#.....I.....#',
    '##################################',
  ],
};
