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
import { Book, PULL } from '../../kit/starter/book';
import { buildTiledSigns, stampTiledSign, type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addPickups } from './pickups';

export type SignName = 'room' | 'loop' | 'next' | 'score' | 'money' | 'hurt' | 'heal' | 'quiet' | 'jump' | 'one' | 'exit';

/** One level’s block set: shared gameplay blocks and only that level’s signs. */
function buildBlocks(pal: Pal, include: readonly SignName[]): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addPickups(book, pal);
  const { blocks, signs } = buildTiledSigns(
    {
      room: { rows: [['EACH ROOM HAS'], ['ITS OWN SONG']] },
      loop: { rows: [['A SONG REPEATS'], ['UNTIL YOU LEAVE']] },
      next: { rows: [['THE NEXT ROOM'], ['PLAYS A NEW SONG']] },
      score: { rows: [['COINS PLAY THE'], ['SCORE SOUND']] },
      money: { rows: [['A BAG PLAYS THE'], ['MONEY SOUND']] },
      hurt: { rows: [['A SPIKE PLAYS'], ['THE HURT SOUND']] },
      heal: { rows: [['A HEART PLAYS'], ['THE HELP SOUND']] },
      quiet: { rows: [['THIS ROOM'], ['HAS NO SONG']] },
      jump: { rows: [['JUMPING HAS'], ['A SOUND TOO']] },
      one: { rows: [['A NEW SOUND CUTS'], ['OFF THE LAST ONE']] },
      exit: { rows: [['EXIT →']], maxWidth: 5 },
    },
    {
      include,
      colors: {
        background: skyOf(pal),
        paper: pal.c('parch', 3),
        ink: pal.c('ink', 0),
        wood: pal.c('wood', 2),
        highlight: pal.c('wood', 4),
        shadow: pal.c('wood', 0),
      },
      lettersPerBlock: 3,
      maxWidth: 7,
      glyphs: { ...MICRO_GLYPHS, '→': '100110111110100' },
      maxBlocks: Math.min(100, 150 - book.index.size),
    },
  );
  for (const [name, pic] of blocks) book.add(name, pic, { grav: PULL.down });
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
  book: Book;
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
  // A two-row turf step supports Kit at the raised entrance, clear of the signs.
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
  const sky = { set: m.setOnSky.bind(m) };
  stampTiledSign(sky, 5, onGround(GROUND, signs.room), signs.room);
  stampTiledSign(sky, 12, onGround(GROUND, signs.loop), signs.loop);
  stampTiledSign(sky, 25, onGround(GROUND, signs.next), signs.next);
  stampTiledSign(sky, 32, 7, signs.exit, 2);
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
  const sky = { set: m.setOnSky.bind(m) };
  stampTiledSign(sky, 5, onGround(GROUND, signs.score), signs.score);
  stampTiledSign(sky, 14, onGround(GROUND, signs.money), signs.money);
  stampTiledSign(sky, 22, onGround(GROUND, signs.hurt), signs.hurt);
  stampTiledSign(sky, 31, onGround(GROUND, signs.heal), signs.heal);
  stampTiledSign(sky, 42, 7, signs.exit, 2);
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
  const sky = { set: m.setOnSky.bind(m) };
  stampTiledSign(sky, 4, onGround(GROUND, signs.quiet), signs.quiet);
  stampTiledSign(sky, 11, onGround(GROUND, signs.jump), signs.jump);
  stampTiledSign(sky, 27, onGround(GROUND, signs.one), signs.one);
  stampTiledSign(sky, 38, 7, signs.exit, 2);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'sounds-and-music');
  const sets = [
    buildBlocks(pal, ['room', 'loop', 'next', 'exit']),
    buildBlocks(pal, ['score', 'money', 'hurt', 'heal', 'exit']),
    buildBlocks(pal, ['quiet', 'jump', 'one', 'exit']),
  ];
  const [first, second, third] = sets;
  const levels: Level[] = [
    { file: 'one', title: 'A Song Per Room', hint: 'Listen: this room has a song.', song: MEADOW, book: first.book, map: songRoom(first.book, first.signs) },
    {
      file: 'two',
      title: 'Sounds on Pickups',
      hint: 'Each pickup has its own sound.',
      song: WALTZ,
      book: second.book,
      map: pickupRoom(second.book, second.signs),
    },
    { file: 'three', title: 'A Quiet Room', hint: 'No song here. Jump!', song: '', book: third.book, map: quietRoom(third.book, third.signs) },
  ];
  return { book: first.book, pal, levels };
}
