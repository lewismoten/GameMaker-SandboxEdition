// Level 15, THE FORD (moonlight): the way home crosses the river where it runs shallow and wide, and the mountain is
// wading in behind Tess. Every step it takes sends a wave down the river, and the waves are the way across: five
// reaches of deep water with a bank between each, and over each a swell that comes up out of the river, runs one
// way, then the other (the third and fifth run the wrong way first). Step into a swell that is leaning your way and it
// carries you over; miss it and it is only a drop into the river and a walk out up the bank's stairs. At the far end a
// ladder climbs to the upper ford, a terrace above the river with five more reaches on three new timings (one quick,
// one that leans right first, one in between; the last borrows the lower ford's third), crossed leftward to the door.

import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { WALKER_SLOT } from '../monsters';
import { WALKER_CELLS } from '../art/walker';

/** The bank's grass row; the river sits in a pit under it. */
export const G9 = 16;
/** The upper ford's bank row (a terrace, its earth four rows deep). */
export const GU = 8;

export const FORD_AT = {
  start: 7,
  mountain: 1,
  /** The first column of each reach, and how wide a reach is (the stairs are its first and last columns). */
  reaches: [15, 29, 43, 57, 71],
  width: 8,
  posts: [13, 25, 55, 68, 85],
  acorns: [27, 37, 53, 69, 84],
  pie: 12,
  moon: [6, 1],
  /** The ladder up to the upper ford (the ground row's column), and the door at the terrace's left end. */
  ladder: 87,
  exit: 2,
  upper: {
    /** The first column of each upper reach (the first is at the right: Tess crosses leftward) and the ring it uses. */
    reaches: [66, 52, 38, 24, 10],
    rings: [5, 6, 7, 5, 2],
    width: 8,
    /** The terrace runs from `left` to `right`. */
    left: 1,
    right: 86,
    posts: [82, 63, 49, 35, 20],
    acorns: [85, 61, 47, 33, 8],
    pie: 81,
  },
  signs: { ford: 8, wrong: 38, upper: 76, almost: 4 },
} as const;

const SIGNS = {
  ford: ['THE FORD. KNEE DEEP ON A NORMAL PERSON.', 4, 3],
  wrong: ['THIS ONE RUNS THE WRONG WAY FIRST.', 4, 3],
  upper: ['THE UPPER FORD. SAME RIVER.', 4, 3],
  almost: ['ALMOST HOME. THE ZIGZAG IS UP THE HILL.', 4, 3],
} as const;

export function levelFord(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['pickups', 'stars', 'ford']);
  const s = addSigns(book, pal, SIGNS);
  const A = FORD_AT;
  const W = 90;
  const g = new Grid(W, G9 + 6);
  g.row(G9, 0, W - 1, 'G').fill(0, G9 + 1, W, 5, 'D');
  g.col(0, 0, G9 - 1, 'X').col(W - 1, 0, G9 - 1, 'X');
  g.put(A.start, G9 - 2, 's').put(A.start, G9 - 1, 'S');
  const U = A.upper;
  // the upper ford: a terrace of earth above the river, with a pit of river at each reach
  g.fill(U.left, GU, U.right - U.left + 1, 1, 'G').fill(U.left, GU + 1, U.right - U.left + 1, 3, 'D');
  g.put(A.exit, GU - 2, 'e').put(A.exit, GU - 1, 'E');
  const m = new MountainMap(book, g.rows());
  // stars and the moon
  for (let y = 0; y < G9 - 4; y++)
    for (let x = 1; x < W - 1; x++) if ((x * 13 + y * 7) % 23 === 0) m.set(x, y, ['faint', 'bright', 'faint2', 'bright2'][(x + y) % 4]);
  const [mx, my] = A.moon;
  m.set(mx, my, 'moonTL')
    .set(mx + 1, my, 'moonTR')
    .set(mx, my + 1, 'moonBL')
    .set(mx + 1, my + 1, 'moonBR');
  // each reach: a pit of river with stairs at both ends, and the swell's cells standing over it
  A.reaches.forEach((x0, k) => {
    const x1 = x0 + A.width - 1;
    for (let x = x0; x <= x1; x++) {
      m.set(x, G9, 'waterTop')
        .set(x, G9 + 1, 'water')
        .set(x, G9 + 2, 'bed')
        .set(x, G9 - 1, `f${k}_0`);
    }
    m.set(x0, G9 + 1, 'bankStep').set(x1, G9 + 1, 'bankStep');
  });
  U.reaches.forEach((x0, i) => {
    const x1 = x0 + U.width - 1;
    for (let x = x0; x <= x1; x++) {
      m.set(x, GU, 'waterTop')
        .set(x, GU + 1, 'water')
        .set(x, GU + 2, 'bed')
        .set(x, GU - 1, `f${U.rings[i]}_0`);
    }
    m.set(x0, GU + 1, 'bankStep').set(x1, GU + 1, 'bankStep');
  });
  // the ladder from the far lower bank up to the terrace
  for (let y = GU - 1; y < G9; y++) m.set(A.ladder, y, 'ladder');
  for (const x of A.posts) m.set(x, G9 - 1, 'post');
  for (const x of A.acorns) m.set(x, G9 - 1, 'acorn');
  m.set(A.pie, G9 - 1, 'pie');
  for (const x of U.posts) m.set(x, GU - 1, 'post');
  for (const x of U.acorns) m.set(x, GU - 1, 'acorn');
  m.set(U.pie, GU - 1, 'pie');
  // Old Mossback, at the near end of the bank until it wades in
  for (const [cx, cy, piece] of WALKER_CELLS) m.mon(WALKER_SLOT[piece], A.mountain + cx, G9 - 3 + cy);
  const at = A.signs;
  for (const k of Object.keys(s) as (keyof typeof s)[]) m.sign(at[k], onGround(k === 'upper' || k === 'almost' ? GU : G9, s[k]), s[k]);
  return {
    file: 'ford',
    title: 'The Ford',
    hint: 'Step into a wave that leans your way.',
    look: 'night',
    map: m,
    book,
    timed,
    mon: 'ford',
    song: 'dusk',
    snd: 'ford',
  };
}
