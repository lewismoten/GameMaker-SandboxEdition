// Level 4, THIRTEEN STEPS: a stair up the side of the old granary, exactly thirteen treads, to a landing high over Fennel
// Hollow (the camera follows the climb). Midnight counts them out loud, which is why she never gets anywhere.
//   - thirteen brick steps, each a block higher than the last;
//   - a landing with the salt shaker, cracks (the 13th step is always cracked) and a crow on patrol overhead;
//   - a ladder down the far side, and a heap of spilled salt to clear at the bottom: toss the pinch.
// No charms: the climb is the point.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../print';
import { CROW } from '../monsters';
import { GROUND, addSigns, onGround, room, scenery, startBook, type Level } from '../level';

const TOP = GROUND - 1 - 12; // the top tread's row

export const STEPS = {
  first: 10,
  /** The landing's planks, and the standing row on it. */
  landing: [36, 47],
  stand: TOP - 1,
  cracks: 41,
  shaker: 44,
  crow: 46,
  crowRow: TOP - 5,
  ladder: 48,
  wall: 58,
  exit: 66,
} as const;

const SIGNS = {
  count: ['THIRTEEN STEPS. DO NOT COUNT THEM.', 4, 3],
  top: ['THE 13TH STEP IS ALWAYS CRACKED. SO IS THE LANDING.', 4, 4],
  salt: ['SPILLED SALT: THROW A PINCH OVER YOUR SHOULDER.', 4, 3],
} as const;

export function levelSteps(pal: Pal): Level {
  const book = startBook(pal, ['crack', 'town', 'salt'], []);
  const s = addSigns(book, pal, SIGNS);
  const g = room(70, STEPS.exit);
  scenery(
    g,
    [
      [8, 1],
      [26, 2],
      [60, 1],
    ],
    [20, 52],
    [14, 62],
  );
  const m = new StarterMap(book, g.rows());
  for (let y = STEPS.stand; y < GROUND; y++) m.set(STEPS.ladder, y, 'ladder');
  // the thirteen treads, two blocks wide each: step k is k + 1 blocks high
  for (let k = 0; k < 13; k++)
    for (const x of [STEPS.first + 2 * k, STEPS.first + 2 * k + 1]) for (let y = TOP + (12 - k); y < GROUND; y++) m.set(x, y, 'brick');
  for (let x = STEPS.landing[0]; x <= STEPS.landing[1]; x++) m.set(x, TOP, 'brick');
  for (const x of [STEPS.cracks, STEPS.cracks + 1]) m.set(x, STEPS.stand, 'crack');
  m.set(STEPS.shaker, STEPS.stand, 'shaker');
  m.mon(CROW.bobbing, STEPS.crow, STEPS.crowRow);
  for (let y = -10; y < GROUND - 2; y++) m.set(STEPS.wall, y, 'brick');
  m.set(STEPS.wall, GROUND - 2, 'saltArch').set(STEPS.wall, GROUND - 1, 'saltPile');
  for (const x of [55]) m.set(x, 8, 'lampHead').set(x, 9, 'lampPost');
  m.sign(4, onGround(GROUND, s.count), s.count);
  m.sign(36, onGround(TOP, s.top), s.top);
  m.sign(52, onGround(GROUND, s.salt), s.salt);
  return {
    file: 'steps',
    title: 'Thirteen Steps',
    hint: 'Count the steps. Do not count them.',
    look: 'steps',
    chr: 'hero',
    map: m,
    book,
    timed: [],
    charms: [],
  };
}
