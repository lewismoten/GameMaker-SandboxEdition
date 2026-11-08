// Level 6, RASCAL'S ROOF: the finale. Ropes and pulleys hang over the town hall's roof, and every trick of the
// day is here again: cracks, a lift of floating umbrellas, a heap of spilled salt and a crow. At the end of the
// roof stands the one who has been pulling the ropes: Rascal the raccoon, a friendly prankster (the story cards
// that follow the door tell the rest). Two charms: the ribbon and the marble.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, startBook, type Level } from '../level';

export const SIX = {
  cracks: 14,
  lift: 22,
  gallery: [23, 40],
  shaker: 34,
  wall: 48,
  ribbon: 51,
  crow: 56,
  marble: 60,
  rascal: 67,
  exit: 76,
} as const;

const SIGNS = {
  roof: ['ROPES AND PULLEYS. SOMEONE BUILT THIS.', 4, 3],
  shaker: ['MORE SALT. SHAKER UP THERE.', 4, 3],
  salt: ['MORE SPILLED SALT. TOSS A PINCH.', 4, 3],
  who: ['A CRATE OF SAUCERS. A STRIPED TAIL. THE CREAM WAS BAIT.', 4, 5],
} as const;

export function levelSix(pal: Pal): Level {
  const charms = ['ribbon', 'marble'] as const;
  const book = startBook(pal, ['crack', 'brolly', 'salt', 'town', 'rascal'], charms);
  const s = addSigns(book, pal, SIGNS);
  const g = room(80, SIX.exit);
  g.row(4, SIX.gallery[0], SIX.gallery[1], '=');
  for (const [x, y] of [
    [10, 2],
    [30, 1],
    [52, 2],
    [70, 1],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  const m = new StarterMap(book, g.rows());
  // the workshop: a line of pulleys hung under the sky
  for (let x = 6; x < 76; x += 5) m.set(x, 0, 'pulley');
  // a rafter over the lift, so the umbrellas hold you at the gallery's height
  for (let x = SIX.lift - 1; x <= SIX.lift + 1; x++) m.set(x, 1, 'brick');
  const colors = ['brollyRed', 'brollyGold', 'brollyTeal'];
  for (let y = 3; y < GROUND; y++) m.set(SIX.lift, y, colors[y % 3]);
  for (const x of [SIX.cracks, SIX.cracks + 1]) m.set(x, GROUND - 1, 'crack');
  m.set(SIX.shaker, 3, 'shaker');
  for (let y = -10; y < GROUND - 2; y++) m.set(SIX.wall, y, 'brick');
  m.set(SIX.wall, GROUND - 2, 'saltArch').set(SIX.wall, GROUND - 1, 'saltPile');
  m.set(SIX.ribbon, GROUND - 1, 'charm.ribbon').set(SIX.marble, GROUND - 1, 'charm.marble');
  m.mon(CROW.bobbing, SIX.crow, 5);
  m.set(SIX.rascal, 8, 'rascalTop').set(SIX.rascal, 9, 'rascalBottom');
  for (const x of [11, 41, 72]) m.set(x, 8, 'lampHead').set(x, 9, 'lampPost');
  m.sign(5, onGround(GROUND, s.roof), s.roof);
  m.sign(34, onGround(GROUND, s.shaker), s.shaker);
  m.sign(43, onGround(GROUND, s.salt), s.salt);
  m.sign(62, onGround(GROUND, s.who), s.who);
  return {
    file: 'six',
    title: 'Payback',
    hint: 'Somebody built all this.',
    look: 'dusk',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    charms: [...charms],
  };
}
