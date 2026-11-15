// Level 2, MIRROR MAZE: a funhouse where the mirrors swap Left and Right (the level loads mirror.chr: the Left key
// walks right and the Right key walks left; Up, Down and Space stay). No broken glass anywhere, only shining panels.
//   - two mirror pillars to hop, then a ladder to a mezzanine with a ladybug and a hand mirror (the key);
//   - a tall mirror wall and its gate: the hand mirror opens it;
//   - beyond it a second mezzanine with a wishbone, and the exit.
// Two charms: the ladybug and the wishbone.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { GROUND, addSigns, onGround, room, startBook, type Level } from '../level';

export const TWO = {
  pillars: 15,
  ladder: 23,
  ladybug: 27,
  key: 31,
  planksEnd: 33,
  /** Two cracks before the gate, hopped on the swapped keys. */
  cracks: 36,
  wall: 40,
  ladder2: 47,
  wishbone: 53,
  exit: 58,
} as const;

const SIGNS = {
  swap: ['MIRRORS SWAP LEFT AND RIGHT. SO DO YOU.', 4, 3],
} as const;

export function levelTwo(pal: Pal): Level {
  const charms = ['ladybug', 'wishbone'] as const;
  const book = startBook(pal, ['mirror', 'town', 'crack'], charms);
  const s = addSigns(book, pal, SIGNS);
  const g = room(62, TWO.exit);
  g.col(TWO.ladder, 4, GROUND - 1, 'H');
  g.row(5, TWO.ladder + 1, TWO.planksEnd, '=');
  g.col(TWO.ladder2, 4, GROUND - 1, 'H');
  g.row(5, TWO.ladder2 + 1, TWO.wishbone + 3, '=');
  const m = new StarterMap(book, g.rows());
  for (const x of [TWO.cracks, TWO.cracks + 1]) m.set(x, GROUND - 1, 'crack');
  for (let x = 4; x < 58; x += 2) m.set(x, 1, 'bunting');
  for (const y of [8, 9]) m.set(TWO.pillars, y, 'mirrorWall').set(TWO.pillars + 1, y, 'mirrorWall2');
  m.set(TWO.ladybug, 4, 'charm.ladybug').set(TWO.key, 4, 'mirrorKey');
  // the wall and its gate: mirror panels to the top of the world, an arch, the shining gate
  for (let y = -10; y < GROUND - 2; y++) m.set(TWO.wall, y, y % 2 ? 'mirrorWall' : 'mirrorWall2');
  m.set(TWO.wall, GROUND - 2, 'mirrorArch').set(TWO.wall, GROUND - 1, 'mirrorGate');
  m.set(TWO.wishbone, 4, 'charm.wishbone');
  // a few mirror pillars after the gate for the look and one more hop
  for (const y of [8, 9]) m.set(43, y, 'mirrorWall2').set(44, y, 'mirrorWall');
  m.sign(5, onGround(GROUND, s.swap), s.swap);
  return {
    file: 'two',
    title: 'Mirror Maze',
    hint: 'Left is right. Right is left.',
    look: 'mirror',
    chr: 'mirror',
    map: m,
    book,
    timed: [],
    charms: [...charms],
  };
}
