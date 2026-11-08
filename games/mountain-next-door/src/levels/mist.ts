// Level 7, GATHERING MIST (a damp morning): below the stream the meadow is cut by three dells, and Wisp's mist has
// gathered in them in beads, the way a nervous cloud drips. The beads are there to take, and so is the way out: the
// mist stacks itself into steps up each dell's far wall, one step a little later than the last, and they all thin away
// together. Wait until the first is up, hop from step to step before they go, take the beads on the way. Slip and it
// is a drop back to the floor of the dell, and another turn of the clock.

import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';
import { TRAIL } from '../monsters';

/** The meadow's rim: the row of grass Tess walks on. */
export const G8 = 12;

/** Each dell: its columns, how deep it is (rows below the rim to its floor) and so how many steps climb out of it (depth - 1). */
export const DELLS = [
  { a: 26, b: 41, depth: 5 },
  { a: 51, b: 70, depth: 6 },
  { a: 80, b: 103, depth: 7 },
] as const;

/** A dell's floor row. */
export const floorOf = (d: (typeof DELLS)[number]): number => G8 + d.depth;

/** Step k of a dell: its two columns [left, right] and the row of the cloud (Tess stands on the row above). */
export function stepOf(d: (typeof DELLS)[number], k: number): { x: [number, number]; row: number } {
  const n = d.depth - 1;
  const right = d.b - 2 * (n - 1 - k);
  return { x: [right - 1, right], row: floorOf(d) - 2 - k };
}

export const MIST_AT = {
  /** Beads on the floors of the dells and on the steps (by the step's number), and on the rim between. */
  floorBeads: [
    [28, 31],
    [53, 56, 59],
    [83, 87, 91],
  ],
  stepBeads: [
    [1, 3],
    [1, 3],
    [1, 3, 5],
  ],
  rimBeads: [14, 18, 43, 73, 107, 115],
  exit: 118,
  signs: { weather: 7, steps: 21, deeper: 75, wisp: 111 },
} as const;

const SIGNS = {
  weather: ['NOT ALL OF THIS MIST IS WEATHER.', 4, 3],
  steps: ['THE MIST STACKS ITSELF INTO STEPS.', 4, 3],
  deeper: ['THIS ONE IS DEEPER. ONE STEP AT A TIME.', 4, 3],
  wisp: ['WISP WAS HERE. IT DRIPS WHEN IT IS NERVOUS.', 4, 3],
} as const;

export function levelMist(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['pickups', 'mist']);
  const s = addSigns(book, pal, SIGNS);
  const W = 124;
  const g = new Grid(W, G8 + 11);
  g.row(G8, 0, W - 1, 'G').fill(0, G8 + 1, W, 10, 'D');
  g.col(0, 0, G8 - 1, 'X').col(W - 1, 0, G8 - 1, 'X');
  g.put(3, G8 - 2, 's').put(3, G8 - 1, 'S');
  g.put(MIST_AT.exit, G8 - 2, 'e').put(MIST_AT.exit, G8 - 1, 'E');
  // each dell: open air from the rim down to a grassy floor
  for (const d of DELLS) g.fill(d.a, G8, d.b - d.a + 1, d.depth, ' ').row(floorOf(d), d.a, d.b, 'G');
  const m = new MountainMap(book, g.rows());
  for (const d of DELLS) for (let y = G8; y < floorOf(d); y++) for (let x = d.a; x <= d.b; x++) m.set(x, y, 'dellAir');
  DELLS.forEach((d, i) => {
    const feet = floorOf(d) - 1;
    // the steps, all gone at the start: each comes up on its own clock
    for (let k = 0; k < d.depth - 1; k++) {
      const { x, row } = stepOf(d, k);
      m.set(x[0], row, `mist${k}g`).set(x[1], row, `mist${k}g`);
    }
    for (const x of MIST_AT.floorBeads[i]) m.set(x, feet, 'beadDell');
    for (const k of MIST_AT.stepBeads[i]) {
      const { x, row } = stepOf(d, k);
      m.set(x[0], row - 2, 'beadDell');
    }
    m.mon(TRAIL.mist, d.a + 2, G8 + 1);
  });
  for (const x of MIST_AT.rimBeads) m.set(x, G8 - 1, 'bead');
  const at = MIST_AT.signs;
  for (const k of Object.keys(s) as (keyof typeof s)[]) m.sign(at[k], onGround(G8, s[k]), s[k]);
  return {
    file: 'mist',
    title: 'Gathering Mist',
    hint: 'Climb out on the mist steps.',
    look: 'mist',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'mist',
    snd: 'mist',
  };
}
