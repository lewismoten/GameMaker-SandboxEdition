// THE GIANT's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. The Giant: a brick wall with a two-block tunnel through it. Rocky, a big stone fellow, is four
//      monsters (two on top of two) filling the tunnel, with the exit door behind him. A star flies
//      level with Rima's hand, so from the ground it only meets the bottom two; a one-block step
//      lets Rima reach the head. Each part pops on one hit, and the way opens when all four are gone.
//   2. Ouch, Wait: the same kind of wall, with Beep, a tin robot, also four monsters but each takes
//      two hits. After the first a part blinks red for about two seconds, and a star goes straight
//      through it; then it is cracked and the second hit pops it.
// Both rooms are closed in by brick walls you can see, so Rima is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { FRESH, ROCKY } from './monsters';

export type SignName = 'four' | 'head' | 'ouch' | 'wait' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    four: addSign(book, pal, 'four.sign', 'THE GIANT IS 4 MONSTERS', 4, 3),
    head: addSign(book, pal, 'head.sign', 'STAND ON THE STEP FOR ITS HEAD', 4, 3),
    ouch: addSign(book, pal, 'ouch.sign', 'A HIT PART BLINKS RED', 4, 3),
    wait: addSign(book, pal, 'wait.sign', 'WAIT FOR IT TO STOP', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
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

export const GROUND = 10;
/** The rows of the tunnel: the top part of a giant stands in the first, the bottom part in the second. */
export const TOP = GROUND - 2;
export const BOTTOM = GROUND - 1;

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/**
 * Where each level's wall (first and last block), step (first and last block) and giant (the left
 * column's x; the right column is one more) are. The giant stands at the tunnel's mouth with a
 * block between it and the front, so there is room to walk up to it.
 */
export const WALL = [
  [22, 27],
  [23, 28],
] as const;
export const STEP = [
  [17, 19],
  [18, 20],
] as const;
export const GIANT_X = [24, 24] as const;
/** The step's top is a block above the ground, so Rima stands with his feet on row STEP_FEET. */
export const STEP_FEET = BOTTOM - 1;

/** Paints a wall with a two-block tunnel (rows 8 and 9) across `wall`, and the one-block step in front of it. */
function wallAndStep(g: Grid, wall: readonly [number, number], step: readonly [number, number]): void {
  g.fill(wall[0], 0, wall[1] - wall[0] + 1, TOP, 'B');
  g.row(BOTTOM, step[0], step[1], 'G');
}

/** Stands a giant of four monsters in its tunnel: `first` is the monster number of the top left part; `next` how far apart the numbers are. */
function giant(m: StarterMap, x: number, first: number): void {
  // top left, top right, bottom left, bottom right: the order of the monster numbers
  m.mon(first, x, TOP)
    .mon(first + 1, x + 1, TOP)
    .mon(first + 2, x, BOTTOM)
    .mon(first + 3, x + 1, BOTTOM);
}

/** Level 1: Rocky, four parts, one hit each. 46 blocks wide; the ground is row 10. */
function theGiant(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  wallAndStep(g, WALL[0], STEP[0]);
  g.row(9, 15, 16, 'c').put(18, STEP_FEET, 'c').row(9, 31, 31, 'c').row(9, 33, 33, 'c').row(9, 35, 35, 'c');
  scenery(
    g,
    [
      [6, 2],
      [14, 1],
      [33, 2],
      [39, 4],
    ],
    [9, 21, 37],
    [11, 30, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.four), signs.four);
  m.sign(11, onGround(GROUND, signs.head), signs.head);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  giant(m, GIANT_X[0], ROCKY);
  return m;
}

/** Level 2: Beep, four parts, two hits each, with the blink between. 46 blocks wide. */
function ouchWait(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 43);
  wallAndStep(g, WALL[1], STEP[1]);
  g.row(9, 16, 17, 'c').put(19, STEP_FEET, 'c').row(9, 32, 32, 'c').row(9, 34, 34, 'c').put(38, 9, 'c').put(40, 9, 'c');
  scenery(
    g,
    [
      [6, 2],
      [16, 1],
      [32, 3],
      [40, 1],
    ],
    [10, 36],
    [8, 31, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.ouch), signs.ouch);
  m.sign(12, onGround(GROUND, signs.wait), signs.wait);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  giant(m, GIANT_X[1], FRESH);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'giant');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'The Giant', hint: 'Four parts, one door.', map: theGiant(book, signs) },
    { file: 'two', title: 'Ouch, Wait', hint: 'Let it stop blinking.', map: ouchWait(book, signs) },
  ];
  return { book, pal, levels };
}
