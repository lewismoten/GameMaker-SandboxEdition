// The ladder arrival lesson: its course, block art and placement.
import type { Nod } from './types';

export const ladder: Nod = {
  id: 'ladder',
  course: 'first-steps',
  say: 'CLIMB THE LADDER',
  note: 'A tower with a ladder up one side and down the other, and coins on top.',
  how: 'How do I make a ladder to climb?',
  made: '<b>ladder</b> blocks stacked in a column. The ladder has no gravity, so the hero holds on and climbs with Up and Down. Here a ladder stands on each side of a brick tower, so what you climb you can climb back down.',
  width: 11,
  blocks: () => undefined,
  place(m, x) {
    const f = x + 5;
    for (let y = 5; y < 10; y++) m.set(f, y, 'ladder').set(f + 4, y, 'ladder');
    for (let y = 6; y < 10; y++) for (let k = 1; k < 4; k++) m.set(f + k, y, 'brick');
    for (let k = 1; k < 4; k++) m.set(f + k, 4, 'coin');
  },
};
