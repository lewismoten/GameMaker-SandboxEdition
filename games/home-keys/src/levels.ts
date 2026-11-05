// HOME KEYS' three levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs, coins and jellies. No new blocks: what is new is in
// the hero's character file (hero.ts) and in which keys the levels ask for.
//
//   1. Arrows, Space, Enter: the arrows walk, Space jumps a wall, Enter throws a star at the jellies that
//                    block a tunnel. A sign stands before the first place each key is needed.
//   2. No Diagonal Needed: two gaps whose coins curve up and to the right, as if a diagonal key were needed.
//                    Space, then hold Right, is all it takes.
//   3. Leap Shelves: two shelves of coins too high for a jump. E leaps up and right onto one, Q up and left
//                    onto the other. They are extra: the way to the door is flat.
// Every edge is a hedge or a wall you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { JELLY } from './monsters';

export type SignName = 'walk' | 'jump' | 'throw' | 'exit' | 'arc' | 'higher' | 'shelves' | 'old';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  walk: { text: 'THE ARROW KEYS WALK. A AND D WALK TOO', w: 4, h: 3 },
  jump: { text: 'SPACE JUMPS. HOLD AN ARROW TOO, TO JUMP THAT WAY', w: 4, h: 4 },
  throw: { text: 'A JELLY BLOCKS THE TUNNEL. ENTER THROWS A STAR', w: 4, h: 4 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
  arc: { text: 'THE COINS CURVE UP AND RIGHT. NO DIAGONAL KEY NEEDED', w: 4, h: 4 },
  higher: { text: 'SPACE, THEN HOLD RIGHT. THAT IS THE SAME CURVE', w: 4, h: 4 },
  shelves: { text: 'EXTRA COINS UP HIGH. E LEAPS UP AND RIGHT, Q UP AND LEFT', w: 4, h: 4 },
  old: { text: 'OLD KEYBOARDS HAD 7 AND 9 ON THE NUMBER PAD FOR THIS', w: 4, h: 4 },
};

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

const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** Level 1: the ground row, the width, the wall's columns and top row, the hill's columns (a tunnel two blocks high through it), the jellies' columns, the exit column and the coins. */
export const L1 = {
  ground: 12,
  width: 62,
  wall: [17, 19],
  wallTop: 9,
  hill: [30, 50],
  jellies: [36, 43],
  exit: 57,
  coins: [
    [18, 8],
    [33, 11],
    [47, 11],
    [49, 11],
    [52, 11],
  ],
} as const;
/** Level 2: the ground row, the width, each gap's [first, last] column and the first ground column and its rows above the old ground (the step), the exit column and the coins. */
export const L2 = {
  ground: 12,
  width: 60,
  pits: [
    [14, 15],
    [36, 38],
  ],
  depth: 2,
  /** The ground past the first gap is one block higher, to column 27. */
  step: { from: 16, to: 27, rise: 1 },
  exit: 55,
  coins: [
    [14, 9],
    [15, 8],
    [17, 9],
    [19, 10],
    [35, 10],
    [37, 9],
    [39, 10],
    [45, 11],
  ],
} as const;
/** Level 3: the ground row, the width, the two shelves' [first, last] columns and top row, the exit column and the coins. */
export const L3 = {
  ground: 13,
  width: 66,
  shelfE: [20, 25],
  shelfQ: [40, 45],
  shelfTop: 9,
  exit: 61,
  coinsE: [
    [21, 8],
    [23, 8],
    [25, 8],
  ],
  coinsQ: [
    [40, 8],
    [42, 8],
    [44, 8],
  ],
  coins: [
    [10, 12],
    [32, 12],
    [52, 12],
  ],
} as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: a wall for Space, a tunnel with two jellies for Enter. */
function arrowsSpaceEnter(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L1.ground;
  const g = new Grid(L1.width, G + 3);
  g.row(G, 0, L1.width - 1, 'G').fill(0, G + 1, L1.width, 2, 'D');
  g.col(0, 0, G - 1, 'X').col(L1.width - 1, 0, G - 1, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  // the wall: three blocks high, grass on top
  g.fill(L1.wall[0], L1.wallTop + 1, L1.wall[1] - L1.wall[0] + 1, G - L1.wallTop - 1, 'D').row(L1.wallTop, L1.wall[0], L1.wall[1], 'G');
  // the hill with a tunnel two blocks high, so Kit cannot hop over a jelly
  const [h0, h1] = L1.hill;
  g.fill(h0, G - 5, h1 - h0 + 1, 3, 'B').row(G - 6, h0, h1, 'G');
  g.put(L1.exit, G - 2, 'e').put(L1.exit, G - 1, 'E');
  for (const [x, y] of L1.coins) g.put(x, y, 'c');
  scenery(g, G, [[8, 2], [26, 1], [54, 3]], [8, 24, 59], [10, 22, 60]);
  const m = new StarterMap(book, g.rows());
  for (const x of L1.jellies) m.mon(JELLY, x, G - 1);
  m.sign(6, onGround(G, signs.walk), signs.walk);
  m.sign(12, onGround(G, signs.jump), signs.jump);
  m.sign(25, onGround(G, signs.throw), signs.throw);
  m.sign(53, onGround(G, signs.exit), signs.exit);
  return m;
}

/** Level 2: two gaps with an arc of coins over each, the first with ground two blocks higher beyond it. */
function noDiagonal(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const rows = G + 5;
  const g = new Grid(L2.width, rows);
  g.row(G, 0, L2.width - 1, 'G').fill(0, G + 1, L2.width, rows - G - 1, 'D');
  g.col(0, 0, G - 1, 'X').col(L2.width - 1, 0, G - 1, 'X');
  const { from, to, rise } = L2.step;
  g.fill(from, G - rise, to - from + 1, rise, 'D').row(G - rise, from, to, 'G');
  for (const [a, b] of L2.pits) g.fill(a, G, b - a + 1, L2.depth, ' ');
  // the step's blocks over the first gap's far side are dirt; the first gap's far wall shows as dirt too
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L2.exit, G - 2, 'e').put(L2.exit, G - 1, 'E');
  for (const [x, y] of L2.coins) g.put(x, y, 'c');
  scenery(g, G, [[7, 2], [28, 1], [48, 3]], [9, 31, 44], [11, 33, 42]);
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(G, signs.arc), signs.arc);
  m.sign(29, onGround(G, signs.higher), signs.higher);
  m.sign(51, onGround(G, signs.exit), signs.exit);
  return m;
}

/** Level 3: flat ground to the door, with a shelf of coins on each side of the way, too high for Space alone. */
function leapShelves(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L3.ground;
  const g = new Grid(L3.width, G + 3);
  g.row(G, 0, L3.width - 1, 'G').fill(0, G + 1, L3.width, 2, 'D');
  g.col(0, 0, G - 1, 'X').col(L3.width - 1, 0, G - 1, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L3.exit, G - 2, 'e').put(L3.exit, G - 1, 'E');
  for (const [a, b] of [L3.shelfE, L3.shelfQ]) g.row(L3.shelfTop, a, b, '=');
  for (const [x, y] of [...L3.coins, ...L3.coinsE, ...L3.coinsQ]) g.put(x, y, 'c');
  scenery(g, G, [[8, 2], [30, 1], [55, 3]], [13, 31, 48], [15, 34, 50]);
  const m = new StarterMap(book, g.rows());
  m.sign(8, onGround(G, signs.shelves), signs.shelves);
  m.sign(28, onGround(G, signs.old), signs.old);
  m.sign(57, onGround(G, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Arrows, Space, Enter', hint: 'Walk, jump, throw.', map: arrowsSpaceEnter(book, signs) },
    { file: 'two', title: 'No Diagonal Needed', hint: 'Space, then hold Right.', map: noDiagonal(book, signs) },
    { file: 'three', title: 'Leap Shelves', hint: 'Q and E, only for extras.', map: leapShelves(book, signs) },
  ];
  return { book, pal, levels };
}
