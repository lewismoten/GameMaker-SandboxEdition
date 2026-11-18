// The tokens arrival lesson: its course, block art and placement.
import { SOLID } from '../book';
import { gatePicture, SILVER_KEYS } from '../locks';
import { air } from './rules';
import { add } from './blocks';
import { sky, lined } from './pictures';
import { locks, gateWall } from './gates';
import type { Nod } from './types';

export const tokens: Nod = {
  id: 'tokens',
  course: 'three-tokens',
  say: 'THREE TOKENS',
  note: 'Three tokens lie on the path; the gate beyond wants all three.',
  how: 'How do I make a gate that wants three tokens?',
  made: 'Each <b>token</b> adds one to counter 21. The <b>tokenGate</b> takes three from it, so it opens only once all three are in your pocket.',
  width: 11,
  blocks(c) {
    locks(c);
    const b = c.pal.r('blue');
    const t = sky(c);
    t.disc(9.5, 9.5, 7, b[1])
      .disc(9.5, 9.5, 5.8, b[3])
      .disc(9.5, 9.5, 4.2, b[2])
      .ring(9.5, 9.5, 4, c.pal.c('white', 3))
      .disc(9.5, 9.5, 1.6, c.pal.c('white', 3));
    add(c, 'token', lined(c, t), { ...air, score: 10, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
    add(c, 'tokenGate', gatePicture(c.pal, 'blue', 'white', true), { solid: SOLID, effect: SILVER_KEYS, eamt: -3, touch: 'sky' });
  },
  place(m, x) {
    const f = x + 5;
    [0, 1, 2].forEach((dx) => m.set(f + dx, 9, 'token'));
    gateWall(m, f + 4, 'tokenGate');
  },
};
