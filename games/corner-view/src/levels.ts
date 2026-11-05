// CORNER VIEW's two levels. Each is one screen, 16 blocks by 10, that never scrolls. The whole room is painted
// as one 320x200 picture (iso.ts: a floor of diamonds, cubes with a top and two sides) and cut into 20x20 blocks;
// cells that come out alike share one block. The game underneath is the plain top view of Gravity Off:
// Lena walks on the square grid, the four arrows only, and every block's Gravity is none.
//
//   1. The Corner Room: a diagonal wall of cubes. She cannot walk along it, so she goes round it in square steps.
//   2. Stairs of Towers: towers one, two and three blocks high. A tall tower covers the blocks above it, so those are solid too.
//   3. The Diamond Floor: a room whose floor is a diamond. Here Lena walks only diagonally: each arrow walks one
//      diagonal of the drawn floor (cornerHero.ts), so she goes the way the room is laid out. The room's edges are
//      cubes in steps of two blocks across and one down, the same slope she walks, with dark blocks outside them.
// Both rooms are closed in by cubes you can see, so Lena is never stopped by something she can't.
import { newMap, MLEN, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, SOLID } from '../../kit/starter/book';
import { ORIGIN, type Exit } from '../../kit/starter/map';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { cubeShades, floor, pad, tower } from './iso';

export type SignName = 'floor' | 'cube' | 'square' | 'tall' | 'front' | 'lean' | 'upright' | 'downleft' | 'zig';

export const COLS = 16;
export const ROWS = 10;
/** The sign boards' size in blocks (four across, three high) and where each level's signs stand: board top-left blocks. */
const SIGN = { w: 4, h: 3 } as const;
const WORDS: Record<SignName, string> = {
  floor: 'DIAMOND FLOOR, SQUARE GRID',
  cube: 'A CUBE IS ONE BLOCK: A TOP AND TWO SIDES',
  square: 'ARROWS WALK THE SQUARES, NOT THE DIAMONDS',
  tall: 'TALL TOWERS COVER THE BLOCKS ABOVE THEM',
  front: 'LENA IS ALWAYS IN FRONT, NEVER BEHIND',
  lean: 'EACH ARROW TAKES THE NEAREST SLANT',
  upright: 'UP IS UPPER RIGHT. RIGHT IS LOWER RIGHT.',
  downleft: 'DOWN IS LOWER LEFT. LEFT IS UPPER LEFT.',
  zig: 'TAP TWO IN TURN FOR A LINE',
};

/** A tower: the block it stands on (`row` is its lowest) and how many blocks tall its picture is (1, 2 or 3). */
type Tower = readonly [col: number, row: number, tall: number];
interface Spec {
  towers: Tower[];
  signs: [SignName, number, number][];
  start: [number, number];
  exit: [number, number];
  /** A room with a floor of its own shape: the blocks it walks on. Outside it, cubes ring it in and dark blocks fill the rest. */
  room?: boolean[][];
}

/** The cubes round the room, one block each. */
const ring: Tower[] = [];
for (let x = 0; x < COLS; x++) ring.push([x, 0, 1], [x, ROWS - 1, 1]);
for (let y = 1; y < ROWS - 1; y++) ring.push([0, y, 1], [COLS - 1, y, 1]);

/** Lena starts in the middle of the screen: the view stays where the level starts, centered on her, so she must start there. */
export const EXITS: [number, number][] = [
  [13, 7],
  [2, 5],
  [12, 5],
];
export const START: [number, number] = [8, 5];

/** Level 3's floor: a diamond whose edges step two blocks across for one down, the slope of the drawn diamonds. [first column, last column] a row. */
const DIAMOND: Record<number, [number, number]> = { 2: [7, 8], 3: [5, 10], 4: [3, 12], 5: [3, 12], 6: [5, 10], 7: [7, 8] };
const FLOOR3: boolean[][] = Array.from({ length: ROWS }, (_, y) =>
  Array.from({ length: COLS }, (_, x) => !!DIAMOND[y] && x >= DIAMOND[y][0] && x <= DIAMOND[y][1]),
);
/** The cubes that ring the diamond: every block that touches it (corners too) and is not part of it. */
const RING3: Tower[] = [];
FLOOR3.forEach((row, y) =>
  row.forEach((on, x) => {
    if (on) return;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (FLOOR3[y + dy]?.[x + dx]) return void RING3.push([x, y, 1]);
  }),
);
/** Level 1: a wall of cubes running up to the right from the floor's edge, like a wall seen from a corner. Its top end is open: Lena goes round there. */
export const DIAGONAL: Tower[] = [
  [8, 8, 1],
  [9, 7, 1],
  [10, 6, 1],
  [11, 5, 1],
  [12, 4, 1],
  [13, 3, 1],
];
/** Level 2: a stair of towers, one, two and three blocks tall, and back down. */
export const STAIRS: Tower[] = [
  [4, 7, 1],
  [5, 7, 2],
  [6, 7, 3],
  [7, 7, 2],
  [8, 7, 1],
];

const SPECS: Spec[] = [
  {
    towers: [...ring, ...DIAGONAL],
    signs: [
      ['floor', 1, 1],
      ['cube', 6, 1],
      ['square', 1, 5],
    ],
    start: START,
    exit: EXITS[0],
  },
  {
    towers: [...ring, ...STAIRS],
    signs: [
      ['tall', 9, 1],
      ['front', 10, 5],
    ],
    start: START,
    exit: EXITS[1],
  },
  {
    towers: RING3,
    signs: [
      ['upright', 0, 0],
      ['downleft', 12, 0],
      ['lean', 0, 7],
      ['zig', 12, 7],
    ],
    start: START,
    exit: EXITS[2],
    room: FLOOR3,
  },
];

/** The pixels of a 20x20 cell of a picture. */
const cellOf = (pic: Pixels, x: number, y: number): Pixels => pic.crop(x * 20, y * 20, 20, 20);

/** Every block of a tower's footprint and cover: the blocks its picture fills. */
const cellsOf = ([col, row, tall]: Tower): [number, number][] => Array.from({ length: tall }, (_, k) => [col, row - k]);

export interface Level {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  map: IsoMap;
  /** This level's block set: a level has up to 150 blocks. */
  book: Book;
}

/** The level as a map of the 100x100 world: the room at ORIGIN, the rest filled with the ring's cube. */
class IsoMap {
  readonly map: GameMap = newMap();
  start: [number, number] = [0, 0];
  readonly exits: Exit[] = [];
  readonly width = COLS;
  readonly height = ROWS;

  constructor(
    private readonly book: Book,
    fill: string,
  ) {
    this.map.blocks.fill(book.n(fill));
  }

  set(x: number, y: number, name: string): void {
    this.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN] = this.book.n(name);
  }

  done(): GameMap {
    return this.map;
  }
}

/** One level: its picture, its blocks and its map. */
function build(pal: Pal, file: string, spec: Spec, title: string, hint: string): Level {
  const base = new Pixels(COLS * 20, ROWS * 20, 0);
  floor(base, pal);
  pad(base, pal, spec.start[0] * 20 + 10, spec.start[1] * 20 + 14, 'green');
  pad(base, pal, spec.exit[0] * 20 + 10, spec.exit[1] * 20 + 14, 'gold');
  // a room's outside is dark blocks, solid and never reached
  const dark = pal.c('ink', 1);
  const inside = (x: number, y: number) => !spec.room || spec.room[y][x];
  const ringed = new Set(spec.towers.map(([x, y]) => `${x},${y}`));
  if (spec.room)
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!inside(x, y) && !ringed.has(`${x},${y}`)) base.rect(x * 20, y * 20, 20, 20, dark);
  const purple = cubeShades(pal, 'purple');
  const teal = cubeShades(pal, 'teal');
  // painter's order: the lower a tower stands on the screen, the later it is drawn
  const sorted = [...spec.towers].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  for (const [col, row, tall] of sorted)
    tower(base, col * 20 + 10, (row + 1) * 20, tall * 20 - 10, ring.some((r) => r[0] === col && r[1] === row) || spec.room ? purple : teal);
  const solid = new Set<string>();
  if (spec.room) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!inside(x, y)) solid.add(`${x},${y}`);
  for (const t of spec.towers) for (const [x, y] of cellsOf(t)) solid.add(`${x},${y}`);

  const book = new Book('bbl');
  const names = new Map<string, string>();
  const plain = (pic: Pixels, isSolid: boolean): string => {
    const key = `${isSolid ? 'S' : 'A'}${pic.px.join(',')}`;
    let name = names.get(key);
    if (!name) {
      name = `v${names.size}`;
      names.set(key, name);
      book.add(name, pic, isSolid ? { solid: SOLID } : {});
    }
    return name;
  };
  const cells = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => plain(cellOf(base, x, y), solid.has(`${x},${y}`))));

  // the signs: the kit's boards and posts, with the floor showing where they are sky-colored
  const scratch = new Book('bbl');
  const sky = skyOf(pal);
  for (const [name, col, top] of spec.signs) {
    const s: Sign = addSign(scratch, pal, name, WORDS[name], SIGN.w, SIGN.h);
    const put = (src: string, x: number, y: number) => {
      const pic = scratch.pics.get(src)!;
      const under = cellOf(base, x, y);
      cells[y][x] = plain(
        under.crop(0, 0, 20, 20).map((px, py, c) => (pic.get(px, py) !== sky ? pic.get(px, py) : c)),
        false,
      );
    };
    s.board.forEach((row, dy) => row.forEach((n, dx) => put(n, col + dx, top + dy)));
    if (spec.room) continue; // a sign in a dark corner hangs on the wall: no posts
    put(s.legs[0], col, top + SIGN.h);
    put(s.legs[1], col + SIGN.w - 1, top + SIGN.h);
  }
  const map = new IsoMap(
    book,
    spec.room
      ? plain(
          cellOf(base, 0, 0).map(() => dark),
          true,
        )
      : cells[0][0],
  );
  cells.forEach((row, y) => row.forEach((n, x) => map.set(x, y, n)));
  map.start = [spec.start[0] + ORIGIN, spec.start[1] + ORIGIN];
  map.exits.push({ from: [spec.exit[0] + ORIGIN, spec.exit[1] + ORIGIN] });
  return { file, title, hint, map, book };
}

/** The levels in order, with the book of starter pictures the cards and menus are drawn on. */
export function buildLevels(): { pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'corner-view');
  const levels = [
    build(pal, 'one', SPECS[0], 'The Corner Room', 'Go round the wall of cubes.'),
    build(pal, 'two', SPECS[1], 'Stairs of Towers', 'Tall things cover what is behind.'),
    build(pal, 'three', SPECS[2], 'The Diamond Floor', 'Every arrow walks a diagonal.'),
  ];
  return { pal, levels };
}
