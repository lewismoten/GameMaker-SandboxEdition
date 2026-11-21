// The ice arrival lesson: its course, block art and placement.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SOLID, PULL } from '../book';
import { add } from './blocks';
import { sky } from './pictures';
import type { Nod } from './types';

export const ice: Nod = {
  id: 'ice',
  course: 'slippery-and-bouncy',
  say: 'ICE IS SLIPPERY',
  note: 'A patch of ice: step on and you slide a little further than you meant.',
  how: 'How do I make ice that slides?',
  made: 'The <b>ice</b> is a solid floor. The air above it, <b>slickAir</b>, pulls down and to the right, so anyone standing in it is carried along and slides on after letting go. It is only three blocks wide, so a jump takes you back across.',
  width: 11,
  blocks(c) {
    const w = c.pal.r('white');
    const b = c.pal.r('blue');
    const i = new Pixels(20, 20, b[4]);
    i.rect(0, 0, 20, 5, w[3]).rect(0, 4, 20, 1, w[1]).line(3, 8, 9, 14, w[3]).line(13, 9, 17, 16, w[3]).rect(0, 19, 20, 1, b[2]);
    add(c, 'ice', i, { solid: SOLID });
    const s = sky(c);
    for (const [x, y] of [
      [2, 15],
      [10, 17],
      [15, 12],
    ] as const)
      s.rect(x, y, 4, 1, w[2]);
    add(c, 'slickAir', s, { grav: PULL.down | PULL.right });
  },
  place(m, x) {
    const f = x + 5;
    for (let k = 1; k < 4; k++) {
      m.set(f + k, 10, 'ice')
        .set(f + k, 9, 'slickAir')
        .set(f + k, 8, 'slickAir');
    }
  },
};
