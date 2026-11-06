// HERE TODAY's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. A Bubble: a clear bubble sits in a low tunnel through a brick wall and blocks it. It has a
//      lifetime, so it shrinks stage by stage, pops on its own and leaves a sparkle. Mia waits,
//      then walks through.
//   2. Wake Up: a sleepy blue gumdrop blocks the tunnel. When its lifetime is up it does not
//      vanish, it opens its eyes stage by stage and becomes an awake orange one that is not solid
//      and strolls about. Mia waits, then walks through (and past) it.
// Both rooms are short: the signs, Mia's entrance and the tunnel with its monster are all in the
// opening view (the view centers on Mia, about 8 blocks to her left and 7 to her right), so the
// whole countdown is watched from the start. Both rooms are closed in by brick walls you can see,
// so Mia is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BUBBLE, SLEEPER } from './monsters';

export type SignName = 'life' | 'shrink' | 'wakes' | 'eyes' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    life: addSign(book, pal, 'life.sign', 'THIS BUBBLE POPS ON ITS OWN', 4, 2),
    shrink: addSign(book, pal, 'shrink.sign', 'WATCH IT SHRINK', 3, 2),
    wakes: addSign(book, pal, 'wakes.sign', 'THIS ONE WAKES UP AS ANOTHER', 4, 2),
    eyes: addSign(book, pal, 'eyes.sign', 'WATCH ITS EYES', 3, 2),
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

/** Where Mia comes in, in both levels: one sign behind her, one ahead, then the tunnel. */
const ENTRANCE = 6;

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance (x ENTRANCE) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(ENTRANCE, 8, 's').put(ENTRANCE, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Where the bubble stands in level 1 and the sleeper in level 2, one block into each tunnel (a brick wall from x 10 to 15 in level 1, 10 to 17 in level 2). */
export const BUBBLE_X = 11;
export const SLEEPER_X = 11;
export const TUNNEL_1 = [10, 15] as const;
export const TUNNEL_2 = [10, 17] as const;

/** A wall with a two-block-high tunnel through it. */
function wall(g: Grid, [from, to]: readonly [number, number]): void {
  g.fill(from, 0, to - from + 1, 8, 'B');
}

/** Level 1: a bubble in the tunnel shrinks and pops on its own. 26 blocks wide; the ground is row 10. */
function aBubble(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(26, 24);
  wall(g, TUNNEL_1);
  // two coins in the tunnel behind the bubble, in sight from the start, and four past the wall
  g.row(9, 13, 14, 'c').row(9, 16, 19, 'c');
  scenery(
    g,
    [
      [2, 2],
      [7, 1],
      [17, 2],
      [21, 4],
    ],
    [5],
    [23],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(1, onGround(GROUND, signs.life), signs.life);
  m.sign(7, onGround(GROUND, signs.shrink), signs.shrink);
  m.sign(20, onGround(GROUND, signs.exit), signs.exit);
  m.mon(BUBBLE, BUBBLE_X, STAND);
  return m;
}

/** Level 2: a sleepy gumdrop in the tunnel wakes up. 28 blocks wide. */
function wakeUp(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(28, 26);
  wall(g, TUNNEL_2);
  // two coins in the tunnel past the awake one's stroll, and four past the wall
  g.row(9, 15, 16, 'c').row(9, 18, 21, 'c');
  scenery(
    g,
    [
      [2, 1],
      [8, 3],
      [19, 1],
      [23, 3],
    ],
    [5],
    [25],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(1, onGround(GROUND, signs.wakes), signs.wakes);
  m.sign(7, onGround(GROUND, signs.eyes), signs.eyes);
  m.sign(22, onGround(GROUND, signs.exit), signs.exit);
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
