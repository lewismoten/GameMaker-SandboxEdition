// THROW IT's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. Throw a Star: press Enter and Mia throws a star the way he last walked. A mint green
//      gumdrop sits waiting for it. Stars fly only so far, so the second gumdrop is far enough
//      away that the first throw falls short.
//   2. The Narrow Way: a brick wall with a low tunnel through it, and a grump sitting in the
//      tunnel with no room to go around. Face it, throw a star, and the way opens.
// Both rooms are closed in by brick walls you can see, so Mia is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { GUARD, TARGET } from './monsters';

export type SignName = 'throw' | 'far' | 'narrow' | 'face' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    throw: addSign(book, pal, 'throw.sign', 'PRESS ENTER TO THROW A STAR', 4, 3),
    far: addSign(book, pal, 'far.sign', 'A STAR FLIES ONLY SO FAR', 4, 3),
    narrow: addSign(book, pal, 'narrow.sign', 'A GRUMP BLOCKS THE NARROW WAY', 4, 3),
    face: addSign(book, pal, 'face.sign', 'A STAR FLIES THE WAY YOU LAST WALKED', 4, 4),
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

/** Where level 1's two targets stand. */
export const TARGETS_1 = [15, 34] as const;
/** Where level 2's guard sits, and the tunnel it blocks (a brick wall from x 22 to 29). */
export const GUARD_X = 26;
export const TUNNEL = [22, 29] as const;

/** Level 1: two mint gumdrops sit still. 46 blocks wide; the ground is row 10. */
function throwAStar(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  // coins on the walk, one block high: Mia takes them as he goes
  g.row(9, 18, 19, 'c').row(9, 25, 28, 'c');
  scenery(
    g,
    [
      [6, 2],
      [18, 1],
      [27, 3],
      [38, 1],
    ],
    [10, 23, 40],
    [8, 21, 31],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.throw), signs.throw);
  m.sign(20, onGround(GROUND, signs.far), signs.far);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  for (const x of TARGETS_1) m.mon(TARGET, x, STAND);
  return m;
}

/** Level 2: a grump in a tunnel through a brick wall. 46 blocks wide. */
function narrowWay(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  // the wall: brick from the top of the room down to a two-block-high tunnel (rows 8 and 9)
  g.fill(TUNNEL[0], 0, TUNNEL[1] - TUNNEL[0] + 1, 8, 'B');
  g.row(9, 19, 20, 'c').row(9, 32, 35, 'c');
  scenery(
    g,
    [
      [6, 2],
      [14, 1],
      [33, 2],
      [39, 4],
    ],
    [9, 17, 36],
    [11, 31, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.narrow), signs.narrow);
  m.sign(12, onGround(GROUND, signs.face), signs.face);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  m.mon(GUARD, GUARD_X, STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'throw-it');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Throw a Star', hint: 'Press Enter to throw.', map: throwAStar(book, signs) },
    { file: 'two', title: 'The Narrow Way', hint: 'Pop what is in the way.', map: narrowWay(book, signs) },
  ];
  return { book, pal, levels };
}
