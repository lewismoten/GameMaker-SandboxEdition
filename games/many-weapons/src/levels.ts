// ONE KEY, MANY WEAPONS' two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, pouches (monsters) and gumdrops.
//
//   1. Empty Hands: Enter does nothing but shrug until Lena touches a pouch, and a pouch holds two stars.
//                   Three mint gumdrops stand in a row, so the third needs the pouch again (it fills up).
//   2. Star or Flame: a wall with a tunnel, and two frosty grumps in it that a star cannot melt. A flame
//                   pouch sits up on a ledge. Flames go before stars, and a star is thrown when the flames
//                   are gone.
// Both rooms are closed in by brick walls you can see, so Lena is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { FLAME_POUCH, FROSTY, STAR_POUCH, TARGET } from './monsters';

export type SignName = 'empty' | 'pouch' | 'out' | 'frost' | 'flame' | 'order' | 'exit';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  empty: { text: 'NOTHING TO THROW YET. ENTER JUST SHRUGS', w: 4, h: 4 },
  pouch: { text: 'WALK INTO THE POUCH FOR TWO STARS. ENTER THROWS ONE', w: 4, h: 4 },
  out: { text: 'OUT OF STARS? ENTER SHRUGS AGAIN. THE POUCH FILLS UP', w: 4, h: 4 },
  frost: { text: "A STAR CAN'T MELT FROST. TAKE STARS AND TRY", w: 4, h: 4 },
  flame: { text: 'A FLAME CAN. JUMP UP TO THE FLAME POUCH', w: 4, h: 4 },
  order: { text: 'FLAMES GO FIRST. WHEN THEY ARE GONE, ENTER THROWS A STAR', w: 4, h: 4 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
};

/** The block set both levels share: the Starter blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const n of Object.keys(WORDS) as SignName[]) signs[n] = addSign(book, pal, `${n}.sign`, WORDS[n].text, WORDS[n].w, WORDS[n].h);
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

/** Level 1: the star pouch's column, the three targets' columns and the exit's. */
export const L1 = {
  width: 46,
  exit: 42,
  pouch: 12,
  targets: [20, 27, 33],
  coins: [
    [23, 9],
    [24, 9],
    [36, 9],
    [37, 9],
  ],
} as const;
/** Level 2: the star pouch's column, the flame pouch's column and ledge, the wall (first, last column), the two frosty grumps, the target and the exit. */
export const L2 = {
  width: 50,
  exit: 46,
  starPouch: 10,
  flamePouch: 17,
  ledge: [16, 18],
  ledgeRow: 8,
  wall: [24, 31],
  frosty: [26, 29],
  target: 38,
  coins: [
    [14, 9],
    [21, 9],
    [35, 9],
    [41, 9],
  ],
} as const;

/** Level 1: a pouch, and three mint gumdrops in a row. 46 blocks wide; the ground is row 10. */
function emptyHands(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(L1.width, L1.exit);
  for (const [x, y] of L1.coins) g.put(x, y, 'c');
  scenery(
    g,
    [
      [6, 2],
      [18, 1],
      [30, 3],
      [38, 1],
    ],
    [9, 27, 41],
    [8, 29, 31],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(GROUND, signs.empty), signs.empty);
  m.mon(STAR_POUCH, L1.pouch, STAND);
  m.sign(14, onGround(GROUND, signs.pouch), signs.pouch);
  m.sign(22, onGround(GROUND, signs.out), signs.out);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  for (const x of L1.targets) m.mon(TARGET, x, STAND);
  return m;
}

/** Level 2: two frosty grumps in a tunnel through a brick wall, a star pouch on the ground and a flame pouch on a ledge. 50 blocks wide. */
function starOrFlame(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(L2.width, L2.exit);
  // the wall: brick from the top of the room down to a two-block-high tunnel (rows 8 and 9)
  g.fill(L2.wall[0], 0, L2.wall[1] - L2.wall[0] + 1, 8, 'B');
  // the ledge for the flame pouch: planks, stood on from above and jumped up through from below
  g.row(L2.ledgeRow, L2.ledge[0], L2.ledge[1], '=');
  for (const [x, y] of L2.coins) g.put(x, y, 'c');
  scenery(
    g,
    [
      [6, 2],
      [14, 1],
      [34, 2],
      [42, 4],
    ],
    [8, 22, 43],
    [12, 33, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.frost), signs.frost);
  m.mon(STAR_POUCH, L2.starPouch, STAND);
  m.sign(12, onGround(GROUND, signs.flame), signs.flame);
  m.mon(FLAME_POUCH, L2.flamePouch, L2.ledgeRow - 1);
  m.sign(20, onGround(GROUND, signs.order), signs.order);
  m.sign(42, onGround(GROUND, signs.exit), signs.exit);
  for (const x of L2.frosty) m.mon(FROSTY, x, STAND);
  m.mon(TARGET, L2.target, STAND);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'many-weapons');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Empty Hands', hint: 'Walk into a pouch for stars.', map: emptyHands(book, signs) },
    { file: 'two', title: 'Star or Flame', hint: 'Flames first, then stars.', map: starOrFlame(book, signs) },
  ];
  return { book, pal, levels };
}
