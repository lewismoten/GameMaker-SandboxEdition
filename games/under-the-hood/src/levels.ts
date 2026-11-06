// UNDER THE HOOD's three levels, each painted on a Grid (a block a character, see games/kit/starter/map.ts),
// then given its own blocks, its signs and a hex-dump background on every open cell.
//
//   1. What Is an EXE: a program is a long row of bytes, each at an offset. The four bytes at 0x2575B say
//      "Play"; the gate past them wants all four.
//   2. Same Size: a word lives in a slot of fixed size. START (5 bytes) jams the lower door of a four-byte slot;
//      GO and two spaces (4 bytes) opens the upper one, up the ladder.
//   3. Ask First: pick up the backup copy before the gate; then signs on whose copy, the credits, and what this
//      game does not teach.
// Nothing here changes a player program: the levels are ordinary scenes, and the signs say where the real
// patching is taught (manual.json links the Guide's chapter and the DOS player panel).
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addHoodBlocks, hoodPalette, PLAY_BYTES } from './hoodBlocks';

const SIGNS = {
  bytes: ['AN EXE IS A LONG ROW OF BYTES', 2],
  offset: ['EVERY BYTE HAS AN OFFSET', 2],
  play: ['AT 2575B THE BYTES SAY PLAY', 2],
  gate: ['THE GATE WANTS ALL 4', 2],
  patch: ['A PATCH LIVES IN THE PLAYER, NOT IN A LEVEL', 3],
  slot: ['A WORD SITS IN A SLOT', 2],
  four: ['PLAY HAS 4 BYTES. SO DOES ITS SLOT', 2],
  long: ['START IS 5 BYTES. TOO LONG', 2],
  fits: ['GO AND 2 SPACES FITS', 2],
  same: ['SAME SIZE IN, SAME SIZE OUT', 2],
  copy: ['COPY THE EXE FIRST', 2],
  backup: ['THE GATE WANTS A BACKUP', 2],
  own: ['ONLY CHANGE YOUR OWN COPY', 2],
  credits: ['LEAVE THE CREDITS AS THEY ARE', 2],
  paid: ['UNLOCKING A PAID GAME IS NOT TAUGHT HERE', 3],
  test: ['TRY IT ON THE COPY, THEN PLAY', 2],
} as const;

export type SignName = keyof typeof SIGNS;

/** A level's block set (each level has its own .bbl, since all the signs would not fit one): the Starter blocks, this game's blocks, then the level's signs. */
export function buildBlocks(pal: Pal, names: SignName[]): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addHoodBlocks(book, pal);
  const signs = Object.fromEntries(names.map((name) => [name, addSign(book, pal, name, SIGNS[name][0], 4, SIGNS[name][1])])) as Record<SignName, Sign>;
  return { book, signs };
}

/** The signs each level stands up, in order. */
const LEVEL_SIGNS: SignName[][] = [
  ['bytes', 'offset', 'play', 'gate', 'patch'],
  ['slot', 'four', 'long', 'fits', 'same'],
  ['copy', 'backup', 'own', 'credits', 'paid', 'test'],
];

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** The level's own block set (its file is `${file}.bbl`). */
  book: Book;
  map: StarterMap;
}

/** Every level's ground row. */
export const GROUND = 10;

/** The top row of a sign standing on row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

/** A level's frame: green ground and its dark fill, an entrance at column 3, and the exit door at `exit`. */
function frame(width: number, exit: number): Grid {
  const g = new Grid(width, 15);
  g.row(GROUND, 0, width - 1, 'G').fill(0, GROUND + 1, width, 4, 'D');
  g.put(3, 8, 's').put(3, 9, 'S');
  g.put(exit, 8, 'e').put(exit, 9, 'E');
  for (const x of [9, 14, 19]) g.put(x, GROUND - 1, 'c');
  return g;
}

/** The room's two end walls and a wall at `x` from the top down to row `to`, as panels. */
function walls(m: StarterMap, width: number, at: number[], to = GROUND - 1): void {
  for (let y = 0; y < GROUND; y++) m.set(0, y, 'panel').set(width - 1, y, 'panel');
  for (const x of at) for (let y = 0; y <= to; y++) m.set(x, y, 'panel');
}

/** The hex dump behind everything: each open cell above the ground shows two rows of bytes. */
function dump(book: Book, m: StarterMap): void {
  const sky = book.n('sky');
  const map = m.done();
  for (let y = 0; y < GROUND; y++)
    for (let x = 0; x < m.width; x++) if (map.blocks[(y + ORIGIN) * 100 + x + ORIGIN] === sky) m.set(x, y, `hex${(x * 3 + y * 5) % 8}`);
}

/** Level 1: What Is an EXE. 44 blocks wide. */
function whatIsAnExe(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const W = 44;
  const g = frame(W, 40);
  for (const x of [27, 32]) g.put(x, GROUND - 1, 'c');
  const m = new StarterMap(book, g.rows());
  walls(m, W, [33], GROUND - 3);
  m.set(33, GROUND - 2, 'arch').set(33, GROUND - 1, 'playGate');
  PLAY_BYTES.forEach(([hex], i) => m.set(20 + i * 2, GROUND - 1, `b${hex}`));
  m.sign(5, onGround(GROUND, signs.bytes), signs.bytes);
  m.sign(10, onGround(GROUND, signs.offset), signs.offset);
  m.sign(15, onGround(GROUND, signs.play), signs.play);
  m.sign(28, onGround(GROUND, signs.gate), signs.gate);
  m.sign(35, onGround(GROUND, signs.patch), signs.patch);
  dump(book, m);
  return m;
}

/** The row the ledge in level 2 stands on. */
export const LEDGE = 6;

/** Level 2: Same Size. 46 blocks wide; a wall at 25 with two doors, a ledge and a ladder to the upper one. */
function sameSize(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const W = 46;
  const g = frame(W, 41);
  g.col(18, LEDGE - 1, GROUND - 1, 'H');
  for (const x of [32, 37]) g.put(x, GROUND - 1, 'c');
  const m = new StarterMap(book, g.rows());
  walls(m, W, [25]);
  for (let x = 19; x <= 29; x++) if (x !== 25) m.set(x, LEDGE, 'panel');
  m.set(25, LEDGE - 2, 'arch').set(25, LEDGE - 1, 'goPlate');
  m.set(25, GROUND - 2, 'arch').set(25, GROUND - 1, 'startPlate');
  m.sign(5, onGround(GROUND, signs.slot), signs.slot);
  m.sign(10, onGround(GROUND, signs.four), signs.four);
  m.sign(20, onGround(GROUND, signs.long), signs.long);
  m.sign(20, onGround(LEDGE, signs.fits), signs.fits);
  m.sign(31, onGround(GROUND, signs.same), signs.same);
  dump(book, m);
  return m;
}

/** Level 3: Ask First. 46 blocks wide; the backup gate is in a wall at 16. */
function askFirst(book: Book, signs: Record<SignName, Sign>): StarterMap {
  const W = 46;
  const g = frame(W, 41);
  for (const x of [26, 27, 33, 38]) g.put(x, GROUND - 1, 'c');
  const m = new StarterMap(book, g.rows());
  walls(m, W, [16], GROUND - 3);
  m.set(16, GROUND - 2, 'arch').set(16, GROUND - 1, 'backupGate');
  m.set(10, GROUND - 1, 'floppy');
  m.set(23, 5, 'creditsL').set(24, 5, 'creditsR');
  m.sign(5, onGround(GROUND, signs.copy), signs.copy);
  m.sign(11, onGround(GROUND, signs.backup), signs.backup);
  m.sign(17, onGround(GROUND, signs.own), signs.own);
  m.sign(22, onGround(GROUND, signs.credits), signs.credits);
  m.sign(28, onGround(GROUND, signs.paid), signs.paid);
  m.sign(34, onGround(GROUND, signs.test), signs.test);
  dump(book, m);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = hoodPalette();
  const make = (i: number, file: string, title: string, hint: string, draw: typeof whatIsAnExe): Level => {
    const { book, signs } = buildBlocks(pal, LEVEL_SIGNS[i]);
    return { file, title, hint, book, map: draw(book, signs) };
  };
  const levels: Level[] = [
    make(0, 'one', 'What Is an EXE', 'A program is a row of bytes.', whatIsAnExe),
    make(1, 'two', 'Same Size', 'A word must fit its slot.', sameSize),
    make(2, 'three', 'Ask First', 'Back up, and change only your own.', askFirst),
  ];
  return { book: levels[0].book, pal, levels };
}
