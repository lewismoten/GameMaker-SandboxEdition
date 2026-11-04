// SLIPPERY AND BOUNCY's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, its floors and the air above
// them that pulls (slick.ts). The pull belongs to the air block Kit's feet are in, not to the floor.
//
//   1. Ice: a patch of ice drags Kit to the right, and he keeps sliding a little after it; a spike waits beyond.
//      A plank ledge, then, is for jumping up through.
//   2. The Belt: a long walkway carries Kit along, to a spike at its end unless he jumps off.
//   3. Wind: a spring pad bounces him up to a ledge, and a fan blows him up through a one-way shelf to the door.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addSlick } from './slick';

export type SignName = 'ice' | 'ledge' | 'belt' | 'spring' | 'wind' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the floors and the air that pulls. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    ice: addSign(book, pal, 'ice.sign', 'ICE DRAGS YOU RIGHT, AND YOU SLIDE ON', 4, 3),
    ledge: addSign(book, pal, 'ledge.sign', 'JUMP UP THROUGH A LEDGE AND LAND ON TOP', 4, 3),
    belt: addSign(book, pal, 'belt.sign', 'A BELT CARRIES YOU. JUMP NEAR THE END', 4, 3),
    spring: addSign(book, pal, 'spring.sign', 'A SPRING IS A SHORT WIND', 4, 2),
    wind: addSign(book, pal, 'wind.sign', 'WIND BLOWS YOU UP', 4, 2),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addSlick(book, pal);
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

/** The ground, the side walls, the entrance on the left (x 3) and, if `exitX` is given, the exit door there. */
function base(width: number, exitX?: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  if (exitX !== undefined) g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** A floor `name` along ground row `GROUND` from x0 to x1, with the air that pulls (`airName`) in the two rows above it. */
function floor(m: StarterMap, x0: number, x1: number, name: string, airName: string): void {
  for (let x = x0; x <= x1; x++) {
    m.set(x, GROUND, name);
    m.set(x, GROUND - 1, airName);
    m.set(x, GROUND - 2, airName);
  }
}

/** Where the ice runs, where its spike stands, and the ledge after it. */
export const ICE = [14, 21] as const;
export const ICE_SPIKE = 23;
export const LEDGE_1 = [30, 35] as const;

/** Level 1: ice, the spike it slides you into, then a ledge to jump up through. 50 blocks wide. */
function iceLevel(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(50, 46);
  g.row(7, LEDGE_1[0], LEDGE_1[1], '=');
  g.row(6, LEDGE_1[0] + 1, LEDGE_1[1] - 1, 'c');
  g.row(9, 40, 42, 'c');
  scenery(
    g,
    [
      [6, 2],
      [19, 1],
      [30, 3],
      [41, 2],
    ],
    [10, 21, 38],
    [8, 27, 44],
  );
  const m = new StarterMap(book, g.rows());
  floor(m, ICE[0], ICE[1], 'ice', 'slickAir');
  m.sign(6, onGround(GROUND, signs.ice), signs.ice);
  m.sign(26, onGround(GROUND, signs.ledge), signs.ledge);
  m.sign(43, onGround(GROUND, signs.exit), signs.exit);
  m.set(ICE_SPIKE, GROUND - 1, 'spikeUp');
  return m;
}

/** The belt, and the spike at its end. */
export const BELT = [12, 19] as const;
export const BELT_SPIKE = 22;

/** Level 2: a walkway carries Kit to a spike. 44 blocks wide. */
function beltLevel(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(44, 40);
  g.row(9, 24, 28, 'c');
  scenery(
    g,
    [
      [6, 2],
      [20, 1],
      [33, 3],
    ],
    [9, 31, 37],
    [7, 30, 35],
  );
  const m = new StarterMap(book, g.rows());
  floor(m, BELT[0], BELT[1], 'belt', 'beltAir');
  m.sign(6, onGround(GROUND, signs.belt), signs.belt);
  m.sign(34, onGround(GROUND, signs.exit), signs.exit);
  m.set(BELT_SPIKE, GROUND - 1, 'spikeUp');
  return m;
}

/** Level 3's spring, its ledge, the fan and the shelf with the door. */
export const SPRING = [9, 11] as const;
export const FAN = [24, 25] as const;
export const SHELF = [22, 38] as const;

/** Level 3: a spring up to a ledge, then wind up through a one-way shelf to the door. 44 blocks wide. */
function windLevel(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(44);
  g.row(6, 12, 17, '=');
  g.row(5, 13, 16, 'c');
  g.row(SHELF_ROW, SHELF[0], SHELF[1], '=');
  g.put(37, SHELF_ROW - 2, 'e').put(37, SHELF_ROW - 1, 'E');
  g.row(SHELF_ROW - 1, SHELF_COINS[0], SHELF_COINS[1], 'c').row(SHELF_ROW - 1, 34, 35, 'c');
  g.col(SHELF[1] + 1, 0, SHELF_ROW, 'X');
  scenery(
    g,
    [
      [6, 1],
      [30, 1],
    ],
    [20, 31, 36],
    [8, 28, 34],
  );
  const m = new StarterMap(book, g.rows());
  for (let x = SPRING[0]; x <= SPRING[1]; x++) {
    m.set(x, GROUND, 'spring');
    for (const y of [GROUND - 1, GROUND - 2, GROUND - 3]) m.set(x, y, 'springAir');
  }
  for (const x of FAN) {
    m.set(x, GROUND, 'fan');
    for (let y = SHELF_ROW + 3; y < GROUND; y++) m.set(x, y, "windAir");
  }
  m.sign(4, onGround(GROUND, signs.spring), signs.spring);
  m.sign(19, onGround(GROUND, signs.wind), signs.wind);
  m.sign(31, SHELF_ROW - 1 - signs.exit.board.length, signs.exit);
  m.set(SHELF_SPIKE, SHELF_ROW - 1, 'spikeUp');
  return m;
}
export const SHELF_ROW = 3;
/** The spike on the shelf, a little way from where the wind drops Kit, and the coins after it. */
export const SHELF_SPIKE = 28;
export const SHELF_COINS = [29, 30] as const;

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Ice', hint: 'Ice keeps you sliding.', map: iceLevel(book, signs) },
    { file: 'two', title: 'The Belt', hint: 'A belt carries you along.', map: beltLevel(book, signs) },
    { file: 'three', title: 'Wind', hint: 'Wind lifts you up.', map: windLevel(book, signs) },
  ];
  return { book, pal, levels };
}
