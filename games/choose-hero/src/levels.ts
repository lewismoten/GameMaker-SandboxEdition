// WHO TO BE?'s three levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs and coins. No new blocks: what is new is in the scenes
// (game.ts): a scene lists the character file it loads, so two doors can lead to the same level with two heroes.
//
//   1. Two Doors:     a small room. The left door goes to the climb with FAST FEET, the right door to the same climb with BIG HOPS.
//   2. The Same Climb: two steps up to a plateau, then a drop and the exit door. Every hero can take the steps; only
//                    BIG HOPS can hop from the ground to the plateau, and only BIG HOPS can reach the high coins.
//   3. The Open Road: a short road with one hill and its scene sets NO character file: the hero you picked
//                    last is still the hero. Nothing on it needs a particular hero; every one can finish it.
// Every edge is a hedge or a wall you can see, so nobody is stopped by something they can't.
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign, stampMicroPlaques } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';

export type SignName = 'pick' | 'fast' | 'big' | 'high' | 'back' | 'exit' | 'carry';

/** Complete vocabulary, shared within each map's own block set. */
const WORDS = {
  pick: { lines: ['PICK', 'DOOR'] },
  fast: { lines: ['FAST', 'FEET'], post: false },
  big: { lines: ['BIG', 'HOPS'], post: false },
  high: { lines: ['BIG', 'HOPS'] },
  back: { lines: ['GO', 'BACK'] },
  carry: { lines: ['SAME', 'HERO'] },
  exit: { lines: ['EXIT', '→'], post: false },
};

function buildBlocks(pal: Pal, include: readonly SignName[]): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, Object.fromEntries(include.map((name) => [name, WORDS[name]]))) as Record<SignName, Sign>;
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  book: Book;
}

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

/** Level 3: the ground row, the width, the hill's columns and height, the exit column and the coins. */
export const L3 = {
  ground: 14,
  width: 46,
  step: { cols: [14, 16], height: 2 },
  hill: { cols: [17, 24], height: 3 },
  exit: 41,
  coins: [
    [11, 12],
    [13, 12],
    [19, 9],
    [22, 9],
    [29, 12],
    [34, 12],
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
  g.row(G - 1, 18, 19, 'G');
  g.put(19, G - 3, 's').put(19, G - 2, 'S');
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
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 3, 9, signs.fast, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 18, 9, signs.pick, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 32, 9, signs.big, 1, { maxPostHeight: 1 });
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
  stampMicroPlaques({ set: (x, y, name) => m.setOnSky(x, y, name) }, 12, 14, [signs.high, signs.back], 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 50, 14, signs.exit, 1, { maxPostHeight: 1 });
  return m;
}

/** Level 3: a road with one hill; its scene loads no character file. */
function openRoad(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const G = L3.ground;
  const rows = G + 3;
  const g = new Grid(L3.width, rows);
  g.row(G, 0, L3.width - 1, 'G').fill(0, G + 1, L3.width, rows - G - 1, 'D');
  g.col(0, 0, G - 1, 'X').col(L3.width - 1, 0, G - 1, 'X');
  for (const s of [L3.step, L3.hill]) {
    const [a, b] = s.cols;
    g.fill(a, G - s.height + 1, b - a + 1, s.height, 'D').row(G - s.height, a, b, 'G');
  }
  g.put(3, G - 2, 's').put(3, G - 1, 'S');
  g.put(L3.exit, G - 2, 'e').put(L3.exit, G - 1, 'E');
  for (const [x, y] of L3.coins) g.put(x, y, 'c');
  scenery(
    g,
    G,
    [
      [6, 3],
      [26, 2],
      [38, 4],
    ],
    [2, 27, 32],
    [8, 30, 36],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 5, 12, signs.carry, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: (x, y, name) => m.setOnSky(x, y, name) }, 40, 11, signs.exit, 1, { maxPostHeight: 1 });
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'choose-hero');
  const level = (file: string, title: string, hint: string, include: SignName[], map: (book: Book, signs: Record<SignName, Sign>) => StarterMap): Level => {
    const { book, signs } = buildBlocks(pal, include);
    return { file, title, hint, book, map: map(book, signs) };
  };
  const levels = [
    level('doors', 'Two Doors', 'Pick a hero.', ['pick', 'fast', 'big'], twoDoors),
    level('climb', 'The Same Climb', 'Up the steps, or all at once.', ['high', 'back', 'exit'], theClimb),
    level('road', 'The Open Road', 'Nobody is picked here.', ['carry', 'exit'], openRoad),
  ];
  return { book: levels[0].book, pal, levels };
}
