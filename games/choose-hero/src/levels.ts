// WHO TO BE?'s two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs and coins. No new blocks: what is new is in the scenes
// (game.ts): a scene lists the character file it loads, so two doors can lead to the same level with two heroes.
//
//   1. Two Doors:     a small room. The left door goes to the climb with FAST FEET, the right door to the same climb with BIG HOPS.
//   2. The Same Climb: two steps up to a plateau, then a drop and the exit door. Every hero can take the steps; only
//                    BIG HOPS can hop from the ground to the plateau, and only BIG HOPS can reach the high coins.
// Every edge is a hedge or a wall you can see, so nobody is stopped by something they can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

export type SignName = 'pick' | 'fast' | 'big' | 'steps' | 'hop' | 'high' | 'exit';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  pick: { text: 'TWO DOORS, TWO HEROES. THE SAME LEVEL BEHIND BOTH', w: 4, h: 4 },
  fast: { text: 'FAST FEET. RUNS QUICKLY, JUMPS LIKE KIT', w: 4, h: 4 },
  big: { text: 'BIG HOPS. SLOW FEET, JUMPS SIX BLOCKS', w: 4, h: 4 },
  steps: { text: 'STEPS UP. EVERY HERO CAN TAKE THEM', w: 4, h: 4 },
  hop: { text: 'BIG HOPS CAN SKIP A STEP. FAST FEET TAKES THEM ALL', w: 4, h: 4 },
  high: { text: 'HIGH COINS NEED BIG HOPS. TRY THE OTHER DOOR', w: 4, h: 4 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
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

/** Level 1: the ground row, the width, the two doors' columns and the coins. */
export const L1 = {
  ground: 12,
  width: 36,
  doors: [3, 32],
  coins: [
    [11, 10],
    [17, 10],
    [22, 10],
    [29, 10],
  ],
} as const;
/** Level 2: the ground row, the width, the steps' [first, last] columns and heights, the plateau, the exit column and the coins. */
export const L2 = {
  ground: 17,
  width: 58,
  steps: [
    { cols: [14, 16], height: 2 },
    { cols: [17, 19], height: 3 },
  ],
  plateau: { cols: [20, 29], height: 4 },
  exit: 51,
  low: [
    [13, 15],
    [28, 12],
    [18, 12],
    [34, 15],
    [41, 15],
  ],
  high: [
    [23, 6],
    [25, 6],
    [27, 6],
  ],
} as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: a room with two doors. */
function twoDoors(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L1.ground;
  const g = new Grid(L1.width, G + 3);
  g.row(G, 0, L1.width - 1, 'G').fill(0, G + 1, L1.width, 2, 'D');
  g.col(0, 0, G - 1, 'X').col(L1.width - 1, 0, G - 1, 'X');
  g.put(19, G - 2, 's').put(19, G - 1, 'S');
  for (const x of L1.doors) g.put(x, G - 2, 'e').put(x, G - 1, 'E');
  for (const [x, y] of L1.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [8, 2],
      [18, 1],
      [28, 3],
    ],
    [5, 16, 30],
    [10, 21, 26],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(G, signs.fast), signs.fast);
  m.sign(12, onGround(G, signs.pick), signs.pick);
  m.sign(24, onGround(G, signs.big), signs.big);
  return m;
}

/** Level 2: steps up to a plateau, a drop, and the exit. */
function theClimb(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const rows = G + 3;
  const g = new Grid(L2.width, rows);
  g.row(G, 0, L2.width - 1, 'G').fill(0, G + 1, L2.width, rows - G - 1, 'D');
  g.col(0, 0, G - 1, 'X').col(L2.width - 1, 0, G - 1, 'X');
  for (const s of [...L2.steps, L2.plateau]) {
    const [a, b] = s.cols;
    g.fill(a, G - s.height + 1, b - a + 1, s.height, 'D').row(G - s.height, a, b, 'G');
  }
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L2.exit, G - 2, 'e').put(L2.exit, G - 1, 'E');
  for (const [x, y] of [...L2.low, ...L2.high]) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [5, 3],
      [24, 2],
      [44, 4],
    ],
    [31, 33, 38, 55],
    [11, 36, 45, 48],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(G, signs.steps), signs.steps);
  m.sign(9, onGround(G, signs.hop), signs.hop);
  m.sign(21, onGround(G - L2.plateau.height, signs.high), signs.high);
  m.sign(46, onGround(G, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'doors', title: 'Two Doors', hint: 'Pick a hero.', map: twoDoors(book, signs) },
    { file: 'climb', title: 'The Same Climb', hint: 'Up the steps, or all at once.', map: theClimb(book, signs) },
  ];
  return { book, pal, levels };
}
