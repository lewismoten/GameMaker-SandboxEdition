// The say arrival lesson: its course, block art and placement.
import { addSign } from '../sign';
import type { Nod } from './types';

export const say: Nod = {
  id: 'say',
  course: 'say-something',
  say: 'A FRIEND SAYS HI',
  note: 'A guest from the Cast stands by the path with a speech bubble.',
  how: 'How do I put a speech bubble over a friend?',
  made: "The guest is the Cast's own picture cut into blocks standing on the path. The bubble is a 3-block <b>sign</b> hung over the friend's head, with no posts.",
  width: 10,
  blocks(c) {
    if (!c.book.has('sign.bubble.00')) addSign(c.book, c.pal, 'bubble', 'HELLO!', 3, 1);
  },
  place(m, x, c) {
    const f = x + 5;
    const top = 10 - c.guest.length;
    c.guest.forEach((n, k) => m.set(f + 2, top + k, n));
    for (let k = 0; k < 3; k++) m.set(f + 1 + k, top - 1, `sign.bubble.${k}0`);
  },
};
