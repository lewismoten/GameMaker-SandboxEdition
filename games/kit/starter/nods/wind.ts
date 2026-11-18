// The wind arrival lesson: its course, block art and placement.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SOLID, PULL } from '../book';
import { add } from './blocks';
import { sky } from './pictures';
import type { Nod } from './types';

export const wind: Nod = {
  id: 'wind',
  course: 'gusts',
  say: 'WIND LIFTS YOU',
  note: 'A fan on the path blows a shaft of air up to a shelf with coins on it.',
  how: 'How do I make wind that lifts the hero?',
  made: '<b>windAir</b> blocks pull up. Stack them in a column over the <b>fan</b> and under a <b>plank</b> shelf (solid from the top only) and the hero rises through the shelf and stands on it.',
  width: 11,
  blocks(c) {
    const s = c.pal.r('stone');
    const fan = new Pixels(20, 20, s[2]);
    fan.rect(0, 0, 20, 3, s[4]).frame(0, 0, 20, 20, s[0]).rect(3, 7, 14, 3, s[1]).rect(2, 5, 4, 7, s[3]).rect(14, 5, 4, 7, s[3]);
    add(c, 'fan', fan, { solid: SOLID });
    const w = sky(c);
    const col = c.pal.c('white', 2);
    for (const [x, y] of [
      [5, 2],
      [13, 9],
      [7, 14],
    ] as const)
      w.rect(x, y, 1, 5, col)
        .set(x - 1, y + 1, col)
        .set(x + 1, y + 1, col);
    add(c, 'windAir', w, { grav: PULL.up });
  },
  place(m, x) {
    const f = x + 5;
    m.set(f + 1, 10, 'fan');
    for (let y = 5; y < 10; y++) m.set(f + 1, y, 'windAir');
    for (let k = 1; k < 5; k++) m.set(f + k, 4, 'plank');
    for (let k = 2; k < 5; k++) m.set(f + k, 3, 'coin');
  },
};
