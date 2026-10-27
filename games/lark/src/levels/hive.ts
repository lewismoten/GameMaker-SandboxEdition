// Chapter 8, Open Mic at the Hive. The coffee house behind the little castle front, on open mic
// night: café tables, the counter, shelves of books, the stage under the windows. Will is up
// next, and the fans have blown his pages all over: three go round and round under the ceiling
// fans (catch them, and the turret stair door opens: they were the first pages, and the rest
// went up the stair), and four are up in the turret (levels/loft.ts). Back down the turret's
// other stair, the Hive is listening, the stage is lit, and the steps up to Will's corner want
// those four; it opens once (chapter 8's rope) and lets Joe out by a swing gate.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

const HIVE_W = 26;
const HIVE_H = 16;

/** Where each floor page starts going round (drawing cells), and the size of its loop. */
export const PAGE_LOOPS: [number, number, number, number][] = [
  [4, 9, 3, 2],
  [12, 9, 3, 2],
  [20, 7, 2, 3],
];

function hiveRows(after: boolean): string[] {
  const g: string[][] = Array.from({ length: HIVE_H }, (_, y) =>
    Array.from({ length: HIVE_W }, (_, x) => (x === 0 || y === 0 || x === HIVE_W - 1 || y === HIVE_H - 1 ? 'Z' : (x + y) % 7 ? '.' : ',')),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  for (const x of [3, 11, 22]) (put(x, 0, 'W'), put(x, HIVE_H - 1, 'W'));
  // shelves of books along the west wall, the counter
  for (let y = 2; y < 7; y++) put(1, y, y % 2 ? 'b' : 'B');
  for (const [x, ch] of [
    [1, 'c'],
    [2, 'e'],
    [3, 'c'],
    [4, 'p'],
  ] as const)
    put(x, 13, ch);
  put(1, 12, 'c');
  // the stage, the curtain behind it, the mic
  for (let x = 6; x < 18; x++) {
    put(x, 1, 'C');
    for (const y of [2, 3]) put(x, y, after ? 'l' : 's');
  }
  put(12, 2, 'm');
  // Will's corner, at the stage's east end, behind the curtain: the rope, the swing gate, the steps up
  for (const y of [1, 2, 3]) (put(18, y, 'C'), put(21, y, 'C'));
  put(19, 1, after ? 'L' : 's');
  put(20, 1, after ? 'k' : 's');
  put(19, 2, 's');
  put(20, 2, 's');
  put(19, 3, after ? 'J' : 'C');
  put(20, 3, after ? 'V' : 'C');
  put(19, 4, after ? 'A' : '.');
  // rugs, tables, the fans the pages go round under
  for (let x = 9; x < 16; x++) for (const y of [5, 6]) put(x, y, 'r');
  for (const [x, y] of [
    [3, 4],
    [8, 7],
    [16, 6],
    [7, 12],
    [17, 11],
    [22, 13],
    [10, 12],
    [23, 4],
  ])
    put(x, y, (x + y) % 2 ? 't' : 'T');
  for (const [x, y] of PAGE_LOOPS) put(x + 1, y + 1, 'f');
  // the turret stair door, in the east wall
  put(HIVE_W - 1, 6, after ? 'Z' : 'U');
  // Will waits on the floor before the stage, worried
  if (!after) put(13, 4, 'w');
  put(16, 14, 'K');
  put(13, HIVE_H - 2, '@');
  put(13, HIVE_H - 1, 'S');
  return g.map((row) => row.join(''));
}

export function hiveMap(set: BlockSet, mons: Bestiary | undefined, after: boolean): Stamped {
  const rows = hiveRows(after);
  if (!after) PAGE_LOOPS.forEach(([x, y], i) => (rows[y] = rows[y].slice(0, x) + String(i) + rows[y].slice(x + 1)));
  return stamp(
    rows,
    {
      Z: 'stone',
      W: 'castleWindow',
      '.': 'floor',
      ',': 'floor2',
      r: 'rug',
      b: 'books',
      B: 'books2',
      c: 'counter',
      e: 'espresso',
      p: 'pastry',
      C: 'curtain',
      s: 'stage',
      l: 'stageLit',
      m: 'mic',
      t: 'table',
      T: 'table2',
      f: 'fan',
      K: 'chalkboard',
      U: 'turret',
      w: 'will',
      L: 'willGlad',
      k: 'umbrella',
      J: 'rope8',
      V: 'swing8',
      A: 'steps',
      ...Object.fromEntries(PAGE_LOOPS.map((_, i) => [String(i), { tile: 'floor', mon: `page${i}` }])),
      '@': 'floor',
      S: 'castleDoor',
    },
    set,
    'stone',
    after ? undefined : mons,
    after ? 'LkJVA@S' : 'wU@S',
  );
}
