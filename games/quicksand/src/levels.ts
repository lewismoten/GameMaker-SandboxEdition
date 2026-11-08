// QUICKSAND's two levels. Each is painted on a Grid (a block a character, see games/kit/starter/map.ts
// for what the letters mean), then given its signs and its sand.
//
//   1. Don't Stand Still: a patch of quicksand between two grassy banks. Sand is a chain of blocks, each
//      one set to turn into the next when it is touched. Standing on a block touches it on every tick,
//      so a block you stand on runs down its chain (a dimple, a wider one, a swirl) and gives way: you
//      drop into a hole a block deep and jump out. Walk on and no block is under you long enough.
//   2. Stepping Stones: a wide crossing with stones that never sink, a coin on each, and a stretch of
//      dark wet sand whose chain is shorter, so it gives way sooner.
//
// Under the sand is a firm bed, so a hole is only a block deep and you can always jump out. A hole
// stays a hole (Game-Maker has no way to fill it back in). Both rooms end in a visible hedge.
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { STAGES, bed, hole, sandAt, sandRamps, stone, tuft, type Kind } from './props';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: StarterMap;
  book: Book;
}

const AIR = { grav: PULL.down };

/** How many touches each picture of a chain lasts: dry sand gives way after STAGES * DRY touches, wet after STAGES * WET. */
export const DRY = 9;
export const WET = 5;

export const GROUND_ONE = 10;
export const GROUND_TWO = 10;
export const WIDTH_ONE = 36;
export const WIDTH_TWO = 46;
/** Level 1: the quicksand's first and last columns. */
export const SAND_ONE = [15, 24] as const;
/** Level 2: the crossing's first and last columns, its stones, and the wet stretch's first and last columns. */
export const SAND_TWO = [14, 37] as const;
export const STONES = [19, 25, 32] as const;
export const WET_TWO = [26, 31] as const;

type SignName = 'sinks' | 'walk' | 'stones' | 'wet';
const SIGNS: Record<SignName, string> = {
  sinks: 'STAND STILL ON SAND AND IT SINKS',
  walk: 'KEEP WALKING, OR JUMP OUT',
  stones: 'STONES NEVER SINK. REST ON ONE',
  wet: 'DARK WET SAND SINKS FASTER',
};

/** The name of the block of `kind` sand at link `i` of its chain (0 is fresh sand). */
export const link = (kind: Kind, i: number) => `${kind}.${i}`;
/** The hole `kind` sand leaves. */
export const holeOf = (kind: Kind) => `${kind}.hole`;
/** How many links a chain of `kind` sand has. */
export const linksOf = (kind: Kind) => STAGES * (kind === 'sand' ? DRY : WET);

/**
 * Adds a chain of sand blocks: link 0 turns into link 1 when touched, and so on; each picture is shown by
 * `per` links in a row, and the last link turns into the hole. Every link is solid, and pulls down like air
 * (so you stand on it); the hole is open, so you drop into it.
 */
function addSand(book: Book, pal: Pal, kind: Kind): void {
  const per = kind === 'sand' ? DRY : WET;
  const n = linksOf(kind);
  for (let i = 0; i < n; i++)
    book.add(link(kind, i), sandAt(pal, kind, Math.floor(i / per)), { solid: SOLID, grav: PULL.down, touch: i + 1 < n ? link(kind, i + 1) : holeOf(kind) });
  book.add(holeOf(kind), hole(pal, kind), AIR);
}

function startBook(pal: Pal, names: SignName[], kinds: Kind[]): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const signs: Record<string, Sign> = {};
  for (const n of names) signs[n] = addSign(book, pal, `${n}.sign`, SIGNS[n], 4, 3);
  book.add('bed', bed(pal), { solid: SOLID });
  book.add('tuft', tuft(pal), AIR);
  for (const k of kinds) addSand(book, pal, k);
  return { book, signs };
}

/** The top row of a sign standing on ground row `ground`. */
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;

function scenery(g: Grid, ground: number, clouds: [number, number][], bushes: number[], flowers: number[]): void {
  for (const [x, y] of clouds) g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of bushes) g.put(x, ground - 1, 'b');
  for (const x of flowers) g.put(x, ground - 1, 'f');
}

/** A banked room: hedges at both ends, the entrance at column 3, the exit door at `exit`, grass on dirt. */
function room(width: number, ground: number, exit: number): Grid {
  const g = new Grid(width, ground + 5);
  g.row(ground, 0, width - 1, 'G').fill(0, ground + 1, width, 4, 'D');
  g.col(0, 0, ground - 1, 'X').col(width - 1, 0, ground - 1, 'X');
  g.put(3, ground - 2, 's').put(3, ground - 1, 'S');
  g.put(exit, ground - 2, 'e').put(exit, ground - 1, 'E');
  return g;
}

/** Lays sand from column `x0` to `x1` on ground row `ground`, with the firm bed under it. */
function lay(m: StarterMap, ground: number, x0: number, x1: number, kind: Kind): void {
  for (let x = x0; x <= x1; x++) {
    m.set(x, ground, link(kind, 0));
    for (let y = ground + 1; y <= ground + 4; y++) m.set(x, y, 'bed');
  }
}

/** Level 1: one patch of dry quicksand. */
function dontStandStill(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['sinks', 'walk'], ['sand']);
  const G = GROUND_ONE;
  const g = room(WIDTH_ONE, G, 32);
  for (const x of [18, 21]) g.put(x, G - 1, 'c');
  for (const x of [27, 28]) g.put(x, G - 1, 'c');
  scenery(
    g,
    G,
    [
      [6, 1],
      [20, 2],
      [29, 1],
    ],
    [2, 34],
    [12, 30],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(5, onGround(G, signs.sinks), signs.sinks);
  m.sign(10, onGround(G, signs.walk), signs.walk);
  lay(m, G, SAND_ONE[0], SAND_ONE[1], 'sand');
  m.set(SAND_ONE[0] - 1, G - 1, 'tuft').set(SAND_ONE[1] + 1, G - 1, 'tuft');
  return { file: 'one', title: "Don't Stand Still", hint: 'Sand sinks under your feet.', map: m, book };
}

/** Level 2: a wide crossing with three stones and a wet stretch. */
function steppingStones(pal: Pal): Level {
  const { book, signs } = startBook(pal, ['stones', 'wet'], ['sand', 'wet']);
  book.add('stone', stone(pal), { solid: SOLID });
  const G = GROUND_TWO;
  const g = room(WIDTH_TWO, G, 42);
  for (const x of STONES) g.put(x, G - 1, 'c');
  scenery(
    g,
    G,
    [
      [7, 2],
      [22, 1],
      [36, 2],
    ],
    [2, 44],
    [11, 40],
  );
  const m = new StarterMap(book, g.rows());
  m.sign(4, onGround(G, signs.stones), signs.stones);
  m.sign(9, onGround(G, signs.wet), signs.wet);
  lay(m, G, SAND_TWO[0], SAND_TWO[1], 'sand');
  lay(m, G, WET_TWO[0], WET_TWO[1], 'wet');
  for (const x of STONES) m.set(x, G, 'stone');
  m.set(SAND_TWO[0] - 1, G - 1, 'tuft').set(SAND_TWO[1] + 1, G - 1, 'tuft');
  return { file: 'two', title: 'Stepping Stones', hint: 'Stones never sink.', map: m, book };
}

/** The palette and the levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(sandRamps, 'quicksand');
  return { pal, levels: [dontStandStill(pal), steppingStones(pal)] };
}
