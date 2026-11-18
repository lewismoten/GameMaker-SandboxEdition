// UNDER THE SURFACE's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its water, signs and coins.
// Water is only a block whose gravity setting pulls some way (water.ts); none of it hurts.
//
//   1. The Creek:    water that pulls LEFT and down. Fall in, and it carries Lami back to the bank she started from.
//                    Stepping stones cross it.
//   2. The Float:    a deep pool that pulls UP. Lami drops in, floats to the top row (which has no pull) and swims across.
//   3. The Lift:     a tall pool that pulls UP and LEFT. Lami steps in at the bottom and is lifted to the ledge on the left,
//                    where the door is.
// Every level is closed in by hedges you can see, so Lami is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addWater } from './water';

export type SignName = keyof typeof WORDS;

/** Shared micro plaques fit the banks without moving pools or scenery. */
const WORDS = {
  pull: { lines: ['PULL', '←'] },
  stones: { lines: ['SAFE', 'HERE'] },
  exit: { lines: ['EXIT', '→'], post: false },
  float: { lines: ['PULL', '↑'] },
  top: { lines: ['NO', 'PULL'] },
  lift: { lines: ['PULL', '↖'] },
  ledge: { lines: ['NO', 'PULL'] },
  back: { lines: ['EXIT', '←'], post: false },
};

/** One block set for every level, including the complete sign vocabulary. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addWater(book, pal);
  const signs = addMicroPlaques(book, pal, WORDS) as Record<SignName, Sign>;
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

/** Level 1: the ground row, the width, the creek's columns, the stones' columns, the exit column and the coins. */
export const L1 = {
  ground: 10,
  width: 44,
  creek: [14, 28],
  stones: [17, 21, 25],
  exit: 40,
  coins: [
    [17, 9],
    [19, 7],
    [21, 9],
    [23, 7],
    [25, 9],
    [32, 9],
    [34, 9],
  ],
} as const;
/** Level 2: the ground row, the width, the pool's columns and its depth in rows (the top row is the surface), the exit column. */
export const L2 = {
  ground: 10,
  width: 44,
  pool: [10, 33],
  depth: 5,
  exit: 42,
  coins: [
    [14, 9],
    [18, 9],
    [22, 9],
    [26, 9],
    [30, 9],
  ],
} as const;
/** Level 3: the low floor's row, the ledge's row, the pool's columns and top row, the start and exit columns. */
export const L3 = {
  floor: 12,
  ledge: 6,
  pool: [14, 25],
  top: 5,
  width: 42,
  start: 36,
  exit: 1,
  coins: [
    [33, 11],
    [29, 11],
    [17, 3],
    [4, 5],
    [12, 5],
    [13, 5],
  ],
} as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: a creek between two banks, with three stepping stones across it. */
function theCreek(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L1.ground;
  const [c0, c1] = L1.creek;
  const g = new Grid(L1.width, 15);
  g.row(G, 0, L1.width - 1, 'G').fill(0, G + 1, L1.width, 4, 'D');
  g.col(0, 0, 9, 'X').col(L1.width - 1, 0, 9, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L1.exit, G - 2, 'e').put(L1.exit, G - 1, 'E');
  for (const [x, y] of L1.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [8, 2],
      [20, 1],
      [34, 3],
    ],
    [7, 33, 38],
    [11, 31, 42],
  );
  const m = new StarterMap(book, g.rows());
  for (let x = c0; x <= c1; x++) m.set(x, G, 'creekTop').set(x, G + 1, 'creek');
  for (const x of L1.stones) m.set(x, G, 'stone');
  stampTiledSign({ set: m.setOnSky.bind(m) }, 5, onGround(G, signs.pull), signs.pull, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 9, onGround(G, signs.stones), signs.stones, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 35, 7, signs.exit, 2, { maxPostHeight: 1 });
  return m;
}

/** Level 2: a deep pool; the top row is the surface. */
function theFloat(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const [p0, p1] = L2.pool;
  const rows = G + L2.depth + 3;
  const g = new Grid(L2.width, rows);
  g.row(G, 0, L2.width - 1, 'G').fill(0, G + 1, L2.width, rows - G - 1, 'D');
  g.col(0, 0, 9, 'X').col(L2.width - 1, 0, 9, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L2.exit, G - 2, 'e').put(L2.exit, G - 1, 'E');
  for (const [x, y] of L2.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [7, 2],
      [18, 1],
      [30, 3],
    ],
    [6, 41],
    [4],
  );
  const m = new StarterMap(book, g.rows());
  for (let x = p0; x <= p1; x++) {
    m.set(x, G, 'deepTop');
    for (let y = G + 1; y < G + L2.depth; y++) m.set(x, y, 'deep');
  }
  stampTiledSign({ set: m.setOnSky.bind(m) }, 5, onGround(G, signs.float), signs.float, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 8, onGround(G, signs.top), signs.top, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 38, 7, signs.exit, 2, { maxPostHeight: 1 });
  return m;
}

/** Level 3: a tall pool between a low floor on the right and a high ledge on the left. */
function theLift(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const F = L3.floor;
  const [p0, p1] = L3.pool;
  const W = L3.width;
  const g = new Grid(W, F + 4);
  g.fill(0, L3.ledge, p0, F + 4 - L3.ledge, 'D').row(L3.ledge, 0, p0 - 1, 'G'); // the ledge: a cliff on the left
  g.row(F, p0, W - 1, 'G').fill(p0, F + 1, W - p0, 3, 'D'); // the pool's floor and the low floor
  g.col(0, 0, L3.ledge - 1, 'X').col(W - 1, 0, F - 1, 'X');
  g.put(L3.start, F - 2, 's').put(L3.start, F - 1, 'S');
  g.put(L3.exit, L3.ledge - 2, 'e').put(L3.exit, L3.ledge - 1, 'E');
  for (const [x, y] of L3.coins) g.put(x, y, 'c');
  scenery(
    g,
    F,
    [
      [30, 5],
      [36, 3],
    ],
    [30, 39],
    [28, 38],
  );
  scenery(g, L3.ledge, [[9, 1]], [5], [11]);
  const m = new StarterMap(book, g.rows());
  for (let x = p0; x <= p1; x++) {
    m.set(x, L3.top, 'liftTop');
    for (let y = L3.top + 1; y < F; y++) m.set(x, y, 'lift');
  }
  stampTiledSign({ set: m.setOnSky.bind(m) }, 31, onGround(F, signs.lift), signs.lift, 1, { maxPostHeight: 1 });
  // Float beside the upper water row: the approach has no nearby ground for a short post.
  stampTiledSign({ set: m.setOnSky.bind(m) }, 26, 4, signs.ledge, 0, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 1, 3, signs.back, 2, { maxPostHeight: 1 });
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'swim');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'The Creek', hint: 'It pulls to the left.', map: theCreek(book, signs) },
    { file: 'two', title: 'The Float', hint: 'The water holds you up.', map: theFloat(book, signs) },
    { file: 'three', title: 'The Lift', hint: 'Up and to the left.', map: theLift(book, signs) },
  ];
  return { book, pal, levels };
}
