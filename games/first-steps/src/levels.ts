// FIRST STEPS' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs.
//
//   1. Walk, Jump, Fall: walk right, jump a wall, climb a step, and walk off the edge.
//   2. Climb and Fall: up a ladder, across an island, and down two drops to the door.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

/** The block set both levels share: the Starter blocks, then this game's six signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    start: addSign(book, pal, 'start', 'YOU START HERE', 4, 2),
    walk: addSign(book, pal, 'walk', '← → WALK', 4),
    jump: addSign(book, pal, 'jump', 'SPACE JUMPS', 3, 2),
    gravity: addSign(book, pal, 'gravity', 'GRAVITY PULLS YOU DOWN', 4, 2),
    climb: addSign(book, pal, 'climb', 'CLIMB THE LADDER', 3, 2),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
  };
  return { book, signs };
}

export type SignName = 'start' | 'walk' | 'jump' | 'gravity' | 'climb' | 'exit';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** The ground's top row in a level: signs stand on it. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** Level 1: walk, jump, fall. 58 blocks wide; the ground is row 10, and the last stretch drops to row 12. */
function walkJumpFall(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(58, 15);
  const GROUND = 10;
  // the first ground, a wall to jump, a step up, a plateau, and the low ground beyond
  g.row(GROUND, 0, 39, 'G').fill(0, GROUND + 1, 40, 4, 'D');
  g.fill(40, 8, 9, 1, 'G').fill(40, 9, 9, 6, 'D');
  g.row(12, 49, 57, 'G').fill(49, 13, 9, 2, 'D');
  g.col(0, 0, 9, 'X').col(57, 0, 11, 'X');
  // the entrance, and the door at the end
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(55, 10, 'e').put(55, 11, 'E');
  // a wall two blocks high: walking into it does nothing, so jump
  g.fill(34, 8, 2, 2, 'B');
  // coins to walk through, over the wall, and down the drop
  g.row(9, 21, 24, 'c').row(6, 34, 35, 'c').row(6, 45, 47, 'c').put(49, 7, 'c').put(50, 8, 'c').put(50, 9, 'c').put(51, 10, 'c').put(51, 11, 'c');
  // scenery
  for (const [x, y] of [
    [20, 2],
    [5, 1],
    [26, 3],
    [41, 1],
    [51, 2],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [12, 38, 56]) g.put(x, GROUND - 1 + (x > 48 ? 2 : 0), 'b');
  for (const x of [19, 32, 47]) g.put(x, x === 47 ? 7 : GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.start), signs.start);
  m.sign(14, onGround(GROUND, signs.walk), signs.walk);
  m.sign(28, onGround(GROUND, signs.jump), signs.jump);
  m.sign(41, 8 - 1 - signs.gravity.board.length, signs.gravity);
  m.sign(52, onGround(12, signs.exit), signs.exit);
  return m;
}

/** Level 2: climb and fall. 50 blocks wide; the ground is row 15. */
function climbAndFall(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = new Grid(50, 18);
  const GROUND = 15;
  g.row(GROUND, 0, 49, 'G').fill(0, GROUND + 1, 50, 2, 'D');
  // the ladder up to the first island, the island, and a lower island that joins the ground
  g.col(14, 7, 14, 'H');
  g.row(8, 15, 30, 'G').fill(15, 9, 16, 2, 'D');
  g.row(11, 31, 40, 'G').fill(31, 12, 10, 3, 'D');
  g.col(0, 0, 14, 'X').col(49, 0, 14, 'X');
  g.put(3, 13, 's').put(3, 14, 'S');
  g.put(46, 13, 'e').put(46, 14, 'E');
  // coins: along the island and down the drops
  g.row(6, 17, 21, 'c').row(7, 24, 28, 'c').put(31, 7, 'c').put(32, 8, 'c').put(33, 9, 'c').put(41, 10, 'c').put(42, 11, 'c').put(42, 12, 'c');
  for (const [x, y] of [
    [4, 2],
    [18, 1],
    [33, 3],
    [44, 1],
    [9, 5],
  ] as const)
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [11, 36, 48]) g.put(x, x === 36 ? 10 : GROUND - 1, 'b');
  for (const [x, y] of [
    [10, GROUND - 1],
    [22, 7],
  ] as const)
    g.put(x, y, 'f');
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.climb), signs.climb);
  m.sign(43, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'walk', title: 'Walk, Jump, Fall', hint: 'Read the signs.', map: walkJumpFall(book, signs) },
    { file: 'climb', title: 'Climb and Fall', hint: 'Ladders and drops.', map: climbAndFall(book, signs) },
  ];
  return { book, pal, levels };
}
