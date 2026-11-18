// The keyGate arrival lesson: its course, block art and placement.
import { locks, gateWall } from './gates';
import type { Nod } from './types';

export const keyGate: Nod = {
  id: 'keyGate',
  course: 'keys-and-doors',
  say: 'KEY, THEN DOOR',
  note: 'A key lies on the path just before a gate in a wall; the gate takes the key.',
  how: 'How do I make a gate that needs the key lying just before it?',
  made: 'The <b>key</b> block adds one to counter 20 when you touch it. The <b>gate</b> is solid, but its rule takes one from that counter when touched, so with a key it becomes sky. The brick wall above it goes up out of reach, and the arch is plain scenery.',
  width: 11,
  blocks: locks,
  place(m, x) {
    const f = x + 5;
    m.set(f, 9, 'key').set(f + 2, 9, 'flower');
    gateWall(m, f + 4, 'gate');
  },
};
