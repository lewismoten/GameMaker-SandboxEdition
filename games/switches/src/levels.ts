// SWITCHES's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, levers and bridges.
//
//   1. Pull the Lever: a lever on the path and a pool across it. Six dotted planks stand over the pool
//      where a bridge would be. Walk through the lever (it flips and puts six on a counter), then onto
//      the planks: each one turns solid under Kit and takes one off the counter.
//   2. Red and Blue: two levers, two counters, two bridges. The blue lever is on the path and gets pulled
//      on the way, so the first bridge (red) is not ready: walk onto it and Kit falls in. The red lever
//      is up a ladder. Both bridges are then crossed.
// Every room is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addSwitchBlocks, PLANKS } from './switchBlocks';

export type SignName = 'lever' | 'spend' | 'six' | 'colors' | 'ladder' | 'red' | 'blue' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the switch blocks. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    lever: addSign(book, pal, 'lever.sign', 'A LEVER ADDS TO A COUNTER', 4, 3),
    spend: addSign(book, pal, 'spend.sign', 'EACH DOTTED PLANK SPENDS ONE', 4, 3),
    six: addSign(book, pal, 'six.sign', 'ONE PULL, SIX PLANKS', 4, 2),
    colors: addSign(book, pal, 'colors.sign', 'EACH COLOR HAS ITS OWN COUNTER', 4, 3),
    ladder: addSign(book, pal, 'ladder.sign', 'RED LEVER UP THE LADDER', 4, 3),
    red: addSign(book, pal, 'red.sign', 'RED PLANKS WANT RED', 4, 3),
    blue: addSign(book, pal, 'blue.sign', 'BLUE PLANKS WANT BLUE', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addSwitchBlocks(book, pal);
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
/** Where each level's levers, ladder and pools are (columns), for the bot's route and the shots. */
export const L1 = { lever: 12, pool: 24 } as const;
export const L2 = { blueLever: 11, ladder: 18, ledge: [19, 26], redLever: 24, redPool: 33, bluePool: 46 } as const;
/** The row a lever stands in on the ledge in level 2: the ledge's top. */
export const LEDGE_ROW = 5;

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

/** Fills the digs' blocks once the map exists: a ghost plank row, the water top, the water. */
function fillPools(m: StarterMap, xs: number[], color: 'Red' | 'Blue'): void {
  for (const x of xs)
    for (let i = 0; i < PLANKS; i++)
      m.set(x + i, GROUND, `ghost${color}`)
        .set(x + i, GROUND + 1, 'waterTop')
        .set(x + i, GROUND + 2, 'water');
}

/** Level 1: a lever, then a pool with six dotted planks over it. 48 blocks wide. */
function pullTheLever(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(48, 44);
  g.fill(L1.pool, GROUND, PLANKS, 3, ' ');
  g.row(9, L1.pool, L1.pool + PLANKS - 1, 'c').row(9, 34, 38, 'c');
  scenery(
    g,
    [
      [7, 2],
      [18, 1],
      [31, 3],
      [40, 1],
    ],
    [9, 21, 33, 41],
    [15, 31, 42],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.lever), signs.lever);
  m.sign(14, onGround(GROUND, signs.spend), signs.spend);
  m.sign(19, onGround(GROUND, signs.six), signs.six);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  m.set(L1.lever, GROUND - 1, 'leverRed');
  fillPools(m, [L1.pool], 'Red');
  return m;
}

/** Level 2: a blue lever on the path, a red lever up a ladder, a red pool and then a blue pool. 58 blocks wide. */
function redAndBlue(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(58, 54);
  g.fill(L2.redPool, GROUND, PLANKS, 3, ' ').fill(L2.bluePool, GROUND, PLANKS, 3, ' ');
  // the ledge for the red lever, with a ladder up its near end
  g.row(LEDGE_ROW + 1, L2.ledge[0], L2.ledge[1], 'G').row(LEDGE_ROW + 2, L2.ledge[0], L2.ledge[1], 'D');
  g.col(L2.ladder, LEDGE_ROW, GROUND - 1, 'H');
  g.row(9, L2.redPool, L2.redPool + PLANKS - 1, 'c')
    .row(9, 39, 40, 'c')
    .row(9, 52, 53, 'c')
    .row(LEDGE_ROW, 20, 22, 'c');
  scenery(
    g,
    [
      [7, 2],
      [30, 1],
      [44, 3],
      [50, 1],
    ],
    [9, 28, 42, 50],
    [7, 30, 44],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.colors), signs.colors);
  m.sign(13, onGround(GROUND, signs.ladder), signs.ladder);
  m.sign(28, onGround(GROUND, signs.red), signs.red);
  m.sign(41, onGround(GROUND, signs.blue), signs.blue);
  m.sign(49, onGround(GROUND, signs.exit), signs.exit);
  m.set(L2.blueLever, GROUND - 1, 'leverBlue');
  m.set(L2.redLever, LEDGE_ROW, 'leverRed');
  fillPools(m, [L2.redPool], 'Red');
  fillPools(m, [L2.bluePool], 'Blue');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'switches');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Pull the Lever', hint: 'A lever fills a counter.', map: pullTheLever(book, signs) },
    { file: 'two', title: 'Red and Blue', hint: 'Each color has its own counter.', map: redAndBlue(book, signs) },
  ];
  return { book, pal, levels };
}
