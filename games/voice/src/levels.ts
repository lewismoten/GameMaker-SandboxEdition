// OUT LOUD's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and speakers.
//
//   1. Say Hello: press Enter and Kit says hello. A key's move can play a sound, and the sound
//      can be a voice file.
//   2. Two Speakers: walk into a loudspeaker and it talks. The counter that changes decides
//      the voice: the first speaker's counter goes up, the second's goes down.
//   3. Let It Finish: one voice is cut off when another starts or the scene changes, so the
//      speaker stands far enough from the door for the whole line.
// Every room is closed in by hedges you can see, so Kit is never stopped by something he can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addSpeakerBlocks } from './speakerBlocks';

export type SignName = 'enter' | 'key' | 'again' | 'walkin' | 'counter' | 'one' | 'cut' | 'room' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the speakers. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    enter: addSign(book, pal, 'enter.sign', 'PRESS ENTER AND KIT SAYS HELLO', 4, 3),
    key: addSign(book, pal, 'key.sign', 'A KEY CAN PLAY A SOUND. THIS ONE PLAYS A VOICE FILE', 4, 3),
    again: addSign(book, pal, 'again.sign', 'PRESS IT AGAIN AND THE VOICE STARTS OVER', 4, 3),
    walkin: addSign(book, pal, 'walkin.sign', 'WALK INTO A SPEAKER AND IT TALKS', 4, 3),
    counter: addSign(book, pal, 'counter.sign', 'ITS COUNTER GOES UP, SO IT PLAYS THE UP VOICE', 4, 3),
    one: addSign(book, pal, 'one.sign', 'THIS COUNTER GOES DOWN: THE OTHER VOICE', 4, 3),
    cut: addSign(book, pal, 'cut.sign', 'A NEW SCENE CUTS A VOICE OFF', 4, 3),
    room: addSign(book, pal, 'room.sign', 'THE DOOR IS FAR ENOUGH FOR THE WHOLE LINE', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addSpeakerBlocks(book, pal);
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
  g.put(3, 8, 's').put(3, 9, 'S');
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
  m.sign(5, onGround(GROUND, signs.enter), signs.enter);
  m.sign(12, onGround(GROUND, signs.key), signs.key);
  m.sign(29, onGround(GROUND, signs.again), signs.again);
  m.sign(44, onGround(GROUND, signs.exit), signs.exit);
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
  m.sign(5, onGround(GROUND, signs.walkin), signs.walkin);
  m.sign(16, onGround(GROUND, signs.counter), signs.counter);
  m.sign(30, onGround(GROUND, signs.one), signs.one);
  m.sign(44, onGround(GROUND, signs.exit), signs.exit);
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
  m.sign(5, onGround(GROUND, signs.cut), signs.cut);
  m.sign(32, onGround(GROUND, signs.room), signs.room);
  m.sign(44, onGround(GROUND, signs.exit), signs.exit);
  m.set(L3.speaker, GROUND - 1, 'speaker');
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette();
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'Say Hello', hint: 'Press Enter.', map: sayHello(book, signs) },
    { file: 'two', title: 'Two Speakers', hint: 'Up is one voice, down is another.', map: twoSpeakers(book, signs) },
    { file: 'three', title: 'Let It Finish', hint: 'A new scene cuts a voice off.', map: letItFinish(book, signs) },
  ];
  return { book, pal, levels };
}
