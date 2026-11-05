// KIT DUCKS' two levels, each painted on a Grid (a block a character; see games/kit/starter/map.ts for the letters) and
// then given its signs, its roof, its poles, its coins and its fliers. What is new is in Kit's character file (hero.ts: a
// crouch frame with no top picture) and in where the fliers are put: a bird in the ROW OF KIT'S HEAD, a ball in the row of his feet.
//
//   1. Head Height: three bluebirds patrol under a low awning. The awning is too low to hop over (a hop gets Kit one block
//                   higher, and a bird still fills the row he lands in), so each bird is passed by ducking: Down, and the bird flies over.
//   2. High or Low: a bird at head height again (duck), a ball rolling on the ground (hop with Space: a duck is still on
//                   the ground, so it does not help), and one of each, one after the other.
// Every edge is a hedge or a wall you can see, and every roof is a drawn awning on drawn poles, so nothing is invisible.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { MONS } from './monsters';

/** A flier's kind as `[column, MONS number]` gives it: the name for `patrol()`. */
export const KIND = ['bird', 'birdQuick', 'ball', 'ballQuick'] as const;

export type SignName = 'duck' | 'roof' | 'walk' | 'exit' | 'height' | 'ball' | 'both';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  duck: { text: 'A BIRD FLIES AT HEAD HEIGHT. HOLD DOWN AND KIT DUCKS UNDER IT', w: 4, h: 4 },
  roof: { text: 'THE ROOF IS TOO LOW TO HOP OVER. DUCK AS EACH BIRD PASSES', w: 4, h: 4 },
  walk: { text: 'LET GO OF DOWN AND KIT STANDS. WALK ON TO THE DOOR', w: 4, h: 4 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
  height: { text: 'HIGH BIRD, SO DUCK. LOW BALL, SO HOP WITH SPACE', w: 4, h: 4 },
  ball: { text: 'A DUCK IS STILL ON THE GROUND. A BALL ROLLS UNDER YOU: HOP', w: 4, h: 4 },
  both: { text: 'A BIRD, THEN A BALL. DUCK, THEN HOP', w: 4, h: 4 },
};

/** The block set the levels share: the Starter blocks, this game's awning and pole, then its signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const { c, r } = pal;
  const red = r('red');
  const white = r('white');
  const wood = r('wood');
  // the awning: red and white stripes with a scalloped, darker lower edge (a roof you can see and cannot walk through)
  const awning = new Pixels(20, 20, red[2]);
  for (let x = 0; x < 20; x++) if (Math.floor(x / 5) % 2 === 1) awning.rect(x, 0, 1, 14, white[3]);
  bevel(awning, 0, 0, 20, 3, red, red[3], 1, [1, 1, -1, -1]);
  for (let x = 0; x < 20; x++) {
    const stripe = Math.floor(x / 5) % 2 === 1;
    const base = stripe ? white[3] : red[2];
    const scallop = Math.round(3 * Math.sin(((x % 5) + 0.5) * (Math.PI / 5)));
    awning.rect(x, 14, 1, 2 + scallop, base).set(x, 13, stripe ? white[2] : red[1]);
    awning.set(x, 16 + scallop, c('ink', 0));
  }
  for (let x = 0; x < 20; x += 5) awning.rect(x, 0, 1, 14, c('ink', 1));
  awning.rect(0, 0, 20, 1, c('ink', 0));
  book.add('awning', awning, { solid: SOLID });
  // the pole: thin and wooden, standing behind Kit (not solid: he walks past it)
  const pole = new Pixels(20, 20, skyOf(pal));
  pole.rect(8, 0, 4, 20, wood[2]).rect(8, 0, 1, 20, wood[4]).rect(11, 0, 1, 20, wood[0]);
  book.add('pole', pole, { grav: 4 });
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

/**
 * Level 1: the ground row, the width, the awning's first and last column, the row of its blocks, the poles' columns,
 * the birds (column, then kind: slow `bird` or `birdQuick`), the exit column and the coins (all on the ground).
 */
export const L1 = {
  ground: 11,
  width: 62,
  roof: [14, 51],
  roofRow: 7,
  poles: [14, 51],
  birds: [
    [16, MONS.bird],
    [28, MONS.bird],
    [40, MONS.birdQuick],
  ],
  exit: 58,
  coins: [20, 26, 32, 38, 44, 49],
} as const;
/**
 * Level 2: the ground row, the width, the high-bird lane's awning (first, last column), the birds, the balls and their
 * columns, the last lane's roof, bird and ball, the exit column and the coins (column, row).
 */
export const L2 = {
  ground: 11,
  width: 82,
  roof: [14, 27],
  roofRow: 7,
  poles: [14, 27],
  birds: [[16, MONS.birdQuick]],
  balls: [[34, MONS.ball]],
  both: { roof: [48, 61], bird: [50, MONS.bird], ball: [64, MONS.ball] },
  exit: 78,
  coins: [
    [22, 10],
    [30, 10],
    [45, 10],
    [52, 10],
    [56, 10],
    [75, 10],
  ],
} as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** A grass field with hedges at both ends, ground row G, `rows` tall. */
function field(width: number, G: number, rows: number): Grid {
  const g = new Grid(width, rows);
  g.row(G, 0, width - 1, 'G').fill(0, G + 1, width, rows - G - 1, 'D');
  g.col(0, 0, G - 1, 'X').col(width - 1, 0, G - 1, 'X');
  return g;
}

/** An awning from column `a` to `b` at `row`, on a pole at each end that reaches the ground. */
function awning(m: StarterMap, a: number, b: number, row: number, ground: number): void {
  for (let x = a; x <= b; x++) m.set(x, row, 'awning');
  for (const x of [a, b]) for (let y = row + 1; y < ground; y++) m.set(x, y, 'pole');
}

/** Level 1: three birds under one low awning. */
function headHeight(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L1.ground;
  const g = field(L1.width, G, G + 3);
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L1.exit, G - 2, 'e').put(L1.exit, G - 1, 'E');
  for (const x of L1.coins) g.put(x, G - 1, 'c');
  scenery(
    g,
    G,
    [
      [8, 2],
      [26, 1],
      [44, 2],
    ],
    [7, 12, 54],
    [10, 56],
  );
  const m = new StarterMap(book, g.rows());
  awning(m, L1.roof[0], L1.roof[1], L1.roofRow, G);
  // birds fly in the row of Kit's head: his top block is row G-2
  for (const [x, kind] of L1.birds) m.mon(kind, x, G - 2);
  m.sign(5, onGround(G, signs.duck), signs.duck);
  m.sign(9, onGround(G, signs.roof), signs.roof);
  m.sign(L1.roof[1] + 2, onGround(G, signs.walk), signs.walk);
  return m;
}

/** Level 2: a high bird, a low ball, and one after the other. */
function highOrLow(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const g = field(L2.width, G, G + 3);
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L2.exit, G - 2, 'e').put(L2.exit, G - 1, 'E');
  for (const [x, y] of L2.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [7, 2],
      [32, 1],
      [60, 3],
    ],
    [10, 40, 70],
    [12, 42, 72],
  );
  const m = new StarterMap(book, g.rows());
  awning(m, L2.roof[0], L2.roof[1], L2.roofRow, G);
  awning(m, L2.both.roof[0], L2.both.roof[1], L2.roofRow, G);
  for (const [x, kind] of L2.birds) m.mon(kind, x, G - 2);
  // a ball rolls in the row of Kit's feet: his bottom block is row G-1
  for (const [x, kind] of L2.balls) m.mon(kind, x, G - 1);
  m.mon(L2.both.bird[1], L2.both.bird[0], G - 2);
  m.mon(L2.both.ball[1], L2.both.ball[0], G - 1);
  m.sign(6, onGround(G, signs.height), signs.height);
  m.sign(29, onGround(G, signs.ball), signs.ball);
  m.sign(44, onGround(G, signs.both), signs.both);
  m.sign(L2.exit - 4, onGround(G, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Head Height', hint: 'Down, and the bird flies over.', map: headHeight(book, signs) },
    { file: 'two', title: 'High or Low', hint: 'Duck for the bird, hop for the ball.', map: highOrLow(book, signs) },
  ];
  return { book, pal, levels };
}
