// DROP DOWN's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its crate, signs and monster.
//
// Both are a tunnel through a brick mound, three blocks high, with a crate standing in it and a monster
// sitting on the crate. In level 1 the monster is solid and the roof is low, so Lena can neither pass it nor
// hop over. Walk into the crate: it turns to rubble, the
// monster's Movement takes it down, and the tunnel is open. (Lena's own gravity is the
// engine's; a monster has none, see monsters.ts.)
//   1. In the Way: Plop, a fast faller, and a one-block hole. Plop drops into it in a blink and its back
//      is level with the floor, so Lena walks over it.
//   2. Slow and Soft: two crates stacked in the tunnel with Pip on top. Pip is slow (the Speed of its step
//      down is small) and soft (its picture is not solid), so after the bump it drifts down two blocks,
//      through Lena if he walks on. No hole this time.
// Both rooms are closed in by walls you can see, so Lena is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addCrateBlocks } from './blocks';
import { PIP, PLOP } from './monsters';

export type SignName = 'gate' | 'break' | 'why' | 'slow' | 'wait' | 'speed' | 'exit';

/** The block set both levels share: the Starter blocks, then this game's signs, crate and rubble. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    gate: addSign(book, pal, 'gate.sign', 'PLOP SITS ON A CRATE AND BLOCKS THE WAY', 4, 4),
    break: addSign(book, pal, 'break.sign', 'BREAK THE CRATE AND WHAT SITS ON IT FALLS', 4, 4),
    why: addSign(book, pal, 'why.sign', 'MONSTERS HAVE NO GRAVITY. PLOP STEPS DOWN OVER AND OVER', 4, 4),
    slow: addSign(book, pal, 'slow.sign', 'PIP IS THE SAME TRICK, BUT SLOW AND SOFT', 4, 4),
    wait: addSign(book, pal, 'wait.sign', 'BREAK BOTH CRATES AND WATCH PIP DRIFT DOWN', 4, 4),
    speed: addSign(book, pal, 'speed.sign', 'HOW FAST IT FALLS AND IF IT IS SOLID ARE SETTINGS', 4, 4),
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
/** The crate (the cork) stands in the tunnel's bottom row; the monster sits on it. */
export const CORK_ROW = GROUND - 1;
export const MON_ROW = CORK_ROW - 1;

/** What differs between the two rooms. */
interface Room {
  /** The mound's columns (left, right) and the hole's column. */
  mound: [number, number];
  holeX: number;
  /** How many blocks deep the hole is (0: none). */
  depth: number;
  /** How many crates stand one on another in the tunnel, the monster on the top one. */
  crates: number;
  monster: number;
  signs: [Sign, number][];
  coins: [number, number][];
  clouds: [number, number][];
  bushes: [number, number][];
  flowers: [number, number][];
}

/** The ground, brick walls at both ends (rows 0 to 9, so the room is closed in), the entrance on the left (x 3) and the exit door at x 42. */
function room(book: Book, width: number, r: Room): StarterMap {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'B').col(width - 1, 0, 9, 'B');
  g.put(3, 8, 's').put(3, 9, 'S').put(42, 8, 'e').put(42, 9, 'E');
  // the mound: three rows of brick under a grass top, with a tunnel three blocks high beneath it
  const [x0, x1] = r.mound;
  g.row(3, x0, x1, 'G').row(4, x0, x1, 'B').row(5, x0, x1, 'B').row(6, x0, x1, 'B');
  if (r.depth) g.fill(r.holeX, GROUND, 1, r.depth, ' ');
  for (const [x, y] of r.coins) g.put(x, y, 'c');
  for (const [x, y] of r.clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const [x, y] of r.bushes) g.put(x, y, 'b');
  for (const [x, y] of r.flowers) g.put(x, y, 'f');
  const m = new StarterMap(book, g.rows());
  for (let i = 0; i < r.crates; i++) m.set(r.holeX, CORK_ROW - i, 'crate');
  m.mon(r.monster, r.holeX, MON_ROW - r.crates + 1);
  for (const [s, x] of r.signs) m.sign(x, onGround(GROUND, s), s);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'drop-down');
  const { book, signs } = buildBlocks(pal);
  const one = room(book, 46, {
    mound: [19, 29],
    holeX: 24,
    depth: 1,
    crates: 1,
    monster: PLOP,
    signs: [
      [signs.gate, 6],
      [signs.break, 13],
      [signs.why, 32],
      [signs.exit, 38],
    ],
    coins: [
      [26, 9],
      [27, 9],
      [28, 9],
      [30, 9],
      [31, 9],
      [37, 9],
    ],
    clouds: [
      [6, 1],
      [13, 1],
      [33, 1],
      [39, 3],
    ],
    bushes: [
      [11, 9],
      [44, 9],
    ],
    flowers: [
      [18, 9],
      [21, 9],
    ],
  });
  const two = room(book, 46, {
    mound: [14, 24],
    holeX: 19,
    depth: 0,
    crates: 2,
    monster: PIP,
    signs: [
      [signs.slow, 5],
      [signs.wait, 9],
      [signs.speed, 27],
      [signs.exit, 38],
    ],
    coins: [
      [21, 9],
      [22, 9],
      [23, 9],
      [33, 9],
      [34, 9],
      [37, 9],
    ],
    clouds: [
      [5, 3],
      [22, 0],
      [34, 1],
      [40, 4],
    ],
    bushes: [
      [12, 9],
      [43, 9],
    ],
    flowers: [
      [16, 9],
      [25, 9],
    ],
  });
  const levels: Level[] = [
    { file: 'one', title: 'In the Way', hint: 'A friend sits on a crate.', map: one },
    { file: 'two', title: 'Slow and Soft', hint: 'A friend that drifts down.', map: two },
  ];
  return { book, pal, levels };
}
