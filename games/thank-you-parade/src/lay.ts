// Helpers for laying out the parade's levels: a map built from a Grid and then dressed block by block (the ground, shop
// fronts, runs of one block), the shared constants, and the sign set.
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import type { Book } from '../../kit/starter/book';
import type { Sign } from '../../kit/starter/sign';
import { addPlacard } from './blocks';
import type { Pal } from './print';
import type { Tone } from './text';

export const GROUND = 10;
export const HEIGHT = 15;

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** The level's own block set and palette. */
  book: Book;
  pal: Pal;
  /** A door that sends the hero back to the level's start (a gust that ran out), as [x, y] of its bottom block. */
  retry?: [number, number];
  /** Who plays it (Penny unless it says Marge). */
  hero?: 'penny' | 'marge';
  /** Its song (the parade march unless it names another). */
  song?: 'march' | 'marge' | 'drumoff';
}

/** A room: ground on `GROUND`, hedges at both ends, the entrance at `startX` and the exit door at `exitX`. */
export function room(width: number, exitX: number, startX = 3): Grid {
  const g = new Grid(width, HEIGHT);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(startX, 8, 's').put(startX, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** Runs of one block: `run(m, 'walk', 0, 9, 10)` sets x 0 to 9 on row 10. */
export function run(m: StarterMap, name: string, x0: number, x1: number, y: number): void {
  for (let x = x0; x <= x1; x++) m.set(x, y, name);
}

/** A column of one block from y0 to y1. */
export function column(m: StarterMap, name: string, x: number, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y++) m.set(x, y, name);
}

/** The street: a sidewalk on the ground row and road below it, from x0 to x1. */
export function street(m: StarterMap, x0: number, x1: number): void {
  run(m, 'walk', x0, x1, GROUND);
  for (let y = GROUND + 1; y < HEIGHT; y++) run(m, 'road', x0, x1, y);
}

/** A shop front behind the sidewalk: a wall from row 3 down to the ground, windows, an awning and a door, `w` blocks wide. */
export function shop(m: StarterMap, x: number, w: number, tone: 'wallA' | 'wallB', doorAt = Math.floor(w / 2)): void {
  for (let i = 0; i < w; i++) {
    m.set(x + i, 3, 'cornice');
    for (let y = 4; y < GROUND; y++) m.set(x + i, y, tone);
    m.set(x + i, 5, 'awning');
    if (i !== doorAt) m.set(x + i, 7, `${tone}Win`);
  }
  m.set(x + doorAt, GROUND - 2, 'shopDoor').set(x + doorAt, GROUND - 1, 'shopDoor');
}

/** A flagpole with a waving flag: its foot on `ground` at x, `h` blocks tall. */
export function flagpole(m: StarterMap, x: number, ground: number, h: number): void {
  const top = ground - h;
  for (let y = top + 1; y < ground; y++) m.set(x, y, 'pole');
  m.set(x, top, 'poleTop')
    .set(x + 1, top, 'flagA0')
    .set(x + 2, top, 'flagA1');
}

/** Bunting strung along row y from x0 to x1. */
export function bunting(m: StarterMap, x0: number, x1: number, y: number): void {
  for (let x = x0; x <= x1; x++) m.set(x, y, x % 2 ? 'bunting1' : 'bunting0');
}

/** The top row of a sign standing on ground row `ground`. */
export const onGround = (ground: number, s: Sign): number => ground - 1 - s.board.length;

export type Signs = Record<string, Sign>;

/** Adds each placard of `defs` ([text, blocks wide, blocks high, ink]) to `book`. */
export function addSigns(book: Book, pal: Pal, defs: Record<string, [string, number, number, Tone?]>): Signs {
  const out: Signs = {};
  for (const [n, [text, w, h, tone]] of Object.entries(defs)) out[n] = addPlacard(book, pal, n, text, w, h, tone);
  return out;
}
