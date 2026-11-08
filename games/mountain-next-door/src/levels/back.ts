// Level 3, UP MOSSBACK'S BACK (late morning, crisp and high): the mountain is very sorry, but it will not say why it
// came. So Tess climbs it. Its back rises in six mossy terraces, one above the next, with a ladder bolted to each
// cliff at alternate ends. Two of the paths have wobbly rocks that sink into the face and rise again on a clock
// (wait till they are up; slip, and it is only the terrace below). The hens that got out while the gates were off
// have come up to see the view. Blaze a post at both ends of every terrace, for the hikers. At the top: no cloud,
// only a damp, cloud-shaped dent in the moss, where something soft has sat for a very long time.
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { TRAIL } from '../monsters';

export const G_BACK = 44;
/** The terraces bottom to top: their ledge row, and their first and last columns. */
export const TERRACES = [0, 1, 2, 3, 4, 5].map((k) => ({ row: 38 - k * 6, a: 3 + k * 7, b: 82 - k * 7 }));

export const BACK_AT = {
  /** The ladder up onto terrace k (0 is the one from the ground onto the first terrace). */
  ladders: [4, 74, 18, 60, 32, 46],
  /** Each terrace's two posts, in the order Tess passes them. */
  posts: [
    [9, 80],
    [71, 12],
    [23, 65],
    [57, 26],
    [34, 52],
  ],
  acorns: [
    [0, 50],
    [1, 40],
    [3, 44],
  ],
  /** Runs of wobbly rocks: [terrace, first column, last column]. */
  scree: [
    [0, 30, 33],
    [2, 36, 39],
    [4, 40, 42],
  ],
  hens: [
    [1, 30],
    [1, 52],
  ],
  pie: [3, 28],
  dent: 42,
  exit: 39,
  signs: { view: 5, hens: 13, up: 19, dent: 42 },
} as const;

const SIGNS = {
  hens: ['THE HENS CAME UP FOR THE VIEW. TRAITORS.', 4, 3],
  dent: ['NO CLOUD. JUST A DENT WHERE ONE SAT.', 4, 3],
} as const;

export function levelBack(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['mountain', 'trail', 'high']);
  const s = addSigns(book, pal, SIGNS);
  const W = 86;
  const B = BACK_AT;
  const g = new Grid(W, G_BACK + 4);
  g.row(G_BACK, 0, W - 1, 'G').fill(0, G_BACK + 1, W, 3, 'D');
  g.col(0, 0, G_BACK - 1, 'X').col(W - 1, 0, G_BACK - 1, 'X');
  g.put(2, G_BACK - 2, 's').put(2, G_BACK - 1, 'S');
  const m = new MountainMap(book, g.rows());
  // the terraces: rock from each one's ledge down to the ground, then each ledge across its whole width (the
  // paths run on across the face of the cliff above)
  for (const t of TERRACES) for (let x = t.a - 1; x <= t.b + 1; x++) for (let y = t.row + 1; y < G_BACK; y++) m.set(x, y, 'rock');
  for (const t of TERRACES) {
    for (let x = t.a; x <= t.b; x++) m.set(x, t.row, 'ledge');
    m.set(t.a - 1, t.row, 'slopeL').set(t.b + 1, t.row, 'slopeR');
  }
  const top = TERRACES[5];
  // ladders: from the ground onto the first terrace, then one up each cliff
  B.ladders.forEach((x, k) => {
    const from = k === 0 ? G_BACK - 1 : TERRACES[k - 1].row - 1;
    for (let y = TERRACES[k].row - 1; y <= from; y++) m.set(x, y, 'ladder');
  });
  for (const [k, a, b] of B.scree) for (let x = a; x <= b; x++) m.set(x, TERRACES[k].row, 'screeUp');
  B.posts.forEach(([a, b], k) => m.set(a, TERRACES[k].row - 1, 'post').set(b, TERRACES[k].row - 1, 'post'));
  for (const [k, x] of B.acorns) m.set(x, TERRACES[k].row - 1, 'acorn');
  for (const [k, x] of B.hens) m.mon(TRAIL.hens, x, TERRACES[k].row - 1);
  m.set(B.pie[1], TERRACES[B.pie[0]].row - 1, 'pie');
  m.mon(TRAIL.mist, 10, 20).mon(TRAIL.mist, 60, 14).mon(TRAIL.mist, 40, 4);
  for (const k of [0, 1, 2] as const) m.set(B.dent - 1 + k, top.row, `dent${k}`);
  m.set(B.exit, top.row - 2, 'doorTop').set(B.exit, top.row - 1, 'doorBottom');
  const at = B.signs;
  m.sign(at.hens, onGround(TERRACES[1].row, s.hens), s.hens);
  m.sign(at.dent, onGround(top.row, s.dent), s.dent);
  m.exits.push({ from: [B.exit + ORIGIN, top.row - 1 + ORIGIN] });
  return {
    file: 'back',
    title: "Up Mossback's Back",
    hint: 'Climb to the top. See what is missing.',
    look: 'high',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'trail',
  };
}
