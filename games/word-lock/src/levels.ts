// SAY THE WORD's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. Pay to Pass: three words lie on the way. The first lock takes all three, and right behind
//      it a refund tray gives three back, so the second lock (and the door past it) can be paid too.
//   2. No Tray: the same two locks, but no refund. Six words are needed: three before the first
//      lock and three more on a ledge past it. The second lock is the level's exit.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addWordBlocks } from './wordBlocks';

export type SignName = 'words' | 'takes' | 'tray' | 'again' | 'noTray' | 'gone' | 'last';

/** The block set both levels share: the Starter blocks, the word, lock and refund, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addWordBlocks(book, pal);
  const signs = {
    words: addSign(book, pal, 'words', 'WORDS ADD UP. GET 3', 4, 2),
    takes: addSign(book, pal, 'takes', 'THIS LOCK TAKES 3 WORDS', 4, 2),
    tray: addSign(book, pal, 'tray', 'THE TRAY GIVES 3 BACK', 4, 2),
    again: addSign(book, pal, 'again', 'PAY THIS LOCK AGAIN', 4, 2),
    noTray: addSign(book, pal, 'noTray', 'NO TRAY HERE. GET 6', 4, 2),
    gone: addSign(book, pal, 'gone', 'NO TRAY. THEY ARE GONE', 4, 2),
    last: addSign(book, pal, 'last', 'THE EXIT LOCK TAKES 3 MORE', 4, 2),
  };
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** A wall of brick from the top down to a lock: the lock and its arch are set after. */
function wall(g: Grid, x: number, ground: number): void {
  g.col(x, 0, ground - 3, 'B');
}

/** Level 1: pay to pass. 48 blocks wide; the ground is row 10. */
function payToPass(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(48, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 47, 'G').fill(0, GROUND + 1, 48, 4, 'D');
  g.col(0, 0, 9, 'X').col(47, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(44, 8, 'e').put(44, 9, 'E');
  wall(g, 19, GROUND);
  wall(g, 35, GROUND);
  g.row(9, 22, 24, 'c').row(9, 29, 30, 'c').row(9, 38, 41, 'c');
  for (const [x, y] of [
    [6, 2],
    [14, 0],
    [26, 1],
    [40, 2],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [9, 17, 33]) g.put(x, GROUND - 1, 'b');
  for (const x of [7, 15, 43]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  for (const x of [9, 11, 13]) m.set(x, GROUND - 1, 'word');
  m.set(19, GROUND - 2, 'lockTop').set(19, GROUND - 1, 'lock');
  m.set(21, GROUND - 1, 'refund');
  m.set(35, GROUND - 2, 'lockTop').set(35, GROUND - 1, 'lock');
  m.sign(5, onGround(GROUND, signs.words), signs.words);
  m.sign(15, onGround(GROUND, signs.takes), signs.takes);
  m.sign(25, onGround(GROUND, signs.tray), signs.tray);
  m.sign(31, onGround(GROUND, signs.again), signs.again);
  return m;
}

/** Level 2: no tray. 50 blocks wide; the ground is row 10. */
function noTray(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(50, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 49, 'G').fill(0, GROUND + 1, 50, 4, 'D');
  g.col(0, 0, 9, 'X').col(49, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  wall(g, 18, GROUND);
  wall(g, 44, GROUND);
  // a ledge past the first lock, with a ladder up to it
  g.row(3, 28, 38, 'G').fill(28, 4, 11, 1, 'D');
  g.col(27, 2, 9, 'H');
  g.row(9, 21, 22, 'c').row(9, 24, 25, 'c').row(9, 40, 40, 'c').row(9, 42, 43, 'c');
  for (const [x, y] of [
    [6, 2],
    [13, 0],
    [30, 0],
    [41, 2],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [9, 16, 46]) g.put(x, GROUND - 1, 'b');
  for (const x of [7, 14, 47]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  for (const x of [9, 11, 13]) m.set(x, GROUND - 1, 'word');
  for (const x of [31, 33, 35]) m.set(x, 2, 'word');
  m.set(18, GROUND - 2, 'lockTop').set(18, GROUND - 1, 'lock');
  // the second lock is the door out: its block is the level's only link
  m.set(44, GROUND - 2, 'lockTop').set(44, GROUND - 1, 'lock');
  m.exits.push({ from: [44 + ORIGIN, GROUND - 1 + ORIGIN] });
  m.sign(5, onGround(GROUND, signs.noTray), signs.noTray);
  m.sign(20, onGround(GROUND, signs.gone), signs.gone);
  m.sign(38, onGround(GROUND, signs.last), signs.last);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Pay to Pass', hint: 'A lock takes words. A tray gives them back.', map: payToPass(book, signs) },
    { file: 'two', title: 'No Tray', hint: 'Without a tray, what a lock takes is gone.', map: noTray(book, signs) },
  ];
  return { book, pal, levels };
}
