// Level 14, EXCUSE ME (the sleeping town, well after midnight): Wisp is found, and now Old Mossback goes home. It walks
// the length of the street behind Tess, on its own clock, and up the hill and back along the lane above, and the way is
// narrower than a mountain: stacks of recycling bins, washing lines and yard gates stand between the houses. Tess goes
// ahead and clears them. Bins and sheets give way when she walks into them (and the mountain, behind, says "Oh. Excuse
// me."); a yard gate swings on a clock, and two in a row take turns. Windows light up behind her as the neighbors wake.
// Blaze the lamp posts; nothing here hurts.

import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { WALKER_SLOT } from '../monsters';
import { WALKER_CELLS } from '../art/walker';

/** The two streets' ground rows: the street below (walked rightward), the lane above it (leftward). */
export const STREET_ROWS = { low: 17, up: 8 } as const;

export interface Obstacle {
  x: number;
  kind: 'bins' | 'sheets' | 'gate';
  /** A gate: whether it starts open. */
  open?: boolean;
}
export interface Street {
  obstacles: Obstacle[];
  /** Houses [first column, last column]. */
  houses: [number, number][];
  posts: number[];
  acorns: number[];
  pie?: number;
}

const LOW: Street = {
  obstacles: [
    { x: 24, kind: 'bins' },
    { x: 40, kind: 'gate', open: false },
    { x: 45, kind: 'gate', open: true },
    { x: 63, kind: 'sheets' },
    { x: 77, kind: 'bins' },
  ],
  houses: [
    [14, 20],
    [27, 33],
    [48, 55],
    [66, 73],
  ],
  posts: [13, 22, 30, 43, 52, 61, 70, 84],
  acorns: [17, 32, 50, 67, 74],
  pie: 54,
};

const UP: Street = {
  obstacles: [
    { x: 66, kind: 'bins' },
    { x: 46, kind: 'gate', open: true },
    { x: 41, kind: 'gate', open: false },
    { x: 22, kind: 'sheets' },
  ],
  houses: [
    [72, 79],
    [52, 59],
    [28, 35],
    [11, 18],
  ],
  posts: [83, 70, 62, 43, 38, 26, 18, 9],
  acorns: [78, 56, 33, 15],
};

export const STREET_AT = {
  start: 7,
  /** Where the mountain stands to begin with (its left column; it is four wide and three tall). */
  mountain: 1,
  /** The ladder up to the lane, at the end of the street. */
  ladder: 86,
  /** The street (the window of every house but the third, Mr. Hale's, goes on as the mountain passes) and the lane above (every window lit: the neighbors up here are awake). */
  low: LOW,
  up: UP,
  exit: 3,
  signs: { quiet: 9, gate: 34, hale: 56, ford: 5 },
} as const;

const SIGNS = {
  quiet: ['QUIET HOURS. NO STOMPING.', 4, 3],
  gate: ['THE GATE OPENS WHEN IT FEELS LIKE IT.', 4, 3],
  hale: ["MR. HALE'S LIGHT IS ON. KEEP MOVING.", 4, 3],
  ford: ['THE FORD IS NEXT. WEAR YOUR WET SOCKS.', 4, 3],
} as const;

/** One street's houses, what stands in the way, the posts, acorns and pie, on ground row `g`. */
function lay(m: MountainMap, g: number, s: Street, lit: boolean): void {
  s.houses.forEach(([x0, x1], k) => {
    const win = lit || k === 2 ? 'windowLit' : `dark${k < 2 ? k : 2}`;
    for (let x = x0; x <= x1; x++) {
      for (const y of [g - 3, g - 2, g - 1]) m.set(x, y, (x - x0) % 3 === 2 && y === g - 2 ? win : k % 2 ? 'wallB' : 'wall');
      m.set(x, g - 4, x === x0 ? 'roofL' : x === x1 ? 'roofR' : 'roofF');
    }
    for (let x = x0 + 1; x < x1; x++) m.set(x, g - 5, x === x0 + 1 ? 'roofL' : x === x1 - 1 ? 'roofR' : 'roofM');
  });
  // what stands in the way: two blocks tall, under a beam that keeps anyone from hopping it
  for (const o of s.obstacles) {
    for (const x of [o.x - 1, o.x, o.x + 1]) m.set(x, g - 3, 'arborBeam');
    m.set(o.x - 1, g - 2, 'arch')
      .set(o.x + 1, g - 2, 'arch')
      .set(o.x - 1, g - 1, 'arch')
      .set(o.x + 1, g - 1, 'arch');
    if (o.kind === 'bins') m.set(o.x, g - 2, 'stackTop').set(o.x, g - 1, 'stackBot');
    else if (o.kind === 'sheets') m.set(o.x, g - 2, 'sheetTop').set(o.x, g - 1, 'sheetBot');
    else m.set(o.x, g - 2, o.open ? 'swingOpen0' : 'swing0').set(o.x, g - 1, o.open ? 'swingOpen1' : 'swing1');
  }
  for (const x of s.posts) m.set(x, g - 1, 'post');
  for (const x of s.acorns) m.set(x, g - 1, 'acorn');
  if (s.pie) m.set(s.pie, g - 1, 'pie');
}

export function levelExcuse(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['pickups', 'town', 'street']);
  const s = addSigns(book, pal, SIGNS);
  const A = STREET_AT;
  const { low, up } = STREET_ROWS;
  const W = 90;
  const g = new Grid(W, low + 5);
  // the street below, and the lane above it: a thin shelf of hillside, with a ladder through it at the near end
  g.row(low, 0, W - 1, 'G').fill(0, low + 1, W, 4, 'D');
  g.row(up, 1, W - 2, 'G').row(up + 1, 1, W - 2, 'D');
  g.col(0, 0, low - 1, 'X').col(W - 1, 0, low - 1, 'X');
  g.put(A.start, low - 2, 's').put(A.start, low - 1, 'S');
  g.col(A.ladder, up - 1, low - 1, 'H');
  g.put(A.exit, up - 2, 'e').put(A.exit, up - 1, 'E');
  const m = new MountainMap(book, g.rows());
  lay(m, low, A.low, false);
  lay(m, up, A.up, true);
  // Old Mossback, standing at the near end of the street until it sets off
  for (const [cx, cy, piece] of WALKER_CELLS) m.mon(WALKER_SLOT[piece], A.mountain + cx, low - 3 + cy);
  const at = A.signs;
  for (const k of ['quiet', 'gate', 'hale'] as const) m.sign(at[k], onGround(low, s[k]), s[k]);
  m.sign(at.ford, onGround(up, s.ford), s.ford);
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
