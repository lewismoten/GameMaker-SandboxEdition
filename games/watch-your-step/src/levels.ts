// WATCH YOUR STEP's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and its hazards.
//
//   1. Spikes: a lone spike stings once and lies flat; a row of three is for jumping over.
//   2. The Pool: a pool in the ground takes a life. The room is short, so starting it again is quick.
//   3. The Safe Way: planks over spikes, and a plank bridge across a pool.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addHazards } from './hazards';

export type SignName = 'spikes' | 'over' | 'fall' | 'safe' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the hazards. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    spikes: addSign(book, pal, 'spikes.sign', 'SPIKES HURT', 4, 2),
    over: addSign(book, pal, 'over.sign', 'JUMP OVER THEM', 4, 2),
    fall: addSign(book, pal, 'fall.sign', 'FALL IN AND YOU START THIS ROOM AGAIN', 4, 3),
    safe: addSign(book, pal, 'safe.sign', 'FIND A SAFE WAY ACROSS', 4, 2),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addHazards(book, pal);
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

export const GROUND = 10;

/** The ground, the side walls, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
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

/** Level 1: one spike to walk into, three to jump over. 40 blocks wide. */
function spikes(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(40, 36);
  g.row(7, 25, 28, 'c');
  scenery(
    g,
    [
      [6, 2],
      [19, 1],
      [30, 3],
    ],
    [11, 22, 34],
    [8, 20, 32],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(8, onGround(GROUND, signs.spikes), signs.spikes);
  m.sign(17, onGround(GROUND, signs.over), signs.over);
  m.sign(32, onGround(GROUND, signs.exit), signs.exit);
  m.set(14, GROUND - 1, 'spikeUp');
  for (const x of [26, 27]) m.set(x, GROUND - 1, 'spikeUp');
  return m;
}

/** Level 2: a pool, three blocks wide and two deep. A short room: 24 blocks wide. */
function pool(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(24, 21);
  g.fill(13, GROUND, 3, 2, ' ');
  g.row(8, 13, 15, 'c');
  scenery(
    g,
    [
      [8, 1],
      [17, 2],
    ],
    [11, 19],
    [10, 18],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.fall), signs.fall);
  m.sign(17, onGround(GROUND, signs.exit), signs.exit);
  for (const x of [13, 14, 15]) m.set(x, GROUND, 'waterTop').set(x, GROUND + 1, 'water');
  return m;
}

/** Level 3: planks over the spikes, a plank bridge over the pool. 36 blocks wide. */
function safeWay(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(36, 32);
  g.row(8, 9, 13, '=').row(7, 10, 12, 'c');
  g.fill(20, GROUND + 1, 4, 2, ' ');
  g.row(GROUND, 20, 23, '=');
  scenery(
    g,
    [
      [5, 2],
      [17, 1],
      [26, 3],
    ],
    [16, 26],
    [7, 18, 29],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(4, onGround(GROUND, signs.safe), signs.safe);
  m.sign(28, onGround(GROUND, signs.exit), signs.exit);
  for (const x of [10, 11, 12]) m.set(x, GROUND - 1, 'spikeUp');
  for (const x of [20, 21, 22, 23]) m.set(x, GROUND + 1, 'waterTop').set(x, GROUND + 2, 'water');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Spikes', hint: 'Spikes hurt a little.', map: spikes(book, signs) },
    { file: 'two', title: 'The Pool', hint: 'A pool costs a life.', map: pool(book, signs) },
    { file: 'three', title: 'The Safe Way', hint: 'Find the way past both.', map: safeWay(book, signs) },
  ];
  return { book, pal, levels };
}
