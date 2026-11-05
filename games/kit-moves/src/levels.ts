// KIT'S MOVES' two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs and coins. No new blocks: what is new is in the hero's
// character file (hero.ts): which keys repeat while held and which happen once per press.
//
//   1. Tap and Hold: SPACE is one hop per press (a low wall, then a taller one that one hop cannot clear);
//                    UP lifts for as long as it is held (a cliff to rise beside, then the door on top).
//   2. Once Per Press: ENTER is a dash to the right, once per press. Holding it gives one dash; to go
//                    farther, let go and press again. Three gaps, each wider than the last.
// Every edge is a hedge or a wall you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

export type SignName = 'hop' | 'hold' | 'lift' | 'top' | 'exit' | 'dash' | 'again' | 'last';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  hop: { text: 'SPACE HOPS ONCE PER PRESS. HOLD IT AND KIT STILL HOPS ONCE', w: 4, h: 4 },
  hold: { text: 'TOO TALL TO HOP. THE UP KEY IS DIFFERENT', w: 4, h: 4 },
  lift: { text: 'HOLD UP. KIT KEEPS LIFTING WHILE THE KEY IS DOWN', w: 4, h: 4 },
  top: { text: 'LET GO OF UP AND KIT FALLS. NOW WALK RIGHT', w: 4, h: 4 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
  dash: { text: 'ENTER DASHES RIGHT, ONCE PER PRESS. HOLDING IT DASHES ONCE', w: 4, h: 4 },
  again: { text: 'A WIDER GAP. HOP, KEEP RIGHT HELD, PRESS ENTER', w: 4, h: 4 },
  last: { text: 'THE WIDEST GAP. HOP, KEEP RIGHT HELD, ENTER TWICE', w: 4, h: 4 },
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

/** Level 1: the ground row, the width, the low wall's columns and top row, the cliff's first column and top row, the exit column and the coins. */
export const L1 = {
  ground: 14,
  width: 50,
  wall: [12, 14],
  wallTop: 11,
  cliff: 30,
  cliffTop: 5,
  exit: 45,
  coins: [
    [13, 10],
    [28, 11],
    [28, 8],
    [28, 5],
    [38, 4],
    [40, 4],
  ],
} as const;
/** Level 2: the ground row, the width, the pits' [first, last] columns, how deep they are, the exit column and the coins. */
export const L2 = {
  ground: 11,
  width: 70,
  pits: [
    [11, 11],
    [24, 28],
    [41, 47],
  ],
  depth: 2,
  exit: 64,
  coins: [
    [12, 9],
    [17, 9],
    [26, 7],
    [35, 9],
    [44, 7],
    [57, 9],
  ],
} as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: a low wall for a hop, then a cliff for the lift. */
function tapAndHold(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L1.ground;
  const g = new Grid(L1.width, G + 3);
  g.row(G, 0, L1.width - 1, 'G').fill(0, G + 1, L1.width, 2, 'D');
  g.col(0, 0, G - 1, 'X').col(L1.width - 1, 0, G - 1, 'X');
  // the low wall: three blocks high, grass on top
  g.fill(L1.wall[0], L1.wallTop + 1, L1.wall[1] - L1.wall[0] + 1, G - L1.wallTop - 1, 'D').row(L1.wallTop, L1.wall[0], L1.wall[1], 'G');
  // the cliff: nine blocks high, a brick face and grass on top
  g.fill(L1.cliff, L1.cliffTop + 1, L1.width - 1 - L1.cliff, G - L1.cliffTop - 1, 'B').row(L1.cliffTop, L1.cliff, L1.width - 2, 'G');
  g.col(L1.width - 1, 0, L1.cliffTop - 1, 'X');
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L1.exit, L1.cliffTop - 2, 'e').put(L1.exit, L1.cliffTop - 1, 'E');
  for (const [x, y] of L1.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [8, 2],
      [20, 1],
      [34, 1],
    ],
    [8, 20, 25],
    [10, 17, 23],
  );
  scenery(g, L1.cliffTop, [], [34, 47], [37, 42]);
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(G, signs.hop), signs.hop);
  m.sign(18, onGround(G, signs.hold), signs.hold);
  m.sign(23, onGround(G, signs.lift), signs.lift);
  m.sign(33, onGround(L1.cliffTop, signs.top), signs.top);
  m.sign(41, onGround(L1.cliffTop, signs.exit), signs.exit);
  return m;
}

/** Level 2: three gaps, each wider, with a dash for each press. */
function oncePerPress(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L2.ground;
  const rows = G + 5;
  const g = new Grid(L2.width, rows);
  g.row(G, 0, L2.width - 1, 'G').fill(0, G + 1, L2.width, rows - G - 1, 'D');
  g.col(0, 0, G - 1, 'X').col(L2.width - 1, 0, G - 1, 'X');
  for (const [a, b] of L2.pits) {
    g.fill(a, G, b - a + 1, L2.depth, ' ');
  }
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L2.exit, G - 2, 'e').put(L2.exit, G - 1, 'E');
  for (const [x, y] of L2.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [7, 2],
      [30, 1],
      [52, 3],
    ],
    [20, 38, 56],
    [18, 40, 58],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(6, onGround(G, signs.dash), signs.dash);
  m.sign(20, onGround(G, signs.again), signs.again);
  m.sign(36, onGround(G, signs.last), signs.last);
  m.sign(60, onGround(G, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'kit-moves');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Tap and Hold', hint: 'One hop, or a long lift.', map: tapAndHold(book, signs) },
    { file: 'two', title: 'Once Per Press', hint: 'Dash, let go, dash again.', map: oncePerPress(book, signs) },
  ];
  return { book, pal, levels };
}
