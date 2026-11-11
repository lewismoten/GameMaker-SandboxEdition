// BOOTS AND JET PACK's two levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, coins and (level 2) boot charges.
//
//   1. Jet Pack: Nova as she is, with an unlimited jump. A tap in the air lifts her again, so tapping keeps her
//                rising: up a tall cliff, then across a gap on the top.
//   2. Double-Jump Boots: the same Nova with only two taps (hero2.chr). Each step is too tall for one jump and
//                fine for two; blue bubbles (boot charges, three in a row, one tap each) fill the boots up. A bubble
//                is used up when touched. A ladder in the pit leads back out for anyone who falls.
// Every edge is a hedge or a wall you can see, so Nova is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addBootBlocks } from './bootBlocks';

export type SignName = 'rise' | 'fly' | 'exit' | 'two' | 'third' | 'step' | 'gap';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  rise: { text: 'TAP SPACE IN THE AIR AND NOVA RISES AGAIN', w: 4, h: 3 },
  fly: { text: 'HOLD RIGHT, KEEP TAPPING, FLY ACROSS', w: 4, h: 3 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
  two: { text: 'THESE BOOTS HOLD TWO JUMPS. EACH TAP USES ONE', w: 4, h: 3 },
  third: { text: 'NO JUMPS LEFT? WALK INTO A BLUE BUBBLE', w: 4, h: 3 },
  step: { text: 'TOO TALL FOR ONE JUMP. TAP AGAIN', w: 4, h: 3 },
  gap: { text: 'TWO TAPS CROSS IT. FILL UP FIRST', w: 4, h: 3 },
};

/** The block set the levels share: the Starter blocks, the boot charges, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addBootBlocks(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const n of Object.keys(WORDS) as SignName[]) signs[n] = addSign(book, pal, `${n}.sign`, WORDS[n].text, WORDS[n].w, WORDS[n].h);
  return { book, signs };
}

export interface Level {
  file: string;
  /** The character file the level loads: hero.chr (jump unlimited) or hero2.chr (two taps). */
  hero: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

/** Where a sign's board starts so its posts stand on `surface`, the row of the ground it stands on. */
const onTop = (surface: number, s: Sign) => surface - 1 - s.board.length;

/** Level 1: the ground row, the cliff's top row, its columns, the gap, the far side, the width, the exit and the coins [column, row]. */
export const L1 = {
  ground: 24,
  top: 6,
  cliff: [20, 33],
  gap: [34, 43],
  far: [44, 60],
  width: 62,
  exit: 56,
  coins: [
    [19, 19],
    [19, 15],
    [19, 11],
    [19, 7],
    [38, 3],
    [41, 3],
    [50, 4],
    [53, 4],
  ],
} as const;

/** Level 2: the ground row, the step heights (rows), the towers' [first, last] columns, the pit, the pods' [column, row], the exit and the coins. */
export const L2 = {
  ground: 16,
  step: 5,
  width: 70,
  tower1: [28, 30],
  pit: [44, 49],
  depth: 2,
  stair1: [55, 60],
  stair2: [61, 68],
  exit: 66,
  /** Boot charges: [first column, last column, row] of each row of them. */
  pods: [
    [15, 17, 15],
    [32, 34, 15],
    [40, 42, 15],
    [51, 53, 15],
    [56, 58, 10],
  ],
  /** The ladder out of the pit, in its first column (its top sticks up one block above the ground). */
  ladder: 44,
  coins: [
    [29, 10],
    [36, 15],
    [54, 15],
    [59, 10],
    [62, 5],
  ],
} as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: a tall cliff, a gap on top, and the door on the far side. */
function jetPack(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L1.ground;
  const T = L1.top;
  const g = new Grid(L1.width, G + 4);
  g.row(G, 0, L1.width - 1, 'G').fill(0, G + 1, L1.width, 3, 'D');
  g.col(0, 0, G - 1, 'X').col(L1.width - 1, 0, G - 1, 'X');
  for (const [a, b] of [L1.cliff, L1.far]) g.row(T, a, b, 'G').fill(a, T + 1, b - a + 1, G - T - 1, 'D');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L1.exit, T - 2, 'e').put(L1.exit, T - 1, 'E');
  for (const [x, y] of L1.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [8, 2],
      [26, 1],
      [48, 2],
    ],
    [11, 16],
    [9, 17],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onTop(G, signs.rise), signs.rise);
  m.sign(L1.cliff[0] + 2, onTop(T, signs.fly), signs.fly);
  m.sign(L1.exit + 2, onTop(T, signs.exit), signs.exit);
  return m;
}

/** A tower: grass on top at `top`, dirt below it down to the ground, from column a to b. */
function tower(g: Grid, a: number, b: number, top: number, ground: number): void {
  g.row(top, a, b, 'G').fill(a, top + 1, b - a + 1, ground - top - 1, 'D');
}

/** Level 2: a tall step, a pit, and a staircase of two, with boot charges between. */
function boots(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const rows = G + 5;
  const g = new Grid(L2.width, rows);
  g.row(G, 0, L2.width - 1, 'G').fill(0, G + 1, L2.width, rows - G - 1, 'D');
  g.col(0, 0, G - 1, 'X').col(L2.width - 1, 0, G - 1, 'X');
  g.fill(L2.pit[0], G, L2.pit[1] - L2.pit[0] + 1, L2.depth, ' ');
  g.col(L2.ladder, G - 1, G + L2.depth - 1, 'H');
  tower(g, L2.tower1[0], L2.tower1[1], G - L2.step, G);
  tower(g, L2.stair1[0], L2.stair1[1], G - L2.step, G);
  tower(g, L2.stair2[0], L2.stair2[1], G - 2 * L2.step, G);
  g.put(2, G - 2, 's').put(2, G - 1, 'S');
  g.put(L2.exit, G - 2 * L2.step - 2, 'e').put(L2.exit, G - 2 * L2.step - 1, 'E');
  for (const [x, y] of L2.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [8, 3],
      [38, 2],
      [52, 4],
    ],
    [18, 26, 41],
    [19, 34, 48],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(4, onTop(G, signs.two), signs.two);
  m.sign(10, onTop(G, signs.third), signs.third);
  m.sign(20, onTop(G, signs.step), signs.step);
  m.sign(35, onTop(G, signs.gap), signs.gap);
  m.sign(L2.stair2[0] + 2, onTop(G - 2 * L2.step, signs.exit), signs.exit);
  for (const [a, b, y] of L2.pods) for (let x = a; x <= b; x++) m.set(x, y, 'pod');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'jump-boots');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', hero: 'hero.chr', title: 'Jet Pack', hint: 'Tap in the air to rise.', map: jetPack(book, signs) },
    { file: 'two', hero: 'hero2.chr', title: 'Double-Jump Boots', hint: 'Two taps, then fill up.', map: boots(book, signs) },
  ];
  return { book, pal, levels };
}
