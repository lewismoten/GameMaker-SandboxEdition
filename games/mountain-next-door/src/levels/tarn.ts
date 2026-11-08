// THE FROZEN TARN (the cold hour before dawn): the mountain is home on its hill, but it will not sit down. Its old
// seat is a hollow where a pond has frozen overnight, and it will not put its weight on thin ice. So Tess crosses the
// tarn ahead of it, to see where the ice will hold. The plates tip and settle on a clock, like the stones in the
// stream: some in runs (wait for the run to come up, then cross), some one at a time in a wave (go with it).
// Two reaches, one above the other, a ladder between; the second is crossed back the other way.
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { RIPPLE_ORDER } from '../propsDeeper';

/** The reaches' bank rows (Tess walks on the row above): the lower tarn, then the upper. */
export const TARN_ROWS = [20, 11] as const;
export const tarnFeet = (k: number): number => TARN_ROWS[k] - 1;

/** A run of plates: [first column, last column, group (A starts up, B under)]. */
type Run = readonly [number, number, 'A' | 'B'];

export const TARN_AT = {
  /** Per reach, in the order walked: plate runs, and the ripple (its water's columns and the single plates in walking order). */
  reaches: [
    {
      runs: [
        [
          [14, 16, 'A'],
          [17, 19, 'B'],
        ],
        [
          [62, 64, 'B'],
          [65, 67, 'A'],
          [68, 70, 'B'],
        ],
      ] as readonly (readonly Run[])[],
      ripple: { water: [36, 46], stones: [37, 39, 41, 43, 45] },
    },
    {
      runs: [
        [
          [66, 68, 'A'],
          [69, 71, 'B'],
        ],
        [
          [18, 20, 'B'],
          [21, 23, 'A'],
        ],
      ] as readonly (readonly Run[])[],
      ripple: { water: [36, 46], stones: [45, 43, 41, 39, 37] },
    },
  ],
  /** Per reach: posts to blaze and acorns on the banks. */
  posts: [
    [11, 25, 31, 53, 58, 74],
    [73, 60, 53, 29, 14],
  ],
  acorns: [
    [28, 51, 76],
    [57, 31],
  ],
  pie: [1, 33],
  ladder: 80,
  exit: 4,
  signs: [
    [0, 6],
    [1, 75],
    [1, 9],
  ],
} as const;

const SIGNS = [
  ['THIN ICE. THE MOUNTAIN ASKED FOR A TEST PILOT.', 4, 3],
  ['PLATES TIP IN A WAVE. GO WITH IT.', 4, 3],
  ['THE LAST OF THE NIGHT. SUNRISE IS ON ITS WAY.', 4, 3],
] as const;

export function levelTarn(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'stream', 'ripple']);
  const names = SIGNS.map((_, i) => `sign${i}`);
  const s = addSigns(book, pal, Object.fromEntries(SIGNS.map((d, i) => [names[i], d])) as Record<string, readonly [string, number, number]>);
  const W = 88;
  const A = TARN_AT;
  const [t0, t1] = TARN_ROWS;
  const g = new Grid(W, t0 + 4);
  g.row(t0, 0, W - 1, 'G').fill(0, t0 + 1, W, 3, 'D');
  g.row(t1, 1, W - 2, 'G').row(t1 + 1, 1, W - 2, 'D');
  g.col(0, 0, t0 - 1, 'X').col(W - 1, 0, t0 - 1, 'X');
  g.put(3, t0 - 2, 's').put(3, t0 - 1, 'S');
  g.put(A.exit, t1 - 2, 'e').put(A.exit, t1 - 1, 'E');
  g.col(A.ladder, t1 - 1, t0 - 1, 'H');
  for (const [x, y] of [
    [10, 2],
    [40, 4],
    [70, 2],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  const m = new MountainMap(book, g.rows());
  TARN_ROWS.forEach((t, k) => {
    const r = A.reaches[k];
    for (const runs of r.runs) {
      for (let x = runs[0][0]; x <= runs[runs.length - 1][1]; x++) m.set(x, t, 'waterTop').set(x, t + 1, 'bed');
      for (const [a, b, grp] of runs) for (let x = a; x <= b; x++) m.set(x, t, grp === 'A' ? 'stoneUp' : 'stoneUnder');
    }
    const [w0, w1] = r.ripple.water;
    for (let x = w0; x <= w1; x++) m.set(x, t, 'waterTop').set(x, t + 1, 'bed');
    r.ripple.stones.forEach((x, i) => m.set(x, t, RIPPLE_ORDER[i % RIPPLE_ORDER.length]).set(x, t - 1, 'acorn'));
    for (const x of A.posts[k]) m.set(x, t - 1, 'post');
    for (const x of A.acorns[k]) m.set(x, t - 1, 'acorn');
  });
  m.set(A.pie[1], TARN_ROWS[A.pie[0]] - 1, 'pie');
  m.exits.push({ from: [A.exit + ORIGIN, t1 - 1 + ORIGIN] });
  A.signs.forEach(([k, x], i) => m.sign(x, onGround(TARN_ROWS[k], s[names[i]]), s[names[i]]));
  return {
    file: 'tarn',
    title: 'The Frozen Tarn',
    hint: 'Test the ice before the mountain does.',
    look: 'frost',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'home',
    snd: 'brook',
  };
}
