// Chapter 9, The Painted Rocks. A little rock garden on the hill, the morning after the rain.
// Somebody painted a rock for everyone who ever needed cheering up, and each has its own painted
// circle at the end of a channel of raked sand; the rain set them all rolling. Loaf #13 rolled
// into the stone cubby out of the rain, and its door only unlatches when every rock is home.
// A painted rock rolls away from Joe along its channel (stopping at walls): come at it from the
// far side and it rolls into its circle, and shines until patted (walk into it). The corner
// channel needs Joe above its corner; the others, at their far ends. Then Loaf, and the gate on.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { ROCKS } from '../ids';
import { stamp, type Stamped } from './stamp';

const GARDEN_W = 28;
const GARDEN_H = 18;

/** Each rock's start and its circle (drawing cells), and where Joe stands to send it home. */
export const ROCK_PLAN: { rock: [number, number]; circle: [number, number]; push: [number, number]; pat: [number, number] }[] = [
  { rock: [7, 7], circle: [11, 7], push: [1, 7], pat: [12, 7] },
  { rock: [19, 10], circle: [23, 14], push: [23, 8], pat: [23, 15] },
  { rock: [4, 13], circle: [4, 15], push: [4, 9], pat: [4, 16] },
  { rock: [19, 3], circle: [14, 3], push: [26, 3], pat: [13, 3] },
];

function gardenRows(): string[] {
  if (ROCK_PLAN.length !== ROCKS) throw new Error('a plan for every rock');
  const R = (x: number, y: number) => ((x * 7 + y * 13) % 11 < 3 ? ',' : '.');
  const g: string[][] = Array.from({ length: GARDEN_H }, (_, y) =>
    Array.from({ length: GARDEN_W }, (_, x) => (x === 0 || y === 0 || x === GARDEN_W - 1 || y === GARDEN_H - 1 ? 'h' : R(x, y))),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  const wallRow = (y: number, x0: number, x1: number) => {
    for (let x = x0; x <= x1; x++) put(x, y, (x + y) % 2 ? 'w' : 'W');
  };
  const wallCol = (x: number, y0: number, y1: number) => {
    for (let y = y0; y <= y1; y++) put(x, y, (x + y) % 2 ? 'w' : 'W');
  };
  // the cubby, Loaf inside, the door in its south wall
  wallRow(1, 6, 9);
  for (const y of [1, 2, 3, 4]) (put(6, y, 'C'), put(9, y, 'C'));
  for (let x = 6; x <= 9; x++) put(x, 1, 'C');
  put(7, 2, 'L');
  put(8, 2, 'k');
  put(7, 3, 'i');
  put(8, 3, 'i');
  put(7, 4, 'D');
  put(8, 4, 'C');
  // the red rock's channel: west to east, its circle at the east end
  wallRow(6, 2, 11);
  wallRow(8, 2, 11);
  put(2, 7, 'W');
  for (let x = 3; x <= 10; x++) put(x, 7, '-');
  // the green rock's channel: north to south, its circle at the south end
  wallCol(3, 10, 15);
  wallCol(5, 10, 15);
  put(4, 10, 'W');
  for (let y = 11; y <= 14; y++) put(4, y, '|');
  // the blue rock's channel: east, round a corner, then south to its circle
  wallRow(9, 16, 24);
  wallRow(11, 16, 22);
  put(16, 10, 'W');
  put(24, 10, 'W');
  for (let x = 17; x <= 23; x++) put(x, 10, '-');
  wallCol(22, 11, 14);
  wallCol(24, 11, 14);
  for (let y = 11; y <= 13; y++) put(23, y, '|');
  // the purple rock's channel: east to west, its circle at the west end
  wallRow(2, 14, 24);
  wallRow(4, 14, 24);
  put(24, 3, 'W');
  for (let x = 15; x <= 23; x++) put(x, 3, '-');
  ROCK_PLAN.forEach(({ rock: [rx, ry], circle: [cx, cy] }, k) => (put(rx, ry, `${k}`), put(cx, cy, 'abcd'[k])));
  // flower beds, a birdbath, the sign
  for (const [x, y, ch] of [
    [11, 12, 'f'],
    [12, 12, 'f'],
    [17, 15, 'f'],
    [18, 15, 'f'],
    [8, 14, 'B'],
    [19, 6, 'f'],
    [12, 1, 'f'],
    [2, 2, 'f'],
    [26, 15, 'n'],
  ] as const)
    put(x, y, ch);
  put(14, GARDEN_H - 2, '@');
  return g.map((row) => row.join(''));
}

export function gardenMap(set: BlockSet, mons: Bestiary): Stamped {
  return stamp(
    gardenRows(),
    {
      h: 'hedge',
      '.': 'gravel',
      ',': 'grass',
      w: 'lowWall',
      W: 'lowWall2',
      '-': 'sandEW',
      '|': 'sandNS',
      ...Object.fromEntries(
        [...Array(ROCKS).keys()].map((k) => [
          String(k),
          { tile: ROCK_PLAN[k].rock[1] === ROCK_PLAN[k].circle[1] || k === 1 ? 'sandEW' : 'sandNS', mon: `rock${k}` },
        ]),
      ),
      ...Object.fromEntries([...Array(ROCKS).keys()].map((k) => ['abcd'[k], { tile: `circle${k}`, mon: `spot${k}` }])),
      f: 'flowerBed',
      B: 'birdbath',
      n: 'signRocks',
      C: 'cubby',
      i: 'cubbyIn',
      L: 'loafGlad',
      k: 'heartStone',
      D: 'door',
      '@': 'gravel',
    },
    set,
    'hedge',
    mons,
    'LkD@',
  );
}
