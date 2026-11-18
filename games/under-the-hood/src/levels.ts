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
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addHoodBlocks, hoodPalette, PLAY_BYTES } from './hoodBlocks';

const SIGNS = {
  play: { lines: ['2575B:', 'PLAY'], post: false },
  gate: { lines: ['NEED', '4'] },
  long: { lines: ['START=5', 'TOO LONG'] },
  fits: { lines: ['GO'] },
  spaces: { lines: ['2', 'SPACES'] },
  copy: { lines: ['COPY EXE', 'FIRST'] },
  own: { lines: ['YOUR OWN', 'COPY'] },
  credits: { lines: ['KEEP THE', 'CREDITS'] },
  paid: { lines: ['NO PAID', 'UNLOCKS'] },
} as const;

export type SignName = keyof typeof SIGNS;

/** A level's block set (each level has its own .bbl, since all the signs would not fit one): the Starter blocks, this game's blocks, then the level's signs. */
export function buildBlocks(pal: Pal, names: SignName[]): { book: Book; signs: Record<SignName, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  addHoodBlocks(book, pal);
  const signs = addMicroPlaques(book, pal, Object.fromEntries(names.map((name) => [name, SIGNS[name]]))) as Record<SignName, Sign>;
  return { book, signs };
}

/** The signs each level stands up, in order. */
const LEVEL_SIGNS: SignName[][] = [
  ['play', 'gate'],
  ['long', 'fits', 'spaces'],
  ['copy', 'own', 'credits', 'paid'],
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
  // A narrow turf ledge supports the hero at entry, with dirt down to the path.
  g.put(3, 8, 'G').put(3, 9, 'D');
  g.put(3, 6, 's').put(3, 7, 'S');
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
function dump(book: Book, pal: Pal, m: StarterMap): void {
  const sky = book.n('sky');
  const map = m.done();
  const names = [...book.index.keys()];
  for (let y = 0; y < GROUND; y++)
    for (let x = 0; x < m.width; x++) {
      const block = map.blocks[(y + ORIGIN) * 100 + x + ORIGIN];
      const hex = `hex${(x * 3 + y * 5) % 8}`;
      if (block === sky) m.set(x, y, hex);
      else if (names[block].startsWith('microPlaque.post')) {
        // Copy shared supports before adding the local dump texture; boards stay shared.
        const source = names[block];
        const mounted = `${source}.${hex}`;
        if (!book.has(mounted))
          book.add(
            mounted,
            book.pics
              .get(source)!
              .crop(0, 0, 20, 20)
              .map((px, py, c) => (c === skyOf(pal) ? book.pics.get(hex)!.get(px, py) : c)),
            book.rulesOf(source),
          );
        m.set(x, y, mounted);
      }
    }
}

/** Level 1: What Is an EXE. 44 blocks wide. */
function whatIsAnExe(book: Book, signs: Record<SignName, Sign>, pal: Pal): StarterMap {
  const W = 44;
  const g = frame(W, 40);
  for (const x of [27, 32]) g.put(x, GROUND - 1, 'c');
  const m = new StarterMap(book, g.rows());
  walls(m, W, [33], GROUND - 3);
  m.set(33, GROUND - 2, 'arch').set(33, GROUND - 1, 'playGate');
  PLAY_BYTES.forEach(([hex], i) => m.set(20 + i * 2, GROUND - 1, `b${hex}`));

  stampTiledSign({ set: m.setOnSky.bind(m) }, 15, onGround(GROUND, signs.play), signs.play, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 28, onGround(GROUND, signs.gate), signs.gate, 1, { maxPostHeight: 1 });

  dump(book, pal, m);
  return m;
}

/** The row the ledge in level 2 stands on. */
export const LEDGE = 6;

/** Level 2: Same Size. 46 blocks wide; a wall at 25 with two doors, a ledge and a ladder to the upper one. */
function sameSize(book: Book, signs: Record<SignName, Sign>, pal: Pal): StarterMap {
  const W = 46;
  const g = frame(W, 41);
  g.col(18, LEDGE - 1, GROUND - 1, 'H');
  for (const x of [32, 37]) g.put(x, GROUND - 1, 'c');
  const m = new StarterMap(book, g.rows());
  walls(m, W, [25]);
  // left of the wall only: a ledge on both sides would draw a plus sign
  for (let x = 19; x <= 24; x++) m.set(x, LEDGE, 'panel');
  m.set(25, LEDGE - 2, 'arch').set(25, LEDGE - 1, 'goPlate');
  m.set(25, GROUND - 2, 'arch').set(25, GROUND - 1, 'startPlate');

  stampTiledSign({ set: m.setOnSky.bind(m) }, 20, onGround(GROUND, signs.long), signs.long, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 20, onGround(LEDGE, signs.fits), signs.fits, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 22, onGround(LEDGE, signs.spaces), signs.spaces, 1, { maxPostHeight: 1 });

  dump(book, pal, m);
  return m;
}

/** Level 3: Ask First. 46 blocks wide; the backup gate is in a wall at 16. */
function askFirst(book: Book, signs: Record<SignName, Sign>, pal: Pal): StarterMap {
  const W = 46;
  const g = frame(W, 41);
  for (const x of [26, 27, 33, 38]) g.put(x, GROUND - 1, 'c');
  const m = new StarterMap(book, g.rows());
  walls(m, W, [16], GROUND - 3);
  m.set(16, GROUND - 2, 'arch').set(16, GROUND - 1, 'backupGate');
  m.set(10, GROUND - 1, 'floppy');
  m.set(23, 5, 'creditsL').set(24, 5, 'creditsR');
  stampTiledSign({ set: m.setOnSky.bind(m) }, 5, onGround(GROUND, signs.copy), signs.copy, 1, { maxPostHeight: 1 });

  stampTiledSign({ set: m.setOnSky.bind(m) }, 17, onGround(GROUND, signs.own), signs.own, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 22, onGround(GROUND, signs.credits), signs.credits, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 28, onGround(GROUND, signs.paid), signs.paid, 1, { maxPostHeight: 1 });

  dump(book, pal, m);
  return m;
}

/** The levels in order. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = hoodPalette();
  const make = (i: number, file: string, title: string, hint: string, draw: typeof whatIsAnExe): Level => {
    const { book, signs } = buildBlocks(pal, LEVEL_SIGNS[i]);
    return { file, title, hint, book, map: draw(book, signs, pal) };
  };
  const levels: Level[] = [
    make(0, 'one', 'What Is an EXE', 'A program is a row of bytes.', whatIsAnExe),
    make(1, 'two', 'Same Size', 'A word must fit its slot.', sameSize),
    make(2, 'three', 'Ask First', 'Back up, and change only your own.', askFirst),
  ];
  return { book: levels[0].book, pal, levels };
}
