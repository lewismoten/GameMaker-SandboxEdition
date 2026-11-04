// KEYS AND DOORS' three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. One Key, One Door: you reach the padlocked door first and it stays shut (LOCKED. FIND A KEY.).
//      The key is on a ledge over the door, up a ladder just before it.
//   2. Two Keys, One Door: one key on the ground, one on a ledge, and a gold door that costs two.
//   3. Two Keys, Two Doors: a gold key for the gold door, a silver key for the silver door. The
//      silver key sits up on a ledge you can see from the start, reached by a ladder behind the
//      gold door: a short walk back the way you came.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks, gatePicture } from '../../kit/starter/locks';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { KEYS } from '../../kit/starter/blocks';
import { SOLID } from '../../kit/starter/book';
import { addSign, type Sign } from '../../kit/starter/sign';

/** A gold gate that costs two keys (Effect amount -2), with a second key hole so it looks the part. */
function addGateTwo(book: Book, pal: Pal): void {
  const p: Pixels = gatePicture(pal, 'wood', 'gold');
  const ink = pal.c('ink', 0);
  const g = pal.r('gold');
  p.rect(6, 8, 8, 7, g[3])
    .rect(6, 8, 8, 1, g[g.length - 1])
    .rect(6, 14, 8, 1, g[1]);
  p.disc(8.5, 10.5, 1.2, ink).rect(8, 11, 1, 3, ink);
  p.disc(11.5, 10.5, 1.2, ink).rect(11, 11, 1, 3, ink);
  book.add('gateTwo', p, { solid: SOLID, effect: KEYS, eamt: -2, touch: 'sky' });
}

/** The block set both levels share: the Starter blocks, the lock blocks, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  addGateTwo(book, pal);
  const signs = {
    locked: addSign(book, pal, 'locked', 'LOCKED. FIND A KEY.', 4, 2),
    findBoth: addSign(book, pal, 'findBoth', 'FIND BOTH KEYS', 4, 2),
    needsTwo: addSign(book, pal, 'needsTwo', 'THIS DOOR NEEDS 2 KEYS', 4, 2),
    two: addSign(book, pal, 'two', 'TWO DOORS, TWO KEYS', 4, 2),
    gold: addSign(book, pal, 'gold', 'GOLD KEY, GOLD DOOR', 4, 2),
    climb: addSign(book, pal, 'climb', 'CLIMB TO THE SILVER KEY', 4, 2),
    silver: addSign(book, pal, 'silver', 'SILVER KEY, SILVER DOOR', 4, 2),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
  };
  return { book, signs };
}

export type SignName = 'locked' | 'findBoth' | 'needsTwo' | 'two' | 'gold' | 'climb' | 'silver' | 'exit';

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

/** Level 1: one key, one door. 46 blocks wide; the ground is row 10. The door is met first, shut; the key waits up on a ledge in sight of it. */
function oneKey(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(46, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 45, 'G').fill(0, GROUND + 1, 46, 4, 'D');
  g.col(0, 0, 9, 'X').col(45, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(42, 8, 'e').put(42, 9, 'E');
  // the locked door in a wall; the key on a ledge in plain sight of it, a ladder on the near side
  wall(g, 28, GROUND, 'l', 'L');
  g.row(3, 20, 27, 'G').fill(20, 4, 8, 1, 'D');
  g.put(26, 2, 'k');
  g.col(19, 2, 9, 'H');
  // coins along the ledge and past the door
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
  m.sign(20, onGround(GROUND, signs.locked), signs.locked);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: two of the same key. 46 blocks wide; the ground is row 10. One key on the ground, the second on a ledge, and a gold door that costs two. */
function twoOfAKind(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(46, 15);
  const GROUND = 10;
  g.row(GROUND, 0, 45, 'G').fill(0, GROUND + 1, 46, 4, 'D');
  g.col(0, 0, 9, 'X').col(45, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(42, 8, 'e').put(42, 9, 'E');
  // the first key on the ground; the second on a ledge with a ladder; the gold door in a wall
  g.put(11, 9, 'k');
  g.row(3, 14, 22, 'G').fill(14, 4, 9, 1, 'D');
  g.put(16, 2, 'k');
  g.col(23, 2, 9, 'H');
  wall(g, 29, GROUND, 'l', 'L');
  g.row(2, 18, 20, 'c').row(9, 32, 36, 'c');
  for (const [x, y] of [
    [6, 2],
    [12, 0],
    [33, 1],
    [38, 2],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [8, 27, 44]) g.put(x, GROUND - 1, 'b');
  for (const x of [13, 20, 40]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  // the wall's gold door costs two keys
  m.set(29, GROUND - 1, 'gateTwo');
  m.sign(5, onGround(GROUND, signs.findBoth), signs.findBoth);
  m.sign(24, onGround(GROUND, signs.needsTwo), signs.needsTwo);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 3: two keys, two doors. 48 blocks wide; the ground is row 10. */
function twoDoors(book: Book, signs: Record<SignName, Sign>): StarterMap {
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
    { file: 'one', title: 'One Key, One Door', hint: 'Some doors are shut at first.', map: oneKey(book, signs) },
    { file: 'two', title: 'Two Keys, One Door', hint: 'A door can want more than one key.', map: twoOfAKind(book, signs) },
    { file: 'three', title: 'Two Keys, Two Doors', hint: 'Each door wants its own key.', map: twoDoors(book, signs) },
  ];
  return { book, pal, levels };
}
