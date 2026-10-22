// Level 5, the Cold Cellar: the Larder's stones, frozen. A wall of ice keeps the spoon from you
// until it thaws (an opener: a block that changes by itself and ends open), icicles fall from
// the kegs, and the slide along the middle only goes west. While the ice thaws there is time
// to look around downstairs, where a trail of bottle caps ends at a wall that is not one, and
// a second vanilla bean drops you into the room nobody mentions.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';

export const L05: RoomSpec = {
  file: 'cellar',
  level: 5,
  name: 'The Cold Cellar',
  style: 'cellar',
  theme: 'cellar',
  ingredient: 5,
  song: 'cellar',
  card: ['The ice thaws. Eventually.', 'The slide only goes one way.', 'Follow the bottle caps.'],
  born: { s: { kind: 'icicle', reach: 2, speed: 3 } },
  legend: {
    '1': { mon: (b) => KINDS.mouse(b) },
  },
  rows: [
    '##################################',
    '#Z@..o.....#..._...._..#........k#',
    '#....o....................HH.....#',
    '#.T..o.....#.$.......$.#.........#',
    '#....##########.############v#####',
    '#$.....+.$...#WWWWWWWWWWWWWWWWWWW#',
    '#.############.###################',
    '#$.$.$.$.$.$.$.......#...........#',
    '#%#############......L...........#',
    '#J.############..1...#.......I...#',
    '#..############......#...........#',
    '##################################',
  ],
};
