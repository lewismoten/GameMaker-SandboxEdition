// Under the Stove: Sir Reginald Cluckington III's interlude, between the Sugar Room and the
// Brewery. The cane sugar went under the Sugar Room's iron range when the tax man came by in
// 1773, and it is still hiding there; Doc Leo does not fit under there, and a rubber chicken
// does. The Pantry's tiles in soot and ember light: the firebox drops embers, the pilot
// lights take turns, the grease that has dripped down since the Revolution slides one way, and
// the mice who live here have never been squawked at by the chicken himself. The sugar is the
// way out (on to the Brewery), and the cartoon of him popping out with it plays then. Both
// routes come this way: the hidey-hole's spare tea leads to the Sugar Room too.
import type { RoomSpec } from '../room';
import { KINDS } from '../../sprites/monsters';
import { STOVE_SCENE } from '../../ids';

export const STOVE: RoomSpec = {
  file: 'stove',
  level: 7,
  interlude: { scene: STOVE_SCENE },
  hero: 'chick',
  name: 'Under the Stove',
  style: 'kitchen',
  theme: 'stove',
  ingredient: 7,
  song: 'sugar',
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
