// Level 7, EARLIER STILL: THE HALL, played as Rascal again. The Town Hall is closed for lunch, so it is empty, and a
// raccoon with a rope can work in peace.
//   - two umbrella lifts, one on top of the other: the first floats you to a gallery, the second (at its end) floats
//     you higher still, to the rafters;
//   - chores on the way: three rope cleats and three doorsteps to put a saucer of cream on (7 points each);
//   - the bins' key is hung in the rafters; its padlocked gate, cracks and a crow are on the ground past the drop.
// No charms: Rascal isn't collecting luck, he's arranging it.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, startBook, type Level } from '../level';

export const RIGGING = {
  cleat1: 9,
  step1: 10,
  crates: 12,
  lift: 17,
  gallery: [18, 30],
  cleatA: 23,
  lift2: 31,
  rafters: [32, 46],
  cleatB: 36,
  key: 42,
  step2: 49,
  cracks: 52,
  crow: 59,
  crowRow: 5,
  wall: 62,
  step3: 65,
  exit: 68,
} as const;

/** The top of the first lift, and of the second, as the row a hero stands on. */
const TOP_A = 3;
const TOP_B = -1;

const SIGNS = {
  closed: ['HALL CLOSED FOR LUNCH. - THE COMMITTEE', 4, 3],
} as const;

export function levelRigging(pal: Pal): Level {
  const book = startBook(pal, ['crate', 'crack', 'town', 'chores', 'salt', 'brolly'], []);
  const s = addSigns(book, pal, SIGNS);
  const g = room(72, RIGGING.exit);
  g.row(TOP_A + 1, RIGGING.gallery[0], RIGGING.gallery[1], '=');
  const m = new StarterMap(book, g.rows());
  for (let x = 1; x < 71; x++) for (const y of [0, 1]) m.set(x, y - 6, y === 0 || x % 4 ? 'brick' : 'window');
  // the beams that stop each lift (an umbrella carries you up until your head meets a beam)
  for (let x = RIGGING.lift; x <= RIGGING.gallery[1]; x++) m.set(x, TOP_A - 2, 'brick');
  for (let x = RIGGING.lift2; x <= RIGGING.rafters[1]; x++) m.set(x, TOP_B - 2, 'brick');
  // the rafters' planks, high over the hall
  for (let x = RIGGING.rafters[0]; x <= RIGGING.rafters[1]; x++) m.set(x, TOP_B + 1, x % 2 ? 'awning' : 'awning2');
  // the two columns of floating umbrellas
  const colors = ['brollyRed', 'brollyGold', 'brollyTeal'];
  for (let y = TOP_A; y < GROUND; y++) m.set(RIGGING.lift, y, colors[y % 3]);
  for (let y = TOP_B; y <= TOP_A; y++) m.set(RIGGING.lift2, y, colors[(y + 3) % 3]);
  for (const x of [RIGGING.cleat1]) m.set(x, GROUND - 1, 'cleat');
  m.set(RIGGING.cleatA, TOP_A, 'cleat').set(RIGGING.cleatB, TOP_B, 'cleat');
  m.set(RIGGING.key, TOP_B, 'binKey');
  for (const x of [RIGGING.step1, RIGGING.step2, RIGGING.step3]) m.set(x, GROUND - 1, 'step');
  for (const y of [8, 9]) m.set(RIGGING.crates, y, 'crate').set(RIGGING.crates + 1, y, 'crate');
  for (const x of [RIGGING.cracks, RIGGING.cracks + 1, RIGGING.cracks + 2]) m.set(x, GROUND - 1, 'crack');
  m.mon(CROW.bobbing, RIGGING.crow, RIGGING.crowRow);
  for (let y = -10; y < GROUND - 2; y++) m.set(RIGGING.wall, y, 'brick');
  m.set(RIGGING.wall, GROUND - 2, 'saltArch').set(RIGGING.wall, GROUND - 1, 'padlock');
  for (const x of [66, 67]) m.set(x, GROUND - 2, 'binTop').set(x, GROUND - 1, 'bin');
  m.sign(4, onGround(GROUND, s.closed), s.closed);
  return {
    file: 'still',
    title: 'Earlier Still',
    hint: 'Play Rascal. Go up. Then up again.',
    look: 'morning',
    chr: 'rascal',
    map: m,
    book,
    timed: [],
    charms: [],
  };
}
