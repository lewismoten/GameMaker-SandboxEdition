// TWINKLE, TWINKLE's two levels, painted on a Grid (see games/kit/starter/map.ts for the letters), each with its own
// block set (one.bbl, two.bbl), then given stars.
//
//   1. All at Once: a night meadow. The sky's first half has stars that all keep the same time, so they blink together,
//      which looks like a signal, not a sky. The second half has the same stars, each in a loop of its own times.
//   2. A Night Sky: a bigger meadow with a moon and hills, under the second kind of sky.
// Both kinds of sky use the same six star pictures. What differs is the time each loop takes.
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { stampTiledSign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { addMoon, addHill } from './scenery';
import { SPOTS, addOwnStars, addSyncStars, nightPalette, type Timed } from './stars';

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  book: Book;
  /** The blocks that turn into others by themselves. */
  timed: Timed[];
  map: StarterMap;
  /** The stars laid in the sky, for the checks. */
  stars: Star[];
}

/** A star laid in the sky: level block, which of the six pictures, which of the loop's four starts, and which set. */
export interface Star {
  x: number;
  y: number;
  spot: number;
  start: number;
  set: 'sync' | 'star';
}

const WORDS = {
  same: { lines: ['SAME', 'TIME'] },
  own: { lines: ['OWN', 'TIME'] },
  six: { lines: ['6 LOOPS'] },
} as const;
type SignName = keyof typeof WORDS;

/** The ground's top row in both levels: signs stand on it. */
const GROUND = 11;
const onGround = (s: Sign) => GROUND - 1 - s.board.length;

interface Built {
  book: Book;
  timed: Timed[];
  signs: Record<SignName, Sign>;
}

/** A level's block set: the Starter blocks, its signs, and the stars (and moon and hill) it needs. */
function blocks(pal: Pal, level: 1 | 2): Built {
  const book = new Book('bbl');
  const timed: Timed[] = [];
  addStarterBlocks(book, pal);
  const signs = (level === 1 ? addMicroPlaques(book, pal, WORDS) : {}) as Record<SignName, Sign>;
  if (level === 1) addSyncStars(book, timed, pal);
  addOwnStars(book, timed, pal);
  if (level === 2) {
    addMoon(book, pal);
    addHill(book, pal);
  }
  return { book, timed, signs };
}

/**
 * Lays stars on the sky cells of columns x0..x1, rows 2..rowMax. With `set` 'sync' every star is a slot-0 block of the
 * same-time set; with 'star' each is of one of the six loops, started at any of its four frames, and no two stars within
 * 4 blocks share a picture (and so a loop).
 */
function scatter(m: StarterMap, book: Book, set: 'sync' | 'star', x0: number, x1: number, rowMax: number, seed: number): Star[] {
  const rand = rng(seed);
  const sky = book.n('sky');
  // Preserve the sky animation layout while the signs shrink or disappear.
  const reserved = (x: number, y: number) =>
    m.width === 56 ? (y >= 7 && ((x >= 6 && x <= 12) || (x >= 42 && x <= 48))) || (y >= 8 && x >= 25 && x <= 32) : y >= 7 && x >= 5 && x <= 12;
  const cells: [number, number][] = [];
  for (let y = 2; y <= rowMax; y++)
    for (let x = x0; x <= x1; x++) if (!reserved(x, y) && m.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN] === sky) cells.push([x, y]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const placed: Star[] = [];
  for (const [x, y] of cells) {
    if (rand() > 0.3) continue;
    if (placed.some((s) => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1)) continue; // never side by side
    const near = new Set(placed.filter((s) => Math.abs(s.x - x) <= 4 && Math.abs(s.y - y) <= 4).map((s) => s.spot));
    const free = SPOTS.map((_s, i) => i).filter((i) => set === 'sync' || !near.has(i));
    if (!free.length) continue;
    const spot = free[Math.floor(rand() * free.length)];
    const start = set === 'sync' ? 0 : Math.floor(rand() * 4);
    placed.push({ x, y, spot, start, set });
    m.set(x, y, `${set === 'sync' ? 'sync' : 'star'}${spot}.${start}`);
  }
  return placed;
}

/** Level 1: 56 blocks wide; the first half of the sky keeps one time, the second keeps six. */
function allAtOnce(pal: Pal): Level {
  const { book, timed, signs } = blocks(pal, 1);
  const g = new Grid(56, 15);
  g.row(GROUND, 0, 55, 'G').fill(0, GROUND + 1, 56, 3, 'D');
  g.col(0, 0, GROUND - 1, 'X').col(55, 0, GROUND - 1, 'X');
  // A three-row turf ledge opens the view onto the night sky.
  g.put(3, GROUND - 3, 'G').fill(3, GROUND - 2, 1, 2, 'D');
  g.put(3, GROUND - 5, 's').put(3, GROUND - 4, 'S');
  g.put(52, GROUND - 2, 'e').put(52, GROUND - 1, 'E');
  for (const x of [13, 21, 38]) g.put(x, GROUND - 1, 'b');
  for (const x of [11, 17, 33, 47]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  stampTiledSign({ set: m.setOnSky.bind(m) }, 6, onGround(signs.same), signs.same, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 25, onGround(signs.own), signs.own, 1, { maxPostHeight: 1 });
  stampTiledSign({ set: m.setOnSky.bind(m) }, 28, onGround(signs.six), signs.six, 1, { maxPostHeight: 1 });
  const stars = [...scatter(m, book, 'sync', 1, 24, 8, 11), ...scatter(m, book, 'star', 30, 54, 8, 12)];
  return { file: 'one', title: 'All at Once', hint: 'The same stars, then each its own.', book, timed, map: m, stars };
}

/** Level 2: 60 blocks wide; a moon, hills and a sky of six loops. */
function nightSky(pal: Pal): Level {
  const { book, timed } = blocks(pal, 2);
  const g = new Grid(60, 15);
  g.row(GROUND, 0, 59, 'G').fill(0, GROUND + 1, 60, 3, 'D');
  g.col(0, 0, GROUND - 1, 'X').col(59, 0, GROUND - 1, 'X');
  // A three-row turf ledge opens the view onto the night sky.
  g.put(3, GROUND - 3, 'G').fill(3, GROUND - 2, 1, 2, 'D');
  g.put(3, GROUND - 5, 's').put(3, GROUND - 4, 'S');
  g.put(56, GROUND - 2, 'e').put(56, GROUND - 1, 'E');
  for (const x of [12, 33, 50]) g.put(x, GROUND - 1, 'b');
  for (const x of [10, 28, 38, 53]) g.put(x, GROUND - 1, 'f');
  const m = new StarterMap(book, g.rows());
  for (const x0 of [12, 36]) for (let i = 0; i < 3; i++) m.set(x0 + i + (x0 === 12 ? 2 : 6), GROUND - 1, `hill.${i}`);
  const moon = [...Array(3).keys()].map((row) => [...Array(3).keys()].map((col) => `moon.${col}${row}`));
  moon.forEach((row, dy) => row.forEach((name, dx) => m.set(46 + dx, 5 + dy, name)));

  const stars = scatter(m, book, 'star', 1, 58, 8, 21);
  return { file: 'two', title: 'A Night Sky', hint: 'A moon, hills and a sky of loops.', book, timed, map: m, stars };
}

/** The levels in order. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = nightPalette();
  return { pal, levels: [allAtOnce(pal), nightSky(pal)] };
}
export type { SignName };
