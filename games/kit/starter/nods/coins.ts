// The coins arrival lesson: its course, block art and placement.
import type { Nod } from './types';

export const coins: Nod = {
  id: 'coins',
  course: 'coins-and-score',
  say: 'COINS ADD UP',
  note: 'A little arc of coins to walk and hop through; each is worth ten points.',
  how: 'How do I make coins that add to the score?',
  made: 'Each <b>coin</b> has Score points 10 and becomes <b>sky</b> when touched, so it is gone after you take it. The high one needs a hop.',
  width: 11,
  blocks: () => undefined,
  place(m, x) {
    const f = x + 5;
    [
      [0, 9],
      [1, 8],
      [2, 7],
      [3, 8],
      [4, 9],
    ].forEach(([dx, y]) => m.set(f + dx, y, 'coin'));
  },
};
