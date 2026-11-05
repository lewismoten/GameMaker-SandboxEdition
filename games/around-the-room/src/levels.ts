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
import { StarterMap } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, linesDown, lettersAcross, wrapWords, type Sign } from '../../kit/starter/sign';
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

/** The signs' words and sizes: each is 4 blocks wide. */
const SIGNS: Record<string, { text: string; h: number }> = {
  floor: { text: 'THE FLOOR. GRAVITY PULLS DOWN. LEFT WALKS, SPACE JUMPS', h: 3 },
  block1: { text: 'A BLOCK. JUMP OVER IT', h: 2 },
  trench1: { text: 'A TRENCH. JUMP ACROSS', h: 2 },
  exit1: { text: 'THE ROOM TURNS NEXT. WALK TO THE DOOR', h: 3 },
  left: { text: 'THE LEFT WALL. GRAVITY PULLS LEFT. UP WALKS UP THE WALL', h: 3 },
  jump2: { text: 'SPACE JUMPS OFF THE WALL, AND YOU FALL BACK', h: 3 },
  trench2: { text: 'A TRENCH IN THE WALL. JUMP IT', h: 2 },
  exit2: { text: 'NEXT, THE CEILING. WALK TO THE DOOR', h: 3 },
  ceil: { text: 'THE CEILING. GRAVITY PULLS UP. RIGHT WALKS RIGHT', h: 3 },
  jump3: { text: 'SPACE JUMPS DOWN FROM THE CEILING', h: 3 },
  trench3: { text: 'A WIDE TRENCH. FALLING UP IS STILL FALLING', h: 3 },
  exit3: { text: 'ONE WALL LEFT. WALK TO THE DOOR', h: 3 },
  right: { text: 'THE RIGHT WALL. GRAVITY PULLS RIGHT. DOWN WALKS DOWN', h: 3 },
  block4: { text: 'BLOCKS AND TRENCHES. SAME JUMPS, ONE MORE TURN', h: 3 },
  exit4: { text: 'THAT WAS ONE LAP. THE LAST DOOR', h: 3 },
};

const COURSES: Course[] = [
  {
    file: 'one',
    title: 'The Floor',
    hint: 'Down is down. Left walks.',
    blocks: [
      [12, 1],
      [18, 2],
    ],
    trenches: [[25, 27]],
    coins: [
      [25, 2],
      [26, 3],
      [27, 2],
      [12, 3],
      [18, 4],
    ],
    signs: [
      ['floor', 5, 3],
      ['block1', 14, 3],
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
      [14, 2],
      [20, 1],
      [21, 1],
    ],
    trenches: [
      [27, 29],
      [34, 35],
    ],
    coins: [
      [14, 4],
      [27, 2],
      [28, 3],
      [29, 2],
      [34, 3],
    ],
    signs: [
      ['left', 5, 4],
      ['jump2', 10, 8],
      ['trench2', 24, 4],
      ['exit2', 38, 5],
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
      [10, 2],
      [30, 2],
      [36, 1],
    ],
    trenches: [
      [17, 18],
      [23, 25],
    ],
    coins: [
      [17, 2],
      [18, 3],
      [24, 3],
      [25, 2],
      [30, 4],
    ],
    signs: [
      ['ceil', 5, 4],
      ['jump3', 12, 8],
      ['trench3', 21, 5],
      ['exit3', 39, 4],
    ],
    scenery: [
      [14, 'f'],
      [33, 'b'],
    ],
  },
  {
    file: 'four',
    title: 'The Right Wall',
    hint: 'Gravity right. Down walks.',
    blocks: [
      [10, 1],
      [14, 2],
      [15, 2],
      [30, 1],
    ],
    trenches: [
      [20, 22],
      [26, 27],
    ],
    coins: [
      [14, 4],
      [21, 2],
      [26, 3],
      [27, 3],
      [30, 3],
    ],
    signs: [
      ['right', 5, 4],
      ['block4', 17, 8],
      ['exit4', 36, 5],
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
  map: { start: [number, number]; exits: { from: [number, number] }[]; width: number; height: number; done(): ReturnType<StarterMap['done']>; set(x: number, y: number, name: string): unknown };
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
  for (const [a, b] of course.trenches) for (let u = a; u <= b; u++) put(u, -1, ' '), put(u, -2, ' ');
  for (let h = 0; h <= top; h++) put(-1, h, 'X'), put(N, h, 'X');
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
    // the board is upright whatever the room's turn, centered on place (u, h)
    const board = signs[name].board;
    const [cx, cy] = f.at(u, h);
    const x0 = cx - Math.floor(board[0].length / 2);
    const y0 = cy - Math.floor(board.length / 2);
    board.forEach((row, dy) => row.forEach((id, dx) => m.set(x0 + dx, y0 + dy, id)));
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
    const signs: Record<string, Sign> = {};
    for (const [name] of course.signs) {
      const s = SIGNS[name];
      // the smallest board (4 blocks wide) the words fit
      let h = 2;
      for (; h < 6; h++)
        try {
          wrapWords(s.text, lettersAcross(4), linesDown(h));
          break;
        } catch {
          // too small: try a taller board
        }
      signs[name] = addSign(book, pal, name, s.text, 4, h);
    }
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
