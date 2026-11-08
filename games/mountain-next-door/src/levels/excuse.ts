// Level 14, EXCUSE ME (the sleeping town, well after midnight): Wisp is found, and now Old Mossback goes home. It walks
// the length of the street behind Tess, on its own clock, and the street is narrower than a mountain: stacks of recycling
// bins, washing lines and yard gates stand between the houses. Tess goes ahead and clears them. Bins and sheets give
// way when she walks into them (and the mountain, behind, says "Oh. Excuse me."); a yard gate swings on a clock, and
// two in a row take turns. Windows light up behind her as the neighbors wake. Blaze the lamp posts; nothing here hurts.

import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { GROUND, addSigns, onGround, room, startBook, MountainMap, type Level } from '../level';
import { WALKER_SLOT } from '../monsters';
import { WALKER_CELLS } from '../art/walker';

/** Every obstacle: where it stands, what it is, and (a gate) whether it starts open. */
export const STREET_AT = {
  start: 7,
  /** Where the mountain stands to begin with (its left column; it is four wide and three tall). */
  mountain: 1,
  obstacles: [
    { x: 24, kind: 'bins' },
    { x: 40, kind: 'gate', open: false },
    { x: 45, kind: 'gate', open: true },
    { x: 63, kind: 'sheets' },
    { x: 77, kind: 'bins' },
  ],
  /** Houses [first column, last column]; the window of every one but the third (Mr. Hale's, lit) goes on as the mountain passes. */
  houses: [
    [14, 20],
    [27, 33],
    [48, 55],
    [66, 73],
  ],
  posts: [13, 22, 30, 43, 52, 61, 70, 84],
  acorns: [17, 32, 50, 67, 74],
  pie: 54,
  exit: 86,
  signs: { quiet: 9, gate: 34, hale: 56, ford: 79 },
} as const;

const SIGNS = {
  quiet: ['QUIET HOURS. NO STOMPING.', 4, 3],
  gate: ['THE GATE OPENS WHEN IT FEELS LIKE IT.', 4, 3],
  hale: ["MR. HALE'S LIGHT IS ON. KEEP MOVING.", 4, 3],
  ford: ['THE FORD IS NEXT. WEAR YOUR WET SOCKS.', 4, 3],
} as const;

export function levelExcuse(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['pickups', 'town', 'street']);
  const s = addSigns(book, pal, SIGNS);
  const A = STREET_AT;
  const W = 90;
  const g = room(W, A.exit);
  // room() puts the way in at x 3; this street starts at its own spot
  g.put(3, GROUND - 2, ' ')
    .put(3, GROUND - 1, ' ')
    .put(A.start, GROUND - 2, 's')
    .put(A.start, GROUND - 1, 'S');
  const m = new MountainMap(book, g.rows());
  // the houses, each with a window that lights when the mountain goes by
  A.houses.forEach(([x0, x1], k) => {
    const win = k === 2 ? 'windowLit' : `dark${k < 2 ? k : 2}`;
    for (let x = x0; x <= x1; x++) {
      for (const y of [GROUND - 3, GROUND - 2, GROUND - 1]) m.set(x, y, (x - x0) % 3 === 2 && y === GROUND - 2 ? win : k % 2 ? 'wallB' : 'wall');
      m.set(x, GROUND - 4, x === x0 ? 'roofL' : x === x1 ? 'roofR' : 'roofF');
    }
    for (let x = x0 + 1; x < x1; x++) m.set(x, GROUND - 5, x === x0 + 1 ? 'roofL' : x === x1 - 1 ? 'roofR' : 'roofM');
  });
  // what stands in the way: two blocks tall, under a beam that keeps anyone from hopping it
  for (const o of A.obstacles) {
    for (const x of [o.x - 1, o.x, o.x + 1]) m.set(x, GROUND - 3, 'arborBeam');
    m.set(o.x - 1, GROUND - 2, 'arch')
      .set(o.x + 1, GROUND - 2, 'arch')
      .set(o.x - 1, GROUND - 1, 'arch')
      .set(o.x + 1, GROUND - 1, 'arch');
    if (o.kind === 'bins') m.set(o.x, GROUND - 2, 'stackTop').set(o.x, GROUND - 1, 'stackBot');
    else if (o.kind === 'sheets') m.set(o.x, GROUND - 2, 'sheetTop').set(o.x, GROUND - 1, 'sheetBot');
    else m.set(o.x, GROUND - 2, o.open ? 'swingOpen0' : 'swing0').set(o.x, GROUND - 1, o.open ? 'swingOpen1' : 'swing1');
  }
  for (const x of A.posts) m.set(x, GROUND - 1, 'post');
  for (const x of A.acorns) m.set(x, GROUND - 1, 'acorn');
  m.set(A.pie, GROUND - 1, 'pie');
  // Old Mossback, standing at the near end of the street until it sets off
  for (const [cx, cy, piece] of WALKER_CELLS) m.mon(WALKER_SLOT[piece], A.mountain + cx, GROUND - 3 + cy);
  const at = A.signs;
  for (const k of Object.keys(s) as (keyof typeof s)[]) m.sign(at[k], onGround(GROUND, s[k]), s[k]);
  return {
    file: 'excuse',
    title: 'Excuse Me',
    hint: 'Clear the way ahead of it.',
    look: 'town',
    map: m,
    book,
    timed,
    mon: 'street',
    song: 'tiptoe',
    snd: 'town',
  };
}
