// AROUND THE ROOM's four levels: one little course (blocks to jump over, trenches to jump across, coins, signs and a
// door) laid along each of a room's four sides: the floor, the left wall, the ceiling and the right wall. A level is a
// list of places (frame.ts: u along the path, h out from the surface); each level's own block set (blocks.ts) draws
// the ground turned to face the hero and makes the air pull toward the surface.
//
//   1. The floor:      gravity down, the hero upright, Left walks
//   2. The left wall:  gravity left,  the hero on his side, Up walks (up the wall)
//   3. The ceiling:    gravity up,    the hero upside down, Right walks
//   4. The right wall: gravity right, the hero on his other side, Down walks (down the wall)
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { type TiledSign as Sign } from '@lewismoten/gamemaker-sandbox-tools/kit/tiledSigns';
import { addMicroPlaques } from '../../kit/starter/microPlaque';
import { roomBook } from './blocks';
import { ACROSS, frameOf, type Frame, type Room } from './frame';

/** The path's length in blocks, the same in every room. */
export const N = 44;
/** The entrance and the exit, in steps along the path. */
export const ENTRANCE_U = 1;
export const EXIT_U = N - 4;

interface Course {
  file: string;
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** Wall blocks to jump over: [u, how many blocks out from the surface]. */
  blocks: [number, number][];
  /** Trenches to jump across: [first u, last u], two blocks deep. */
  trenches: [number, number][];
  /** Coins: [u, h]. */
  coins: [number, number][];
  /** Signs: [name, u of its center, h of its center]. */
  signs: [string, number, number][];
  /** Scenery along the surface: [u, 'b' bush or 'f' flower]. */
  scenery: [number, 'b' | 'f'][];
}

/** Upright wall boards: all four rooms' words, selected per map. */
const SIGNS = {
  floor: { lines: ['PULL', '↓'] },
  walk1: { lines: ['WALK', '←'] },
  space1: { lines: ['SPACE', 'JUMPS'] },
  block1: { lines: ['JUMP', 'OVER'] },
  trench1: { lines: ['JUMP', 'OVER'] },
  exit1: { lines: ['TO', 'DOOR'] },
  left: { lines: ['PULL', '←'] },
  walk2: { lines: ['WALK', '↑'] },
  jump2: { lines: ['SPACE', 'JUMPS'] },
  trench2: { lines: ['JUMP', 'OVER'] },
  exit2: { lines: ['TO', 'DOOR'] },
  ceil: { lines: ['PULL', '↑'] },
  walk3: { lines: ['WALK', '→'] },
  jump3: { lines: ['SPACE', 'JUMPS'] },
  trench3: { lines: ['FALL', 'UP!'] },
  exit3: { lines: ['ONE', 'MORE'] },
  door3: { lines: ['TO', 'DOOR'] },
  right: { lines: ['PULL', '→'] },
  walk4: { lines: ['WALK', '↓'] },
  block4: { lines: ['JUMP', 'OVER'] },
  exit4: { lines: ['LAST', 'DOOR'] },
};

const COURSES: Course[] = [
  {
    file: 'one',
    title: 'The Floor',
    hint: 'Down is down. Left walks.',
    blocks: [
      [12, 1],
      [18, 1],
    ],
    trenches: [[25, 27]],
    coins: [
      [25, 2],
      [26, 2],
      [27, 2],
      [12, 2],
      [18, 2],
    ],
    signs: [
      ['floor', 5, 2],
      ['walk1', 7, 2],
      ['space1', 9, 2],
      ['block1', 10, 4],
      ['trench1', 22, 3],
      ['exit1', 35, 3],
    ],
    scenery: [
      [8, 'f'],
      [21, 'b'],
      [31, 'f'],
    ],
  },
  {
    file: 'two',
    title: 'The Left Wall',
    hint: 'Gravity left. Up walks.',
    blocks: [
      [14, 1],
      [20, 1],
      [21, 1],
    ],
    trenches: [
      [27, 29],
      [34, 35],
    ],
    coins: [
      [14, 2],
      [27, 2],
      [28, 2],
      [29, 2],
      [34, 2],
    ],
    signs: [
      ['left', 5, 2],
      ['walk2', 7, 2],
      ['jump2', 10, 4],
      ['trench2', 24, 4],
      ['exit2', 38, 4],
    ],
    scenery: [
      [17, 'b'],
      [31, 'f'],
    ],
  },
  {
    file: 'three',
    title: 'The Ceiling',
    hint: 'Gravity up. Right walks.',
    blocks: [
      [10, 1],
      [30, 1],
      [36, 1],
    ],
    trenches: [
      [17, 18],
      [23, 25],
    ],
    coins: [
      [17, 2],
      [18, 2],
      [24, 2],
      [25, 2],
      [30, 2],
    ],
    signs: [
      ['ceil', 5, 2],
      ['walk3', 7, 2],
      ['jump3', 8, 3],
      ['trench3', 21, 2],
      ['exit3', 32, 3],
      ['door3', 35, 3],
    ],
    scenery: [
      [12, 'f'],
      [33, 'b'],
    ],
  },
  {
    file: 'four',
    title: 'The Right Wall',
    hint: 'Gravity right. Down walks.',
    blocks: [
      [10, 1],
      [14, 1],
      [15, 1],
      [30, 1],
    ],
    trenches: [
      [20, 22],
      [26, 27],
    ],
    coins: [
      [14, 2],
      [21, 2],
      [26, 2],
      [27, 2],
      [30, 2],
    ],
    signs: [
      ['right', 5, 2],
      ['walk4', 7, 2],
      ['block4', 8, 4],
      ['exit4', 36, 4],
    ],
    scenery: [
      [8, 'f'],
      [33, 'b'],
    ],
  },
];

export interface Level {
  file: string;
  title: string;
  hint: string;
  /** The room (0 floor, 1 left wall, 2 ceiling, 3 right wall) and its places. */
  frame: Frame;
  book: Book;
  course: Course;
  map: {
    start: [number, number];
    exits: { from: [number, number] }[];
    width: number;
    height: number;
    done(): ReturnType<StarterMap['done']>;
    set(x: number, y: number, name: string): unknown;
  };
}

/** The chart of one room: terrain, coins, scenery and doors as level text, then the signs. */
function roomMap(f: Frame, course: Course, book: Book, signs: Record<string, Sign>): Level['map'] {
  const rows: string[][] = Array.from({ length: f.h }, () => Array(f.w).fill(' '));
  const put = (u: number, h: number, ch: string) => {
    const [x, y] = f.at(u, h);
    rows[y][x] = ch;
  };
  const top = ACROSS - 3;
  for (let u = -1; u <= N; u++) {
    put(u, -2, 'D');
    put(u, -1, 'G');
  }
  for (const [a, b] of course.trenches) for (let u = a; u <= b; u++) (put(u, -1, ' '), put(u, -2, ' '));
  for (let h = 0; h <= top; h++) (put(-1, h, 'X'), put(N, h, 'X'));
  for (const [u, n] of course.blocks) for (let h = 0; h < n; h++) put(u, h, 'B');
  for (const [u, ch] of course.scenery) put(u, 0, ch);
  for (const [u, h] of course.coins) put(u, h, 'c');
  put(ENTRANCE_U, 1, 's');
  put(ENTRANCE_U, 0, 'S');
  put(EXIT_U, 1, 'e');
  put(EXIT_U, 0, 'E');
  const m = new StarterMap(
    book,
    rows.map((r) => r.join('')),
  );
  for (const [name, u, h] of course.signs) {
    // The board stays upright. Its center can move off the path to clear coins and
    // scenery while staying within the camera's narrow view beside each surface.
    const board = signs[name].board;
    const [cx, cy] = f.at(u, h);
    const x0 = cx - Math.floor(board[0].length / 2);
    const y0 = cy - Math.floor(board.length / 2);
    if (x0 < 0 || y0 < 0 || x0 + board[0].length > f.w || y0 + board.length > f.h) throw new Error(`Sign ${name} leaves the room`);
    board.forEach((row, dy) => row.forEach((id, dx) => m.setOnSky(x0 + dx, y0 + dy, id)));
    const post = signs[name].post!;
    const posts = f.k === 1 || f.k === 3 ? ['microPlaque.post'] : post.rightBlock ? [post.block, post.rightBlock] : [post.block];
    if (f.k === 2) posts.reverse();
    const toward = [-f.away[0], -f.away[1]];
    // Upright plaques attach along the side facing the surface; rotate only their supports.
    for (let j = 0; j < posts.length; j++) {
      const tile = posts[j];
      const px = f.k === 0 || f.k === 2 ? x0 + post.x + j : f.k === 1 ? x0 - 1 : x0 + board[0].length;
      const py = f.k === 0 ? y0 + board.length : f.k === 2 ? y0 - 1 : y0;
      let x = px,
        y = py;
      const cells: [number, number][] = [];
      let grounded = false;
      while (x >= 0 && y >= 0 && x < f.w && y < f.h) {
        const at = m.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN];
        if (at === book.n('grass') || at === book.n('dirt')) {
          grounded = true;
          break;
        }
        cells.push([x, y]);
        x += toward[0];
        y += toward[1];
      }
      if (grounded && cells.length === 1) for (const [x, y] of cells) m.setOnSky(x, y, tile);
    }
  }
  const dirt = book.n('dirt');
  return {
    start: m.start,
    exits: m.exits,
    width: m.width,
    height: m.height,
    set: (x, y, name) => m.set(x, y, name),
    // the surface carries on past the room's far edges: the whole world behind it is ground, so nothing shows beyond
    done() {
      const map = m.done();
      const O = 10;
      const fill = (x0: number, y0: number, x1: number, y1: number) => {
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) map.blocks[y * MLEN + x] = dirt;
      };
      if (f.k === 1) fill(0, 0, O, MLEN);
      if (f.k === 2) fill(0, 0, MLEN, O);
      if (f.k === 3) fill(O + f.w, 0, MLEN, MLEN);
      return map;
    },
  };
}

/** The four levels, each with its own block set (the floor's pictures, `base`, are what the others turn). */
export function buildLevels(): { base: Book; pal: Pal; levels: Level[] } {
  const pal = buildStarterPalette(undefined, 'around-the-room');
  const floorBook = (course: Course): { book: Book; signs: Record<string, Sign> } => {
    const book = new Book('bbl');
    addStarterBlocks(book, pal);
    const signs = addMicroPlaques(book, pal, Object.fromEntries(course.signs.map(([name]) => [name, SIGNS[name as keyof typeof SIGNS]])));
    return { book, signs };
  };
  const levels: Level[] = COURSES.map((course, i) => {
    const frame = frameOf(i as Room, N);
    const { book: floor, signs } = floorBook(course);
    const book = roomBook(floor, frame.k, frame.pull);
    return { file: course.file, title: course.title, hint: course.hint, frame, book, course, map: roomMap(frame, course, book, signs) };
  });
  const { book: base } = floorBook(COURSES[0]);
  return { base, pal, levels };
}
