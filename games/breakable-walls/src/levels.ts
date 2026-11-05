// SMASH IT's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, crates and gems.
//
//   1. Bump a Crate: two walls of crates across the path. Walk into one and the crates you touch
//      turn to rubble; the ones above Kit's head stay, so only what you touch breaks.
//   2. Coins Pay Once: a coin whose "becomes" is itself pays every tick Kit stands in it and never goes
//      (the mistake), then ordinary coins that become air and pay once, then a crate wall to the exit.
//   3. Spinning Gems: gems that turn in four frames. Every frame has the same touch, so a gem goes
//      whichever frame it is caught in. A crate wall hides a stack of them.
// Every room is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addBreakBlocks } from './breakBlocks';

export type SignName = 'bump' | 'rubble' | 'only' | 'again' | 'once' | 'wall' | 'spin' | 'frames' | 'hidden' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the smash blocks. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    bump: addSign(book, pal, 'bump.sign', 'BUMP A CRATE AND IT BECOMES RUBBLE', 4, 3),
    rubble: addSign(book, pal, 'rubble.sign', 'RUBBLE IS A BLOCK TOO. WALK ON', 4, 3),
    only: addSign(book, pal, 'only.sign', 'ONLY WHAT YOU TOUCH BREAKS', 4, 3),
    again: addSign(book, pal, 'again.sign', 'A COIN THAT STAYS A COIN PAYS AGAIN AND AGAIN', 4, 3),
    once: addSign(book, pal, 'once.sign', 'A COIN THAT BECOMES AIR PAYS ONCE', 4, 3),
    wall: addSign(book, pal, 'wall.sign', 'BREAK THE WALL TO THE EXIT', 4, 3),
    spin: addSign(book, pal, 'spin.sign', 'A SPINNING GEM IS FOUR BLOCKS IN A LOOP', 4, 3),
    frames: addSign(book, pal, 'frames.sign', 'EACH FRAME BECOMES AIR', 4, 2),
    hidden: addSign(book, pal, 'hidden.sign', 'MORE GEMS BEHIND THE CRATES', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addBreakBlocks(book, pal);
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

export const GROUND = 10;
/** Where each level's crate walls, stuck coins and gems are (columns), for the bot's route and the shots. */
export const L1 = { wallA: 16, wallB: 27, wallBWidth: 2, rows: 4 } as const;
export const L2 = { stuck: [15, 16, 17], wall: 38 } as const;
export const L3 = { gems: [13, 15, 17, 19, 21], wall: 32, stack: [35, 36] } as const;

/** The ground, the side walls, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Stamps a block of crates, `w` wide and `h` high, standing on the ground at column `x`. */
function crates(m: StarterMap, x: number, w: number, h: number): void {
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) m.set(x + i, GROUND - 1 - j, 'crate');
}

/** Level 1: a wall of four crates high, then a two-wide one. 48 blocks wide. */
function bumpACrate(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(48, 44);
  g.row(9, 30, 31, 'c').row(9, 33, 38, 'c');
  scenery(
    g,
    [
      [7, 2],
      [20, 1],
      [31, 3],
      [40, 1],
    ],
    [10, 24, 29, 46],
    [8, 14, 39],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.bump), signs.bump);
  m.sign(18, onGround(GROUND, signs.rubble), signs.rubble);
  m.sign(22, onGround(GROUND, signs.only), signs.only);
  m.sign(40, onGround(GROUND, signs.exit), signs.exit);
  crates(m, L1.wallA, 1, L1.rows);
  crates(m, L1.wallB, L1.wallBWidth, L1.rows);
  return m;
}

/** Level 2: three stuck coins, a sign, ordinary coins, then a crate wall. 52 blocks wide. */
function coinsPayOnce(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  g.row(9, 26, 32, 'c').row(9, 42, 43, 'c');
  scenery(
    g,
    [
      [7, 2],
      [24, 1],
      [36, 3],
      [44, 1],
    ],
    [11, 24, 33, 40],
    [9, 13, 36],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.again), signs.again);
  m.sign(19, onGround(GROUND, signs.once), signs.once);
  m.sign(34, onGround(GROUND, signs.wall), signs.wall);
  m.sign(44, onGround(GROUND, signs.exit), signs.exit);
  for (const x of L2.stuck) m.set(x, GROUND - 1, 'stuckCoin');
  crates(m, L2.wall, 1, 4);
  return m;
}

/** Level 3: five gems on the path, a crate wall, then a stack of gems behind it. 52 blocks wide. */
function spinningGems(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  scenery(
    g,
    [
      [7, 2],
      [22, 1],
      [38, 3],
      [44, 1],
    ],
    [11, 28, 40, 46],
    [9, 25, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.spin), signs.spin);
  m.sign(23, onGround(GROUND, signs.frames), signs.frames);
  m.sign(27, onGround(GROUND, signs.hidden), signs.hidden);
  m.sign(44, onGround(GROUND, signs.exit), signs.exit);
  for (const x of L3.gems) m.set(x, GROUND - 1, 'gem0');
  crates(m, L3.wall, 1, 4);
  for (const x of L3.stack) m.set(x, GROUND - 1, 'gem2').set(x, GROUND - 2, 'gem1');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Bump a Crate', hint: 'A bump is a touch.', map: bumpACrate(book, signs) },
    { file: 'two', title: 'Coins Pay Once', hint: 'A coin must become air.', map: coinsPayOnce(book, signs) },
    { file: 'three', title: 'Spinning Gems', hint: 'Every frame says the same.', map: spinningGems(book, signs) },
  ];
  return { book, pal, levels };
}
