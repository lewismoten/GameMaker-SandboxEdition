// ROLL THE DICE's one level. It is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its clock.
//
//   Roll the Dice: a die sits on the ground, rolling. It is a ring of six blocks, each set to turn
//   into the next after a few ticks, so one face after another shows. Touch it and it stops on the
//   face it shows (that block's touch turns it into a still copy) and gives a key: gold for an odd
//   face, silver for an even one. A wall ahead has two doors: the gold one on the ground, the silver
//   one up a ladder. The face you landed on picks the door.
//
// Nothing here is random. The clock starts when the room loads and counts ticks, so the face
// at a touch is whatever the tick makes it (the manual says so). The room ends in visible
// hedges, so Kit is never stopped by something he can't see.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks, KEYS } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { SILVER_KEYS, addLockBlocks } from '../../kit/starter/locks';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { face } from './props';
import { FACE } from './timing';

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
export const WIDTH = 46;
/** The die's column (its block is on row GROUND - 1), the wall with the two doors, and the ladder up to the silver door. */
export const DIE_X = 16;
export const WALL_X = 33;
export const LADDER_X = 25;
/** The ledge the ladder climbs to (the silver door is on it) and the doors' rows. */
export const LEDGE = 5;
export const FACES = [1, 2, 3, 4, 5, 6];

/** The names of the rolling and the stopped face `n`. */
export const rolling = (n: number) => `face${n}`;
export const stopped = (n: number) => `stop${n}`;

type SignName = 'roll' | 'touch' | 'odd' | 'even';
const SIGNS: Record<SignName, string> = {
  roll: 'A DIE ROLLS AND ROLLS',
  touch: 'TOUCH IT TO STOP IT',
  odd: 'ODD: 1 3 5 GOLD DOOR AHEAD',
  even: 'EVEN: 2 4 6 SILVER DOOR UP THE LADDER',
};

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

function buildBook(pal: Pal): { book: Book; signs: Record<SignName, Sign>; timed: Timed[] } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  const timed: Timed[] = [];
  // the ring of faces: rolling face n gives a gold key (odd) or a silver one (even) and, touched, turns into the still face n
  for (const n of FACES) {
    book.add(rolling(n), face(pal, n, false), { ...AIR, effect: n % 2 ? KEYS : SILVER_KEYS, eamt: 1, touch: stopped(n) });
    timed.push({ name: rolling(n), next: rolling((n % 6) + 1), ticks: FACE });
  }
  for (const n of FACES) book.add(stopped(n), face(pal, n, true), AIR);
  const signs = {} as Record<SignName, Sign>;
  for (const k of Object.keys(SIGNS) as SignName[]) signs[k] = addSign(book, pal, `${k}.sign`, SIGNS[k], 4, 3);
  return { book, signs, timed };
}

/** The level: 46 wide, the ground on row 10. */
function rollTheDice(pal: Pal): Level {
  const { book, signs, timed } = buildBook(pal);
  const g = new Grid(WIDTH, 15);
  g.row(GROUND, 0, WIDTH - 1, 'G').fill(0, GROUND + 1, WIDTH, 4, 'D');
  g.col(0, 0, 9, 'X').col(WIDTH - 1, 0, 9, 'X');
  g.put(3, 8, 's')
    .put(3, 9, 'S')
    .put(WIDTH - 4, 8, 'e')
    .put(WIDTH - 4, 9, 'E');
  // the wall: brick between the two doors and over them, the way over blocked
  g.col(WALL_X, 0, 2, 'B').col(WALL_X, LEDGE, 7, 'B');
  // the ledge and its ladder, up to the silver door
  g.row(LEDGE, LADDER_X + 1, WALL_X - 1, 'G');
  g.col(LADDER_X, LEDGE - 1, GROUND - 1, 'H');
  // coins past the wall
  g.row(GROUND - 1, WALL_X + 3, WALL_X + 6, 'c');
  for (const [x, y] of [
    [6, 2],
    [17, 1],
    [30, 2],
    [40, 3],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [15, 24, 34]) g.put(x, GROUND - 1, 'b');
  for (const x of [18, 27, 35]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.set(DIE_X, GROUND - 1, rolling(1));
  m.set(WALL_X, LEDGE - 2, 'gateTopSilver').set(WALL_X, LEDGE - 1, 'gateSilver');
  m.set(WALL_X, GROUND - 2, 'gateTop').set(WALL_X, GROUND - 1, 'gate');
  m.sign(5, onGround(GROUND, signs.roll), signs.roll);
  m.sign(10, onGround(GROUND, signs.touch), signs.touch);
  m.sign(19, onGround(GROUND, signs.even), signs.even);
  m.sign(28, onGround(GROUND, signs.odd), signs.odd);
  return { file: 'one', title: 'Roll the Dice', hint: 'The face you stop on picks the door.', map: m, book, timed };
}

/** The palette and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  return { pal, levels: [rollTheDice(pal)] };
}
