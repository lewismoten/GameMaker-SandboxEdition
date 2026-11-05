// HERE TODAY's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. A Bubble: a clear bubble sits in a low tunnel through a brick wall and blocks it. It has a
//      lifetime, so it pops on its own after a while and leaves a sparkle. Mia waits, then walks through.
//   2. Wake Up: a sleepy blue gumdrop blocks the tunnel. When its lifetime is up it does not
//      vanish, it becomes an awake orange one that is not solid and strolls about. Mia waits, then
//      walks through (and past) it.
// Both rooms are closed in by brick walls you can see, so Mia is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BUBBLE, SLEEPER } from './monsters';

export type SignName = 'life' | 'wait' | 'sleepy' | 'becomes' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    life: addSign(book, pal, 'life.sign', 'THIS BUBBLE POPS ON ITS OWN', 4, 4),
    wait: addSign(book, pal, 'wait.sign', 'WAIT FOR IT TO GO', 4, 3),
    sleepy: addSign(book, pal, 'sleepy.sign', 'A SLEEPY ONE BLOCKS THE TUNNEL', 4, 4),
    becomes: addSign(book, pal, 'becomes.sign', 'LATER IT BECOMES AN AWAKE ONE', 4, 4),
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
/** Where the monsters stand: the row above the ground. */
export const STAND = GROUND - 1;

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

/** Where the bubble stands in level 1 and the sleeper in level 2, and each tunnel (a brick wall from x 22 to 29 in level 1, 24 to 33 in level 2). */
export const BUBBLE_X = 23;
export const SLEEPER_X = 25;
export const TUNNEL_1 = [22, 29] as const;
export const TUNNEL_2 = [24, 33] as const;

/** A wall with a two-block-high tunnel through it. */
function wall(g: Grid, [from, to]: readonly [number, number]): void {
  g.fill(from, 0, to - from + 1, 8, 'B');
}

/** Level 1: a bubble in the tunnel pops on its own. 46 blocks wide; the ground is row 10. */
function aBubble(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  wall(g, TUNNEL_1);
  g.row(9, 11, 12, 'c').row(9, 32, 35, 'c');
  scenery(
    g,
    [
      [6, 2],
      [14, 1],
      [33, 2],
      [39, 4],
    ],
    [9, 20, 37],
    [13, 31, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.life), signs.life);
  m.sign(14, onGround(GROUND, signs.wait), signs.wait);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  m.mon(BUBBLE, BUBBLE_X, STAND);
  return m;
}

/** Level 2: a sleepy gumdrop in the tunnel wakes up. 46 blocks wide. */
function wakeUp(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  wall(g, TUNNEL_2);
  g.row(9, 10, 11, 'c').row(9, 35, 38, 'c');
  scenery(
    g,
    [
      [6, 2],
      [16, 1],
      [20, 3],
      [40, 1],
    ],
    [9, 22, 41],
    [18, 34, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.sleepy), signs.sleepy);
  m.sign(12, onGround(GROUND, signs.becomes), signs.becomes);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  m.mon(SLEEPER, SLEEPER_X, STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'short-lived');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'A Bubble', hint: 'Some things last only a while.', map: aBubble(book, signs) },
    { file: 'two', title: 'Wake Up', hint: 'A monster can become another.', map: wakeUp(book, signs) },
  ];
  return { book, pal, levels };
}
