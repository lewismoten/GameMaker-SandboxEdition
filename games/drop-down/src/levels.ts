// DROP DOWN's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its crates, signs and Plops.
//
//   1. In the Way: Kit walks into a tunnel through a brick mound. Plop sits on a crate in the middle of
//      it, over a one-block dip in the floor. Plop is solid and the roof is low, so Kit cannot pass or hop
//      over. Walk into the crate: it turns to rubble, Plop drops two blocks into the dip, its back level
//      with the floor, and Kit walks over it.
//   2. A Step Up: the exit is on a high plateau, four blocks above a brick shelf. Two crates hang above
//      the shelf with a Plop on each. The first is far from the wall: its Plop lands where it is no help.
//      The second is by the wall: its Plop lands against it, and Kit climbs Plop, then the plateau.
// Both rooms are closed in by walls you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addCrateBlocks } from './blocks';
import { PLOP } from './monsters';

export type SignName = 'gate' | 'break' | 'why' | 'high' | 'lands' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs, crate and rubble. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    gate: addSign(book, pal, 'gate.sign', 'PLOP SITS ON A CRATE AND BLOCKS THE WAY', 4, 4),
    break: addSign(book, pal, 'break.sign', 'BREAK THE CRATE AND WHAT SITS ON IT FALLS', 4, 4),
    why: addSign(book, pal, 'why.sign', 'PLOP FALLS BECAUSE ITS MOVEMENT PULLS IT DOWN', 4, 4),
    high: addSign(book, pal, 'high.sign', 'TOO HIGH TO JUMP. A STEP WOULD HELP', 4, 4),
    lands: addSign(book, pal, 'lands.sign', 'IT LANDS WHERE ITS CRATE WAS', 4, 4),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addCrateBlocks(book, pal);
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
/** Level 1: the dip in the floor, the crate over it (the cork) and Plop on the crate. */
export const DIP_X = 24;
export const CORK_ROW = GROUND - 1;
export const PLOP_ROW_1 = CORK_ROW - 1;
/** Level 2: the shelf's top row, where each crate hangs, and the plateau's top row. */
export const SHELF = 8;
export const FAR_X = 14;
export const NEAR_X = 20;
export const PERCH_ROW = 6;
export const PLATEAU = 4;

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at `exitX` on row `top` + 1. */
function base(width: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: [number, number][], flowers: [number, number][]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const [x, y] of bushes) g.put(x, y, 'b');
  for (const [x, y] of flowers) g.put(x, y, 'f');
}

/** Level 1: a tunnel through a brick mound, Plop on a crate over a dip. 46 blocks wide; the ground is row 10. */
function inTheWay(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46);
  g.put(42, 8, 'e').put(42, 9, 'E');
  // the mound: three rows of brick under a grass top, with a tunnel three blocks high beneath it
  g.row(3, 19, 29, 'G').row(4, 19, 29, 'B').row(5, 19, 29, 'B').row(6, 19, 29, 'B');
  g.put(DIP_X, GROUND, ' ');
  g.row(9, 26, 28, 'c').row(9, 30, 31, 'c').put(37, 9, 'c');
  scenery(
    g,
    [
      [6, 1],
      [13, 1],
      [33, 1],
      [39, 3],
    ],
    [
      [11, 9],
      [44, 9],
    ],
    [
      [18, 9],
      [21, 9],
    ],
  );
  const m = new StarterMap(book, g.rows());
  m.set(DIP_X, CORK_ROW, 'crate');
  m.mon(PLOP, DIP_X, PLOP_ROW_1);
  m.sign(6, onGround(GROUND, signs.gate), signs.gate);
  m.sign(13, onGround(GROUND, signs.break), signs.break);
  m.sign(32, onGround(GROUND, signs.why), signs.why);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: a shelf, two crates with a Plop on each, and a plateau four blocks above the shelf. 46 blocks wide. */
function aStepUp(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46);
  // the brick shelf (two blocks high) and the plateau: grass on dirt, its face at x 21
  g.fill(11, SHELF, 10, 2, 'B');
  g.row(PLATEAU, 21, 44, 'G').fill(21, PLATEAU + 1, 24, 5, 'D');
  g.put(40, 2, 'e').put(40, 3, 'E');
  g.row(3, 24, 29, 'c');
  scenery(
    g,
    [
      [5, 1],
      [24, 0],
      [34, 1],
    ],
    [
      [9, 9],
      [13, 7],
      [32, 3],
    ],
    [
      [31, 3],
      [42, 3],
    ],
  );
  const m = new StarterMap(book, g.rows());
  for (const x of [FAR_X, NEAR_X]) m.set(x, PERCH_ROW, 'crate').mon(PLOP, x, PERCH_ROW - 1);
  m.sign(6, onGround(GROUND, signs.high), signs.high);
  m.sign(15, onGround(SHELF, signs.lands), signs.lands);
  m.sign(36, onGround(PLATEAU, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'In the Way', hint: 'A friend sits on a crate.', map: inTheWay(book, signs) },
    { file: 'two', title: 'A Step Up', hint: 'Drop a friend, then climb it.', map: aStepUp(book, signs) },
  ];
  return { book, pal, levels };
}
