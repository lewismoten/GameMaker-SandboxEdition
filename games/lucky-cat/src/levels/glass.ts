// Level 7, THE OTHER SIDE: the Mirror Shop's back door is a mirror, and behind it the level runs backwards: Midnight
// starts at the right and the exit is at the far left. The funhouse's swap is on again (the level loads mirror.chr:
// the Left key walks right, so the way to the exit is the Right key), and the whole town is cut in negative: a pale
// silver plate with the ink in black.
//   - three mirror pillars (one, two, one block) to hop going left, then a ladder up to a mezzanine and a hand mirror;
//   - the first gate; a watchman crow; a second ladder, a second mezzanine and hand mirror; the second gate and the door.
// No charms. Two hand mirrors are worth 25 points each.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, startBook, type Level } from '../level';

export const GLASS = {
  start: 66,
  pillars: [60, 57, 54],
  ladder: 49,
  mezzanine: [36, 48],
  key1: 42,
  gate1: 32,
  crow: 28,
  crowRow: 5,
  ladder2: 22,
  mezzanine2: [14, 21],
  key2: 18,
  gate2: 11,
  exit: 5,
} as const;

const SIGNS = {
  back: ['THE OTHER SIDE. EXIT ON THE LEFT. LEFT IS THE RIGHT KEY.', 4, 4],
} as const;

export function levelGlass(pal: Pal): Level {
  const book = startBook(pal, ['mirror', 'town'], []);
  const s = addSigns(book, pal, SIGNS);
  const g = room(70, GLASS.exit);
  // the entrance moves to the right-hand end
  g.put(3, GROUND - 2, ' ')
    .put(3, GROUND - 1, ' ')
    .put(GLASS.start, GROUND - 2, 's')
    .put(GLASS.start, GROUND - 1, 'S');
  g.col(GLASS.ladder, 4, GROUND - 1, 'H');
  g.row(5, GLASS.mezzanine[0], GLASS.mezzanine[1], '=');
  g.col(GLASS.ladder2, 4, GROUND - 1, 'H');
  g.row(5, GLASS.mezzanine2[0], GLASS.mezzanine2[1], '=');
  const m = new StarterMap(book, g.rows());
  for (let x = 4; x < 66; x += 2) m.set(x, 1, 'bunting');
  [1, 2, 1].forEach((h, i) => {
    for (let k = 0; k < h; k++) m.set(GLASS.pillars[i], GROUND - 1 - k, 'mirrorWall').set(GLASS.pillars[i] + 1, GROUND - 1 - k, 'mirrorWall2');
  });
  m.set(GLASS.key1, 4, 'mirrorKey').set(GLASS.key2, 4, 'mirrorKey');
  for (const x of [GLASS.gate1, GLASS.gate2]) {
    for (let y = -10; y < GROUND - 2; y++) m.set(x, y, y % 2 ? 'mirrorWall' : 'mirrorWall2');
    m.set(x, GROUND - 2, 'mirrorArch').set(x, GROUND - 1, 'mirrorGate');
  }
  m.mon(CROW.bobbing, GLASS.crow, GLASS.crowRow);
  m.sign(62, onGround(GROUND, s.back), s.back);
  return {
    file: 'glass',
    title: 'The Other Side',
    hint: 'Walk left. Press right.',
    look: 'glass',
    chr: 'mirror',
    map: m,
    book,
    timed: [],
    charms: [],
  };
}
