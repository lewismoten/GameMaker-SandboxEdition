// COINS AND SCORE's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. Coins Add Points: coins on the ground and along a ledge, each worth 10. Two signs before the ladder: what a
//      coin does, and that F2 shows the score, with the coins right after it (PLAYGAME draws no score on the play screen).
//   2. Some Are Worth More: a coin is 10, a gem 50 (up on a ledge), and a rock takes 20 away.
//   3. Points Are Not Lives: a row of coins changes the score and nothing else; a heart on a
//      ledge adds a life. Game-Maker has no "extra life at a score": a block that adds to the
//      lives counter does it.
import { Book, PULL } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { addPickupBlocks } from './pickups';

/** The block set the levels share: the Starter blocks, this game's pickups, then its signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addPickupBlocks(book, pal);
  const { blocks, signs } = buildTiledSigns(
    {
      coinsAdd: { rows: [['COINS ADD POINTS']] },
      scoreKey: { rows: [['F2 SHOWS YOUR SCORE']] },
      coinTen: { rows: [['A COIN IS WORTH 10']] },
      gemFifty: { rows: [['A GEM IS WORTH 50']] },
      rockCosts: { rows: [['A ROCK TAKES 20 AWAY']] },
      onlyPoints: { rows: [['COINS ARE ONLY POINTS']] },
      heartLife: { rows: [['A HEART ADDS A LIFE']] },
      f2Lives: { rows: [['F2 SHOWS YOUR LIVES']] },
      exit: { rows: [['EXIT →']] },
    },
    {
      colors: {
        background: skyOf(pal),
        paper: pal.c('parch', 3),
        ink: pal.c('ink', 0),
        wood: pal.c('wood', 2),
        highlight: pal.c('wood', 4),
        shadow: pal.c('wood', 0),
      },
      glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' },
      lettersPerBlock: 3,
      maxBlocks: 100 - book.index.size,
    },
  );
  for (const [name, pic] of blocks) book.add(name, pic, { grav: PULL.down });
  return { book, signs };
}

export type SignName = 'coinsAdd' | 'scoreKey' | 'coinTen' | 'gemFifty' | 'rockCosts' | 'onlyPoints' | 'heartLife' | 'f2Lives' | 'exit';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

const GROUND = 10;

/** A level's shell: ground, dirt, edge walls, the entrance, the exit, and clouds, bushes and flowers around it. */
function shell(width: number, clouds: [number, number][], bushes: number[], flowers: number[]): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(width - 4, 8, 'e').put(width - 4, 9, 'E');
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
  return g;
}

/** A ledge of grass over dirt from column `x0` to `x1` at row `row`, with a ladder at column `ladder`. */
function ledge(g: Grid, row: number, x0: number, x1: number, ladder: number): void {
  g.row(row, x0, x1, 'G').fill(x0, row + 1, x1 - x0 + 1, 1, 'D');
  g.col(ladder, row - 1, GROUND - 1, 'H');
}

/** Level 1: coins on the ground, then up a ladder and along a ledge. 46 blocks wide. */
function coinsAddPoints(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = shell(
    46,
    [
      [6, 2],
      [14, 0],
      [33, 1],
      [38, 2],
    ],
    [12, 26, 44],
    [2, 21, 43],
  );
  ledge(g, 3, 20, 27, 19);
  g.row(GROUND - 1, 13, 18, 'c').row(2, 21, 25, 'c');
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 2, 6, signs.coinsAdd, 3);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 7, onGround(GROUND, signs.scoreKey), signs.scoreKey);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 38, 7, signs.exit, 2);
  return m;
}

/** Level 2: coins, then gems up a ladder, then a rock to pay for. 52 blocks wide. */
function worthMore(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = shell(
    52,
    [
      [6, 2],
      [16, 0],
      [36, 1],
      [44, 2],
    ],
    [19, 33, 50],
    [21, 31, 49],
  );
  ledge(g, 3, 23, 31, 22);
  g.row(GROUND - 1, 10, 13, 'c').row(GROUND - 1, 41, 43, 'c');
  const m = new StarterMap(book, g.rows());
  for (const x of [25, 27, 29]) m.set(x, 2, 'gem');
  m.set(39, GROUND - 1, 'rock');
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 4, onGround(GROUND, signs.coinTen), signs.coinTen);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 13, onGround(GROUND, signs.gemFifty), signs.gemFifty);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 34, onGround(GROUND, signs.rockCosts), signs.rockCosts);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 44, 7, signs.exit, 2);
  return m;
}

/** Level 3: a long row of coins that gives no life, then a heart up a ladder that does. 52 blocks wide. */
function heartsAddLives(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = shell(
    52,
    [
      [6, 2],
      [20, 0],
      [38, 1],
      [44, 2],
    ],
    [26, 36, 50],
    [25, 41, 47],
  );
  ledge(g, 3, 28, 34, 27);
  g.row(GROUND - 1, 10, 19, 'c');
  const m = new StarterMap(book, g.rows());
  m.set(31, 2, 'heart');
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 5, onGround(GROUND, signs.onlyPoints), signs.onlyPoints);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 18, onGround(GROUND, signs.heartLife), signs.heartLife);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 35, onGround(GROUND, signs.f2Lives), signs.f2Lives);
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 44, 7, signs.exit, 2);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'coins-and-score');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Coins Add Points', hint: 'Walk into a coin for points.', map: coinsAddPoints(book, signs) },
    { file: 'two', title: 'Some Are Worth More', hint: 'A gem pays more. A rock costs.', map: worthMore(book, signs) },
    { file: 'three', title: 'Points Are Not Lives', hint: 'Only a heart adds a life.', map: heartsAddLives(book, signs) },
  ];
  return { book, pal, levels };
}
