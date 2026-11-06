// SLIDE AND DRIFT's two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs and coins. No new blocks: what is new is in the hero's
// character file (hero.ts), whose walking steps add to Yana's speed instead of moving her.
//
//   1. Glide: a flat rink. A tap of Right and she glides on; holding makes her faster, and so a longer glide;
//             Left turns her around. The door is at the end.
//   2. Run-Up: three gaps, each wider than the last, too wide for a hop from standing. Her speed from a run
//             carries the hop across.
// Every edge is a hedge or a wall you can see, so Yana is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

export type SignName = 'glide' | 'faster' | 'turn' | 'exit' | 'run' | 'longer' | 'last';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  glide: { text: 'TAP RIGHT AND LET GO. YANA GLIDES ON', w: 4, h: 4 },
  faster: { text: 'HOLD IT LONGER AND THEY GO FASTER', w: 4, h: 4 },
  turn: { text: 'LET GO AND THEY SLOW. LEFT TURNS THEM AROUND', w: 4, h: 4 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
  run: { text: 'A STANDING HOP GOES NOWHERE. HOLD RIGHT TOO', w: 4, h: 4 },
  longer: { text: 'A WIDER GAP NEEDS A RUN-UP FIRST', w: 4, h: 4 },
  last: { text: 'THE WIDEST. RUN, THEN HOP AT THE EDGE', w: 4, h: 4 },
};

/** The block set the levels share: the Starter blocks, then this game's signs. */
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

/** Level 1: the ground row, the width, the exit column and the coins (all on the floor, one row above the ground). */
export const L1 = {
  ground: 11,
  width: 60,
  exit: 52,
  coins: [10, 13, 22, 25, 28, 40, 43],
} as const;
/** Level 2: the ground row, the width, the pits' [first, last] columns, how deep they are, the exit column and the coins. */
export const L2 = {
  ground: 11,
  width: 96,
  pits: [
    [20, 24],
    [42, 49],
    [66, 75],
  ],
  depth: 2,
  exit: 88,
  coins: [
    [22, 7],
    [45, 7],
    [46, 7],
    [70, 7],
    [71, 7],
    [80, 10],
  ],
} as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: a flat rink and a wall at the end. */
function glide(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L1.ground;
  const g = new Grid(L1.width, G + 3);
  g.row(G, 0, L1.width - 1, 'G').fill(0, G + 1, L1.width, 2, 'D');
  g.col(0, 0, G - 1, 'X').col(L1.width - 1, 0, G - 1, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L1.exit, G - 2, 'e').put(L1.exit, G - 1, 'E');
  for (const x of L1.coins) g.put(x, G - 1, 'c');
  scenery(
    g,
    G,
    [
      [8, 2],
      [22, 1],
      [38, 3],
    ],
    [18, 35],
    [20, 37],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(G, signs.glide), signs.glide);
  m.sign(16, onGround(G, signs.faster), signs.faster);
  m.sign(33, onGround(G, signs.turn), signs.turn);
  m.sign(55, onGround(G, signs.exit), signs.exit);
  return m;
}

/** Level 2: three gaps, each wider, crossed with a hop at speed. */
function runUp(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const rows = G + 5;
  const g = new Grid(L2.width, rows);
  g.row(G, 0, L2.width - 1, 'G').fill(0, G + 1, L2.width, rows - G - 1, 'D');
  g.col(0, 0, G - 1, 'X').col(L2.width - 1, 0, G - 1, 'X');
  for (const [a, b] of L2.pits) g.fill(a, G, b - a + 1, L2.depth, ' ');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L2.exit, G - 2, 'e').put(L2.exit, G - 1, 'E');
  for (const [x, y] of L2.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [7, 2],
      [30, 1],
      [58, 3],
      [80, 2],
    ],
    [12, 33, 56, 84],
    [14, 38, 58, 86],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(G, signs.run), signs.run);
  m.sign(36, onGround(G, signs.longer), signs.longer);
  m.sign(60, onGround(G, signs.last), signs.last);
  m.sign(91, onGround(G, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'momentum');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Glide', hint: 'Tap, and let them coast.', map: glide(book, signs) },
    { file: 'two', title: 'Run-Up', hint: 'Get up to speed, then hop.', map: runUp(book, signs) },
  ];
  return { book, pal, levels };
}
