// KEYS AND DOORS' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. One Key, One Door: a key adds to a counter; the door opens while the counter is high enough.
//   2. Two Keys, Two Doors: a gold key for the gold door, a silver key for the silver door. The
//      silver key sits up on a ledge you can see from the start, reached by a ladder behind the
//      gold door: a short walk back the way you came.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks } from '../../kit/starter/locks';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

/** The block set both levels share: the Starter blocks, the lock blocks, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  const signs = {
    counter: addSign(book, pal, 'counter', 'A KEY ADDS TO A COUNTER', 4, 2),
    needs: addSign(book, pal, 'needs', 'THE DOOR NEEDS 1 KEY', 3, 2),
    two: addSign(book, pal, 'two', 'TWO DOORS, TWO KEYS', 4, 2),
    gold: addSign(book, pal, 'gold', 'GOLD KEY, GOLD DOOR', 4, 2),
    climb: addSign(book, pal, 'climb', 'CLIMB TO THE SILVER KEY', 4, 2),
    silver: addSign(book, pal, 'silver', 'SILVER KEY, SILVER DOOR', 4, 2),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
  };
  return { book, signs };
}

export type SignName = 'counter' | 'needs' | 'two' | 'gold' | 'climb' | 'silver' | 'exit';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** A wall of brick from row `from` down to a door: an arch (`top`) and the locked door (`gate`) on the last two rows. */
function wall(g: Grid, x: number, ground: number, top: string, gate: string, from = 0): void {
  g.col(x, from, ground - 3, 'B')
    .put(x, ground - 2, top)
    .put(x, ground - 1, gate);
}

/** Level 1: one key, one door. 46 blocks wide; the ground is row 10. */
function oneKey(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(46, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 45, 'G').fill(0, GROUND + 1, 46, 4, 'D');
  g.col(0, 0, 9, 'X').col(45, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(42, 8, 'e').put(42, 9, 'E');
  // the key, and the locked door in a wall
  g.put(14, 9, 'k');
  wall(g, 30, GROUND, 'l', 'L');
  // coins to walk through
  g.row(9, 20, 22, 'c').row(9, 33, 37, 'c');
  for (const [x, y] of [
    [6, 2],
    [18, 1],
    [26, 3],
    [37, 1],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [11, 28, 40]) g.put(x, GROUND - 1, 'b');
  for (const x of [17, 25, 32]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.counter), signs.counter);
  m.sign(23, onGround(GROUND, signs.needs), signs.needs);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: two keys, two doors. 48 blocks wide; the ground is row 10. */
function twoKeys(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(48, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 47, 'G').fill(0, GROUND + 1, 48, 4, 'D');
  g.col(0, 0, 9, 'X').col(47, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(44, 8, 'e').put(44, 9, 'E');
  // the gold key on the ground, then the gold door in a wall; a ledge over the start and the wall
  g.put(9, 9, 'k');
  wall(g, 14, GROUND, 'l', 'L', 4);
  g.row(3, 6, 16, 'G').fill(6, 4, 8, 1, 'D').fill(15, 4, 2, 1, 'D');
  // the silver key waits on the ledge, in plain sight; a ladder behind the gold door climbs to it
  g.put(8, 2, 'K');
  g.col(17, 2, 9, 'H');
  // the silver door
  wall(g, 34, GROUND, 'm', 'M');
  // coins along the ground and along the ledge
  g.row(9, 22, 25, 'c').row(9, 35, 38, 'c').row(2, 11, 13, 'c');
  for (const [x, y] of [
    [5, 0],
    [21, 1],
    [27, 3],
    [40, 1],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [11, 30, 43]) g.put(x, GROUND - 1, 'b');
  for (const x of [7, 20, 42]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.two), signs.two);
  m.sign(10, onGround(GROUND, signs.gold), signs.gold);
  m.sign(18, onGround(GROUND, signs.climb), signs.climb);
  m.sign(28, onGround(GROUND, signs.silver), signs.silver);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'One Key, One Door', hint: 'A key adds to a counter.', map: oneKey(book, signs) },
    { file: 'two', title: 'Two Keys, Two Doors', hint: 'Each door wants its own key.', map: twoKeys(book, signs) },
  ];
  return { book, pal, levels };
}
