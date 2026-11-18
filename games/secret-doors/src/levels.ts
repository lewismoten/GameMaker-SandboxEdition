// LOOKS LIKE A WALL's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and walls.
//
//   1. Same Look: two walls drawn exactly alike. The first is solid (Mia bumps it and jumps over);
//      the second, four high, is only a picture of a wall: Mia walks into it and through it.
//   2. Bump, Then Bump: a wall that cracks when touched and crumbles when touched again. The block
//      you touch becomes a second block, and that one becomes a third.
//   3. Coins in the Wall: a wall of fake bricks with coins showing in it. A secret is fair when
//      the level hints at it.
// Every room is closed in by hedges you can see, so Mia is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques, stampTiledSign } from '../../kit/starter/microPlaque';
import { addWallBlocks } from './wallBlocks';

export type SignName = 'real' | 'picture' | 'bump' | 'twice' | 'window' | 'exit' | 'exitLarge';

/** The block set the levels share: the Starter blocks, this game's signs, then the wall blocks. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addWallBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, {
    real: { lines: ['JUMP', 'OVER'] },
    picture: { lines: ['WALK', 'IN'] },
    bump: { lines: ['BUMP', 'IT!'] },
    twice: { lines: ['BUMP', 'IT!'] },
    window: { lines: ['WALK', 'IN'] },
    exit: { lines: ['EXIT', '→'], post: false },
    exitLarge: { lines: ['EXIT', '→'], post: false },
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

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** Where each level's walls are (columns), for the bot's route and the shots. */
export const L1 = { real: 18, realRows: 2, fake: 34, fakeRows: 4 } as const;
export const L2 = { wallA: 18, wallB: 34, wallBWidth: 2, rows: 4 } as const;
export const L3 = {
  x: 30,
  width: 4,
  roofRow: 7,
  windows: [
    [30, 8],
    [32, 8],
    [31, 9],
    [33, 9],
  ],
} as const;

/** The ground, the side walls, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  // A narrow turf step supports the hero before walking down onto the path.
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

/** Stamps a block `name`, `w` wide and `h` high, standing on the ground at column `x`. */
function stack(m: StarterMap, name: string, x: number, w: number, h: number): void {
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) m.set(x + i, GROUND - 1 - j, name);
}

/** Level 1: a real wall and a picture of one, drawn alike. 52 blocks wide. */
function sameLook(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  g.row(7, 18, 19, 'c').row(9, 40, 42, 'c');
  scenery(
    g,
    [
      [7, 2],
      [22, 1],
      [36, 3],
      [44, 1],
    ],
    [11, 26, 30, 46],
    [9, 24, 43],
  );
  const m = new StarterMap(book, g.rows());
  stack(m, 'wall', L1.real, 1, L1.realRows);
  stack(m, 'fake', L1.fake, 1, L1.fakeRows);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 12, onGround(GROUND, signs.real), signs.real);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 27, onGround(GROUND, signs.picture), signs.picture);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 43, 7, signs.exit, 2);
  return m;
}

/** Level 2: a wall that cracks, then crumbles; then a wall two thick. 52 blocks wide. */
function bumpThenBump(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  g.row(9, 22, 28, 'c').row(9, 42, 43, 'c');
  scenery(
    g,
    [
      [7, 2],
      [24, 1],
      [38, 3],
      [44, 1],
    ],
    [11, 21, 31, 46],
    [9, 29, 40],
  );
  const m = new StarterMap(book, g.rows());
  stack(m, 'loose', L2.wallA, 1, L2.rows);
  stack(m, 'loose', L2.wallB, L2.wallBWidth, L2.rows);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 4, onGround(GROUND, signs.bump), signs.bump);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 12, onGround(GROUND, signs.twice), signs.twice);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 43, 7, signs.exit, 2);
  return m;
}

/** Level 3: a low wall of fake bricks with four coins showing in it. 52 blocks wide. */
function coinsInTheWall(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  scenery(
    g,
    [
      [7, 2],
      [20, 1],
      [38, 3],
      [44, 1],
    ],
    [11, 24, 40, 46],
    [9, 27, 42],
  );
  const m = new StarterMap(book, g.rows());
  // the wall: a roof of real bricks over two rows of fake ones, with a coin showing in four squares
  stack(m, 'fake', L3.x, L3.width, 2);
  for (let i = 0; i < L3.width; i++) m.set(L3.x + i, L3.roofRow, 'wall');
  for (const [x, y] of L3.windows) m.set(x, y, 'coin');
  stampTiledSign({ set: m.setOnSky.bind(m) }, 4, onGround(GROUND, signs.window), signs.window);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 45, 7, signs.exitLarge, 2);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'secret-doors');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Same Look', hint: 'Solid is not a look.', map: sameLook(book, signs) },
    { file: 'two', title: 'Bump, Then Bump', hint: 'A change can change again.', map: bumpThenBump(book, signs) },
    { file: 'three', title: 'Coins in the Wall', hint: 'A fair secret has a hint.', map: coinsInTheWall(book, signs) },
  ];
  return { book, pal, levels };
}
