// MEET THE MONSTERS' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. Walk and Hurt: a gumdrop walks a path back and forth; a snail creeps and hurts when
//      touched. Jump over both.
//   2. Pop and Lives: two mint gumdrops sit at the bottom of a pit. Drop onto them and they
//      pop into stars. Game-Maker has no "top only" rule, so the pit is what makes the way in
//      from above; a hurting gumdrop and another pit follow.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { GRUMP, POP } from './monsters';

export type SignName = 'path' | 'hurts' | 'over' | 'land' | 'lives' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
export function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    path: addSign(book, pal, 'path', 'MONSTERS WALK A PATH', 4, 2),
    hurts: addSign(book, pal, 'hurts', 'TOUCHING HURTS', 4, 2),
    over: addSign(book, pal, 'over', 'JUMP OVER IT', 4, 2),
    land: addSign(book, pal, 'land', 'LAND ON TOP TO POP IT', 4, 2),
    lives: addSign(book, pal, 'lives', 'WATCH YOUR LIVES', 4, 2),
    exit: addSign(book, pal, 'exit', 'EXIT →', 3),
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

const GROUND = 10;

/** The ground, the side walls, the entrance on the left and the exit door at `exitX`. */
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

/** Level 1: a gumdrop walks a path, a snail hurts when touched. 46 blocks wide; the ground is row 10. */
function walkAndHurt(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  // the gumdrop (12 to 16) and the snail (33 to 35); coins above both, to jump for
  g.put(12, GROUND - 1, 'g').put(33, GROUND - 1, 'n');
  g.row(7, 13, 16, 'c').row(7, 33, 36, 'c');
  scenery(
    g,
    [
      [6, 2],
      [20, 1],
      [26, 3],
      [38, 1],
    ],
    [10, 23, 40],
    [9, 19, 30],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.path), signs.path);
  m.sign(18, onGround(GROUND, signs.over), signs.over);
  m.sign(26, onGround(GROUND, signs.hurts), signs.hurts);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Level 2: drop onto the mint gumdrops in a pit, mind a gumdrop that hurts. 46 blocks wide. */
function popAndLives(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  // two pits, two blocks wide and two deep, a pop gumdrop at the bottom of each side
  for (const x of [13, 35]) g.fill(x, GROUND, 2, 2, ' ');
  g.row(8, 13, 14, 'c').row(8, 35, 36, 'c').row(7, 26, 29, 'c');
  scenery(
    g,
    [
      [5, 1],
      [19, 2],
      [30, 1],
      [39, 3],
    ],
    [10, 31, 40],
    [8, 21, 33],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.land), signs.land);
  m.sign(16, onGround(GROUND, signs.lives), signs.lives);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  m.mon(GRUMP, 25, GROUND - 1);
  for (const x of [13, 14, 35, 36]) m.mon(POP, x, GROUND + 1);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Walk and Hurt', hint: 'Some monsters walk a path.', map: walkAndHurt(book, signs) },
    { file: 'two', title: 'Pop and Lives', hint: 'Land on a monster to pop it.', map: popAndLives(book, signs) },
  ];
  return { book, pal, levels };
}
