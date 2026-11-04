// POWER UP's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its power-ups.
// Brick walls close both ends, so every limit of a room is something you can see.
//
//   1. The High Ledge: the door is on a ledge five blocks up. A jump falls short; the stars give high jumps.
//   2. The Wide Gap: a canyon too wide to jump. The sneakers (back the way you came) make a run and a jump reach.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addPowers } from './powers';

export type SignName = 'ledge' | 'stars' | 'gap' | 'sneakers';

/** The block set the levels share: the Starter blocks, this game's signs, then the power-ups. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    ledge: addSign(book, pal, 'ledge.sign', 'THE EXIT IS UP ON THAT LEDGE. TRY A JUMP.', 4, 3),
    stars: addSign(book, pal, 'stars.sign', 'A STAR GIVES 4 HIGH JUMPS. TAKE ONE.', 4, 3),
    gap: addSign(book, pal, 'gap.sign', 'TOO WIDE TO JUMP? LOOK BACK THE WAY YOU CAME.', 4, 3),
    sneakers: addSign(book, pal, 'sneakers.sign', 'SNEAKERS RUN AND JUMP FAR. 50 STRIDES.', 4, 3),
  };
  addPowers(book, pal);
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
/** Level 1: the ledge's plank row, and the columns it spans. */
export const LEDGE_ROW = GROUND - 5;
export const LEDGE_FROM = 14;
export const LEDGE_TO = 24;
/** Level 2: the canyon's columns (the ladder stands in its first). */
export const GAP_FROM = 31;
export const GAP_TO = 37;
export const CANYON_FLOOR = 14;

/** The ground, brick walls at both ends, the entrance at `enterX` and the exit door at `exitX` (on `exitRow`). */
function base(width: number, enterX: number, exitX: number, exitRow = GROUND - 1): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, GROUND - 1, 'B').col(width - 1, 0, GROUND - 1, 'B');
  g.put(enterX, 8, 's').put(enterX, 9, 'S');
  g.put(exitX, exitRow - 1, 'e').put(exitX, exitRow, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: a ledge of planks five blocks up with the door on it; the stars lie further along. 46 blocks wide. */
function highLedge(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 3, 21, LEDGE_ROW - 1);
  g.row(LEDGE_ROW, LEDGE_FROM, LEDGE_TO, '=');
  scenery(
    g,
    [
      [6, 1],
      [28, 2],
      [38, 1],
    ],
    [11, 27, 43],
    [9, 26, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.ledge), signs.ledge);
  m.sign(29, onGround(GROUND, signs.stars), signs.stars);
  m.set(35, GROUND - 1, 'star').set(37, GROUND - 1, 'star');
  return m;
}

/** Level 2: a canyon seven blocks wide with a ladder up its near wall; the sneakers wait at the far left. 52 blocks wide. */
function wideGap(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 18, 47);
  g.fill(GAP_FROM, GROUND, GAP_TO - GAP_FROM + 1, CANYON_FLOOR - GROUND, ' ');
  g.col(GAP_FROM, GROUND - 1, CANYON_FLOOR - 1, 'H');
  scenery(
    g,
    [
      [8, 1],
      [22, 2],
      [41, 1],
    ],
    [14, 44],
    [12, 24, 49],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(8, onGround(GROUND, signs.sneakers), signs.sneakers);
  m.sign(26, onGround(GROUND, signs.gap), signs.gap);
  m.set(3, GROUND - 1, 'sneakerL').set(4, GROUND - 1, 'sneakerR');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'The High Ledge', hint: 'Stars give high jumps.', map: highLedge(book, signs) },
    { file: 'two', title: 'The Wide Gap', hint: 'Sneakers run and jump far.', map: wideGap(book, signs) },
  ];
  return { book, pal, levels };
}
