// Level 10, WASH DAY: played as Rascal. The Committee has hung its banner ("LUCK TO ALL. EXCEPT CATS.") out to dry on
// the long washing line over the lane, and a raccoon with knots to tie knows what a banner is good for.
//   - six awnings climb the house like a staircase, a cleat on every second one;
//   - up on the line (a long awning over the lane) a fourth cleat, and the bins' key pinned to the banner's corner;
//   - down the far side: cracks, the padlocked gate, and the doorsteps for saucers of cream.
// No charms. Chores score 7 points each (three cleats on the stairs, one on the line, three doorsteps) and the key 25.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { GROUND, addSigns, onGround, room, startBook, type Level } from '../level';

export const LAUNDRY = {
  step1: 9,
  cracks: 13,
  stairs: [0, 1, 2, 3, 4, 5].map((i) => ({ x: 19 + 3 * i, row: 9 - i })),
  line: [37, 54],
  cleatLine: 46,
  key: 52,
  step2: 56,
  cracks2: 62,
  wall: 65,
  step3: 68,
  exit: 71,
} as const;
/** Each awning is this many blocks wide. */
export const STAIR_W = 3;

const SIGNS = {
  banner: ['WASH DAY. THE COMMITTEE HAS HUNG OUT ITS BANNER.', 4, 4],
  line: ['THE KEY IS PINNED TO THE BANNER.', 4, 3],
  gate: ['THE STEPS WANT CREAM. THEN THE BINS.', 4, 3],
} as const;

export function levelLaundry(pal: Pal): Level {
  const book = startBook(pal, ['crack', 'town', 'chores', 'salt'], []);
  const s = addSigns(book, pal, SIGNS);
  const g = room(75, LAUNDRY.exit);
  const m = new StarterMap(book, g.rows());
  // the awnings (stand on them, jump up through them) and the long line
  for (const { x, row } of LAUNDRY.stairs) for (let i = 0; i < STAIR_W; i++) m.set(x + i, row, i % 2 ? 'awning' : 'awning2');
  for (let x = LAUNDRY.line[0]; x <= LAUNDRY.line[1]; x++) m.set(x, 3, x % 2 ? 'awning' : 'awning2');
  // the banner: bunting along the line's top (it is the Committee's banner, in little flags)
  for (let x = LAUNDRY.line[0]; x <= LAUNDRY.line[1]; x++) m.set(x, 1, 'bunting');
  // chores: a cleat on each awning and the line, saucers on three doorsteps, the key
  LAUNDRY.stairs.forEach(({ x, row }, i) => i % 2 === 1 && m.set(x + 1, row - 1, 'cleat'));
  m.set(LAUNDRY.cleatLine, 2, 'cleat');
  m.set(LAUNDRY.key, 2, 'binKey');
  for (const x of [LAUNDRY.step1, LAUNDRY.step2, LAUNDRY.step3]) m.set(x, GROUND - 1, 'step');
  for (const x of [LAUNDRY.cracks, LAUNDRY.cracks + 1, LAUNDRY.cracks2, LAUNDRY.cracks2 + 1]) m.set(x, GROUND - 1, 'crack');
  // the padlocked gate, with the bins beside it
  for (let y = -10; y < GROUND - 2; y++) m.set(LAUNDRY.wall, y, 'brick');
  m.set(LAUNDRY.wall, GROUND - 2, 'saltArch').set(LAUNDRY.wall, GROUND - 1, 'padlock');
  for (const x of [69, 70]) m.set(x, GROUND - 2, 'binTop').set(x, GROUND - 1, 'bin');
  m.sign(4, onGround(GROUND, s.banner), s.banner);
  m.sign(40, onGround(3, s.line), s.line);
  m.sign(58, onGround(GROUND, s.gate), s.gate);
  return {
    file: 'wash',
    title: 'Wash Day',
    hint: 'Play Rascal. Tie the banner.',
    look: 'dawn',
    chr: 'rascal',
    map: m,
    book,
    timed: [],
    charms: [],
  };
}
