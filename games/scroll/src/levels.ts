// SCROLL OR STAY's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and coins.
//
//   1. One Screen: a room 16 blocks wide and 10 high, exactly what the screen shows. The scene's
//      scrolling is off, so the picture never moves. The view starts with Kit in the middle of the
//      screen, which is why his entrance is in the middle of the room. Hedges close the room in.
//   2. The View Follows: a level 60 blocks wide, with scrolling on. The screen shows 16 blocks, and
//      the view slides along as Kit walks.
// Every room is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

export type SignName = 'one' | 'hedge' | 'follows' | 'wide' | 'switch' | 'exit';

/** The block set the levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    one: addSign(book, pal, 'one.sign', 'THIS ROOM IS ONE SCREEN, SO IT DOES NOT SCROLL', 4, 3),
    hedge: addSign(book, pal, 'hedge.sign', 'THE HEDGE KEEPS KIT ON THE SCREEN', 3, 3),
    follows: addSign(book, pal, 'follows.sign', 'THE VIEW FOLLOWS KIT WHEN HE WALKS', 4, 3),
    wide: addSign(book, pal, 'wide.sign', 'THIS LEVEL IS 60 BLOCKS WIDE. THE SCREEN SHOWS 16', 4, 3),
    switch: addSign(book, pal, 'switch.sign', 'SCROLLING IS A SWITCH ON EACH SCENE', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** Whether the scene's scrolling is on. */
  scroll: boolean;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The screen in blocks: the engine shows 16 across and 10 down, with the hero's start block in the middle. */
export const SCREEN = { w: 16, h: 10 } as const;
/** Level 1: the room is one screen; the ground row, the entrance column and the exit column. */
export const L1 = { ground: 6, start: 8, exit: 14, coins: [6, 7, 13] } as const;
/** Level 2: the ground row, the width, the exit column and the coins along the path. */
export const L2 = { ground: 10, width: 60, exit: 56, coins: [14, 16, 18, 31, 33, 35, 47, 49, 51] } as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: one screen, closed in by hedges on three sides and the ground below. */
function oneScreen(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(SCREEN.w, SCREEN.h);
  g.row(0, 0, SCREEN.w - 1, 'X')
    .col(0, 0, L1.ground - 1, 'X')
    .col(SCREEN.w - 1, 0, L1.ground - 1, 'X');
  g.row(L1.ground, 0, SCREEN.w - 1, 'G').fill(0, L1.ground + 1, SCREEN.w, 3, 'D');
  g.put(L1.start, L1.ground - 2, 's').put(L1.start, L1.ground - 1, 'S');
  g.put(L1.exit, L1.ground - 2, 'e').put(L1.exit, L1.ground - 1, 'E');
  for (const x of L1.coins) g.put(x, L1.ground - 1, 'c');
  scenery(g, L1.ground, [[6, 1]], [9], [1]);
  const m = new StarterMap(book, g.rows());
  m.sign(2, onGround(L1.ground, signs.one), signs.one);
  m.sign(10, onGround(L1.ground, signs.hedge), signs.hedge);
  return m;
}

/** Level 2: a long level, with the sky and the ground carrying on past both ends. */
function theViewFollows(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const g = new Grid(L2.width, 15);
  g.row(G, 0, L2.width - 1, 'G').fill(0, G + 1, L2.width, 4, 'D');
  g.col(0, 0, 9, 'X').col(L2.width - 1, 0, 9, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L2.exit, G - 2, 'e').put(L2.exit, G - 1, 'E');
  for (const x of L2.coins) g.put(x, G - 1, 'c');
  scenery(
    g,
    G,
    [
      [8, 2],
      [22, 1],
      [30, 3],
      [42, 1],
      [52, 2],
    ],
    [11, 21, 38, 44],
    [9, 27, 40, 54],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(G, signs.follows), signs.follows);
  m.sign(24, onGround(G, signs.wide), signs.wide);
  m.sign(40, onGround(G, signs.switch), signs.switch);
  m.sign(53, onGround(G, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'scroll');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'One Screen', hint: 'The picture stays still.', scroll: false, map: oneScreen(book, signs) },
    { file: 'two', title: 'The View Follows', hint: 'A long way to walk.', scroll: true, map: theViewFollows(book, signs) },
  ];
  return { book, pal, levels };
}
