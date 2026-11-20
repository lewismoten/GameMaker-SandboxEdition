// STRONGER KEYS' three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its doors and signs.
//
// One counter holds the keys' worth: a bronze key adds 1, a silver 2, a gold 3. A door takes its
// own price (bronze 1, silver 2, gold 3) and refuses unless the counter can pay it, so a bigger key
// opens every smaller door and the change stays in the counter.
//
//   1. Small Key, Big Door: a bronze key on the ground, then a silver door that stays shut. The silver
//      key waits on a ledge up a ladder; with it the door opens and one bronze's worth is left over
//      for the bronze door ahead.
//   2. One Gold Key: the gold key (worth 3) is up a ladder at the start. A bronze door, then a silver
//      door: the one key pays for both (1 and 2).
//   3. Keys Add Up: a gold door costs 3. The bronze key (1) alone does nothing, silver (2) is one
//      short, and the two together are enough.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addLadderBlocks, type Grade } from './ladderBlocks';

export type SignName = 'bronzeKey' | 'silverKey' | 'silverDoor' | 'goldKey' | 'goldDoor' | 'adds' | 'exit';

/** The block set the levels share: the Starter blocks, the keys and doors, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLadderBlocks(book, pal);
  // Share centered lettering, borders and posts across every level's vocabulary.
  const signs = addMicroPlaques(book, pal, {
    bronzeKey: { lines: ['BRONZE', '= 1'], post: false },
    silverKey: { lines: ['SILVER', '= 2'], post: false },
    silverDoor: { lines: ['SILVER', 'DOOR: 2'], post: false },
    goldKey: { lines: ['GOLD', '= 3'], post: false },
    goldDoor: { lines: ['GOLD', 'DOOR: 3'], post: false },
    adds: { lines: ['1+2', '= 3'] },
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

/** Every level's ground row. */
export const GROUND = 10;

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** A wall of brick from the top down to a door: an arch over the door of `grade` on the last two rows. */
function wall(g: Grid, x: number): void {
  g.col(x, 0, GROUND - 3, 'B');
}

/** The door and its arch, in the wall at column `x`. */
function door(m: StarterMap, x: number, grade: Grade): void {
  m.set(x, GROUND - 2, `arch_${grade}`).set(x, GROUND - 1, `gate_${grade}`);
}

/** The ground, the entrance at column 3 and the exit at `exitX`, the hedges at both ends. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  // Three rows of turf and dirt frame both the ground and the upper keys in one view.
  g.row(7, 1, 3, 'G').fill(1, 8, 3, 2, 'D');
  g.put(3, 5, 's').put(3, 6, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** A ledge of grass on dirt along row 3 from `x0` to `x1`, with a ladder on its left side at `x0 - 1`. */
function ledge(g: Grid, x0: number, x1: number): void {
  g.row(3, x0, x1, 'G').fill(x0, 4, x1 - x0 + 1, 1, 'D');
  g.col(x0 - 1, 2, 9, 'H');
}

/** Clouds, bushes and flowers that stay clear of the keys, signs and doors. */
function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: a bronze key, a silver door that stays shut, the silver key up a ladder, then a bronze door. 46 wide. */
function smallKeyBigDoor(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 43);
  ledge(g, 15, 22);
  g.row(2, 17, 19, 'c').row(9, 29, 31, 'c').put(38, 9, 'c').put(39, 9, 'c').put(41, 9, 'c');
  wall(g, 27);
  wall(g, 37);
  scenery(
    g,
    [
      [6, 2],
      [24, 1],
      [32, 3],
      [40, 1],
    ],
    [8, 34, 44],
    [13, 25, 42],
  );
  const m = new StarterMap(book, g.rows());
  const signMap = { set: (x: number, y: number, block: string) => m.setOnSky(x, y, block) };
  m.set(9, 9, 'key_bronze').set(21, 2, 'key_silver');
  door(m, 27, 'silver');
  door(m, 37, 'bronze');
  stampTiledSign(signMap, 4, onGround(GROUND, signs.bronzeKey), signs.bronzeKey, 1, { maxPostHeight: 1 });
  stampTiledSign(signMap, 9, onGround(GROUND, signs.silverKey), signs.silverKey, 1, { maxPostHeight: 1 });
  stampTiledSign(signMap, 22, onGround(GROUND, signs.silverDoor), signs.silverDoor, 1, { maxPostHeight: 1 });
  stampTiledSign(signMap, 38, onGround(GROUND, signs.exit), signs.exit, 1, { maxPostHeight: 1 });
  return m;
}

/** Level 2: the gold key up a ladder, then a bronze door and a silver door: one key pays for both. 46 wide. */
function oneGoldKey(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 43);
  ledge(g, 9, 16);
  g.row(2, 11, 13, 'c').row(9, 27, 29, 'c').put(37, 9, 'c').put(38, 9, 'c').put(39, 9, 'c').put(41, 9, 'c');
  wall(g, 25);
  wall(g, 35);
  scenery(
    g,
    [
      [6, 1],
      [20, 1],
      [30, 3],
      [38, 1],
    ],
    [6, 18, 44],
    [14, 31, 40],
  );
  const m = new StarterMap(book, g.rows());
  const signMap = { set: (x: number, y: number, block: string) => m.setOnSky(x, y, block) };
  m.set(15, 2, 'key_gold');
  door(m, 25, 'bronze');
  door(m, 35, 'silver');
  // Keep the board above the raised entrance, with its post left of the ladder.
  stampTiledSign(signMap, 3, 2, signs.goldKey, GROUND - 2 - signs.goldKey.board.length, { maxPostHeight: 1 });
  // The taller post clears the flower and keeps the board above the exit door.
  stampTiledSign(signMap, 40, 7, signs.exit, 2, { maxPostHeight: 1 });
  return m;
}

/** Level 3: a gold door costs 3; the bronze and silver keys together pay for it. 46 wide. */
function keysAddUp(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 43);
  ledge(g, 14, 21);
  g.row(2, 16, 18, 'c').row(9, 33, 37, 'c');
  wall(g, 30);
  scenery(
    g,
    [
      [6, 2],
      [24, 1],
      [34, 3],
      [40, 1],
    ],
    [7, 38, 44],
    [12, 23, 41],
  );
  const m = new StarterMap(book, g.rows());
  const signMap = { set: (x: number, y: number, block: string) => m.setOnSky(x, y, block) };
  m.set(9, 9, 'key_bronze').set(20, 2, 'key_silver');
  door(m, 30, 'gold');
  stampTiledSign(signMap, 18, onGround(GROUND, signs.goldDoor), signs.goldDoor, 1, { maxPostHeight: 1 });
  stampTiledSign(signMap, 10, onGround(GROUND, signs.adds), signs.adds, 1, { maxPostHeight: 1 });
  stampTiledSign(signMap, 38, onGround(GROUND, signs.exit), signs.exit, 1, { maxPostHeight: 1 });
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'power-ladder');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Small Key, Big Door', hint: 'A small key is not enough.', map: smallKeyBigDoor(book, signs) },
    { file: 'two', title: 'One Gold Key', hint: 'A stronger key opens weaker doors.', map: oneGoldKey(book, signs) },
    { file: 'three', title: 'Keys Add Up', hint: 'Small keys add up to a big one.', map: keysAddUp(book, signs) },
  ];
  return { book, pal, levels };
}
