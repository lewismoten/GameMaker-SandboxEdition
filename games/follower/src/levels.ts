// FOLLOW ME's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monster.
//
//   1. Puff Follows: a flat meadow with a small brick hill. Puff, a little winged pup, starts a few
//      blocks from Lena and flies straight at her whenever she moves. It is slower than Lena, so it
//      falls behind when she runs and catches up when she stops.
//   2. Out of Reach: Lena starts on a brick ledge, and Puff starts in the low room under it. Puff
//      flies straight at Lena, hits the underside of the ledge and stays there, below her, until
//      she steps off the end. It plans no way around.
// Both rooms are closed in by brick walls you can see, so Lena is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { PUFF } from './monsters';

export type SignName = 'follows' | 'behind' | 'under' | 'around' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    follows: addSign(book, pal, 'follows.sign', 'PUFF FLIES AFTER YOU', 4, 4),
    behind: addSign(book, pal, 'behind.sign', 'RUN AND PUFF FALLS BEHIND', 4, 4),
    under: addSign(book, pal, 'under.sign', 'PUFF IS STUCK UNDER THE LEDGE', 4, 4),
    around: addSign(book, pal, 'around.sign', 'IT FLIES STRAIGHT, NOT AROUND', 4, 4),
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
/** Where Puff stands: the row above the ground. */
export const STAND = GROUND - 1;
/** Level 2: the brick ledge's row, how far it reaches, and where Puff starts under it. */
export const LEDGE = 7;
export const LEDGE_END = 22;
export const PUFF_START_1 = 9;
export const PUFF_START_2 = 12;

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number, entrance = true): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  if (entrance) g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: Puff follows Lena over a small brick hill. 46 blocks wide; the ground is row 10. */
function puffFollows(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  // the hill: two steps and a top, with coins over it
  g.row(9, 22, 26, 'B').row(8, 23, 25, 'B');
  g.row(9, 19, 20, 'c').row(7, 23, 24, 'c').row(9, 31, 32, 'c');
  scenery(
    g,
    [
      [8, 2],
      [18, 1],
      [30, 3],
      [38, 1],
    ],
    [12, 28, 37],
    [10, 21, 35],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.follows), signs.follows);
  m.sign(14, onGround(GROUND, signs.behind), signs.behind);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  m.mon(PUFF, PUFF_START_1, STAND);
  return m;
}

/** Level 2: Lena starts on a ledge; Puff is in the room under it. 46 blocks wide. */
function outOfReach(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42, false);
  g.row(LEDGE, 1, LEDGE_END, 'B');
  g.put(3, LEDGE - 2, 's').put(3, LEDGE - 1, 'S');
  g.row(LEDGE - 1, 12, 12, 'c')
    .row(LEDGE - 1, 19, 19, 'c')
    .row(9, 26, 26, 'c')
    .row(9, 28, 28, 'c')
    .row(9, 30, 30, 'c')
    .row(9, 32, 32, 'c');
  scenery(
    g,
    [
      [10, 1],
      [24, 2],
      [34, 1],
      [40, 4],
    ],
    [27, 36],
    [29, 34],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(LEDGE, signs.under), signs.under);
  m.sign(14, onGround(LEDGE, signs.around), signs.around);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  m.mon(PUFF, PUFF_START_2, STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'follower');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Puff Follows', hint: 'A friend that flies after you.', map: puffFollows(book, signs) },
    { file: 'two', title: 'Out of Reach', hint: 'It flies straight, not around.', map: outOfReach(book, signs) },
  ];
  return { book, pal, levels };
}
