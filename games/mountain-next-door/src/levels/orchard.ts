// Level 10, HALE'S ORCHARD (the afternoon): the survey crew has gone to lunch, and Mr. Hale, who phoned the county, is
// counting his apples. The mountain's sneeze shook them down, so Tess picks up the windfall on three terraces for him,
// working up the hill: right along the first, left along the second, right along the third. The orchard's gates are
// hung in the fences between the rows and swing on a clock (a beam over each keeps anyone from hopping it); two
// together take turns. Blaze the trunks; the pie is for the climb.
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { tree } from './prints';

/** The terraces' ground rows, bottom to top (Tess walks on the row above each). */
export const ORCHARD_ROWS = [26, 17, 8] as const;
export const orchardFeet = (k: number): number => ORCHARD_ROWS[k] - 1;

/** A gate in a fence row: its column and whether it starts open. */
type Gate = readonly [number, boolean];

export const ORCHARD_AT = {
  /** Per terrace: the trees to blaze, the windfall apples and the gates (the first terrace is walked right, the second left, the third right). */
  trees: [
    [12, 31, 50, 62],
    [66, 46, 26, 12],
    [10, 34, 52],
  ],
  apples: [
    [17, 27, 36, 46, 56, 66],
    [68, 57, 49, 41, 31, 19, 8],
    [7, 17, 29, 39, 48, 62],
  ],
  gates: [
    [
      [22, false],
      [40, true],
    ],
    [
      [53, true],
      [36, false],
    ],
    [
      [24, false],
      [44, true],
      [57, false],
    ],
  ] as readonly (readonly Gate[])[],
  pie: [1, 43],
  /** The ladder up from terrace k to the next: at the right end, then the left. */
  ladders: [70, 3],
  exit: 70,
  signs: [
    [0, 7],
    [1, 60],
    [2, 66],
  ],
} as const;

const SIGNS = [
  ["HALE'S ORCHARD. KEEP OUT. NO MOUNTAIN.", 4, 3],
  ['THE GATES SWING WHEN THEY LIKE.', 4, 3],
  ['THE LOT, FROM UP HERE. IT IS GOING GOLD.', 4, 3],
] as const;

export function levelOrchard(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'town', 'street', 'orchard']);
  const names = SIGNS.map((_, i) => `sign${i}`);
  const s = addSigns(book, pal, Object.fromEntries(SIGNS.map((d, i) => [names[i], d])) as Record<string, readonly [string, number, number]>);
  const W = 74;
  const A = ORCHARD_AT;
  const [t0, t1, t2] = ORCHARD_ROWS;
  const g = new Grid(W, t0 + 4);
  g.row(t0, 0, W - 1, 'G').fill(0, t0 + 1, W, 3, 'D');
  for (const t of [t1, t2]) g.row(t, 1, W - 2, 'G').row(t + 1, 1, W - 2, 'D');
  g.col(0, 0, t0 - 1, 'X').col(W - 1, 0, t0 - 1, 'X');
  g.put(3, t0 - 2, 's').put(3, t0 - 1, 'S');
  g.put(A.exit, t2 - 2, 'e').put(A.exit, t2 - 1, 'E');
  A.ladders.forEach((x, k) => g.col(x, ORCHARD_ROWS[k + 1] - 1, ORCHARD_ROWS[k] - 1, 'H'));
  for (const [x, y] of [
    [8, 1],
    [30, 3],
    [52, 1],
    [66, 4],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  const m = new MountainMap(book, g.rows());
  ORCHARD_ROWS.forEach((t, k) => {
    for (const x of A.trees[k]) tree(m, x, t);
    for (const x of A.apples[k]) m.set(x, t - 1, 'apple');
    // a gate in the fence: two blocks tall under a beam, between two posts
    for (const [x, open] of A.gates[k]) {
      for (const bx of [x - 1, x, x + 1]) m.set(bx, t - 3, 'arborBeam');
      m.set(x - 1, t - 2, 'arch')
        .set(x + 1, t - 2, 'arch')
        .set(x - 1, t - 1, 'arch')
        .set(x + 1, t - 1, 'arch');
      m.set(x, t - 2, open ? 'swingOpen0' : 'swing0').set(x, t - 1, open ? 'swingOpen1' : 'swing1');
    }
  });
  m.set(A.pie[1], ORCHARD_ROWS[A.pie[0]] - 1, 'pie');
  m.exits.push({ from: [A.exit + ORIGIN, t2 - 1 + ORIGIN] });
  A.signs.forEach(([k, x], i) => m.sign(x, onGround(ORCHARD_ROWS[k], s[names[i]]), s[names[i]]));
  return {
    file: 'grove',
    title: "Hale's Orchard",
    hint: 'Pick up the windfall. Mind the gates.',
    look: 'afternoon',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'trail',
  };
}
