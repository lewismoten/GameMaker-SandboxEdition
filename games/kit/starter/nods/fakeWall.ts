// The fakeWall arrival lesson: its course, block art and placement.
import { air } from './rules';
import { add } from './blocks';
import type { Nod } from './types';

export const fakeWall: Nod = {
  id: 'fakeWall',
  course: 'secret-doors',
  say: 'A SECRET WALL',
  note: 'A wall drawn like brick that you can simply walk through.',
  how: 'How do I make a wall you can walk through?',
  made: "<b>fakeBrick</b> is a copy of the <b>brick</b> picture with nothing solid about it. Only the Blocks tab's rules tell the two apart.",
  width: 10,
  blocks(c) {
    add(c, 'fakeBrick', c.book.pics.get('brick')!.crop(0, 0, 20, 20), air);
  },
  place(m, x) {
    const f = x + 5;
    for (let k = 1; k < 3; k++) for (let y = 5; y < 10; y++) m.set(f + k, y, 'fakeBrick');
  },
};
