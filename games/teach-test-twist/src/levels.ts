// TEACH, TEST, TWIST's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs, its pits and spikes.
// One idea runs through all three: a gap in the ground, two blocks deep.
//
//   1. Teach: a gap with nothing to hurt you. Jump it, or drop in for a coin and climb out.
//   2. Test: the same gap with spikes at the bottom, and a wider one, so a bad jump costs a little.
//   3. Twist: the same gap again, but now you want to be in it: the key to the locked door is down there.
//
// Every room is closed in by hedges you can see, so Lena is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { addLockBlocks } from '../../kit/starter/locks';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign, stampMicroPlaques } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addHazards } from './hazards';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
}

export const GROUND = 10;
/** The floor of a gap: the ground row, two blocks lower. */
export const PIT_FLOOR = GROUND + 2;
export type SignName = 'teach' | 'safe' | 'drop' | 'test' | 'ouch' | 'wider' | 'twist' | 'key' | 'locked' | 'exit';
const SIGNS = {
  teach: { lines: ['STEP 1', 'TEACH'], post: false },
  safe: { lines: ['SAFE', 'HERE'] },
  drop: { lines: ['DROP', 'IN'] },
  test: { lines: ['STEP 2', 'TEST'], post: false },
  ouch: { lines: ['OUCH'], post: false },
  wider: { lines: ['RUN,', 'JUMP'] },
  twist: { lines: ['STEP 3', 'TWIST'], post: false },
  key: { lines: ['DROP', 'IN'] },
  locked: { lines: ['NEED', 'KEY'] },
  exit: { lines: ['EXIT', '→'], post: false },
};

/** The block set the levels share: the Starter blocks, the lock and spike blocks, then this game's signs. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addLockBlocks(book, pal);
  addHazards(book, pal);
  const signs = addMicroPlaques(book, pal, SIGNS);
  return { book, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** The room: ground, hedges at both ends, the entrance at x 3 and the exit door at `exitX`. */
function room(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** A wall of brick from row 0 to a locked door: its arch on row 8 and the gold gate on row 9. */
function lockedWall(g: Grid, x: number): void {
  g.col(x, 0, GROUND - 3, 'B')
    .put(x, GROUND - 2, 'l')
    .put(x, GROUND - 1, 'L');
}

/** A gap in the ground `w` blocks wide from column `x`: two blocks deep, with a grass floor you can see. */
function gap(g: Grid, x: number, w: number): void {
  g.fill(x, GROUND, w, 2, ' ').row(PIT_FLOOR, x, x + w - 1, 'G');
}

/** Where things are, for the bot and the shots. */
export const AT = {
  one: { gap: 16, width: 3, coin: 17, exit: 36 },
  two: { gap: 14, width: 3, wide: 26, wideWidth: 4, exit: 41 },
  three: { gap: 13, width: 3, key: 14, wide: 22, wideWidth: 4, door: 32, exit: 44 },
} as const;

/** Level 1: a gap with nothing in it but a coin. 40 blocks wide. */
function teach(book: Book, s: Record<SignName, Sign>): StarterMap {
  const g = room(40, AT.one.exit);
  gap(g, AT.one.gap, AT.one.width);
  g.put(AT.one.coin, PIT_FLOOR - 1, 'c');
  g.row(9, 20, 21, 'c').row(9, 23, 24, 'c');
  scenery(
    g,
    [
      [7, 3],
      [19, 2],
      [30, 4],
    ],
    [9, 26, 33],
    [14, 22, 28],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: m.setOnSky.bind(m) }, 4, onGround(GROUND, s.teach), s.teach, 1, { maxPostHeight: 1 });
  stampMicroPlaques({ set: m.setOnSky.bind(m) }, 12, GROUND - 3, [s.safe, s.drop], 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 30, onGround(GROUND, s.exit), s.exit, 1, { maxPostHeight: 1 });
  return m;
}

/** Level 2: the same gap with spikes at the bottom, then a wider one. 46 blocks wide. */
function test(book: Book, s: Record<SignName, Sign>): StarterMap {
  const g = room(46, AT.two.exit);
  gap(g, AT.two.gap, AT.two.width);
  gap(g, AT.two.wide, AT.two.wideWidth);
  g.row(9, 9, 10, 'c').row(9, 20, 21, 'c').row(9, 34, 36, 'c');
  scenery(
    g,
    [
      [7, 2],
      [18, 4],
      [31, 1],
      [39, 3],
    ],
    [12, 31, 33],
    [11, 19, 32],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: m.setOnSky.bind(m) }, 4, onGround(GROUND, s.test), s.test, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 11, 8, s.ouch, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 23, onGround(GROUND, s.wider), s.wider, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 36, onGround(GROUND, s.exit), s.exit, 1, { maxPostHeight: 1 });
  for (const [x, w] of [
    [AT.two.gap, AT.two.width],
    [AT.two.wide, AT.two.wideWidth],
  ])
    for (let i = 0; i < w; i++) m.set(x + i, PIT_FLOOR - 1, 'spikeUp');
  return m;
}

/** Level 3: the key is in a safe gap; a wider spiked gap and the locked door are beyond. 50 blocks wide. */
function twist(book: Book, s: Record<SignName, Sign>): StarterMap {
  const g = room(50, AT.three.exit);
  gap(g, AT.three.gap, AT.three.width);
  gap(g, AT.three.wide, AT.three.wideWidth);
  lockedWall(g, AT.three.door);
  g.put(AT.three.key, PIT_FLOOR - 1, 'k');
  g.row(9, 18, 20, 'c').row(9, 35, 38, 'c');
  scenery(
    g,
    [
      [8, 3],
      [20, 1],
      [34, 3],
      [42, 1],
    ],
    [17, 21, 31],
    [2, 26, 46],
  );
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: m.setOnSky.bind(m) }, 4, onGround(GROUND, s.twist), s.twist, 1, { maxPostHeight: 1 });
  // Read DROP IN before reaching the key's pit; the post stays on solid ground.
  stampTiledSign({ set: m.setOnSky.bind(m) }, 11, onGround(GROUND, s.key), s.key, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 28, onGround(GROUND, s.locked), s.locked, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 39, onGround(GROUND, s.exit), s.exit, 1, { maxPostHeight: 1 });
  for (let i = 0; i < AT.three.wideWidth; i++) m.set(AT.three.wide + i, PIT_FLOOR - 1, 'spikeUp');
  return m;
}

/** The palette, the shared blocks and the levels in order. */
export function buildLevels(): { pal: Pal; book: Book; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'teach-test-twist');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Teach', hint: 'A gap. Nothing hurts here.', map: teach(book, signs) },
    { file: 'two', title: 'Test', hint: 'The same gap, with spikes.', map: test(book, signs) },
    { file: 'three', title: 'Twist', hint: 'Now the key is in the gap.', map: twist(book, signs) },
  ];
  return { pal, book, levels };
}
