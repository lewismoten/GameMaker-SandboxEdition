// Helpers for the added levels, which are taller than the parade's one-screen streets: a room with its ground on any row,
// a building (a roof, its facade) and a ladder shaft, and the countdown meter laid where the hero can see it.
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
