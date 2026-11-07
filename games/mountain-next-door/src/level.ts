// What every level is made of, and the helpers the levels share: a place painted on a Grid (see
// games/kit/starter/map.ts for what the letters mean), signs, scenery, the level's own block set, its clocks and
// which monster file it plays with.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import type { StarterMap } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addProps, type PropOptions, type Timed } from './props';
import type { SongName } from './song';

export type MonFile = 'trail' | 'next' | 'hollow' | 'picnic';

export interface Level {
  /** The files' base name (next.map, next.lst ...). */
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** The time of day: a key of LOOKS in palette.ts ('' keeps the morning). */
  look: string;
  map: StarterMap;
  book: Book;
  timed: Timed[];
  mon: MonFile;
  song: SongName;
  /** A scene you mostly watch (the bot stops and looks). */
  watch?: boolean;
}

export const GROUND = 10;

/** The finished block set: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: Pick<Level, 'book' | 'timed'>): Block[] {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}

/** A new block set: the Starters' blocks, then the named prop groups; returns it with its clocks. */
export function startBook(pal: Pal, groups: readonly string[], o: PropOptions = {}): { book: Book; timed: Timed[] } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const timed = addProps(book, pal, groups, o);
  return { book, timed };
}

/** Signs by name: [text, width, height] (the words wrap to the board). */
export type SignDefs = Record<string, readonly [string, number, number]>;

export function addSigns<D extends SignDefs>(book: Book, pal: Pal, defs: D): Record<keyof D, Sign> {
  const out = {} as Record<keyof D, Sign>;
  for (const n of Object.keys(defs) as (keyof D & string)[]) {
    const [text, w, h] = defs[n];
    out[n] = addSign(book, pal, `${n}.sign`, text, w, h);
  }
  return out;
}

/** The top row of a sign standing on ground row `ground`. */
export const onGround = (ground: number, s: Sign): number => ground - 1 - s.board.length;

/** A place: ground, hedges at both ends, the way in at x 3 and the exit door at `exitX`. */
export function room(width: number, exitX: number, height = 15, ground = GROUND): Grid {
  const g = new Grid(width, height);
  g.row(ground, 0, width - 1, 'G').fill(0, ground + 1, width, height - ground - 1, 'D');
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

/**
 * The mountain as a backdrop: a snowy peak at (`peakX`, `top`), steep for `steep` rows, then gentle (two blocks a
 * row) down to row `ground - 1`, filled with rock (passable: Tess walks in front of it). Returns each row's
 * [left, right] edge columns.
 */
export function mountain(m: StarterMap, peakX: number, top: number, steep = 3, ground = GROUND, minX = 1, maxX = m.width - 2): [number, number][] {
  const rows: [number, number][] = [];
  const put = (x: number, y: number, n: string) => {
    if (x >= minX && x <= maxX) m.set(x, y, n);
  };
  put(peakX, top, 'peakL');
  put(peakX + 1, top, 'peakR');
  let l = peakX;
  let r = peakX + 1;
  for (let y = top + 1; y < ground; y++) {
    const gentle = y - top > steep;
    if (gentle) {
      l -= 2;
      r += 2;
      put(l, y, 'gentleL1');
      put(l + 1, y, 'gentleL2');
      put(r, y, 'gentleR1');
      put(r - 1, y, 'gentleR2');
    } else {
      l -= 1;
      r += 1;
      put(l, y, 'slopeL');
      put(r, y, 'slopeR');
    }
    const inner = gentle ? 2 : 1;
    for (let x = l + inner; x <= r - inner; x++) put(x, y, (x * 7 + y * 3) % 5 === 0 ? 'rock2' : 'rock');
    rows.push([l, r]);
  }
  return rows;
}

/** Places the mountain's face (monsters.ts face()): eyes at columns `eyeL` and `eyeR` (each 2x2, top row `eyeY`), the mouth (2x1) at (`mouthX`, `mouthY`). */
export function placeFace(m: StarterMap, at: number, eyeL: number, eyeR: number, eyeY: number, mouthX: number, mouthY: number): void {
  for (const x of [eyeL, eyeR]) m.mon(at, x, eyeY).mon(at + 1, x + 1, eyeY).mon(at + 2, x, eyeY + 1).mon(at + 3, x + 1, eyeY + 1);
  m.mon(at + 4, mouthX, mouthY).mon(at + 5, mouthX + 1, mouthY);
}
