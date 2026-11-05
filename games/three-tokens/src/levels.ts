// THREE TOKENS' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. Three for the Gate: two tokens lie on the way, a third waits on a ledge up a ladder. The
//      gate in the wall takes three, so with two it stays shut. Take the third and it opens.
//   2. The Gate Is the Exit: five tokens, and the level's only door is a gate that takes five.
//      There is no other way out: the link is on the gate's own block.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addTokenBlocks } from './tokenBlocks';

export type SignName = 'count' | 'takes3' | 'exit' | 'all5' | 'isExit';

/** The block set both levels share: the Starter blocks, the token and gates, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addTokenBlocks(book, pal);
  const signs = {
    count: addSign(book, pal, 'count', 'TOKENS ADD UP. GET 3', 4, 2),
    takes3: addSign(book, pal, 'takes3', 'THIS GATE TAKES 3 TOKENS', 4, 2),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
    all5: addSign(book, pal, 'all5', 'FIVE TOKENS ARE HERE', 4, 2),
    isExit: addSign(book, pal, 'isExit', 'THE GATE IS THE EXIT', 4, 2),
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

/** A wall of brick from the top down to a gate: the gate and its arch are set after. */
function wall(g: Grid, x: number, ground: number): void {
  g.col(x, 0, ground - 3, 'B');
}

/** Level 1: three for the gate. 46 blocks wide; the ground is row 10. */
function threeForTheGate(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(46, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 45, 'G').fill(0, GROUND + 1, 46, 4, 'D');
  g.col(0, 0, 9, 'X').col(45, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(42, 8, 'e').put(42, 9, 'E');
  wall(g, 28, GROUND);
  // a ledge over the gate's near side, with a ladder up to it
  g.row(3, 20, 27, 'G').fill(20, 4, 8, 1, 'D');
  g.col(19, 2, 9, 'H');
  g.row(2, 22, 24, 'c').row(9, 31, 35, 'c');
  for (const [x, y] of [
    [6, 2],
    [12, 0],
    [33, 1],
    [38, 2],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [9, 26, 44]) g.put(x, GROUND - 1, 'b');
  for (const x of [6, 17, 43]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  // the tokens: two on the way, the third on the ledge in plain sight of the gate
  m.set(11, GROUND - 1, 'token')
    .set(15, GROUND - 1, 'token')
    .set(26, 2, 'token');
  m.set(28, GROUND - 2, 'tokenTop').set(28, GROUND - 1, 'gateThree');
  m.sign(5, onGround(GROUND, signs.count), signs.count);
  m.sign(22, onGround(GROUND, signs.takes3), signs.takes3);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: the gate is the exit. 48 blocks wide; the ground is row 10. */
function gateIsTheExit(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(48, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 47, 'G').fill(0, GROUND + 1, 48, 4, 'D');
  g.col(0, 0, 9, 'X').col(47, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  wall(g, 40, GROUND);
  g.row(3, 14, 22, 'G').fill(14, 4, 9, 1, 'D');
  g.col(23, 2, 9, 'H');
  g.row(9, 26, 28, 'c').row(9, 31, 33, 'c');
  for (const [x, y] of [
    [6, 2],
    [12, 0],
    [28, 1],
    [36, 3],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [8, 25, 43]) g.put(x, GROUND - 1, 'b');
  for (const x of [13, 30, 44]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  // five tokens: two on the ground, three along the ledge
  for (const [x, y] of [
    [10, GROUND - 1],
    [12, GROUND - 1],
    [16, 2],
    [18, 2],
    [20, 2],
  ] as const)
    m.set(x, y, 'token');
  // the gate is the door out: its block is the level's only link
  m.set(40, GROUND - 2, 'tokenTop').set(40, GROUND - 1, 'gateFive');
  m.exits.push({ from: [40 + ORIGIN, GROUND - 1 + ORIGIN] });
  m.sign(5, onGround(GROUND, signs.all5), signs.all5);
  m.sign(34, onGround(GROUND, signs.isExit), signs.isExit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Three for the Gate', hint: 'A gate can ask for three.', map: threeForTheGate(book, signs) },
    { file: 'two', title: 'The Gate Is the Exit', hint: 'Here the gate is the way out.', map: gateIsTheExit(book, signs) },
  ];
  return { book, pal, levels };
}
