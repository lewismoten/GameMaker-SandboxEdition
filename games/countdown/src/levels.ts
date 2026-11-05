// COUNTDOWN's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, digits and exit.
//
//   1. Nine to Zero: a big digit on a brick building counts 9, 8, 7 ... 0, a second each. The
//      double door under it is shut until the digit shows 0; then it opens and you MAY go in.
//   2. Ninety-nine: two small digits count 99 down to 00 in a closed room. At 00 the floor is a
//      trapdoor: it flashes for three seconds, then opens, and you drop onto a mat, and out.
//      You are FORCED out: the only way to stay in the room is to be somewhere with no floor.
//
// The engine has no number readout. A digit is a row of blocks that each look like one number
// and turn into the next after 18 ticks (timing.ts). Every block of one kind changes together,
// so the whole chain is a digit and it counts by itself, from the moment the level starts.
// Both rooms are closed in by brick you can see, so Kit is never stopped by something he can't.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { digit } from './digits';
import { door, mat, shaft, trap } from './props';
import { DOOR_AT, FLOOR_AT, SECOND, TENS, WARN } from './timing';

/** A block that turns into another after some ticks. */
interface Timed {
  name: string;
  next: string;
  ticks: number;
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  book: Book;
  timed: Timed[];
  /** The cells (world blocks) that take the hero on: the door's bottom-left block, or the mat. */
  links: [number, number][];
}

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

const AIR = { grav: PULL.down };
export const GROUND = 10;
export const WIDTH_ONE = 26;
export const WIDTH_TWO = 16;
/** Level 1's double door (left block) and its building's lintel. */
export const DOOR_X = 21;
export const BOARD_Y = 4;
/** Level 2's digits, trapdoor row and the mat at the bottom of the shaft. */
export const TENS_AT: [number, number] = [7, 3];
export const ONES_AT: [number, number] = [8, 3];
export const MAT_ROW = 19;
/** The quarters of a 2x2 picture: block suffix, then its offset in pixels. */
const QUARTERS = [
  ['tl', 0, 0],
  ['tr', 20, 0],
  ['bl', 0, 20],
  ['br', 20, 20],
] as const;

type SignName = 'count' | 'door' | 'two' | 'floor';
const SIGNS: Record<SignName, string> = {
  count: 'THE BIG NUMBER COUNTS DOWN, ONE EVERY SECOND',
  door: 'AT 0 THE DOOR OPENS. UNTIL THEN IT IS SHUT',
  two: 'TWO DIGITS COUNT 99 TO 00',
  floor: 'AT 00 THE FLOOR OPENS. DROP OUT',
};

function startBook(pal: Pal, names: SignName[], signH: number): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  for (const n of names) signs[n] = addSign(book, pal, `${n}.sign`, SIGNS[n], 4, signH);
  return { book, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: nine to zero. */
function nineToZero(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['count', 'door'], 3);
  const timed: Timed[] = [];
  // the big digit: four blocks a number, each its own chain 9 -> 8 -> ... -> 0 (the 0 stays)
  for (let n = 9; n >= 0; n--) {
    const pic = digit(pal, n, 2);
    for (const [q, x, y] of QUARTERS) {
      book.add(`big${n}.${q}`, pic.crop(x, y, 20, 20), AIR);
      if (n > 0) timed.push({ name: `big${n}.${q}`, next: `big${n - 1}.${q}`, ticks: SECOND });
    }
  }
  // the double door: shut and solid, then open
  for (const open of [false, true]) {
    const pic = door(pal, open);
    for (const [q, x, y] of QUARTERS) {
      const name = `door.${open ? 'open' : 'shut'}.${q}`;
      book.add(name, pic.crop(x, y, 20, 20), open ? AIR : { solid: SOLID });
      if (!open) timed.push({ name, next: `door.open.${q}`, ticks: DOOR_AT });
    }
  }
  const g = new Grid(WIDTH_ONE, 15);
  g.row(GROUND, 0, WIDTH_ONE - 1, 'G').fill(0, GROUND + 1, WIDTH_ONE, 4, 'D');
  g.col(0, 0, 9, 'B').col(WIDTH_ONE - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  scenery(
    g,
    [
      [8, 3],
      [14, 4],
    ],
    [8],
    [14],
  );
  // the building: a lintel of brick with the number on it, a porch under it, and the door's frame to the right
  g.fill(19, 2, 6, 6, 'B').fill(23, 8, 2, 2, 'B');
  g.row(9, 15, 18, 'c');
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.count), signs.count);
  m.sign(10, onGround(GROUND, signs.door), signs.door);
  for (const [q, x, y] of QUARTERS) {
    m.set(DOOR_X + x / 20, BOARD_Y + y / 20, `big9.${q}`);
    m.set(DOOR_X + x / 20, 8 + y / 20, `door.shut.${q}`);
  }
  return { file: 'one', title: 'Nine to Zero', hint: 'Wait for the 0.', map: m, book, timed, links: [[DOOR_X + ORIGIN, 9 + ORIGIN]] };
}

/** Level 2: ninety-nine. The ones digit is 100 blocks, one a number from 99 to 0: it has to know the tens to stop at 00. */
function ninetyNine(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['two', 'floor'], 2);
  const timed: Timed[] = [];
  for (let t = 9; t >= 0; t--) {
    book.add(`ten${t}`, digit(pal, t), AIR);
    if (t > 0) timed.push({ name: `ten${t}`, next: `ten${t - 1}`, ticks: TENS });
  }
  for (let t = 9; t >= 0; t--)
    for (let d = 9; d >= 0; d--) {
      book.add(`one${t}${d}`, digit(pal, d), AIR);
      if (d > 0) timed.push({ name: `one${t}${d}`, next: `one${t}${d - 1}`, ticks: SECOND });
      else if (t > 0) timed.push({ name: `one${t}${d}`, next: `one${t - 1}9`, ticks: SECOND });
    }
  book.add('trap.shut', trap(pal, false), { solid: SOLID });
  book.add('trap.warn', trap(pal, true), { solid: SOLID });
  book.add('shaft', shaft(pal), AIR);
  book.add('mat', mat(pal), AIR);
  timed.push({ name: 'trap.shut', next: 'trap.warn', ticks: FLOOR_AT - WARN }, { name: 'trap.warn', next: 'shaft', ticks: WARN });

  const g = new Grid(WIDTH_TWO, 22);
  g.row(2, 0, WIDTH_TWO - 1, 'B')
    .col(0, 2, 19, 'B')
    .col(WIDTH_TWO - 1, 2, 19, 'B')
    .fill(0, 20, WIDTH_TWO, 2, 'D');
  g.fill(5, 3, 6, 2, 'B'); // the plaque the digits sit on
  g.put(1, 8, 's').put(1, 9, 'S');
  g.put(7, 9, 'c').put(8, 9, 'c').put(13, 9, 'c').put(14, 9, 'c');
  const m = new StarterMap(book, g.rows());
  m.sign(3, onGround(GROUND, signs.two), signs.two);
  m.sign(9, onGround(GROUND, signs.floor), signs.floor);
  m.set(...TENS_AT, 'ten9').set(...ONES_AT, 'one99');
  const links: [number, number][] = [];
  for (let x = 1; x < WIDTH_TWO - 1; x++) {
    m.set(x, GROUND, 'trap.shut');
    for (let y = GROUND + 1; y < MAT_ROW; y++) m.set(x, y, 'shaft');
    m.set(x, MAT_ROW, 'mat');
    links.push([x + ORIGIN, MAT_ROW + ORIGIN]);
  }
  return { file: 'two', title: 'Ninety-Nine', hint: 'The floor will open at 00.', map: m, book, timed, links };
}

/** The palette and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  return { pal, levels: [nineToZero(pal), ninetyNine(pal)] };
}
