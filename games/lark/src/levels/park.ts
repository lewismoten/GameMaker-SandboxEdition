// Chapter 2, Valentines in the Park. Teddy meets Joe at the gate: Gwinn has run off with the box of
// valentines for his party, and the wind took the rest. Six valentines tumble about the hedged
// lawn (west); Gwinn runs from Joe round her fenced yard (east) until he corners her; and the
// party's arch (north) opens for all twelve. Behind it, Teddy's corner opens once (chapter 2's
// rope) and lets Joe out by a little gate that only swings outward.
import { rng } from '../../../kit/pixels';
import type { Bestiary, BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

export const PARK_W = 30;
export const PARK_H = 20;

export function parkRows(): string[] {
  const R = rng(23);
  const g: string[][] = Array.from({ length: PARK_H }, (_, y) =>
    Array.from({ length: PARK_W }, (_, x) => {
      if (x === 0 || y === 0 || x === PARK_W - 1 || y === PARK_H - 1) return 'h';
      const v = R();
      return v < 0.1 ? 'f' : v < 0.55 ? 'g' : ',';
    }),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  const box = (x0: number, y0: number, x1: number, y1: number, ch: string) => {
    for (let x = x0; x <= x1; x++) (put(x, y0, ch), put(x, y1, ch));
    for (let y = y0; y <= y1; y++) (put(x0, y, ch), put(x1, y, ch));
  };
  // the path from the gate north to the party, and the west and east paths
  for (let y = 5; y < PARK_H - 1; y++) put(15, y, 'p');
  for (let x = 4; x < 26; x++) put(x, 15, 'p');
  // the lawn: hedged, its gap facing the path
  box(1, 4, 11, 13, 'h');
  put(11, 9, 'g');
  put(11, 10, 'g');
  for (const [x, y] of [
    [2, 5],
    [7, 5],
    [2, 8],
    [7, 8],
    [2, 11],
    [7, 11],
  ])
    put(x, y, 'v');
  put(5, 10, 'T');
  // Gwinn's yard: fenced, the gate on its south side
  box(18, 5, 28, 13, 'F');
  put(22, 13, 'g');
  put(26, 7, 't');
  put(23, 9, 'w');
  // the party, north: balloons, blankets, the table, the arch, Teddy's corner
  for (let x = 1; x < PARK_W - 1; x++) for (let y = 1; y < 4; y++) put(x, y, x < 11 || x > 19 ? ((x + y) % 3 ? 'g' : 'f') : 'b');
  for (const [x, y] of [
    [12, 1],
    [18, 1],
    [11, 2],
    [19, 2],
  ])
    put(x, y, 'B');
  // the corner: hedge round Teddy and the keepsake, the rope and the swing gate in its south side
  put(13, 1, 'h');
  put(14, 1, 'L');
  put(15, 1, 'k');
  put(16, 1, 'D');
  put(13, 2, 'h');
  put(16, 2, 'h');
  put(13, 3, 'h');
  put(14, 3, 'J');
  put(15, 3, 'V');
  put(16, 3, 'h');
  put(14, 4, 'A');
  put(13, 4, 'h');
  put(12, 4, 'h');
  put(16, 4, 'p');
  put(15, 4, 'p');
  // the party's other tables
  put(17, 2, 'D');
  put(12, 3, 'D');
  // Teddy at the gate
  put(13, 16, 'K');
  put(15, PARK_H - 2, '@');
  put(15, PARK_H - 1, 'S');
  return g.map((row) => row.join(''));
}

export function parkMap(set: BlockSet, mons: Bestiary): Stamped {
  return stamp(
    parkRows(),
    {
      h: 'hedge',
      g: 'grass',
      ',': 'grass2',
      f: 'flowers',
      p: 'path',
      F: 'fence',
      t: 'tree',
      T: 'tree',
      b: 'blanket',
      B: 'balloons',
      D: 'table',
      L: 'teddyGlad',
      k: 'valentine',
      J: 'rope2',
      V: 'swing2',
      A: 'arch',
      K: 'teddy',
      v: { tile: 'grass', mon: 'valentine' },
      w: { tile: 'grass', mon: 'gwinn' },
      '@': 'path',
      S: 'path',
    },
    set,
    'hedge',
    mons,
    'LkJVAK@Svw',
  );
}
