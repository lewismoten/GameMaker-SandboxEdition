// Level 12, THE SPILLWAY (dusk): Wisp followed the water down the hill, and the water goes down in steps: five
// terraces, a pool or two across each, a ladder at alternate ends to the next. The stepping stones sink and rise on a
// clock, as on the stream, but here the way is downhill and the pools come thick and fast, and the terraces are
// crossed to the right, then back to the left. Fall in and it is only wet socks. Springs trickle out of the
// terraces' faces; the last terrace leads to the edge of town.
import { ORIGIN } from '../../../kit/starter/map';
import type { Pal } from '../../../kit/starter/palette';
import { Grid } from '../../../kit/starter/grid';
import { addSigns, onGround, startBook, MountainMap, type Level } from '../level';

/** The terraces' bank rows, top to bottom (Tess walks on the row above); the last is the ground. */
export const TERRACES = [8, 15, 22, 29, 36] as const;

/** A run of stones: [first column, last column, group (A starts up, B under)]. */
type Run = readonly [number, number, 'A' | 'B'];

export const SPILL_AT = {
  /** Per terrace: its crossings (each a list of runs), left to right. */
  crossings: [
    [
      [
        [14, 16, 'A'],
        [17, 19, 'B'],
      ],
      [
        [38, 40, 'B'],
        [41, 43, 'A'],
      ],
    ],
    [
      [
        [62, 64, 'A'],
        [65, 67, 'B'],
      ],
      [
        [36, 38, 'A'],
        [39, 41, 'B'],
        [42, 44, 'A'],
      ],
    ],
    [
      [
        [16, 18, 'A'],
        [19, 21, 'B'],
      ],
      [
        [40, 42, 'A'],
        [43, 45, 'B'],
        [46, 48, 'A'],
      ],
      [
        [66, 68, 'B'],
        [69, 71, 'A'],
      ],
    ],
    [
      [
        [60, 62, 'B'],
        [63, 65, 'A'],
        [66, 68, 'B'],
      ],
      [
        [20, 22, 'A'],
        [23, 25, 'B'],
      ],
    ],
    [
      [
        [18, 20, 'A'],
        [21, 23, 'B'],
        [24, 26, 'A'],
      ],
      [
        [44, 46, 'B'],
        [47, 49, 'A'],
        [50, 52, 'B'],
      ],
    ],
  ] as readonly (readonly (readonly Run[])[])[],
  /** The ladder down from terrace k to the next: at the right end, then the left, by turns. */
  ladders: [80, 3, 80, 3],
  posts: [
    [0, 10],
    [0, 30],
    [1, 76],
    [1, 52],
    [2, 10],
    [2, 34],
    [2, 58],
    [3, 72],
    [3, 48],
    [4, 10],
    [4, 36],
    [4, 62],
  ],
  acorns: [
    [0, 26],
    [1, 24],
    [1, 74],
    [2, 52],
    [3, 28],
    [3, 56],
    [4, 30],
    [4, 66],
  ],
  pie: [3, 54],
  /** Springs trickling from a terrace's face: [terrace, column]. */
  springs: [
    [0, 40],
    [1, 40],
    [2, 41],
    [3, 22],
  ],
  exit: 80,
  signs: [
    [0, 5],
    [2, 26],
    [4, 70],
  ],
} as const;

const SIGNS = [
  ['WISP FOLLOWED THE WATER DOWN THE HILL.', 4, 3],
  ['DOWN IS THE WAY. STONES FIRST, THEN LADDERS.', 4, 3],
  ['TOWN AHEAD. THE SNOW GOES ON OVER THE ROOFS.', 4, 3],
] as const;

/** The row Tess stands on above terrace k. */
export const spillFeet = (k: number): number => TERRACES[k] - 1;

export function levelSpillway(pal: Pal): Level {
  const { book, timed } = startBook(pal, ['trail', 'stream']);
  const names = SIGNS.map((_, i) => `sign${i}`);
  const s = addSigns(book, pal, Object.fromEntries(SIGNS.map((d, i) => [names[i], d])) as Record<string, readonly [string, number, number]>);
  const W = 84;
  const A = SPILL_AT;
  const ground = TERRACES[4];
  const g = new Grid(W, ground + 4);
  g.row(ground, 0, W - 1, 'G').fill(0, ground + 1, W, 3, 'D');
  for (const t of TERRACES.slice(0, 4)) g.row(t, 1, W - 2, 'G').row(t + 1, 1, W - 2, 'D');
  g.col(0, 0, ground - 1, 'X').col(W - 1, 0, ground - 1, 'X');
  g.put(3, TERRACES[0] - 2, 's').put(3, TERRACES[0] - 1, 'S');
  g.put(A.exit, ground - 2, 'e').put(A.exit, ground - 1, 'E');
  A.ladders.forEach((x, k) => g.col(x, TERRACES[k] - 1, TERRACES[k + 1] - 1, 'H'));
  const m = new MountainMap(book, g.rows());
  TERRACES.forEach((t, k) => {
    for (const runs of A.crossings[k]) {
      for (let x = runs[0][0]; x <= runs[runs.length - 1][1]; x++) m.set(x, t, 'waterTop').set(x, t + 1, 'bed');
      for (const [a, b, grp] of runs) for (let x = a; x <= b; x++) m.set(x, t, grp === 'A' ? 'stoneUp' : 'stoneUnder');
    }
  });
  // springs: a thread of water down the terrace's face (the earth rows, then open air to the pool below)
  for (const [k, x] of A.springs) for (let y = TERRACES[k] + 2; y < TERRACES[k + 1]; y++) m.set(x, y, y % 2 ? 'water' : 'water2');
  for (const [k, x] of A.posts) m.set(x, spillFeet(k), 'post');
  for (const [k, x] of A.acorns) m.set(x, spillFeet(k), 'acorn');
  m.set(A.pie[1], spillFeet(A.pie[0]), 'pie');
  m.exits.push({ from: [A.exit + ORIGIN, ground - 1 + ORIGIN] });
  A.signs.forEach(([k, x], i) => m.sign(x, onGround(TERRACES[k], s[names[i]]), s[names[i]]));
  return {
    file: 'spill',
    title: 'The Spillway',
    hint: 'Down the hill by stones and ladders.',
    look: 'dusk',
    map: m,
    book,
    timed,
    mon: 'trail',
    song: 'dusk',
    snd: 'brook',
  };
}
