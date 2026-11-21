// The flock arrival lesson: its course, block art and placement.
import { add, ring } from './blocks';
import { ink, sky } from './pictures';
import type { Nod } from './types';

export const flock: Nod = {
  id: 'flock',
  course: 'flock',
  say: 'FLOCK IN A V',
  note: 'Three birds high overhead flap in a V; they are blocks that turn into each other.',
  how: 'How do I make birds that flap?',
  made: '<b>birdA0</b> turns into <b>birdA1</b> after 6 ticks and back again; <b>birdB0</b> and <b>birdB1</b> do the same every 8, so the birds do not flap in step.',
  width: 11,
  blocks(c) {
    for (const [n, up] of [
      ['birdA0', true],
      ['birdA1', false],
      ['birdB0', false],
      ['birdB1', true],
    ] as const) {
      const p = sky(c);
      const wing = up
        ? [
            [3, 4, 9, 9],
            [17, 4, 11, 9],
          ]
        : [
            [3, 11, 9, 9],
            [17, 11, 11, 9],
          ];
      for (const [x0, y0, x1, y1] of wing) p.line(x0, y0, x1, y1, ink(c)).line(x0, y0 + 1, x1, y1 + 1, ink(c));
      p.rect(9, 9, 3, 2, ink(c));
      add(c, n, p);
    }
    ring(c, ['birdA0', 'birdA1'], 6);
    ring(c, ['birdB0', 'birdB1'], 8);
  },
  place(m, x) {
    m.set(x + 7, 1, 'birdA0')
      .set(x + 5, 2, 'birdB0')
      .set(x + 9, 2, 'birdB1');
  },
};
