// Chapter 10, The Fair, seen from the side, at dusk. Reggie floated off on a bunch of balloons
// and is bobbing to and fro above the carousel's canopy. The carousel's horses go up and down on
// their poles, the ones with brass coats rising while the white ones fall: ride one up, step
// across to the next when it is low, and so on up to the canopy, and catch Reggie as he floats
// by. Then down the far side to Doc Leo at the gate (the turnstile turns once Reggie is safe),
// with the heart balloon Reggie came down holding.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { BANNER_W } from '../blocks/fair';
import { stamp, type Stamped } from './stamp';

export const FAIR_W = 34;
export const FAIR_H = 15;

/** The horses: west column of each (two blocks wide), the row it starts on, and whether it starts by rising (A) or falling (B). */
export const HORSES: { x: number; row: number; kind: 'A' | 'B' }[] = [
  { x: 6, row: 12, kind: 'A' },
  { x: 8, row: 7, kind: 'B' },
  { x: 10, row: 8, kind: 'A' },
  { x: 12, row: 3, kind: 'B' },
];
const HORSE_CHARS = 'QRVX';
const WHEEL_CHARS = '!#$%&*()+';

/** The canopy's row, and how far Reggie floats along it (from its west end). */
export const CANOPY_ROW = 3;
export const REGGIE_RUN = 10;

export function fairRows(): string[] {
  const g: string[][] = Array.from({ length: FAIR_H }, (_, y) =>
    Array.from({ length: FAIR_W }, (_, x) => (y === FAIR_H - 1 ? 'g' : x === 0 || x === FAIR_W - 1 ? 'E' : String(Math.min(7, y)))),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  for (const x of [3, 8, 14, 20, 25, 30]) put(x, 1, 'l');
  // the Ferris wheel far behind
  for (let k = 0; k < 9; k++) put(25 + (k % 3), 3 + Math.floor(k / 3), WHEEL_CHARS[k]);
  // the Clown Club's banner, tents, a booth, the clowns
  for (let k = 0; k < BANNER_W; k++) put(19 + k, 8, 'vwxyz'[k]);
  put(1, 11, 'T');
  put(1, 12, 'U');
  put(1, 13, 'U');
  put(23, 11, 't');
  put(23, 12, 'u');
  put(23, 13, 'u');
  put(20, 13, 'k');
  for (const [x, ch] of [
    [3, 'A'],
    [19, 'B'],
    [26, 'A'],
  ] as const)
    put(x, 13, ch);
  // the carousel: mirrors and poles behind, the canopy on top
  for (let x = 5; x <= 15; x++) {
    put(x, CANOPY_ROW, '=');
    put(x, CANOPY_ROW + 1, 'm');
    put(x, FAIR_H - 1, 'F');
  }
  for (const x of [5, 15]) for (let y = CANOPY_ROW + 2; y < FAIR_H - 1; y++) put(x, y, y < 7 ? 'qrs'[y - 4] : 'p');
  HORSES.forEach((h, i) => {
    for (const dx of [0, 1]) put(h.x + dx, h.row, HORSE_CHARS[i]);
  });
  put(5, CANOPY_ROW - 1, 'Y');
  put(1, FAIR_H - 2, '@');
  // the gate: the turnstile, the heart balloon, Doc Leo
  put(28, 13, 'G');
  put(30, 13, 'K');
  put(32, 13, 'L');
  return g.map((row) => row.join(''));
}

export function fairMap(set: BlockSet, mons: Bestiary): Stamped {
  return stamp(
    fairRows(),
    {
      ...Object.fromEntries([...Array(8).keys()].map((k) => [String(k), `sky${k}`])),
      E: 'fence',
      g: 'grass',
      l: 'lights',
      ...Object.fromEntries([...WHEEL_CHARS].map((ch, k) => [ch, `wheel${k}`])),
      ...Object.fromEntries([...'vwxyz'].map((ch, k) => [ch, `banner${k}`])),
      T: 'tentTop',
      U: 'tentWall',
      t: 'tentTop2',
      u: 'tentWall2',
      k: 'booth',
      A: 'clownA',
      B: 'clownB',
      '=': 'canopy',
      m: 'carouselBand',
      p: 'carouselPole7',
      F: 'carouselFloor',
      q: 'carouselPole4',
      r: 'carouselPole5',
      s: 'carouselPole6',
      ...Object.fromEntries(
        HORSES.map((h, i) => [HORSE_CHARS[i], { tile: h.row === CANOPY_ROW ? 'canopy' : `sky${Math.min(7, h.row)}`, mon: `horse${h.kind}` }]),
      ),
      G: 'turnstile',
      K: 'balloon',
      L: 'leoGlad',
      Y: { tile: `sky${CANOPY_ROW - 1}`, mon: 'reggie' },
      '@': 'sky7',
    },
    set,
    'dirt',
    mons,
    'GKL@',
  );
}
