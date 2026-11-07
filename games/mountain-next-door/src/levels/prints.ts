// Level 3, FOOTPRINTS IN THE PARK (a misty morning): the mountain's footprints lead back across the park, the way
// it came. Some are shallow dents; some are deep, and a pebble the mountain kicked loose rolls about in the bottom
// (hop over). Tess paints a blaze on every trail post and every big tree, so the mountain can find its way home,
// takes the acorns off the oak's branch where Nutmeg the squirrel runs, and hops a fallen log. Mist drifts by.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, type Level } from '../level';
import { TRAIL } from '../monsters';

export const G3 = 15;

export const PRINTS_AT = {
  posts: [9, 30, 45, 64, 81],
  trees: [18, 54, 72],
  dents: [13, 39, 68],
  holes: [23, 58, 76],
  oak: { ladder: 33, row: 10, from: 34, to: 41, acorns: [36, 40] },
  log: 49,
  pie: 62,
  mist: [[6, 4], [26, 3], [47, 5], [66, 4], [80, 3]],
  exit: 87,
  signs: { follow: 4, blaze: 25, nut: 36, mist: 82 },
} as const;

const SIGNS = {
  follow: ['THE BIG PRINTS GO BACK THE WAY IT CAME.', 4, 3],
  blaze: ['PAINT A BLAZE ON EVERY POST AND TREE.', 4, 3],
  nut: ['THAT IS NUTMEG. SHE IS NOSY.', 4, 2],
  mist: ['KEEP TO THE BLAZES IN THE MIST.', 4, 3],
} as const;

export function levelPrints(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail']);
  const s = addSigns(book, pal, SIGNS);
  const W = 90;
  const g = new Grid(W, 19);
  g.row(G3, 0, W - 1, 'G').fill(0, G3 + 1, W, 3, 'D');
  g.col(0, 0, G3 - 1, 'X').col(W - 1, 0, G3 - 1, 'X');
  g.put(3, G3 - 2, 's').put(3, G3 - 1, 'S');
  g.put(PRINTS_AT.exit, G3 - 2, 'e').put(PRINTS_AT.exit, G3 - 1, 'E');
  // the deep footprints: two wide and two deep
  for (const x of PRINTS_AT.holes) g.fill(x, G3, 2, 2, ' ');
  // the oak's ladder and branch
  const o = PRINTS_AT.oak;
  g.col(o.ladder, o.row - 1, G3 - 1, 'H');
  g.row(o.row, o.from, o.to, '=');
  scenery(g);
  const m = new StarterMap(book, g.rows());
  for (const x of PRINTS_AT.holes) m.set(x, G3 + 2, 'printL').set(x + 1, G3 + 2, 'printR');
  for (const x of PRINTS_AT.dents) m.set(x, G3, 'printL').set(x + 1, G3, 'printM').set(x + 2, G3, 'printR');
  for (const x of PRINTS_AT.posts) m.set(x, G3 - 1, 'post');
  for (const x of PRINTS_AT.trees) tree(m, x);
  // the oak: a crown along the branch, acorns on it
  for (let y = o.row - 1; y < G3; y++) m.set(o.to + 1, y, y === G3 - 2 ? 'trunk' : 'bark');
  for (let k = 0; k < 9; k++) m.set(o.to + (k % 3), o.row - 4 + Math.floor(k / 3), `crown${k}`);
  for (const x of o.acorns) m.set(x, o.row - 1, 'acorn');
  m.set(PRINTS_AT.log, G3 - 1, 'logL').set(PRINTS_AT.log + 1, G3 - 1, 'logR');
  m.set(PRINTS_AT.pie, G3 - 1, 'pie');
  for (const x of PRINTS_AT.holes) m.mon(TRAIL.pebbleShort, x, G3 + 1);
  m.mon(TRAIL.nutBranch, o.from + 1, o.row - 1);
  for (const [x, y] of PRINTS_AT.mist) m.mon(TRAIL.mist, x, y);
  const at = PRINTS_AT.signs;
  for (const k of Object.keys(at) as (keyof typeof at)[]) m.sign(at[k], onGround(G3, s[k]), s[k]);
  return { file: 'prints', title: 'Footprints in the Park', hint: 'Blaze every post and tree.', look: 'mist', map: m, book, timed, mon: 'trail', song: 'trail' };
}

/** A big tree at column x: bark, a trunk to blaze at Tess's height, a crown on top. */
export function tree(m: StarterMap, x: number, ground = G3): void {
  m.set(x, ground - 1, 'bark').set(x, ground - 2, 'trunk').set(x, ground - 3, 'bark').set(x, ground - 4, 'bark');
  for (let k = 0; k < 9; k++) m.set(x - 1 + (k % 3), ground - 7 + Math.floor(k / 3), `crown${k}`);
}

function scenery(g: Grid): void {
  for (const [x, y] of [
    [12, 3],
    [37, 2],
    [61, 3],
    [84, 2],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [7, 28, 52, 70, 85]) g.put(x, G3 - 1, 'b');
  for (const x of [16, 35, 61, 79]) g.put(x, G3 - 1, 'f');
}
