// Chapter 7, Snow Day. Lewie's street the morning after the big snow: six houses along the north
// side (Lewie's, in the middle, has the chimney), the plowed street with the plow coming through
// now and then, and drifts across the walks and the sidewalk. Lewie is shoveling the whole
// street, for nothing, and his spare shovel is in the box by the south sidewalk (it opens once:
// chapter 7's flag, which the rope spends too); carrying it, walking into a drift shovels it.
// Now and then snow slides off a roof onto the top of a front walk (the eaves' shadow warns
// first). Clear each neighbor's walk up to the doormat and step on it, and Lewie's porch steps
// come clear; his corner opens once (the rope), and its gate to the back garden is the way on.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { WALKS } from '../ids';
import { paint, stamp, type Stamped } from './stamp';

export const SNOW_W = 40;
export const SNOW_H = 18;
/** The plow's lane (drawing row), and the street's rows either side of it. */
export const PLOW_ROW = 10;

/** The houses by the drawing column of their west wall (three blocks wide, three deep, from row 1): the neighbors' and Lewie's (L). */
export const HOUSES = [
  [2, 'A'],
  [7, 'B'],
  [12, 'C'],
  [18, 'L'],
  [28, 'A'],
  [33, 'B'],
] as const;

/** Lewie's house's west wall. */
export const LX = 18;

/** Drifts on the front walks (drawing cells). */
const WALK_DRIFTS = [
  [3, 6],
  [3, 7],
  [8, 6],
  [8, 7],
  [13, 7],
  [29, 6],
  [34, 6],
  [34, 7],
];
/** Drifts on the north sidewalk (drawing columns, row 8) and the south one (row 12). */
const SIDE_DRIFTS = [5, 10, 15, 22, 26, 31, 36];
const SOUTH_DRIFTS = [7, 30];

/** The neighbors' doormats (drawing columns, row 4), west to east. */
export const DOORMATS = HOUSES.filter(([, h]) => h !== 'L').map(([x0]) => x0 + 1);

export function snowRows(): string[] {
  const g: string[][] = Array.from({ length: SNOW_H }, (_, y) =>
    Array.from({ length: SNOW_W }, (_, x) => (x === 0 || y === 0 || x === SNOW_W - 1 || y === SNOW_H - 1 ? 'h' : 'b')),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  // the houses (painted in by snowMap)
  for (const [x0] of HOUSES) for (let k = 0; k < 9; k++) put(x0 + (k % 3), 1 + Math.floor(k / 3), 'H');
  // the neighbors' doormats and front walks, the top of each under its eaves (snow slides off, by turns)
  if (DOORMATS.length !== WALKS) throw new Error(`${DOORMATS.length} walks, not ${WALKS}`);
  DOORMATS.forEach((x, i) => {
    put(x, 4, 'm');
    put(x, 5, i % 2 ? 'E' : 'F');
    for (let y = 6; y < 8; y++) put(x, y, 'w');
  });
  for (const [x, y] of WALK_DRIFTS) put(x, y, 'd');
  // Lewie's corner, in front of his door: the rope and swing gate, the porch steps below
  for (const y of [4, 5, 6]) (put(LX - 1, y, 'h'), put(LX + 2, y, 'h'));
  put(LX, 4, 't');
  put(LX + 1, 4, 'L');
  put(LX, 5, 't');
  put(LX + 1, 5, 't');
  put(LX, 6, 'J');
  put(LX + 1, 6, 'V');
  put(LX, 7, 'A');
  put(LX + 1, 7, 'w');
  // and the gate in Lewie's hedge to the back garden: the way on, once he has said his thank-you
  put(LX - 1, 4, 'B');
  // Lewie's yard: trees, a snowman, a lamp
  for (const [x, y, ch] of [
    [23, 2, 'T'],
    [26, 1, 'U'],
    [25, 5, 'T'],
    [23, 6, 'n'],
    [22, 4, 'l'],
    [38, 3, 'U'],
  ] as const)
    put(x, y, ch);
  // the sidewalks and the street
  for (let x = 1; x < SNOW_W - 1; x++) {
    put(x, 8, 'k');
    put(x, 9, '=');
    put(x, PLOW_ROW, x % 2 ? '=' : '-');
    put(x, 11, '=');
    put(x, 12, 'k');
  }
  put(1, PLOW_ROW, 'P');
  for (const x of SIDE_DRIFTS) put(x, 8, 'e');
  for (const x of SOUTH_DRIFTS) put(x, 12, 'e');
  // the south side: the way in, the shovel box, a frozen pond, snowmen, lamps and trees
  for (let y = 13; y < SNOW_H - 1; y++) put(20, y, 't');
  put(23, 13, 't');
  put(23, 14, 'X');
  for (let x = 8; x < 14; x++) for (let y = 14; y < 16; y++) put(x, y, 'i');
  for (const [x, y, ch] of [
    [5, 14, 'n'],
    [16, 13, 'l'],
    [27, 13, 'l'],
    [3, 15, 'T'],
    [15, 15, 'U'],
    [30, 15, 'T'],
    [34, 14, 'n'],
    [37, 15, 'U'],
  ] as const)
    put(x, y, ch);
  put(20, SNOW_H - 2, '@');
  return g.map((row) => row.join(''));
}

export function snowMap(set: BlockSet, mons: Bestiary): Stamped {
  const st = stamp(
    snowRows(),
    {
      h: 'hedge',
      b: 'bank',
      H: 'bank',
      w: 'walk',
      k: 'sidewalk',
      t: 'trodden',
      '=': 'street',
      '-': 'street2',
      P: 'plowStart',
      m: 'doormat',
      E: 'eaveA',
      F: 'eaveB',
      d: 'driftWalk',
      e: 'driftSide',
      i: 'pond',
      T: 'snowTree',
      U: 'snowTree2',
      n: 'snowman',
      l: 'lampPost',
      L: 'lewieGlad',
      J: 'rope7',
      V: 'swing7',
      A: 'steps',
      X: 'shovelBox',
      B: 'backGate',
      '@': 'trodden',
    },
    set,
    'hedge',
    mons,
    'LJVAXB@',
  );
  for (const [x0, h] of HOUSES) for (let k = 0; k < 9; k++) paint(st, set, x0 + (k % 3), 1 + Math.floor(k / 3), `house${h}${k}`);
  return st;
}
