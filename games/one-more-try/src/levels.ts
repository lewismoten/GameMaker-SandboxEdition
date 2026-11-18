// TRY AGAIN's two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs, pits and post.
//
//   1. A Post to Start Over: a pit too deep to climb out of. At its bottom stands a post; touching it
//      is a scene link back to this same scene, so the level starts over from the way in.
//   2. Ways Back: three pits, each with a way out built into it (a ladder, steps of planks, steps of
//      solid blocks), so nobody needs a post. The better fix for a trap is not to build one.
// Every room is closed in by hedges you can see, so Mia is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques, stampTiledSign, stampMicroPlaques } from '../../kit/starter/microPlaque';
import { addPostBlocks } from './postBlocks';

export type SignName = 'deep' | 'post' | 'again' | 'exit' | 'ladder' | 'steps';

/** The block set the levels share: the Starter blocks, this game's signs, then the post. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, {
    deep: { lines: ['JUMP', 'OVER'] },
    post: { lines: ['STARTS', 'OVER'] },
    again: { lines: ['SCORE', 'STAYS'] },
    ladder: { lines: ['GO', 'UP'] },
    steps: { lines: ['JUMP', 'UP'] },
    exit: { lines: ['EXIT', '→'], post: false },
  });
  addPostBlocks(book, pal);
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  /** The posts that start the level over: the square of each (level blocks). */
  posts: [number, number][];
}

/** Refuse to cover scenery, pickups or another sign. */
function placeSign(m: StarterMap, x: number, y: number, sign: Sign, postHeight = 1): void {
  stampTiledSign({ set: (sx, sy, block) => m.setOnSky(sx, sy, block) }, x, y, sign, postHeight);
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

export const GROUND = 10;
/** How deep every pit is, in blocks (rows GROUND to GROUND + DEPTH - 1); the hero can jump three. */
export const DEPTH = 4;
/** Where each level's pits are (first column, width), for the bot's route and the shots. */
export const L1 = { pit: 24, width: 4, post: 26, coin: 25 } as const;
export const L2 = {
  ladder: { pit: 14, width: 4, rungs: 17 },
  steps: { pit: 26, width: 4, low: [28, 29], high: 29, top: [28, 29] },
  stairs: { pit: 38, width: 4, tall: 41, short: 40 },
} as const;

/** The ground, the side walls, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

/** Digs a pit `w` wide at column `x`: the grass and the dirt under it, `DEPTH` blocks down, are open sky. */
const dig = (g: Grid, x: number, w: number): Grid => g.fill(x, GROUND, w, DEPTH, ' ');

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: one pit with a post at the bottom. 52 blocks wide. */
function aPostToStartOver(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  dig(g, L1.pit, L1.width);
  g.put(L1.coin, GROUND + DEPTH - 1, 'c');
  g.row(7, L1.pit, L1.pit + L1.width - 1, 'c');
  scenery(
    g,
    [
      [7, 2],
      [20, 1],
      [36, 3],
      [44, 1],
    ],
    [9, 15, 33, 46],
    [12, 31, 41],
  );
  const m = new StarterMap(book, g.rows());
  placeSign(m, 18, onGround(GROUND, signs.deep), signs.deep);
  // Explain the reset post on the clear bank before the pit.
  stampMicroPlaques({ set: (x, y, block) => m.setOnSky(x, y, block) }, 20, GROUND - 3, [signs.post, signs.again]);
  placeSign(m, 42, onGround(GROUND, signs.exit), signs.exit);
  m.set(L1.post, GROUND + DEPTH - 1, 'post');
  return m;
}

/** Level 2: three pits, each with its own way out. 52 blocks wide. */
function waysBack(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  const { ladder, steps, stairs } = L2;
  const floor = GROUND + DEPTH - 1;
  dig(g, ladder.pit, ladder.width);
  g.col(ladder.rungs, GROUND - 1, floor, 'H');
  dig(g, steps.pit, steps.width);
  dig(g, stairs.pit, stairs.width);
  // the coin at the bottom of every pit is the reason to go in
  g.put(ladder.pit + 1, floor, 'c')
    .put(steps.pit + 1, floor, 'c')
    .put(stairs.pit + 1, floor, 'c');
  // the stairs: two columns of solid dirt, one block taller than the next
  g.col(stairs.tall, floor - 1, floor, 'D').put(stairs.short, floor, 'D');
  scenery(
    g,
    [
      [6, 2],
      [22, 1],
      [33, 3],
      [44, 1],
    ],
    [10, 23, 35, 46],
    [8, 21, 45],
  );
  const m = new StarterMap(book, g.rows());
  placeSign(m, 11, onGround(GROUND, signs.ladder), signs.ladder);
  placeSign(m, 24, onGround(GROUND, signs.steps), signs.steps);
  placeSign(m, 42, onGround(GROUND, signs.exit), signs.exit);
  // Two-block landings give a leftward jump from the cliff room to stop.
  // PLAYGAME.C:3682-3690 snaps partial edge landings toward a one-block gap.
  for (const x of steps.low) m.set(x, floor - 1, 'plank');
  for (const x of steps.top) m.set(x, GROUND, 'plank');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'one-more-try');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    {
      file: 'one',
      title: 'A Post to Start Over',
      hint: 'Fell in? Walk into the post.',
      map: aPostToStartOver(book, signs),
      posts: [[L1.post, GROUND + DEPTH - 1]],
    },
    { file: 'two', title: 'Ways Back', hint: 'Never trap the player.', map: waysBack(book, signs), posts: [] },
  ];
  return { book, pal, levels };
}
