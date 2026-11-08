// SHOW THE COUNT's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. Light the Meter: five dark bulbs in a row along a ledge up a ladder. Each one Lena walks
//      through lights up for good and adds one to her count, so the row of lit bulbs is the count
//      shown as pictures (the game cannot print a number). A gate on the ground takes five.
//   2. The Full Meter: six bulbs, three on the ground and three on a ledge, and the level's only
//      way out is a six-slot gate. No other door: the link is on the gate's own block.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addMeterBlocks } from './meterBlocks';

export type SignName = 'shows' | 'walk' | 'takes5' | 'exit' | 'full' | 'isExit';

/** The block set both levels share: the Starter blocks, the bulbs and gates, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addMeterBlocks(book, pal);
  const signs = {
    shows: addSign(book, pal, 'shows', 'LIT BULBS SHOW YOUR COUNT', 4, 2),
    walk: addSign(book, pal, 'walk', 'CLIMB. WALK THE BULBS', 4, 2),
    takes5: addSign(book, pal, 'takes5', 'THIS GATE TAKES FIVE', 4, 2),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
    full: addSign(book, pal, 'full', 'SIX BULBS. FILL THE METER', 4, 2),
    isExit: addSign(book, pal, 'isExit', 'FULL METER OPENS EXIT', 4, 2),
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

/** Level 1: five bulbs on a ledge, a gate that takes five. 46 blocks wide; the ground is row 10. */
function lightTheMeter(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(46, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 45, 'G').fill(0, GROUND + 1, 46, 4, 'D');
  g.col(0, 0, 9, 'X').col(45, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(42, 8, 'e').put(42, 9, 'E');
  wall(g, 31, GROUND);
  // a ledge with a ladder up to it: the meter is a row of bulbs along it
  g.row(3, 18, 29, 'G').fill(18, 4, 12, 1, 'D');
  g.col(17, 2, 9, 'H');
  g.row(9, 33, 36, 'c');
  for (const [x, y] of [
    [6, 2],
    [12, 0],
    [34, 1],
    [38, 3],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [9, 24, 44]) g.put(x, GROUND - 1, 'b');
  for (const x of [15, 22, 43]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  for (const x of [20, 22, 24, 26, 28]) m.set(x, 2, 'bulbOff');
  m.set(31, GROUND - 2, 'meterTop').set(31, GROUND - 1, 'gateFive');
  m.sign(5, onGround(GROUND, signs.shows), signs.shows);
  m.sign(12, onGround(GROUND, signs.walk), signs.walk);
  m.sign(26, onGround(GROUND, signs.takes5), signs.takes5);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: six bulbs and a six-slot gate that is the exit. 48 blocks wide; the ground is row 10. */
function fullMeter(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(48, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 47, 'G').fill(0, GROUND + 1, 48, 4, 'D');
  g.col(0, 0, 9, 'X').col(47, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  wall(g, 41, GROUND);
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
  for (const x of [8, 25, 44]) g.put(x, GROUND - 1, 'b');
  for (const x of [15, 30, 45]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  // six bulbs: three on the ground, three along the ledge
  for (const [x, y] of [
    [9, GROUND - 1],
    [11, GROUND - 1],
    [13, GROUND - 1],
    [16, 2],
    [18, 2],
    [20, 2],
  ] as const)
    m.set(x, y, 'bulbOff');
  // the gate is the door out: its block is the level's only link
  m.set(41, GROUND - 2, 'meterTop').set(41, GROUND - 1, 'gateSix');
  m.exits.push({ from: [41 + ORIGIN, GROUND - 1 + ORIGIN] });
  m.sign(5, onGround(GROUND, signs.full), signs.full);
  m.sign(35, onGround(GROUND, signs.isExit), signs.isExit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'show-the-count');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Light the Meter', hint: 'Lit bulbs show the count.', map: lightTheMeter(book, signs) },
    { file: 'two', title: 'The Full Meter', hint: 'A full meter opens the exit.', map: fullMeter(book, signs) },
  ];
  return { book, pal, levels };
}
