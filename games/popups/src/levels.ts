// SCORE POPUPS' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. A Number Appears: two plain coins just vanish (10 points). Three coins that are monsters
//      pay 100; each becomes a blinking "100" that rises and is gone.
//   2. Its Own Picture: a gem pays 200 and a box 500, each with a number picture of its own. Then
//      the mistake: a coin whose number has no way to leave, so it blinks there for good. The last coin is right.
// Both rooms are closed in by brick walls you can see, and nothing blocks Kit.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { BOX, COIN, GEM, STUCK } from './monsters';

export type SignName = 'plain' | 'monster' | 'number' | 'picture' | 'stuck' | 'ends' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    plain: addSign(book, pal, 'plain.sign', 'PLAIN COINS JUST VANISH', 4, 3),
    monster: addSign(book, pal, 'monster.sign', 'THESE COINS ARE MONSTERS. TOUCH ONE', 4, 4),
    number: addSign(book, pal, 'number.sign', 'IT BECAME A NUMBER THAT RISES', 4, 4),
    picture: addSign(book, pal, 'picture.sign', 'EACH NUMBER IS ITS OWN PICTURE', 4, 4),
    stuck: addSign(book, pal, 'stuck.sign', 'THIS 100 NEVER GOES AWAY', 4, 3),
    ends: addSign(book, pal, 'ends.sign', 'LET ITS PATH END TO CLEAR IT', 4, 3),
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

/** Where the prizes hang: on the ground row, or at Kit's head (a prize there is touched just by walking). */
export const HEAD = STAND - 1;
export const L1_COINS: [number, number][] = [
  [18, STAND],
  [21, HEAD],
  [24, STAND],
];
export const L2_GEM = 11;
export const L2_BOX = 14;
export const L2_STUCK = 24;
export const L2_COIN = 33;

/** Level 1: plain coins, then three coin monsters. 46 blocks wide; the ground is row 10. */
function aNumber(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  g.row(9, 10, 11, 'c');
  scenery(
    g,
    [
      [6, 2],
      [15, 1],
      [33, 2],
      [39, 4],
    ],
    [9, 29, 37],
    [13, 26, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.plain), signs.plain);
  m.sign(13, onGround(GROUND, signs.monster), signs.monster);
  m.sign(28, onGround(GROUND, signs.number), signs.number);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  for (const [x, y] of L1_COINS) m.mon(COIN, x, y);
  return m;
}

/** Level 2: a gem and a box with numbers of their own, a number that never leaves, and a coin done right. 46 blocks wide. */
function itsOwn(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  scenery(
    g,
    [
      [6, 2],
      [17, 1],
      [30, 3],
      [40, 1],
    ],
    [9, 16, 38],
    [20, 28, 41],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.picture), signs.picture);
  m.sign(17, onGround(GROUND, signs.stuck), signs.stuck);
  m.sign(28, onGround(GROUND, signs.ends), signs.ends);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  m.mon(GEM, L2_GEM, STAND).mon(BOX, L2_BOX, HEAD).mon(STUCK, L2_STUCK, STAND).mon(COIN, L2_COIN, STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'A Number Appears', hint: 'A prize can leave a number.', map: aNumber(book, signs) },
    { file: 'two', title: 'Its Own Picture', hint: 'A number is only a picture.', map: itsOwn(book, signs) },
  ];
  return { book, pal, levels };
}
