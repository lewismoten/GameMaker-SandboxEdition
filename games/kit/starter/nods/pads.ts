// The pads arrival lesson: its course, block art and placement.
import { air } from './rules';
import { add } from './blocks';
import { sky, lined } from './pictures';
import type { Nod } from './types';

export const pads: Nod = {
  id: 'pads',
  course: 'sound-board',
  say: 'STEP ON THE PADS',
  note: 'Three pads on the path light up and chime when you step on them.',
  how: 'How do I make a pad that lights up when stepped on?',
  made: 'Each <b>pad</b> has Score points 5 and Becomes block <b>pad0On</b> (and so on), the same pad lit. The score makes the chime.',
  width: 11,
  blocks(c) {
    ['red', 'gold', 'blue'].forEach((hue, i) => {
      const r = c.pal.r(hue);
      for (const lit of [false, true]) {
        const p = sky(c);
        p.rect(2, 14, 16, 6, r[lit ? 4 : 2])
          .rect(2, 14, 16, 1, r[lit ? 5 - (hue === 'blue' ? 1 : 0) : 3])
          .rect(2, 19, 16, 1, r[1]);
        if (lit)
          for (const [x, y] of [
            [4, 11],
            [10, 9],
            [15, 12],
          ] as const)
            p.rect(x, y, 2, 2, c.pal.c('white', 3));
        add(c, `pad${i}${lit ? 'On' : ''}`, lit ? lined(c, p) : p, lit ? air : { ...air, score: 5, touch: `pad${i}On` });
      }
    });
  },
  place(m, x) {
    const f = x + 5;
    [0, 2, 4].forEach((dx, i) => m.set(f + dx, 9, `pad${i}`));
  },
};
