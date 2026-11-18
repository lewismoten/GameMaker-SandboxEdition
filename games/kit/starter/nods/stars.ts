// The stars arrival lesson: its course, block art and placement.
import { air } from './rules';
import { add, ring } from './blocks';
import { sky } from './pictures';
import type { Nod } from './types';

export const stars: Nod = {
  id: 'stars',
  course: 'twinkle',
  say: 'STARS TWINKLE',
  note: 'Sparkles in the sky that blink, each on its own time.',
  how: 'How do I make stars that twinkle?',
  made: '<b>spark0</b>, <b>spark1</b> and <b>spark2</b> are a small, a big and a medium sparkle that turn into each other every 7 ticks, started on different ones.',
  width: 11,
  blocks(c) {
    const names = [0, 1, 2].map((f) => {
      const p = sky(c);
      const g = c.pal.c('gold', 5);
      const r = [1, 5, 3][f];
      p.rect(10 - r, 10, r * 2 + 1, 1, g)
        .rect(10, 10 - r, 1, r * 2 + 1, g)
        .set(10, 10, c.pal.c('white', 3));
      for (const [dx, dy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const)
        p.set(10 + dx * 2, 10 + dy * 2, g).set(10 + dx, 10 + dy, c.pal.c('white', 3));
      add(c, `spark${f}`, p, air);
      return `spark${f}`;
    });
    ring(c, names, 7);
  },
  place(m, x, c) {
    [
      [4, 1],
      [6, 3],
      [8, 1],
      [10, 3],
      [5, 4],
      [9, 4],
    ].forEach(([dx, y], i) => m.setOnSky(x + dx, Math.max(y, c.viewTop ?? y), `spark${i % 3}`));
  },
};
