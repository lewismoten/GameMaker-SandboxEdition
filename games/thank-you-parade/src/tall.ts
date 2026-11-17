// Helpers for the added levels, which are taller than the parade's one-screen streets: a room with its ground on any row,
// a building (a roof, its facade) and a ladder shaft, and the countdown meter laid where the hero can see it.
import type { Book } from '../../kit/starter/book';
import { Grid } from '../../kit/starter/grid';
import type { StarterMap } from '../../kit/starter/map';
import { column, run } from './lay';

/** A room `height` rows tall with ground on row `ground`, hedges at both ends, the entrance at `startX` and the exit at `exitX`. */
export function tallRoom(width: number, height: number, ground: number, exitX: number, startX = 3): Grid {
  const g = new Grid(width, height);
  g.row(ground, 0, width - 1, 'G').fill(0, ground + 1, width, height - ground - 1, 'D');
  g.col(0, 0, ground - 1, 'X').col(width - 1, 0, ground - 1, 'X');
  g.put(startX, ground - 2, 's').put(startX, ground - 1, 'S');
  g.put(exitX, ground - 2, 'e').put(exitX, ground - 1, 'E');
  return g;
}

/** A building: a tar roof from x0 to x1 on row `roof`, a window facade below it down to `ground`. */
export function building(m: StarterMap, x0: number, x1: number, roof: number, ground: number, seed = 0): void {
  run(m, 'roofTile', x0, x1, roof);
  for (let x = x0; x <= x1; x++) for (let y = roof + 1; y < ground; y++) m.set(x, y, (y + x + seed) % 3 ? 'cityWall' : 'cityWin');
}

/** A ladder shaft at x from row `top` down to row `bottom`. */
export const shaft = (m: StarterMap, x: number, top: number, bottom: number): void => column(m, 'ladder', x, top, bottom);

/** A countdown meter named `id` with `segments` bars, its label at (x, y). */
export function meterAt(m: StarterMap, id: string, segments: number, x: number, y: number): void {
  m.set(x, y, `${id}Label0`).set(x + 1, y, `${id}Label1`);
  for (let i = 0; i < segments; i++) m.set(x + 2 + i, y, `${id}${i}`);
  m.set(x + 2 + segments, y, `${id}Cap`);
}

/** Extra copies of the complete five-segment meter across street, roof and pond-bed views.
 * OpenAI Codex (GPT-6.1 Sol), directed by Lewis Moten; existing art and clock blocks. */
const ROUTE_BARS: Record<string, [number, number][]> = {
  gustMini: [
    [72, 7],
    [5, 8],
  ],
  gust: [
    [67, -2],
    [80, -1],
    [77, 3],
    [5, 5],
    [25, 6],
    [68, 6],
    [77, 6],
    [4, 7],
    [15, 7],
    [35, 7],
    [40, 7],
    [48, 7],
    [58, 7],
    [80, 7],
    [17, 8],
    [61, 8],
    [27, 9],
  ],
  bakeryMini: [[17, 25]],
  bakery: [
    [35, -2],
    [55, 0],
    [20, 1],
    [4, 3],
    [14, 3],
    [30, 3],
    [45, 3],
    [65, 3],
    [75, 3],
    [82, 3],
    [55, 5],
    [5, 7],
    [15, 7],
    [15, 9],
    [82, 9],
    [4, 11],
    [30, 11],
    [45, 11],
    [51, 11],
    [65, 11],
    [75, 11],
    [62, 13],
    [36, 14],
    [4, 15],
    [58, 16],
    [14, 17],
    [24, 17],
    [29, 17],
    [41, 17],
    [72, 17],
    [82, 17],
    [51, 19],
    [36, 22],
    [13, 23],
    [58, 24],
    [4, 25],
    [23, 25],
    [30, 25],
    [36, 25],
    [45, 25],
    [55, 25],
    [69, 25],
    [76, 25],
    [82, 25],
    [22, 26],
    [59, 27],
  ],
  thawMini: [],
  thaw: [
    [28, -1],
    [50, -1],
    [8, 0],
    [68, 0],
    [4, 3],
    [18, 3],
    [38, 3],
    [48, 3],
    [60, 3],
    [78, 3],
    [30, 8],
    [4, 9],
    [9, 9],
    [18, 9],
    [68, 9],
    [78, 9],
    [40, 11],
    [60, 11],
    [25, 15],
    [50, 15],
    [25, 16],
    [35, 16],
    [45, 16],
    [50, 16],
    [57, 16],
  ],
};

/** Repeat all five segments, using the same labeled meters' art and absolute timers. */
export function repeatRouteBars(file: string, m: StarterMap, book: Book): void {
  const id = file === 'bakery' ? 'shut' : file;
  const safe = new Set(['sky', 'cityWall', 'cityWin', 'creek'].filter((n) => book.index.has(n)).map((n) => book.n(n)));
  for (const [x, y] of ROUTE_BARS[file] ?? []) {
    for (let i = 0; i < 5; i++) {
      if (!safe.has(m.map.blocks[(y + 10) * 100 + x + i + 10])) throw new Error(`${file}: timer would replace gameplay at ${x + i},${y}`);
      m.set(x + i, y, `${id}${i}`);
    }
  }

  for (const [x, y] of ROUTE_BARS[`${file}Mini`] ?? []) {
    if (!safe.has(m.map.blocks[(y + 10) * 100 + x + 10])) throw new Error(`${file}: small timer would replace gameplay at ${x},${y}`);
    m.set(x, y, `${id}Mini0`);
  }
}
