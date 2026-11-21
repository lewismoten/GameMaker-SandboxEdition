// The hop arrival lesson: its course, block art and placement.
import type { Nod } from './types';

export const hop: Nod = {
  id: 'hop',
  course: 'home-keys',
  say: 'SPACE HOPS',
  note: 'Two low brick walls across the path: a tap of Space hops each.',
  how: 'How do I make a low wall to hop over?',
  made: 'Two single <b>brick</b> blocks on the path. A tap of Space lifts the hero over a block one high.',
  width: 10,
  blocks: () => undefined,
  place(m, x) {
    const f = x + 5;
    m.set(f + 1, 9, 'brick').set(f + 4, 9, 'brick');
    m.set(f + 2, 9, 'flower');
  },
};
