// THREE PHASES' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. Half Way: a brick wall with a long low tunnel through it and Big Bug pacing in the tunnel with no
//      room to go around. It takes four hits. The first two it ambles; at half it turns into a hurried
//      orange bug that runs a longer way, quicker. Touching it only stings a little.
//   2. A Third Face: the same tunnel, five hits: calm, calm, hurried, hurried, and for the last hit a
//      tiny quick bug with a bow. When it falls the way opens.
// Both rooms are closed in by brick walls you can see, so Nova is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { CHAINS } from './monsters';

export type SignName = 'half' | 'sting' | 'third' | 'wait' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    half: addSign(book, pal, 'half.sign', 'HALF WAY IT SPEEDS UP', 4, 3),
    sting: addSign(book, pal, 'sting.sign', 'TOUCHING ONLY STINGS', 4, 3),
    third: addSign(book, pal, 'third.sign', 'THE LAST HIT IS A NEW FACE', 4, 3),
    wait: addSign(book, pal, 'wait.sign', 'THROW WHEN IT COMES CLOSE', 4, 3),
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

/** Where Big Bug starts in each level, and the tunnel it paces in (a brick wall from x 22 to 33). */
export const BUG_X = [26, 26] as const;
export const TUNNEL = [22, 33] as const;

/** Paints a wall with a two-block tunnel (rows 8 and 9) across the tunnel's columns. */
function wall(g: Grid): void {
  g.fill(TUNNEL[0], 0, TUNNEL[1] - TUNNEL[0] + 1, 8, 'B');
}

/** Level 1: Big Bug, calm and then hurried, fills a tunnel. 46 blocks wide; the ground is row 10. */
function halfWay(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  wall(g);
  g.row(9, 16, 19, 'c').row(9, 34, 37, 'c');
  scenery(
    g,
    [
      [6, 2],
      [14, 1],
      [35, 2],
      [39, 4],
    ],
    [9, 21, 31],
    [11, 30, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.half), signs.half);
  m.sign(11, onGround(GROUND, signs.sting), signs.sting);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  m.mon(CHAINS[0].first, BUG_X[0], STAND);
  return m;
}

/** Level 2: Big Bug's three faces, in the same tunnel. 46 blocks wide. */
function aThirdFace(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 43);
  wall(g);
  g.row(9, 12, 14, 'c').row(9, 20, 21, 'c').put(38, 9, 'c').put(40, 9, 'c');
  scenery(
    g,
    [
      [6, 2],
      [16, 1],
      [18, 3],
      [40, 1],
    ],
    [10, 18, 41],
    [8, 34, 36],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.third), signs.third);
  m.sign(16, onGround(GROUND, signs.wait), signs.wait);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  m.mon(CHAINS[1].first, BUG_X[1], STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'boss-phases');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Half Way', hint: 'Watch it change.', map: halfWay(book, signs) },
    { file: 'two', title: 'A Third Face', hint: 'Save a star for the last.', map: aThirdFace(book, signs) },
  ];
  return { book, pal, levels };
}
