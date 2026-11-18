// What every LUCKY CAT level is made of, and the helpers its levels share: a room painted on a Grid (see
// games/kit/starter/map.ts for what the letters mean; ground.ts draws them in the game's woodcut), the Committee's
// handbills, scenery and the level's own block set.
import { applyBlockTimers } from '@lewismoten/gamemaker-sandbox-tools/kit/blockTimers';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, type Timed } from '../../kit/starter/book';
import { Grid } from '../../kit/starter/grid';
import type { StarterMap } from '../../kit/starter/map';
import type { Sign } from '../../kit/starter/sign';
import type { Charm } from './charms';
import { addGround } from './ground';
import { addBill } from './handbill';
import type { Pal } from './print';
import { addProps } from './props';

export type { Timed };

export interface Level {
  /** The files' base name (one.map, one.lst ...). */
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** The look: a key of LOOKS in palette.ts ('' keeps the base palette). */
  look: string;
  /** The character file: Midnight, Midnight with Left and Right swapped, or Rascal. */
  chr: 'hero' | 'mirror' | 'rascal';
  map: StarterMap;
  book: Book;
  timed: Timed[];
  /** The charms in this level, in the order the route takes them. */
  charms: Charm[];
}

export const GROUND = 10;

/** The finished block set: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: Pick<Level, 'book' | 'timed'>): Block[] {
  return applyBlockTimers(l.book.finish(), (name) => l.book.n(name), l.timed);
}

/** A new block set: the ground and walls, then the named prop groups and this level's charms. */
export function startBook(pal: Pal, groups: readonly string[], charms: readonly Charm[]): Book {
  const book = new Book('bbl');
  addGround(book, pal);
  addProps(book, pal, groups, { charms });
  return book;
}

/** Signs by name: [text, width, height] (the words wrap to the board). */
export type SignDefs = Record<string, readonly [string, number, number]>;

export function addSigns<D extends SignDefs>(book: Book, pal: Pal, defs: D): Record<keyof D, Sign> {
  const out = {} as Record<keyof D, Sign>;
  for (const n of Object.keys(defs) as (keyof D & string)[]) {
    const [text, w, h] = defs[n];
    out[n] = addBill(book, pal, `${n}.sign`, text, w, h);
  }
  return out;
}

/** The top row of a sign standing on ground row `ground`. */
export const onGround = (ground: number, s: Sign): number => ground - 1 - s.board.length;

/** The room: ground, hedges at both ends, the entrance at x 3 and the exit door at `exitX`. */
export function room(width: number, exitX: number, ground = GROUND): Grid {
  const g = new Grid(width, 15);
  g.row(ground, 0, width - 1, 'G').fill(0, ground + 1, width, 4, 'D');
  g.col(0, 0, ground - 1, 'X').col(width - 1, 0, ground - 1, 'X');
  g.put(3, ground - 2, 's').put(3, ground - 1, 'S');
  g.put(exitX, ground - 2, 'e').put(exitX, ground - 1, 'E');
  return g;
}

export function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[], ground = GROUND): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** A narrow cracked gap under a low wooden landing: one held rise clears the crack after release. */
export function crackCrossing(m: StarterMap, col: number, width: number, row = GROUND - 1): void {
  for (let x = col; x < col + width; x++) m.set(x, row, 'sky');
  m.set(col, row, 'plank');
  m.set(col, row + 1, 'crack');
}
