// The countdown arrival lesson: its course, block art and placement.
import { SOLID } from '../book';
import { gatePicture } from '../locks';
import { bigDigit } from '../graduationArriveArt';
import { air, COUNT_TICKS, COUNT_FROM } from './rules';
import { add } from './blocks';
import { locks, gateWall } from './gates';
import type { Nod } from './types';

export const countdown: Nod = {
  id: 'countdown',
  course: 'countdown',
  say: 'WAIT FOR ZERO',
  note: 'A big number counts down from 9 on a wall; the door under it opens at 0.',
  how: 'How do I make a number that counts down and opens a gate?',
  made: '<b>cd9</b> turns into <b>cd8</b> after 36 ticks, and so on down to <b>cd0</b>. The <b>timedGate</b> turns into sky after 324 ticks, the same nine two-second counts, so the gate opens as the number reaches 0.',
  width: 10,
  blocks(c) {
    locks(c);
    const bg = c.pal.c('stone', 1);
    for (let n = COUNT_FROM; n >= 0; n--) add(c, `cd${n}`, bigDigit(String(n), bg, c.pal.c('gold', 5)), air);
    for (let n = COUNT_FROM; n > 0; n--) c.timed.push({ name: `cd${n}`, next: `cd${n - 1}`, ticks: COUNT_TICKS });
    const g = gatePicture(c.pal, 'blue', 'white', true);
    add(c, 'timedGate', g, { solid: SOLID });
    c.timed.push({ name: 'timedGate', next: 'sky', ticks: COUNT_TICKS * COUNT_FROM });
  },
  place(m, x) {
    const f = x + 5;
    gateWall(m, f + 4, 'timedGate');
    m.set(f + 4, 6, `cd${COUNT_FROM}`);
  },
};
