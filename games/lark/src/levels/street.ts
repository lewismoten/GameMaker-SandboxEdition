// Chapter 3, The Parade. Main Street at dusk, the Clown Club's parade under way: four lanes of
// unicycles, drum carts and balloon carts rolling east, each lane at its own pace, coming out from
// behind the shops at the west end. The Bard of Bizarre's band can't strike up: his drumsticks
// went flying, one onto the middle sidewalk and one across the street. Find both, and his bass
// drum (in front of his corner by the bandstand) rolls aside; his corner opens once (chapter 3's
// rope) and lets Joe out by a swing gate. The way back to the road is at the street's north end.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

const STREET_W = 22;
const STREET_H = 17;
/** The parade's lanes (drawing rows), west end spawners first. */
export const STREET_LANES = [7, 8, 10, 11];

function streetRows(): string[] {
  const g: string[][] = Array.from({ length: STREET_H }, (_, y) =>
    Array.from({ length: STREET_W }, (_, x) => {
      if (x === 0 || y === 0 || x === STREET_W - 1 || y === STREET_H - 1) return String((x * 7 + y * 3) % 4);
      return (x + y) % 5 ? '.' : ',';
    }),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  STREET_LANES.forEach((ly, k) => {
    for (let x = 1; x < STREET_W - 1; x++) put(x, ly, x % 3 === 1 ? '=' : '-');
    put(1, ly, 'abcd'[k]);
  });
  // the drumsticks: one on the middle sidewalk, one on the far (north) sidewalk
  put(4, 9, 'm');
  put(17, 6, 'm');
  // street furniture
  for (const [x, y, ch] of [
    [2, 13, 'l'],
    [19, 13, 'l'],
    [15, 5, 'l'],
    [8, 13, 'n'],
    [14, 13, 'n'],
    [18, 2, 'n'],
    [3, 5, 'u'],
    [9, 5, 'u'],
  ] as const)
    put(x, y, ch);
  // the bandstand
  put(10, 1, 'W');
  put(11, 1, 'X');
  put(10, 2, 'Y');
  put(11, 2, 'Z');
  // the Bard's corner, the drum in front of it, the rope and the swing gate
  for (const [x, y] of [
    [4, 1],
    [7, 1],
    [4, 2],
    [7, 2],
    [4, 3],
    [7, 3],
    [4, 4],
  ])
    put(x, y, 'h');
  put(5, 1, 'L');
  put(6, 1, 'k');
  put(5, 3, 'J');
  put(6, 3, 'V');
  put(5, 4, 'G');
  put(11, STREET_H - 2, '@');
  put(16, 0, 'N');
  return g.map((row) => row.join(''));
}

export function streetMap(set: BlockSet, mons: Bestiary): Stamped {
  return stamp(
    streetRows(),
    {
      '0': 'shop0',
      '1': 'shop1',
      '2': 'shop2',
      '3': 'shop3',
      '.': 'paver',
      ',': 'paver2',
      '=': 'lane',
      '-': 'road',
      a: 'spawn0',
      b: 'spawn1',
      c: 'spawn2',
      d: 'spawn3',
      m: 'stick',
      l: 'lampPost',
      n: 'bench',
      u: 'bunting',
      W: 'bandstand0',
      X: 'bandstand1',
      Y: 'bandstand2',
      Z: 'bandstand3',
      h: 'bunting',
      L: 'bardGlad',
      k: 'drumstick',
      J: 'rope3',
      V: 'swing3',
      G: 'drum',
      '@': 'paver',
      N: 'paver',
    },
    set,
    'shop0',
    mons,
    'mLkJVG@N',
  );
}
