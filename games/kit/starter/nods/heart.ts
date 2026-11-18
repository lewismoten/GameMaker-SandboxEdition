// The heart arrival lesson: its course, block art and placement.
import { air } from './rules';
import { add } from './blocks';
import { sky, lined } from './pictures';
import type { Nod } from './types';

const LIVES = 1;

export const heart: Nod = {
  id: 'heart',
  course: 'health-and-hearts',
  say: 'A HEART FOR YOU',
  note: 'A heart floats just over the path; hop up and it adds a life.',
  how: 'How do I give the hero an extra life?',
  made: 'The <b>heart</b> block adds one to the Lives counter (counter 1) and becomes sky when touched.',
  width: 11,
  blocks(c) {
    const h = sky(c);
    const r = c.pal.r('red');
    h.disc(6.5, 7, 4.6, r[3]).disc(13.5, 7, 4.6, r[3]).rect(2, 8, 16, 2, r[3]);
    for (let y = 10; y < 18; y++) h.rect(2 + (y - 10), y, 16 - (y - 10) * 2, 1, r[3]);
    h.rect(4, 4, 3, 2, c.pal.c('white', 3)).set(4, 6, c.pal.c('white', 3));
    add(c, 'heart', lined(c, h), { ...air, effect: LIVES, eamt: 1, touch: 'sky' });
  },
  place(m, x) {
    const f = x + 5;
    m.set(f + 1, 7, 'heart').set(f + 3, 9, 'flower');
  },
};
