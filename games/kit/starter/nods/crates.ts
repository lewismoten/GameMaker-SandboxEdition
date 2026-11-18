// The crates arrival lesson: its course, block art and placement.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SOLID } from '../book';
import { add } from './blocks';
import { sky } from './pictures';
import type { Nod } from './types';

export const crates: Nod = {
  id: 'crates',
  course: 'breakable-walls',
  say: 'CRATES BREAK',
  note: 'A stack of crates in the way: bump one and it turns to rubble.',
  how: 'How do I make a wall that breaks?',
  made: 'A <b>crate</b> is solid, and its Becomes block is <b>rubble</b>, which is not solid. Bumping a crate breaks only that crate.',
  width: 11,
  blocks(c) {
    const w = c.pal.r('wood');
    const crate = new Pixels(20, 20, w[2]);
    crate.frame(0, 0, 20, 20, w[0]).frame(1, 1, 18, 18, w[4]).line(2, 2, 17, 17, w[1]).line(17, 2, 2, 17, w[1]).rect(8, 8, 4, 4, w[3]);
    add(c, 'crate', crate, { solid: SOLID, touch: 'rubble' });
    const rub = sky(c);
    for (const [x, y, k] of [
      [2, 16, 2],
      [7, 17, 1],
      [11, 15, 3],
      [15, 17, 2],
      [5, 18, 3],
      [13, 18, 1],
    ] as const)
      rub.rect(x, y, 3, 2, w[k]).set(x, y, w[4]);
    add(c, 'rubble', rub);
  },
  place(m, x) {
    const f = x + 5;
    for (let k = 1; k < 3; k++) for (let y = 7; y < 10; y++) m.set(f + k, y, 'crate');
    m.set(f + 4, 9, 'coin');
  },
};
