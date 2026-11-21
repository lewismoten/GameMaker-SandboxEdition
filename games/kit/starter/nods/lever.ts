// The lever arrival lesson: its course, block art and placement.
import { SOLID } from '../book';
import { gatePicture } from '../locks';
import { POWER, air } from './rules';
import { add } from './blocks';
import { sky, lined } from './pictures';
import { locks, gateWall } from './gates';
import type { Nod } from './types';

export const lever: Nod = {
  id: 'lever',
  course: 'switches',
  say: 'FLIP THE LEVER',
  note: 'A lever on the path opens the gate in the wall beyond it.',
  how: 'How do I make a lever that opens a gate?',
  made: 'The <b>lever</b> adds one to counter 22 and becomes <b>leverOn</b> (its handle flipped over). The <b>powerGate</b> takes one from counter 22 when touched, so after the lever it becomes sky.',
  width: 10,
  blocks(c) {
    locks(c);
    const w = c.pal.r('wood');
    const s = c.pal.r('stone');
    for (const on of [false, true]) {
      const p = sky(c);
      p.rect(3, 15, 14, 5, s[3]).rect(3, 15, 14, 1, s[4]).rect(8, 12, 4, 4, s[1]);
      p.line(10, 13, on ? 16 : 4, 4, w[1])
        .line(11, 13, on ? 17 : 5, 4, w[3])
        .disc(on ? 17 : 4, 4, 2.2, c.pal.c('red', 3));
      add(c, on ? 'leverOn' : 'lever', lined(c, p), on ? air : { ...air, effect: POWER, eamt: 1, touch: 'leverOn' });
    }
    const g = gatePicture(c.pal, 'blue', 'gold', true);
    add(c, 'powerGate', g, { solid: SOLID, effect: POWER, eamt: -1, touch: 'sky' });
  },
  place(m, x) {
    const f = x + 5;
    m.set(f, 9, 'lever');
    gateWall(m, f + 4, 'powerGate');
  },
};
