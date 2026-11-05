// WAVES ON THE SHORE's two levels, seen from above. Each has its own block set (one.bbl, two.bbl).
//
//   1. Open Water: a pier crosses a sea that is one block, four frames. The first stretch lays that one block everywhere,
//      so the whole sea turns at once. The second lays the four starts of the same loop in a checker, so the ripples
//      roll across. Same art, same timing.
//   2. The Shoreline: sand with water round it. A sand tile that touches water is a loop of frames in which the wave runs
//      up the sand and back; every shape of shore (straight, round corners, a cove, a point) is its own loop, laid
//      along the beach from four starts so the waves roll.
// Water is solid and drawn as water (Kit walks round it; for water he can swim in see Under the Surface).
import { Book, SOLID } from '../../kit/starter/book';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { type Sign } from '../../kit/starter/sign';
import { newMap, MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { FRAMES, WATER_TICKS, waterFrame } from './water';
import { E, N, NE, NW, REACH, S, SE, SHORE_TICKS, SW, W, normalize, pebbleTile, sandTile, shoreFrame } from './shoreTiles';
import { addEntrance, addExit, addRing, addSignOn, plankTile, type Timed } from './blocks';

/** Where each level's top-left block sits in the 100x100 world. */
const OX = 18;
const OY = 38;

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  book: Book;
  /** The blocks that turn into others by themselves. */
  timed: Timed[];
  map: ShoreMap;
}

export interface ShoreMap {
  start: [number, number];
  /** The exit door cells (the bottom block of each), in map blocks. */
  exits: { from: [number, number] }[];
  done(): GameMap;
}

/** The words and board size of each sign (a 4x4 board holds 9 letters across and 8 lines). */
const WORDS = {
  sea1: 'ONE BLOCK, STAMPED OVER AND OVER, IS THIS WHOLE SEA',
  sea2: 'SAME START: THE WHOLE SEA TURNS AT ONCE. NEXT, 4 STARTS',
  sea3: '4 STARTS, SO RIPPLES ROLL. THE ART IS THE SAME',
  shore1: 'THE EDGE BLOCKS ARE A LOOP. WAVES RUN IN AND OUT',
  shore2: 'ROUND CORNERS: MORE EDGE BLOCKS, DRAWN ROUND',
  shore3: 'EACH EDGE STARTS AT ITS OWN FRAME, SO WAVES ROLL',
} as const;

/** The four water blocks (the ring), solid so Kit keeps out; they are all the same loop, one frame apart. */
function addWater(book: Book, pal: Pal, timed: Timed[]): string[] {
  const frames = Array.from({ length: FRAMES }, (_, f) => waterFrame(pal, f));
  return addRing(book, timed, 'sea', frames, new Array(FRAMES).fill(WATER_TICKS), { solid: SOLID });
}

/** Both levels' books share their start and exit; sets cell (x, y) of the level to `name`. */
class Canvas {
  readonly map = newMap();
  constructor(readonly book: Book) {}
  set(x: number, y: number, name: string): void {
    this.map.blocks[(OY + y) * MLEN + OX + x] = this.book.n(name);
  }
  fillAll(name: (x: number, y: number) => string): void {
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) this.map.blocks[y * MLEN + x] = this.book.n(name(x - OX, y - OY));
  }
  sign(s: Sign, x: number, y: number): void {
    s.board.forEach((row, dy) => row.forEach((b, dx) => this.set(x + dx, y + dy, b)));
    this.set(x, y + s.board.length, s.legs[0]);
    this.set(x + s.board[0].length - 1, y + s.board.length, s.legs[1]);
  }
}

/** Door cells down column x from y0 to y1, each a pair (top then bottom) so any row of the pier reaches one. */
function doors(c: Canvas, x: number, y0: number, y1: number): { from: [number, number] }[] {
  const exits: { from: [number, number] }[] = [];
  for (let y = y0; y <= y1; y++) {
    c.set(x, y, (y - y0) % 2 ? 'exitBottom' : 'exitTop');
    exits.push({ from: [OX + x, OY + y] });
  }
  return exits;
}

/** Level 1: three platforms of planks and two stretches of pier over the sea. */
function openWater(): Level {
  const pal = buildStarterPalette();
  const book = new Book('bbl');
  const timed: Timed[] = [];
  const sea = addWater(book, pal, timed);
  const plank = plankTile(pal);
  book.add('plank', plank);
  addEntrance(book, pal, plank);
  addExit(book, pal, plank);
  const signs = Object.fromEntries((['sea1', 'sea2', 'sea3'] as const).map((k) => [k, addSignOn(book, pal, plank, k, WORDS[k], 4, 4)])) as Record<
    'sea1' | 'sea2' | 'sea3',
    Sign
  >;
  const c = new Canvas(book);
  // the middle platform ends the first stretch: left of it the sea is one block, right of it four starts
  const mid = 28;
  c.fillAll((x, y) => (x < mid ? sea[0] : sea[(((x + y) % FRAMES) + FRAMES) % FRAMES]));
  const platforms: [number, number][] = [
    [0, 9],
    [28, 35],
    [54, 63],
  ];
  for (const [x0, x1] of platforms) for (let y = 2; y <= 9; y++) for (let x = x0; x <= x1; x++) c.set(x, y, 'plank');
  for (let x = 10; x < 54; x++) for (const y of [6, 7]) if (c.map.blocks[(OY + y) * MLEN + OX + x] !== book.n('plank')) c.set(x, y, 'plank');
  c.set(3, 6, 'startTop');
  c.set(3, 7, 'startBottom');
  c.sign(signs.sea1, 5, 2);
  c.sign(signs.sea2, 30, 2);
  c.sign(signs.sea3, 56, 2);
  const exits = doors(c, 62, 4, 7);
  return {
    file: 'one',
    title: 'Open Water',
    hint: 'One block, four frames, one sea.',
    book,
    timed,
    map: { start: [OX + 3, OY + 7], exits, done: () => c.map },
  };
}

/** Is cell (x, y) of level 2 land? An island of sand with a cove cut into its north side and a point sticking out of it. */
function land(x: number, y: number): boolean {
  if (x >= 42 && x <= 45 && y >= 1 && y <= 3) return true; // the point
  if (x < 3 || x > 60 || y < 4 || y > 14) return false;
  return !(x >= 16 && x <= 22 && y >= 4 && y <= 7); // the cove
}

/** Level 2: the beach. */
function shoreline(): Level {
  const pal = buildStarterPalette();
  const book = new Book('bbl');
  const timed: Timed[] = [];
  const sea = addWater(book, pal, timed);
  const sand = sandTile(pal);
  book.add('sand', sand);
  book.add('pebbles', pebbleTile(pal));
  addEntrance(book, pal, sand);
  addExit(book, pal, sand);
  const signs = Object.fromEntries((['shore1', 'shore2', 'shore3'] as const).map((k) => [k, addSignOn(book, pal, sand, k, WORDS[k], 4, 4)])) as Record<
    'shore1' | 'shore2' | 'shore3',
    Sign
  >;
  const c = new Canvas(book);
  c.fillAll((x, y) => sea[(((x + y) % FRAMES) + FRAMES) % FRAMES]);
  // which of the 8 cells round (x, y) are water
  const key = (x: number, y: number): number => {
    const w = (dx: number, dy: number) => !land(x + dx, y + dy);
    return normalize(
      (w(0, -1) ? N : 0) |
        (w(1, 0) ? E : 0) |
        (w(0, 1) ? S : 0) |
        (w(-1, 0) ? W : 0) |
        (w(1, -1) ? NE : 0) |
        (w(1, 1) ? SE : 0) |
        (w(-1, 1) ? SW : 0) |
        (w(-1, -1) ? NW : 0),
    );
  };
  const made = new Set<number>();
  const pebbleAt = (x: number, y: number) => (x * 7 + y * 13) % 11 === 0;
  for (let y = 0; y <= 15; y++)
    for (let x = 0; x <= 63; x++) {
      if (!land(x, y)) continue;
      const k = key(x, y);
      if (!k) {
        c.set(x, y, pebbleAt(x, y) ? 'pebbles' : 'sand');
        continue;
      }
      if (!made.has(k)) {
        made.add(k);
        const pics = REACH.map((reach) => shoreFrame(pal, k, reach, 5));
        addRing(book, timed, `shore${k}`, pics, SHORE_TICKS);
      }
      c.set(x, y, `shore${k}.${Math.floor(x / 3) % FRAMES}`);
    }
  c.set(4, 9, 'startTop');
  c.set(4, 10, 'startBottom');
  c.sign(signs.shore1, 7, 5);
  c.sign(signs.shore2, 25, 5);
  c.sign(signs.shore3, 34, 5);
  const exits = doors(c, 43, 2, 3).concat(doors(c, 44, 2, 3));
  return {
    file: 'two',
    title: 'The Shoreline',
    hint: 'Waves run in and out on their own.',
    book,
    timed,
    map: { start: [OX + 4, OY + 10], exits, done: () => c.map },
  };
}

/** Both levels. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const levels = [openWater(), shoreline()];
  return { pal: buildStarterPalette(), levels };
}
