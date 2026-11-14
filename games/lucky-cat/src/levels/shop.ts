// Level 6, THE MIRROR SHOP: "Seven Years' Luck, Guaranteed," says the window. The mirrors are back to normal here (the
// level loads the ordinary hero: Left is left again), and a shop this full of glass is wise to a cat in it.
//   - mirror pillars of three heights to hop, then a ladder to a mezzanine and the first hand mirror;
//   - the first mirror gate (a hand mirror opens it, once), and past it a lift of umbrellas "for the high shelf";
//   - on the high shelf the second hand mirror, and the second gate before the door.
// No charms: it is a shop; nothing in it is free. Two hand mirrors are worth 25 points each.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { GROUND, addSigns, onGround, room, startBook, type Level } from '../level';

export const SHOP = {
  pillars: [14, 17, 20],
  ladder: 25,
  mezzanine: [26, 34],
  key1: 31,
  gate1: 38,
  lift: 44,
  shelf: [45, 56],
  key2: 52,
  gate2: 60,
  exit: 65,
} as const;

/** The shelf's standing row (the lift's top) and the beam that stops the lift. */
const TOP = 3;

const SIGNS = {
  window: ["SEVEN YEARS' LUCK. SOLD HERE. SEE SMALL PRINT.", 4, 4],
} as const;

export function levelShop(pal: Pal): Level {
  const book = startBook(pal, ['mirror', 'town', 'brolly', 'crack'], []);
  const s = addSigns(book, pal, SIGNS);
  const g = room(70, SHOP.exit);
  g.col(SHOP.ladder, 5, GROUND - 1, 'H');
  g.row(6, SHOP.mezzanine[0], SHOP.mezzanine[1], '=');
  const m = new StarterMap(book, g.rows());
  for (let x = 4; x < 66; x += 2) m.set(x, 1, 'bunting');
  // a crack in the floor between each pair of pillars: hop pillar to pillar, not down between them
  for (const x of [SHOP.pillars[0] + 2, SHOP.pillars[1] + 2]) m.set(x, GROUND - 1, 'crack');
  // the display: pillars one, two and one block high
  [1, 2, 1].forEach((h, i) => {
    for (let k = 0; k < h; k++) m.set(SHOP.pillars[i], GROUND - 1 - k, 'mirrorWall').set(SHOP.pillars[i] + 1, GROUND - 1 - k, 'mirrorWall2');
  });
  m.set(SHOP.key1, 5, 'mirrorKey');
  for (const x of [SHOP.gate1, SHOP.gate2]) {
    for (let y = -10; y < GROUND - 2; y++) m.set(x, y, y % 2 ? 'mirrorWall' : 'mirrorWall2');
    m.set(x, GROUND - 2, 'mirrorArch').set(x, GROUND - 1, 'mirrorGate');
  }
  // the lift to the high shelf, with a beam over it and over the shelf's start
  const colors = ['brollyRed', 'brollyGold', 'brollyTeal'];
  for (let y = TOP; y < GROUND; y++) m.set(SHOP.lift, y, colors[y % 3]);
  for (const x of [SHOP.lift, SHOP.lift + 1]) m.set(x, TOP - 2, 'brick');
  for (let x = SHOP.shelf[0]; x <= SHOP.shelf[1]; x++) m.set(x, TOP + 1, x % 2 ? 'awning' : 'awning2');
  m.set(SHOP.key2, TOP, 'mirrorKey');
  m.sign(4, onGround(GROUND, s.window), s.window);
  return {
    file: 'shop',
    title: 'The Mirror Shop',
    hint: 'Left is left again.',
    look: 'shop',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    charms: [],
  };
}
