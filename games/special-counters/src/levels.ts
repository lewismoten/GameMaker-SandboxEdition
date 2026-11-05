// NOT THAT KEY's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. Take Both Keys: two gold keys on the ground and one gold door. One key is spent; the spare stays with you.
//   2. The Spare Fits: no key before the door, and the spare from level 1 opens it. A new gold key waits behind it.
//   3. Not That Key: a green door met first (counter 22). The gold key you carry does not fit it. The green key
//      is on a ledge; later a gold door (counter 20) takes the gold key you carried all along.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addGoldBlocks, addGreenBlocks } from './lockBlocks';

/**
 * The block set: the Starter blocks, the gold door, levels 1 and 2's signs; then (after `shared` blocks)
 * the green set and level 3's signs. Levels 1 and 2 load the first `shared` blocks; level 3 loads its own
 * copy of the set with the rest added, and every shared block keeps its number.
 */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign>; shared: number } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addGoldBlocks(book, pal);
  const signs = {
    both: addSign(book, pal, 'both', 'TAKE BOTH KEYS', 4, 2),
    one: addSign(book, pal, 'one', 'ONE KEY OPENS THIS DOOR', 4, 2),
    spare: addSign(book, pal, 'spare', 'THE SPARE KEY GOES WITH YOU', 4, 3),
    none: addSign(book, pal, 'none', 'NO KEY IN THIS LEVEL. TRY THE SPARE', 4, 3),
    again: addSign(book, pal, 'again', 'TAKE THIS ONE TOO', 4, 2),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
  };
  const shared = book.index.size;
  addGreenBlocks(book, pal);
  Object.assign(signs, {
    notThat: addSign(book, pal, 'notThat', 'A GOLD KEY IS NOT A GREEN KEY', 4, 2),
    number: addSign(book, pal, 'number', 'COUNTER 20 IS GOLD. COUNTER 22 IS GREEN.', 4, 3),
    saved: addSign(book, pal, 'saved', 'THE GOLD KEY WAITED FOR THIS DOOR', 4, 3),
  });
  return { book, signs: signs as Record<SignName, Sign>, shared };
}

export type SignName = 'both' | 'one' | 'spare' | 'none' | 'again' | 'notThat' | 'number' | 'saved' | 'exit';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** True when the level loads its own copy of the block set (the shared one plus the green set). */
  ownSet?: boolean;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** A brick wall from row `from` down to a door: a gap for the arch and the door on the last two rows (put by the caller). */
function wall(g: Grid, x: number, ground: number, top: string, gate: string, from = 0): void {
  g.col(x, from, ground - 3, 'B')
    .put(x, ground - 2, top)
    .put(x, ground - 1, gate);
}

/** The ground, the hedges at both ends, the entrance at x 3 and the exit at x `exitX`. */
function frame(width: number, exitX: number): { g: Grid; GROUND: number } {
  const g = new Grid(width, 15);
  const GROUND = 10;
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return { g, GROUND };
}

const clouds = (g: Grid, at: readonly (readonly [number, number])[]) => at.forEach(([x, y]) => g.put(x, y, '(').put(x + 1, y, ')'));

/** Level 1: take both keys. 46 blocks wide; the ground is row 10. Two keys, then the gold door in a wall; one key is spent. */
function takeBoth(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const { g, GROUND } = frame(46, 42);
  g.put(10, 9, 'k').put(12, 9, 'k');
  wall(g, 24, GROUND, 'l', 'L');
  g.row(9, 14, 16, 'c').row(9, 27, 31, 'c');
  clouds(g, [
    [6, 2],
    [14, 0],
    [30, 1],
    [38, 2],
  ]);
  for (const x of [18, 26, 44]) g.put(x, GROUND - 1, 'b');
  for (const x of [7, 21, 43]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.both), signs.both);
  m.sign(19, onGround(GROUND, signs.one), signs.one);
  m.sign(33, onGround(GROUND, signs.spare), signs.spare);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: the spare fits. 46 blocks wide. A gold door with no key before it; the spare opens it, and a new key waits behind. */
function spareFits(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const { g, GROUND } = frame(46, 42);
  wall(g, 16, GROUND, 'l', 'L');
  g.row(9, 11, 13, 'c').row(9, 22, 25, 'c').row(9, 33, 35, 'c');
  g.put(20, 9, 'k');
  clouds(g, [
    [8, 1],
    [24, 2],
    [34, 0],
  ]);
  for (const x of [4, 15, 37]) g.put(x, GROUND - 1, 'b');
  for (const x of [10, 26, 44]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.none), signs.none);
  m.sign(27, onGround(GROUND, signs.again), signs.again);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 3: not that key. 46 blocks wide. A green door (counter 22) met first; the green key on a ledge over it; later a gold door. */
function notThat(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const { g, GROUND } = frame(46, 42);
  // the green door in a wall (the arch and door are put below); the key on a ledge in sight, a ladder on the near side
  g.col(24, 0, GROUND - 3, 'B');
  g.row(3, 16, 23, 'G').fill(16, 4, 8, 1, 'D');
  g.col(15, 2, 9, 'H');
  // the gold door, further on
  wall(g, 34, GROUND, 'l', 'L');
  g.row(2, 18, 20, 'c').row(9, 26, 27, 'c').row(9, 36, 38, 'c');
  clouds(g, [
    [6, 2],
    [12, 0],
    [30, 1],
    [38, 3],
  ]);
  for (const x of [9, 33, 44]) g.put(x, GROUND - 1, 'b');
  for (const x of [11, 25, 43]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.set(24, GROUND - 2, 'gateTopGreen')
    .set(24, GROUND - 1, 'gateGreen')
    .set(22, 2, 'keyGreen');
  m.sign(5, onGround(GROUND, signs.notThat), signs.notThat);
  m.sign(18, onGround(GROUND, signs.number), signs.number);
  m.sign(28, onGround(GROUND, signs.saved), signs.saved);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[]; shared: number } {
  const pal = buildStarterPalette();
  const { book, signs, shared } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Take Both Keys', hint: 'Keys you do not use stay with you.', map: takeBoth(book, signs) },
    { file: 'two', title: 'The Spare Fits', hint: 'A key from before opens this door.', map: spareFits(book, signs) },
    { file: 'three', title: 'Not That Key', hint: 'Each door knows its own counter.', map: notThat(book, signs), ownSet: true },
  ];
  return { book, pal, levels, shared };
}
