// Under the Stove: Sir Reginald Cluckington III's interlude, between the Bakehouse and the Cold
// Cellar. The molasses jug rolled under the Bakehouse's iron range in 1777 and is still
// rolling (molasses has never been in a hurry); Doc Leo does not fit under there, and a rubber
// chicken does. The Pantry's tiles in soot and ember light: the firebox drops embers, the pilot
// lights take turns, the grease that has dripped down since the Revolution slides one way, and
// the mice who live here have never been squawked at by the chicken himself. The jug is the
// way out (on to the Cold Cellar), and the cartoon of him popping out with it plays then.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';
import { STOVE_SCENE } from '../../ids';

export const STOVE: RoomSpec = {
  file: 'stove',
  level: 4,
  interlude: { scene: STOVE_SCENE },
  hero: 'chick',
  name: 'Under the Stove',
  style: 'kitchen',
  theme: 'stove',
  ingredient: 4,
  song: 'bakery',
  card: ['Doc Leo will not fit.', 'Sir Reginald will.', 'W A S D: flap and glide.'],
  born: { s: { kind: 'fireball', reach: 3, speed: 3 } },
  legend: {
    '1': { mon: (b) => KINDS.mouse(b) },
  },
  rows: [
    '##############################',
    '#@...#..........#......_.....#',
    '#....>....1.....>..hhh.......#',
    '#....#..$.......#..........$.#',
    '##.###########.#############v#',
    '#.....eeeeeee...........#....#',
    '#.$..#########..1.....$.#..I.#',
    '#....#.......+..........>....#',
    '##############################',
  ],
};
