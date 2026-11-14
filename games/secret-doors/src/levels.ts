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
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { addWallBlocks } from './wallBlocks';

export type SignName = 'alike' | 'real' | 'picture' | 'setting' | 'bump' | 'twice' | 'own' | 'window' | 'fair' | 'exit' | 'exitLarge';

/** The block set the levels share: the Starter blocks, this game's signs, then the wall blocks. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addWallBlocks(book, pal);
  const texts = {
    alike: { rows: [['A WALL AND A PICTURE OF A WALL CAN LOOK THE SAME']], maxWidth: 7 },
    real: { rows: [['THIS WALL IS REAL. JUMP OVER IT']], maxWidth: 7 },
    picture: { rows: [['THIS ONE IS ONLY A PICTURE. WALK IN']], maxWidth: 7 },
    setting: { rows: [['SOLID IS A BLOCK SETTING, NOT A LOOK']], maxWidth: 7 },
    bump: { rows: [['BUMP IT AND'], ['IT CRACKS']], maxWidth: 7 },
    twice: { rows: [['THE CRACK IS A BLOCK TOO. WALK INTO IT AGAIN']], maxWidth: 7 },
    own: { rows: [['EACH BLOCK CHANGES ON ITS OWN']], maxWidth: 7 },
    window: { rows: [['COINS SHOWING IN A WALL? WALK IN']], maxWidth: 9 },
    fair: { rows: [['A FAIR SECRET GETS A HINT']], maxWidth: 11 },
    exit: { rows: [['EXIT →']], maxWidth: 7 },
    exitLarge: { rows: [['EXIT →']] },
  };
  const colors = {
    background: skyOf(pal),
    paper: pal.c('parch', 3),
    ink: pal.c('ink', 0),
    wood: pal.c('wood', 2),
    highlight: pal.c('wood', 4),
    shadow: pal.c('wood', 0),
  };
  const glyphs = { ...MICRO_GLYPHS, '→': '100110111110100' };
  const compact = buildTiledSigns(texts, {
    include: ['alike', 'real', 'picture', 'setting', 'bump', 'twice', 'own', 'exit'],
    compact: true,
    colors,
    glyphs,
    maxBlocks: Math.min(100, 150 - book.index.size),
  });
  for (const [name, pic] of compact.blocks) book.add(name, pic, { grav: PULL.down });
  const large = buildTiledSigns(texts, {
    include: ['window', 'fair', 'exitLarge'],
    lettersPerBlock: 3,
    colors,
    glyphs,
    prefix: 'largeSign',
    maxBlocks: Math.min(100, 150 - book.index.size),
  });
  for (const [name, pic] of large.blocks) book.add(name, pic, { grav: PULL.down });
  const signs = { ...compact.signs, ...large.signs };
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
  g.put(3, 8, 's').put(3, 9, 'S');
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
  stampTiledSign({ set: m.setOnSky.bind(m) }, 4, onGround(GROUND, signs.alike), signs.alike);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 11, onGround(GROUND, signs.real), signs.real);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 26, onGround(GROUND, signs.picture), signs.picture);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 36, onGround(GROUND, signs.setting), signs.setting);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 45, 7, signs.exit, 2);
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
  stampTiledSign({ set: m.setOnSky.bind(m) }, 11, onGround(GROUND, signs.twice), signs.twice);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 27, onGround(GROUND, signs.own), signs.own);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 45, 7, signs.exit, 2);
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
  stampTiledSign({ set: m.setOnSky.bind(m) }, 6, onGround(GROUND, signs.window), signs.window);
  stampTiledSign({ set: m.setOnSky.bind(m) }, 18, onGround(GROUND, signs.fair), signs.fair);
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
