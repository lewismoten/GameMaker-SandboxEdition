// DIAGONAL WRAP's two levels: the same map, the same road, laid two ways. A road with a hedge either side runs down a
// 100x100 map that wraps at every edge (course.ts has the geometry).
//
//   1. Straight On: the road runs straight down the map. At the bottom edge it comes back in at the top (once), and
//      the finish is about a hundred blocks from the start.
//   2. Tilted: the same road, stepped one block right every three rows. Off the bottom it comes back in at the top a
//      third of the map further over, so it wraps three times and is about three times as long. It crosses the
//      right edge as well, and comes out on the left.
// A dashed white line marks the map's top row and left column wherever the road crosses them. Hedges you can see
// close the road in, so nothing stops Mia that she can't see.
import { addMicroPlaques, stampTiledSign, stampMicroPlaques } from '../../kit/starter/microPlaque';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import type { TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { newMap, MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { addTopBlocks } from './topBlocks';
import { HEDGE, MAP, STRAIGHT, TILTED, WIDTH, capRow, cellAt, finishRow, type Course } from './course';

export type SignName = 'straight' | 'seam' | 'back' | 'tilt' | 'lap1' | 'lap2' | 'length2' | 'distance';

/** Keep the original four-row coin exclusion around each lesson. */
const SIGN_CLEARANCE = 4;
const WORDS = {
  straight: { lines: ['100', 'TALL'], post: false },
  seam: { lines: ['MAP', 'EDGE'], post: false },
  back: { lines: ['97', 'BLOCKS'], post: false },
  tilt: { lines: ['SAME', 'MAP'], post: false },
  lap1: { lines: ['LAP', '1 OF 3'], post: false },
  lap2: { lines: ['LAP', '2 OF 3'], post: false },
  length2: { lines: ['LAP', '3 OF 3'], post: false },
  distance: { lines: ['297', 'BLOCKS'], post: false },
};

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  course: Course;
  map: DiagMap;
}

/** A level's map plus where Mia starts and which blocks are the exit doors. */
export interface DiagMap {
  start: [number, number];
  /** The exit doors (their bottom blocks), in map blocks. */
  exits: { from: [number, number] }[];
  done(): GameMap;
}

function build(book: Book, course: Course, signs: Record<SignName, Sign>, placed: [SignName, number][], coins: number[]): DiagMap {
  const map = newMap();
  const n = (name: string) => book.n(name);
  const set = (x: number, y: number, name: string) => void (map.blocks[y * MLEN + x] = n(name));
  map.blocks.fill(n('lawn'));
  // a few flowers on the lawn, scattered by a fixed rule
  for (let k = 0; k < 90; k++) set((k * 37 + 11) % MAP, (k * 53 + 5) % MAP, 'flower');
  const last = capRow(course);
  const road = (u: number, name = 'path') => {
    for (let i = 0; i < WIDTH; i++) {
      const [x, y] = cellAt(course, u, i);
      // the map's edge shows on the road
      set(x, y, name === 'path' ? (y === 0 && x === 0 ? 'seamCorner' : y === 0 ? 'seamTop' : x === 0 ? 'seamLeft' : 'path') : name);
    }
  };
  for (let u = 0; u < last; u++) {
    for (let h = 1; h <= HEDGE; h++) {
      const [lx, ly] = cellAt(course, u, -h);
      const [rx, ry] = cellAt(course, u, WIDTH - 1 + h);
      set(lx, ly, 'hedge');
      set(rx, ry, 'hedge');
    }
    road(u);
  }
  // the hedge across the end of the road, which is the row above the entrance
  for (let i = -HEDGE; i <= WIDTH + HEDGE; i++) {
    const [x, y] = cellAt(course, last, i);
    set(x, y, 'hedge');
  }
  // coins down the middle
  for (const u of coins) {
    const [x, y] = cellAt(course, u, 2);
    set(x, y, 'coin');
  }
  // the entrance mat, in the middle of the road
  const [sx, sy] = cellAt(course, 1, 2);
  const [tx, ty] = cellAt(course, 0, 2);
  set(tx, ty, 'startTop');
  set(sx, sy, 'startBottom');
  // the finish: a row of doors across the whole road, so any way Mia walks reaches one
  const exits: { from: [number, number] }[] = [];
  const f = finishRow(course);
  for (let i = 0; i < WIDTH; i++) {
    const [x, y] = cellAt(course, f, i);
    const [ex, ey] = cellAt(course, f - 1, i);
    set(ex, ey, 'exitTop');
    set(x, y, 'exitBottom');
    exits.push({ from: [x, y] });
  }
  // Compact plaques stay on clear road cells, in the original lesson order.
  for (const [name, u] of placed) {
    const s = signs[name];
    const [x0, y0] = cellAt(course, u, 0);
    const at = (dx: number, dy: number): [number, number] => [(x0 + dx) % MAP, (y0 + dy) % MAP];
    const target = {
      set: (dx: number, dy: number, block: string) => {
        const [x, y] = at(dx, dy);
        if (map.blocks[y * MLEN + x] !== n('path')) throw new Error(`Sign ${name} would cover scenery at ${x},${y}`);
        set(x, y, block);
      },
    };
    if (name === 'length2') stampMicroPlaques(target, 0, 0, [s, signs.distance], 0);
    else stampTiledSign(target, 0, 0, s);
  }
  return { start: [sx, sy], exits, done: () => map };
}

/** Level 1: signs at the start, before the edge, after it, and near the finish. */
function straight(book: Book, signs: Record<SignName, Sign>): DiagMap {
  const c = STRAIGHT;
  const coins = [14, 24, 34, 53, 66, 76, 90];
  return build(
    book,
    c,
    signs,
    [
      ['straight', 4],
      ['seam', 43],
      ['back', 56],
    ],
    coins,
  );
}

/** Level 2: signs at the start, one for each lap, and the length at the end. */
function tilted(book: Book, signs: Record<SignName, Sign>): DiagMap {
  const c = TILTED;
  const placed: [SignName, number][] = [
    ['tilt', 3],
    ['lap1', 39],
    ['lap2', 141],
    ['length2', 240],
  ];
  const coins: number[] = [];
  // a coin about every 14 rows down the middle, none on a sign or the map's edge
  for (let u = 12; u < 294; u += 14) {
    const nearSign = placed.some(([, at]) => u >= at - 1 && u <= at + SIGN_CLEARANCE + 1);
    const nearEdge = [50, 150, 250].some((e) => Math.abs(u - e) < 2);
    if (!nearSign && !nearEdge) coins.push(u);
  }
  return build(book, c, signs, placed, coins);
}

/** Both levels. */
export function buildLevels(): { book: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'diagonal-wrap');
  const side = new Book('bbl');
  addStarterBlocks(side, pal);
  const book = new Book('bbl');
  const road = addTopBlocks(book, pal, side);
  const scratch = new Book('bbl');
  const signs = addMicroPlaques(scratch, pal, WORDS);
  for (const [name, pic] of scratch.pics)
    book.add(name, name.includes('.post') ? pic.crop(0, 0, 20, 20).map((x, y, c) => (c === skyOf(pal) ? road.get(x, y) : c)) : pic);
  const levels: Level[] = [
    { file: 'one', title: 'Straight On', hint: 'Down the map, and round to the top.', course: STRAIGHT, map: straight(book, signs) },
    { file: 'two', title: 'Tilted', hint: 'The same map, three times as far.', course: TILTED, map: tilted(book, signs) },
  ];
  return { book, pal, levels };
}
