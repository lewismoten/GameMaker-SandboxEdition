// UNDER THE SURFACE's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its water, signs and coins.
// Water is only a block whose gravity setting pulls some way (water.ts); none of it hurts.
//
//   1. The Creek:    water that pulls LEFT and down. Fall in, and it carries Kit back to the bank he started from.
//                    Stepping stones cross it.
//   2. The Float:    a deep pool that pulls UP. Kit drops in, floats to the top row (which has no pull) and swims across.
//   3. The Lift:     a tall pool that pulls UP and LEFT. Kit steps in at the bottom and is lifted to the ledge on the left,
//                    where the door is.
// Every level is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addDigBlocks } from './digBlocks';

export type SignName = 'soil' | 'rock' | 'gold' | 'sink' | 'spikes' | 'exit';

/** The signs' words and sizes. */
const WORDS: Record<SignName, { text: string; w: number; h: number }> = {
  soil: { text: 'SOIL TURNS TO A TUNNEL WHEN YOU TOUCH IT. WALK IN', w: 4, h: 4 },
  rock: { text: 'ROCK DOES NOT DIG. JUMP, AND DIG OVER IT', w: 4, h: 4 },
  gold: { text: 'GOLD FLECKS PAY 10 WHEN YOU DIG THEM UP', w: 4, h: 4 },
  sink: { text: 'SOIL UNDER YOUR FEET GIVES WAY. STEP ON IT TO SINK', w: 4, h: 4 },
  spikes: { text: 'SPIKES HURT. DIG UNDER THEM TO THE LADDER', w: 4, h: 4 },
  exit: { text: 'EXIT →', w: 3, h: 1 },
};

/** The block set the levels share: the Starter blocks, then this game's signs, then the dig blocks. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {} as Record<SignName, Sign>;
  for (const n of Object.keys(WORDS) as SignName[]) signs[n] = addSign(book, pal, `${n}.sign`, WORDS[n].text, WORDS[n].w, WORDS[n].h);
  addDigBlocks(book, pal);
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

/** Level 1: the ground row, the width, the hill's columns, the rock's column, the exit column and the nuggets (column, row). */
export const L1 = {
  ground: 10,
  width: 44,
  hill: [17, 33],
  rock: 17,
  exit: 40,
  nuggets: [
    [21, 8],
    [24, 9],
    [27, 8],
    [30, 9],
  ],
} as const;
/**
 * Level 2: the surface row (its grass), the width, the soil trapdoor's columns, the soil mass's first and last columns,
 * the spikes' columns, the column of the ladder out, the floor row, the exit column and the nuggets (column, row).
 */
export const L2 = {
  surface: 7,
  width: 46,
  shaft: [12, 13],
  mass: [12, 32],
  spikes: [17, 28],
  ladder: 30,
  floor: 12,
  exit: 43,
  nuggets: [
    [16, 10],
    [19, 11],
    [22, 10],
    [25, 11],
    [28, 10],
  ],
} as const;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** Level 1: a hill of soil to tunnel through, with a rock in the way at its foot. */
function theTunnel(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L1.ground;
  const [h0, h1] = L1.hill;
  const g = new Grid(L1.width, 15);
  g.row(G, 0, L1.width - 1, 'G').fill(0, G + 1, L1.width, 4, 'D');
  g.col(0, 0, 9, 'X').col(L1.width - 1, 0, 9, 'X');
  g.put(2, G - 2, 's').put(2, G - 1, 'S');
  g.put(L1.exit, G - 2, 'e').put(L1.exit, G - 1, 'E');
  scenery(g, G, [[6, 1], [24, 1], [36, 3]], [35, 38], [34, 42]);
  const m = new StarterMap(book, g.rows());
  // the hill: stepped, five blocks tall
  for (let y = 5; y < G; y++) {
    const inset = Math.max(0, 7 - y);
    for (let x = h0 + inset; x <= h1 - inset; x++) m.set(x, y, 'soil');
  }
  m.set(L1.rock, G - 1, 'rock');
  for (const [x, y] of L1.nuggets) m.set(x, y, 'nugget');
  m.sign(4, onGround(G, signs.soil), signs.soil);
  m.sign(8, onGround(G, signs.rock), signs.rock);
  m.sign(12, onGround(G, signs.gold), signs.gold);
  m.sign(37, onGround(G, signs.exit), signs.exit);
  return m;
}

/** Level 2: a soil trapdoor in the surface, a tunnel under a lane of spikes, and a ladder out at the far end. */
function theSink(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const S = L2.surface;
  const [m0, m1] = L2.mass;
  const [k0, k1] = L2.spikes;
  const g = new Grid(L2.width, 15);
  g.row(S, 0, L2.width - 1, 'G').fill(0, S + 1, L2.width, 15 - S - 1, 'D');
  g.col(0, 0, S - 1, 'X').col(L2.width - 1, 0, S - 1, 'X');
  g.put(1, S - 2, 's').put(1, S - 1, 'S');
  g.put(L2.exit, S - 2, 'e').put(L2.exit, S - 1, 'E');
  for (let x = k0; x <= k1; x++) g.put(x, S - 1, '^');
  scenery(g, S, [[7, 1], [20, 1], [34, 2]], [40, 31], [38, 42]);
  g.put(31, S - 1, 'b');
  const m = new StarterMap(book, g.rows());
  // the mass of soil under the surface; the first two columns' caps are soil too (the trapdoor)
  for (let x = m0; x <= m1; x++) for (let y = S + 1; y < L2.floor; y++) m.set(x, y, 'soil');
  for (const x of L2.shaft) m.set(x, S, 'soil');
  // the way out: a ladder up from the tunnel's end to a gap in the surface
  for (let y = S + 1; y < L2.floor; y++) m.set(L2.ladder, y, 'mineLadder');
  m.set(L2.ladder, S, 'ladder');
  for (const [x, y] of L2.nuggets) m.set(x, y, 'nugget');
  m.sign(3, onGround(S, signs.sink), signs.sink);
  m.sign(7, onGround(S, signs.spikes), signs.spikes);
  m.sign(39, onGround(S, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'The Tunnel', hint: 'Walk into the soil.', map: theTunnel(book, signs) },
    { file: 'two', title: 'Under the Spikes', hint: 'Soil gives way under you.', map: theSink(book, signs) },
  ];
  return { book, pal, levels };
}
