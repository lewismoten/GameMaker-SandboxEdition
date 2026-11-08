// Level 4, STEPPING STONES (rain): the footprints splash straight through the stream, again and again as it
// bends across the meadow. It is raining, and the stepping stones wobble: they sink and rise on a clock, and some
// rise as others sink. Wait until they are up, then cross. Fall in and it is only wet socks: walk back out and
// try again. Blaze the trees on the banks; the last crossing has a footbridge.

import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { tree } from './prints';
import { RIPPLE_ORDER } from '../propsDeeper';

export const G4 = 15;

/** Each crossing: its stones as runs [first column, last column, group]; group A starts up, group B starts under. */
export const STREAM_AT = {
  crossings: [
    [[8, 11, 'A']],
    [
      [19, 21, 'A'],
      [22, 24, 'B'],
    ],
    [
      [33, 35, 'B'],
      [36, 38, 'A'],
    ],
    [
      [51, 53, 'A'],
      [54, 56, 'B'],
      [57, 58, 'A'],
    ],
  ],
  /** The fifth crossing: single stones two columns apart on the quick ripple clock (propsDeeper.ts), each with an acorn on it. */
  ripple: { water: [67, 77], stones: [68, 70, 72, 74, 76] },
  bridge: [82, 85],
  trees: [14, 28, 46, 65, 79],
  acorns: [30, 48],
  pie: 26,
  exit: 88,
  signs: { stones: 5, two: 16, socks: 40, ripple: 60 },
} as const;

const SIGNS = {
  socks: ['FELL IN? WET SOCKS ARE NOT FATAL.', 4, 3],
  ripple: ['RISE IN A WAVE. WALK WITH IT.', 4, 3],
} as const;

export function levelStream(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'stream', 'rain', 'ripple']);
  const s = addSigns(book, pal, SIGNS);
  const W = 90;
  const g = new Grid(W, 19);
  g.row(G4, 0, W - 1, 'G').fill(0, G4 + 1, W, 3, 'D');
  g.col(0, 0, G4 - 1, 'X').col(W - 1, 0, G4 - 1, 'X');
  g.put(3, G4 - 2, 's').put(3, G4 - 1, 'S');
  g.put(STREAM_AT.exit, G4 - 2, 'e').put(STREAM_AT.exit, G4 - 1, 'E');
  for (const x of [6, 17, 31, 50, 64]) g.put(x, G4 - 1, 'b');
  const m = new MountainMap(book, g.rows());
  // rain everywhere in the sky, on four frames so it scatters
  for (let y = 0; y < G4 - 1; y++) for (let x = 1; x < W - 1; x++) if ((x * 3 + y * 5) % 4 === 0) m.set(x, y, `rain${(x + y * 2) % 4}`);
  // each crossing: water a block deep, a bed under it, the stones on top
  for (const runs of STREAM_AT.crossings) {
    const x0 = runs[0][0];
    const x1 = runs[runs.length - 1][1];
    for (let x = x0; x <= x1; x++) m.set(x, G4, 'waterTop').set(x, G4 + 1, 'bed');
    for (const [a, b, grp] of runs) for (let x = a; x <= b; x++) m.set(x, G4, grp === 'A' ? 'stoneUp' : 'stoneUnder');
  }
  // the ripple: water with single stones in it, each starting in a different phase so they come up in a wave
  const [r0, r1] = STREAM_AT.ripple.water;
  for (let x = r0; x <= r1; x++) m.set(x, G4, 'waterTop').set(x, G4 + 1, 'bed');
  STREAM_AT.ripple.stones.forEach((x, i) => m.set(x, G4, RIPPLE_ORDER[i]).set(x, G4 - 1, 'acorn'));
  // the footbridge
  const [b0, b1] = STREAM_AT.bridge;
  for (let x = b0 - 1; x <= b1 + 1; x++) m.set(x, G4, 'waterTop').set(x, G4 + 1, 'bed');
  for (let x = b0 - 1; x <= b1 + 1; x++) m.set(x, G4 - 1, 'footbridge');
  for (const x of STREAM_AT.trees) tree(m, x, G4);
  for (const x of STREAM_AT.acorns) m.set(x, G4 - 1, 'acorn');
  m.set(STREAM_AT.pie, G4 - 1, 'pie');
  const at = STREAM_AT.signs;
  for (const k of Object.keys(s) as (keyof typeof s)[]) m.sign(at[k], onGround(G4, s[k]), s[k]);
  return { file: 'stream', title: 'Stepping Stones', hint: 'Cross when the stones are up.', look: 'rain', map: m, book, timed, mon: 'trail', song: 'trail' };
}
