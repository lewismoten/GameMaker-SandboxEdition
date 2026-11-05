// BIG BUG's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its monsters.
//
//   1. Five Hits: a brick wall with a low tunnel through it and Big Bug sitting in the tunnel with no
//      room to go around. Nothing on it shows how many hits it has left: count your stars. Touching
//      it only stings a little.
//   2. Count the Lights: the same bug in a tunnel again, now with five lights on its shell. Each hit
//      puts one out, so the picture is a meter. When the last goes out it poofs and the way opens.
// Both rooms are closed in by brick walls you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { LAMPED, PLAIN } from './monsters';

export type SignName = 'meet' | 'sting' | 'lights' | 'poof' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    meet: addSign(book, pal, 'meet.sign', 'BIG BUG TAKES FIVE HITS', 4, 3),
    sting: addSign(book, pal, 'sting.sign', 'TOUCHING IT ONLY STINGS', 4, 3),
    lights: addSign(book, pal, 'lights.sign', 'A LIGHT GOES OUT EACH HIT', 4, 3),
    poof: addSign(book, pal, 'poof.sign', 'THE LAST ONE MAKES IT POOF', 4, 3),
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

/** Where Big Bug sits in each level, and the tunnel it blocks (a brick wall from x 22 to 29, and 30 to 37). */
export const BUG_X = [26, 34] as const;
export const TUNNELS = [
  [22, 29],
  [30, 37],
] as const;

/** Paints a wall with a two-block tunnel (rows 8 and 9) across `tunnel`. */
function wall(g: Grid, tunnel: readonly [number, number]): void {
  g.fill(tunnel[0], 0, tunnel[1] - tunnel[0] + 1, 8, 'B');
}

/** Level 1: Big Bug, plain, fills a tunnel. 46 blocks wide; the ground is row 10. */
function fiveHits(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  wall(g, TUNNELS[0]);
  g.row(9, 14, 15, 'c').row(9, 18, 19, 'c').row(9, 32, 35, 'c');
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
  m.sign(6, onGround(GROUND, signs.meet), signs.meet);
  m.sign(11, onGround(GROUND, signs.sting), signs.sting);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  m.mon(PLAIN, BUG_X[0], STAND);
  return m;
}

/** Level 2: Big Bug with five lights, in a tunnel a little farther along. 46 blocks wide. */
function countTheLights(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 43);
  wall(g, TUNNELS[1]);
  g.row(9, 12, 14, 'c').row(9, 20, 21, 'c').row(9, 39, 40, 'c');
  scenery(
    g,
    [
      [6, 2],
      [16, 1],
      [26, 3],
      [40, 1],
    ],
    [10, 18, 41],
    [8, 24, 28],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.lights), signs.lights);
  m.sign(16, onGround(GROUND, signs.poof), signs.poof);
  m.sign(39, onGround(GROUND, signs.exit), signs.exit);
  m.mon(LAMPED, BUG_X[1], STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Five Hits', hint: 'Count your stars.', map: fiveHits(book, signs) },
    { file: 'two', title: 'Count the Lights', hint: 'Watch the shell.', map: countTheLights(book, signs) },
  ];
  return { book, pal, levels };
}
