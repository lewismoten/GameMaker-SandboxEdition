// The shore arrival lesson: its course, block art and placement.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { air } from './rules';
import { add, ring } from './blocks';
import type { Nod } from './types';

export const shore: Nod = {
  id: 'shore',
  course: 'shore',
  say: 'WATER THAT MOVES',
  note: 'A footbridge over water whose waves are blocks that turn into each other.',
  how: 'How do I make water that moves?',
  made: '<b>water0</b>, <b>water1</b> and <b>water2</b> turn into each other every 6 ticks, and the map starts neighbors on different ones so the waves ripple. The footbridge is a <b>plank</b> row over them.',
  width: 11,
  blocks(c) {
    const b = c.pal.r('blue');
    const names = [0, 1, 2].map((f) => {
      const p = new Pixels(20, 20, b[2]);
      for (let y = 0; y < 20; y += 5)
        for (let x = 0; x < 20; x++) if (Math.sin(((x + f * 7) / 20) * Math.PI * 2) > 0.2) p.set(x, y + 1, b[4]).set(x, y + 2, b[3]);
      add(c, `water${f}`, p, air);
      return `water${f}`;
    });
    ring(c, names, 6);
  },
  place(m, x) {
    for (let k = 4; k < 11; k++) {
      m.set(x + k, 10, 'plank');
      for (let y = 11; y < 13; y++) m.set(x + k, y, `water${(k + y) % 3}`);
    }
  },
};
