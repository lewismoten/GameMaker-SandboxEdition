// SCORE POPUPS' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. A Number Appears: two plain coins just vanish (10 points). Three coins that are monsters
//      pay 100; each becomes a blinking "100" that rises and is gone.
//   2. Its Own Picture: a gem pays 200 and a box 500, each with a number picture of its own. Then
//      the mistake: a coin whose number has no way to leave, so it blinks there for good. The last coin is right.
// Both rooms are closed in by brick walls you can see, and nothing blocks Yana.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { BOX, COIN, GEM, STUCK } from './monsters';

export type SignName = 'monster' | 'stuck' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, {
    monster: { lines: ['WALK', 'IN'] },
    stuck: { lines: ['THIS 100', 'STAYS'] },
    exit: { lines: ['EXIT', '→'], post: false },
  });
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** One short post supports each compact lesson board. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** Where the monsters stand: the row above the ground. */
export const STAND = GROUND - 1;

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  // A two-row turf step supports the hero at entry and opens the view above the path.
  g.put(3, 8, 'G').put(3, 9, 'D');
  g.put(3, 6, 's').put(3, 7, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Where the prizes hang: on the ground row, or at Yana's head (a prize there is touched just by walking). */
export const HEAD = STAND - 1;
export const L1_COINS: [number, number][] = [
  [18, HEAD],
  [21, HEAD],
  [24, HEAD],
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
  const safe = { set: (x: number, y: number, block: string) => m.setOnSky(x, y, block) };
  // Explain the monster coins before the first prize, clear of its rising number.
  stampTiledSign(safe, 15, onGround(GROUND, signs.monster), signs.monster, 1, { maxPostHeight: 1 });
  stampTiledSign(safe, 37, onGround(GROUND, signs.exit), signs.exit, 1, { maxPostHeight: 1 });
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
  const safe = { set: (x: number, y: number, block: string) => m.setOnSky(x, y, block) };
  // Explain the persistent number before its coin, clear of the rising prizes.
  stampTiledSign(safe, 21, onGround(GROUND, signs.stuck), signs.stuck, 1, { maxPostHeight: 1 });
  stampTiledSign(safe, 37, onGround(GROUND, signs.exit), signs.exit, 1, { maxPostHeight: 1 });
  m.mon(GEM, L2_GEM, HEAD).mon(BOX, L2_BOX, HEAD).mon(STUCK, L2_STUCK, HEAD).mon(COIN, L2_COIN, HEAD);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'popups');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'A Number Appears', hint: 'A prize can leave a number.', map: aNumber(book, signs) },
    { file: 'two', title: 'Its Own Picture', hint: 'A number is only a picture.', map: itsOwn(book, signs) },
  ];
  return { book, pal, levels };
}
