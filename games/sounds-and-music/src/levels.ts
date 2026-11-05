// SOUNDS AND MUSIC's three levels. Each is painted on a Grid (a block a character, see
// games/kit/starter/map.ts for what the letters mean), then given its signs and pickups.
//
//   1. A Song for Every Room: the room's scene names a song, and it plays and repeats. Three signs say
//      so; the door leads to a room with a different song.
//   2. Sounds on Pickups: a coin, a money bag, a spike and a heart, each a different counter and so a
//      different sound. Nova walks into the spike once, on purpose, and the hearts mend her.
//   3. A Quiet Room: this scene names no song at all. Jumping has a sound of its own, and five coins
//      in a row show that a new sound cuts off the last.
// Every room is closed in by hedges you can see, so Nova is never stopped by something she can't.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addPickups } from './pickups';

export type SignName = 'room' | 'loop' | 'next' | 'score' | 'money' | 'hurt' | 'heal' | 'quiet' | 'jump' | 'one' | 'exit';

/** The block set the levels share: the Starter blocks, this game's signs, then the pickups. */
function buildBlocks(pal: Pal): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs = {
    room: addSign(book, pal, 'room.sign', 'EACH ROOM HAS ITS OWN SONG', 4, 2),
    loop: addSign(book, pal, 'loop.sign', 'A SONG REPEATS UNTIL YOU LEAVE', 4, 2),
    next: addSign(book, pal, 'next.sign', 'THE NEXT ROOM PLAYS A NEW SONG', 4, 2),
    score: addSign(book, pal, 'score.sign', 'COINS PLAY THE SCORE SOUND', 4, 2),
    money: addSign(book, pal, 'money.sign', 'A BAG PLAYS THE MONEY SOUND', 4, 2),
    hurt: addSign(book, pal, 'hurt.sign', 'A SPIKE PLAYS THE HURT SOUND', 4, 2),
    heal: addSign(book, pal, 'heal.sign', 'A HEART PLAYS THE HELP SOUND', 4, 2),
    quiet: addSign(book, pal, 'quiet.sign', 'THIS ROOM HAS NO SONG', 4, 2),
    jump: addSign(book, pal, 'jump.sign', 'JUMPING HAS A SOUND TOO', 4, 2),
    one: addSign(book, pal, 'one.sign', 'A NEW SOUND CUTS OFF THE LAST ONE', 4, 3),
    exit: addSign(book, pal, 'exit.sign', 'EXIT →', 3),
  };
  addPickups(book, pal);
  return { book, signs };
}

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** The song file the level's scene names ('' = the room has no song). */
  song: string;
  map: StarterMap;
}

/** The two songs (song.ts writes them). */
export const MEADOW = 'meadow.cmf';
export const WALTZ = 'waltz.cmf';

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

/** Level 1: three signs about the room's song, and four coins. 40 blocks wide. */
function songRoom(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(40, 36);
  g.row(9, 21, 24, 'c');
  scenery(
    g,
    [
      [6, 2],
      [18, 1],
      [30, 3],
    ],
    [10, 18, 30, 35],
    [9, 17, 20, 29],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.room), signs.room);
  m.sign(12, onGround(GROUND, signs.loop), signs.loop);
  m.sign(25, onGround(GROUND, signs.next), signs.next);
  m.sign(32, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** Where level 2's pickups are. */
export const COINS_2 = [9, 10, 11] as const;
export const BAGS = [19, 20] as const;
export const SPIKE_X = 29;
export const HEARTS = [36, 39] as const;

/** Level 2: a coin, a bag, a spike and a heart, each with its own sign. 50 blocks wide. */
function pickupRoom(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(50, 46);
  g.row(9, COINS_2[0], COINS_2[2], 'c');
  scenery(
    g,
    [
      [8, 1],
      [21, 3],
      [34, 2],
      [43, 1],
    ],
    [12, 27, 40],
    [13, 21, 30, 36],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.score), signs.score);
  m.sign(14, onGround(GROUND, signs.money), signs.money);
  m.sign(22, onGround(GROUND, signs.hurt), signs.hurt);
  m.sign(31, onGround(GROUND, signs.heal), signs.heal);
  m.sign(42, onGround(GROUND, signs.exit), signs.exit);
  for (const x of BAGS) m.set(x, GROUND - 1, 'bag');
  m.set(SPIKE_X, GROUND - 1, 'spikeUp');
  for (const x of HEARTS) m.set(x, GROUND - 1, 'heart');
  return m;
}

/** The ledge in level 3 and the row of coins on the ground. */
export const LEDGE = { x0: 18, x1: 23, row: 8 } as const;
export const GROUND_COINS = [33, 34, 35, 36, 37] as const;

/** Level 3: no song; a ledge to jump up to, and a tight row of coins. 46 blocks wide. */
function quietRoom(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const g = base(46, 42);
  g.row(LEDGE.row, LEDGE.x0, LEDGE.x1, '=');
  for (const x of [19, 20, 22]) g.put(x, LEDGE.row - 1, 'c');
  g.row(9, GROUND_COINS[0], GROUND_COINS[4], 'c');
  scenery(
    g,
    [
      [6, 2],
      [16, 1],
      [26, 3],
      [38, 1],
    ],
    [9, 16, 25, 41],
    [10, 17, 31, 43],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(GROUND, signs.quiet), signs.quiet);
  m.sign(11, onGround(GROUND, signs.jump), signs.jump);
  m.sign(27, onGround(GROUND, signs.one), signs.one);
  m.sign(38, onGround(GROUND, signs.exit), signs.exit);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'sounds-and-music');
  const { book, signs } = buildBlocks(pal);
  const levels: Level[] = [
    { file: 'one', title: 'A Song Per Room', hint: 'Listen: this room has a song.', song: MEADOW, map: songRoom(book, signs) },
    { file: 'two', title: 'Sounds on Pickups', hint: 'Each pickup has its own sound.', song: WALTZ, map: pickupRoom(book, signs) },
    { file: 'three', title: 'A Quiet Room', hint: 'No song here. Jump!', song: '', map: quietRoom(book, signs) },
  ];
  return { book, pal, levels };
}
