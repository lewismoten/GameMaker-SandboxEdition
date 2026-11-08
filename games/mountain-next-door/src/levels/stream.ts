// Level 4, STEPPING STONES (rain): the footprints splash straight through the stream, again and again as it
// bends across the meadow. It is raining, and the stepping stones wobble: they sink and rise on a clock, and some
// rise as others sink. Wait until they are up, then cross. Fall in and it is only wet socks: walk back out and
// try again. Blaze the trees on the banks; the last crossing has a footbridge.
import { StarterMap } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, type Level } from '../level';
import { tree } from './prints';

export const G4 = 15;

/** Each crossing: its stones as runs [first column, last column, group]; group A starts up, group B starts under. */
export const STREAM_AT = {
  crossings: [
    [[13, 16, 'A']],
    [
      [27, 29, 'A'],
      [30, 32, 'B'],
    ],
    [
      [46, 48, 'B'],
      [49, 51, 'A'],
    ],
    [
      [63, 65, 'A'],
      [66, 68, 'B'],
      [69, 70, 'A'],
    ],
  ],
  bridge: [78, 81],
  trees: [21, 39, 57, 75],
  acorns: [42, 60],
  pie: 35,
  exit: 87,
  signs: { stones: 5, two: 22, socks: 52, hill: 83 },
} as const;

const SIGNS = {
  stones: ['WOBBLY STONES! WAIT TILL THEY ARE UP.', 4, 3],
  two: ['SOME RISE AS THE OTHERS SINK.', 4, 3],
  socks: ['FELL IN? ONLY WET SOCKS. TRY AGAIN.', 4, 3],
  hill: ['THE PRINTS GO ON UP THE HILL.', 4, 3],
} as const;

export function levelStream(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'stream', 'rain']);
  const s = addSigns(book, pal, SIGNS);
  const W = 90;
  const g = new Grid(W, 19);
  g.row(G4, 0, W - 1, 'G').fill(0, G4 + 1, W, 3, 'D');
  g.col(0, 0, G4 - 1, 'X').col(W - 1, 0, G4 - 1, 'X');
  g.put(3, G4 - 2, 's').put(3, G4 - 1, 'S');
  g.put(STREAM_AT.exit, G4 - 2, 'e').put(STREAM_AT.exit, G4 - 1, 'E');
  for (const x of [9, 24, 44, 60, 85]) g.put(x, G4 - 1, 'b');
  const m = new StarterMap(book, g.rows());
  // rain everywhere in the sky, on four frames so it scatters
  for (let y = 0; y < G4 - 1; y++) for (let x = 1; x < W - 1; x++) if ((x * 3 + y * 5) % 4 === 0) m.set(x, y, `rain${(x + y * 2) % 4}`);
  // each crossing: water a block deep, a bed under it, the stones on top
  for (const runs of STREAM_AT.crossings) {
    const x0 = runs[0][0];
    const x1 = runs[runs.length - 1][1];
    for (let x = x0; x <= x1; x++) m.set(x, G4, 'waterTop').set(x, G4 + 1, 'bed');
    for (const [a, b, grp] of runs) for (let x = a; x <= b; x++) m.set(x, G4, grp === 'A' ? 'stoneUp' : 'stoneUnder');
  }
  // the footbridge
  const [b0, b1] = STREAM_AT.bridge;
  for (let x = b0 - 1; x <= b1 + 1; x++) m.set(x, G4, 'waterTop').set(x, G4 + 1, 'bed');
  for (let x = b0 - 1; x <= b1 + 1; x++) m.set(x, G4 - 1, 'footbridge');
  for (const x of STREAM_AT.trees) tree(m, x, G4);
  for (const x of STREAM_AT.acorns) m.set(x, G4 - 1, 'acorn');
  m.set(STREAM_AT.pie, G4 - 1, 'pie');
  const at = STREAM_AT.signs;
  for (const k of Object.keys(at) as (keyof typeof at)[]) m.sign(at[k], onGround(G4, s[k]), s[k]);
  return { file: 'stream', title: 'Stepping Stones', hint: 'Cross when the stones are up.', look: 'rain', map: m, book, timed, mon: 'trail', song: 'trail' };
}
