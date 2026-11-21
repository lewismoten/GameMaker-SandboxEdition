// OUT LOUD's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and speakers.
//
//   1. Say Hello: press Enter and Lena says hello. A key's move can play a sound, and the sound
//      can be a voice file.
//   2. Two Speakers: walk into a loudspeaker and it talks. The counter that changes decides
//      the voice: the first speaker's counter goes up, the second's goes down.
//   3. Let It Finish: one voice is cut off when another starts or the scene changes, so the
//      speaker stands far enough from the door for the whole line.
// Every room is closed in by hedges you can see, so Lena is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addSpeakerBlocks } from './speakerBlocks';

export type SignName = 'enter' | 'walkin' | 'exit';

const WORDS = {
  enter: { lines: ['PRESS', 'ENTER'] },
  walkin: { lines: ['WALK', 'IN'] },
  exit: { lines: ['EXIT', '→'], post: false },
};

/** The block set the levels share: the Starter blocks, this game's signs, then the speakers. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addSpeakerBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, WORDS);
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
const onGround = (ground: number, s: Sign, postHeight = 1) => ground - postHeight - s.board.length;

/** Boards and their single posts replace only sky, never scenery, coins or speakers. */
const place = (m: StarterMap, x: number, sign: Sign, postHeight = 1) =>
  stampTiledSign({ set: (x, y, block) => m.setOnSky(x, y, block) }, x, onGround(GROUND, sign, postHeight), sign, postHeight, { maxPostHeight: 1 });

export const GROUND = 10;
/** Where the speakers stand (columns): level 2's two and level 3's one. */
export const L2 = { up: 22, down: 36 } as const;
export const L3 = { speaker: 28 } as const;
/** Where the coins of level 1 hang, for the bot. */
export const L1 = { coins: [17, 18, 19], exit: 48 } as const;

/** The ground, the side walls, the entrance on the left (x 3) and the exit door at `exitX`. */
function base(width: number, exitX: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.col(0, 0, 9, 'X').col(width - 1, 0, 9, 'X');
  // A narrow turf ledge supports the hero at entry, with dirt down to the path.
  g.put(3, 8, 'G').put(3, 9, 'D');
  g.put(3, 6, 's').put(3, 7, 'S');
  g.put(exitX, 8, 'e').put(exitX, 9, 'E');
  return g;
}

function scenery(g: Grid, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, GROUND - 1, 'b');
  for (const x of flowers) g.put(x, GROUND - 1, 'f');
}

/** Level 1: three signs and a row of coins; Enter does the rest. 52 blocks wide. */
function sayHello(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  g.row(9, L1.coins[0], L1.coins[2], 'c').row(9, 40, 42, 'c');
  scenery(
    g,
    [
      [7, 2],
      [22, 1],
      [36, 3],
      [44, 1],
    ],
    [11, 26, 30, 46],
    [9, 24, 43],
  );
  const m = new StarterMap(book, g.rows());
  place(m, 7, signs.enter);
  place(m, 45, signs.exit);
  return m;
}

/** Level 2: two loudspeakers on the ground, one that goes up and one that goes down. 52 blocks wide. */
function twoSpeakers(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  g.row(9, 14, 15, 'c').row(9, 27, 29, 'c').row(9, 42, 43, 'c');
  scenery(
    g,
    [
      [7, 2],
      [24, 1],
      [38, 3],
      [44, 1],
    ],
    [11, 20, 32, 46],
    [9, 25, 40],
  );
  const m = new StarterMap(book, g.rows());
  place(m, 4, signs.walkin);
  place(m, 45, signs.exit);
  m.set(L2.up, GROUND - 1, 'speaker');
  m.set(L2.down, GROUND - 1, 'lower');
  return m;
}

/** Level 3: one speaker with a long line, and a long walk to the door. 52 blocks wide. */
function letItFinish(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(52, 48);
  g.row(9, 12, 14, 'c').row(9, 20, 22, 'c').row(9, 38, 40, 'c');
  scenery(
    g,
    [
      [7, 2],
      [20, 1],
      [38, 3],
      [44, 1],
    ],
    [10, 25, 43, 47],
    [9, 31, 41],
  );
  const m = new StarterMap(book, g.rows());
  place(m, 44, signs.exit);
  m.set(L3.speaker, GROUND - 1, 'speaker');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'voice');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Say Hello', hint: 'Press Enter.', map: sayHello(book, signs) },
    { file: 'two', title: 'Two Speakers', hint: 'Up is one voice, down is another.', map: twoSpeakers(book, signs) },
    { file: 'three', title: 'Let It Finish', hint: 'A new scene cuts a voice off.', map: letItFinish(book, signs) },
  ];
  return { book, pal, levels };
}
