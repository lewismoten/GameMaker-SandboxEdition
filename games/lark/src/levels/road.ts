// The Long Road, first leg: from The Dog House east along the road, with a lane north to each
// stop (the town clock, the park, Main Street's parade) and, at the far end, a field gate that
// opens for the three friends' thank-yous (and gives them back as Joe goes through).
import { rng } from '../../../kit/pixels';
import type { BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

export const ROAD_W = 36;
export const ROAD_H = 18;
/** Lanes north: chapter 1's, 2's and 3's. */
export const LANES = [10, 19, 27];
export const ROAD_ROW = 12;

export function roadRows(): string[] {
  const R = rng(17);
  const g: string[][] = Array.from({ length: ROAD_H }, (_, y) =>
    Array.from({ length: ROAD_W }, (_, x) => {
      if (x === 0 || y === 0 || x === ROAD_W - 1 || y === ROAD_H - 1) return (x + y) % 2 ? 'T' : 't';
      const v = R();
      return v < 0.12 ? 'f' : v < 0.5 ? 'g' : ',';
    }),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  for (let x = 1; x < ROAD_W - 1; x++) {
    put(x, ROAD_ROW, x % 3 ? 'p' : 'q');
    put(x, ROAD_ROW + 1, x % 4 ? 'q' : 'p');
  }
  // a few trees in the fields, and a fence along the far side of the road
  for (const [x, y] of [
    [5, 4],
    [14, 3],
    [23, 7],
    [31, 3],
    [6, 15],
    [16, 16],
    [24, 15],
    [30, 16],
    [3, 7],
  ])
    put(x, y, (x + y) % 2 ? 'T' : 't');
  for (let x = 4; x < 33; x++) if (!LANES.includes(x) && x % 7 !== 3) put(x, ROAD_ROW + 2, 'F');
  // the lanes north
  LANES.forEach((lx, i) => {
    for (let y = 1; y < ROAD_ROW; y++) put(lx, y, y % 2 ? 'p' : 'q');
    put(lx + 1, ROAD_ROW - 2, ['C', 'K', 'B'][i]);
    // the lane's end (the way in) and its foot (where Joe comes back)
    put(lx, 1, ['L', 'M', 'N'][i]);
    put(lx, ROAD_ROW - 1, ['r', 's', 'u'][i]);
  });
  // The Dog House by the road's west end, and Joe on the step
  put(1, 10, '0');
  put(2, 10, '1');
  put(1, 11, '2');
  put(2, 11, '3');
  put(3, ROAD_ROW, '@');
  // the field gate at the east end, and the road on beyond it
  put(ROAD_W - 3, ROAD_ROW + 1, 'T');
  put(ROAD_W - 3, ROAD_ROW, 'G');
  put(ROAD_W - 2, ROAD_ROW, 'E');
  put(ROAD_W - 2, ROAD_ROW + 1, 't');
  put(ROAD_W - 4, ROAD_ROW - 2, 'O');
  return g.map((row) => row.join(''));
}

export function roadMap(set: BlockSet): Stamped {
  return stamp(
    roadRows(),
    {
      T: 'tree',
      t: 'tree2',
      g: 'grass',
      ',': 'grass2',
      f: 'flowers',
      p: 'path',
      q: 'path2',
      F: 'fence',
      C: 'signClock',
      K: 'signPark',
      B: 'signBand',
      O: 'signOn',
      L: 'path',
      M: 'path',
      N: 'path',
      r: 'path',
      s: 'path',
      u: 'path',
      '0': 'dogHouse0',
      '1': 'dogHouse1',
      '2': 'dogHouse2',
      '3': 'dogHouse3',
      '@': 'path',
      G: 'gate',
      E: 'path',
    },
    set,
    'tree',
    undefined,
    'LMNrsu@GE',
  );
}
