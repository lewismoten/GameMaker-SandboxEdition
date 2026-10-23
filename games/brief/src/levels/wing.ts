// A wing of the library: one map holding its hallway (four tall books on the shelves, a
// door back to the reading room) and its four books, each book a screen of its own, walled
// in by page edges. The hallway, every book and every story card share the wing's files.
//
//   map window   0..15     the hallway
//   map window  16..31     book 1, then books 2..4 every 16 columns
//
// A book's way out is THE END page (E): a solid page that only opens for a hundred words
// (counter 3, which it takes), and the open page counts the story into the wing (counter
// 20 + w) as Joe steps onto it. Right behind it, walled in, a bookmark (L) is the link to the
// story: a link on the page itself would be taken the moment the page opens, before Joe ever
// touched the open page. That link is a book's only way out, so the story (the scene's exit
// graphic) is shown exactly when it has been put back. Nothing in a book can take words away
// (shushers and the like fine points instead), so every book can always be finished.
// (An X in the rows is page edge, where the back cover used to be.)
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, bevel, micro } from '../art/draw';
import { c, r } from '../art/pal';
import { blank, floor, on, sign } from '../art/kit';
import { CTR, WORDS_PER_BOOK, wingCounter } from '../ids';
import { story, type Wing } from '../stories';
import { Area, WIN_W, checkWords, type Cell, type Window } from './area';

export interface BookSpec {
  /** The story's number (stories.ts). */
  n: number;
  /** The block under word slips, monsters and '@' ('.' in the rows). */
  floor: string;
  rows: string[];
  legend: Record<string, Cell>;
  /** Joe's note on the book's cover page (a short paragraph). */
  note: string;
  /** The picture after the story: rows of block names ('m:' for a monster frame), and its caption. */
  twist: { grid: (string | null)[][]; caption: string[] };
}

export interface WingSpec {
  wing: Wing;
  /** Ramp for the hallway carpet, the spines' leather and the page corners. */
  tint: string;
  /**
   * The wing's library stamp (the one that inks SHELVED on its returns): its rubber, its rim
   * and its emblem (ramp, shade). It inks the plate over the wing's door and its gate in the
   * Reserve Stacks.
   */
  stamp: [[string, number], [string, number], [string, number]];
  /** The two hallway signs (three lines each, 14 characters at most). */
  signs: [string[], string[]];
  /** Draws the wing's story blocks and monsters into the area. */
  art(a: Area): void;
  /** A guest wandering the hallway (a monster made by `art`), if any. */
  guest?: string;
  books: BookSpec[];
}

export interface CompiledBook {
  spec: BookSpec;
  win: Window;
  /** THE END page (solid until it takes a hundred words; open, it counts the story). */
  page: { x: number; y: number };
  /** The bookmark behind it: the link to the story's card. */
  end: { x: number; y: number };
}

export interface CompiledWing {
  spec: WingSpec;
  index: number;
  area: Area;
  hall: Window;
  /** The hallway's four spines (links into the books) and its door (back to the reading room). */
  spines: { x: number; y: number }[];
  door: { x: number; y: number };
  books: CompiledBook[];
  /** A quiet nook behind a gap in the hallway's shelves (levels/hidden.ts), if the wing has one. */
  nook?: Nook;
}

/** The nook: its own scene, two screens wide and scrolling, so its far end is never on screen as Joe comes in. */
export interface Nook {
  /** The gap in the hallway's shelves (a link into the nook). */
  gap: { x: number; y: number };
  /** Where Joe comes in, and the way back out to the hallway. */
  entry: { x: number; y: number };
  out: { x: number; y: number };
}

/** A bookshelf: three shelves of books of every color. */
export function shelf(seed: number, tint: string): Pixels {
  const p = new Pixels(20, 20, c('wood', 1));
  const R = rng(seed);
  for (const top of [0, 7, 14]) {
    let x = 1;
    while (x < 19) {
      const w = 1 + Math.floor(R() * 3);
      const h = 4 + Math.floor(R() * 3);
      const ramp = ['red', 'green', 'blue', 'brown', tint, 'purple', 'teal'][Math.floor(R() * 7)];
      p.rect(x, top + 6 - h, Math.min(w, 19 - x), h, c(ramp, 1 + Math.floor(R() * 3)));
      if (h > 4) p.rect(x, top + 6 - h + 1, Math.min(w, 19 - x), 1, c('brass', 3));
      x += w;
    }
    p.rect(0, top + 6, 20, 1, c('wood', 3));
  }
  p.rect(0, 0, 1, 20, c('wood', 0)).rect(19, 0, 1, 20, c('wood', 0));
  return p;
}

/** A tall book standing on the shelf, its spine lettered with a Roman numeral: walk into it. */
function spine(k: number, tint: string, seed: number): Pixels {
  const p = shelf(seed, tint);
  const leather = [tint, 'green', 'blue', 'purple'][k];
  bevel(p, 4, 0, 12, 20, r(leather), 2, 1);
  p.rect(4, 3, 12, 1, c('brass', 3)).rect(4, 16, 12, 1, c('brass', 3));
  const num = ['I', 'II', 'III', 'IV'][k];
  micro(p, 10 - num.length * 2, 8, num, c('brass', 4));
  return p;
}

/** Page edges: the walls inside a book, a stack of cream pages with a leather corner. */
function edge(tint: string): Pixels {
  const p = new Pixels(20, 20, c('paper', 3));
  for (let y = 1; y < 20; y += 2) p.rect(0, y, 20, 1, c('paper', 2));
  p.rect(0, 0, 20, 1, c(tint, 2)).rect(0, 19, 20, 1, c(tint, 1));
  return p;
}

/** THE END: a closed book with a brass lock reading 100, then open, then open and counted. */
function endPage(state: 'shut' | 'open' | 'done', under: Pixels, tint: string): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(under.px);
  if (state === 'shut') {
    bevel(p, 2, 2, 16, 16, r(tint), 2, 1);
    p.rect(4, 3, 12, 10, c('paper', 4));
    micro(p, 5, 4, 'THE', c('ink', 0));
    micro(p, 5, 10 - 3, 'END', c('ink', 0));
    p.rect(3, 13, 14, 6, c('brass', 2)).frame(3, 13, 14, 6, c('brass', 0));
    micro(p, 4, 14, '100', c('ink', 0));
  } else {
    p.rect(1, 4, 18, 13, c('ink', 0));
    p.rect(2, 5, 8, 11, c('paper', 4)).rect(10, 5, 8, 11, c('paper', 3));
    p.rect(9, 5, 2, 11, c('paper', 1));
    micro(p, 3, 7, 'THE', c('ink', 0));
    micro(p, 11, 7, 'END', c('ink', 0));
    if (state === 'done') for (const [x, y] of [[4, 2], [15, 2], [1, 1], [18, 17]]) p.set(x, y, c('yellow', 3));
    p.rect(3, 12, 6, 1, c('grey', 3)).rect(11, 12, 6, 1, c('grey', 3));
  }
  return p;
}

/** The bookmark behind THE END: a red ribbon on gold, the way on to the story. */
function bookmark(under: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(under.px);
  p.rect(2, 2, 16, 16, c('brass', 3)).frame(2, 2, 16, 16, c('brass', 1));
  p.rect(8, 0, 4, 16, c('red', 2)).rect(8, 16, 2, 3, c('red', 2)).rect(10, 16, 2, 2, c('red', 2));
  p.rect(8, 0, 1, 16, c('red', 4));
  return p;
}


/** The wing's rubber stamp on its ink pad, and a fresh SHELVED impression beside it. */
function stampDesk(spec: WingSpec, under: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(under.px);
  const [rubber, rim, emblem] = spec.stamp;
  // the ink pad in its tin
  p.rect(1, 13, 12, 5, c('tin', 2)).rect(2, 14, 10, 3, c('ink', 1));
  // the stamp: a wooden knob on a handle, its rubber foot in the wing's colors
  p.disc(7, 3, 2, c('wood', 4)).rect(6, 4, 3, 5, c('wood', 2));
  p.rect(3, 9, 9, 3, c(rubber[0], rubber[1])).rect(3, 11, 9, 1, c(rim[0], rim[1]));
  // the impression: a square seal, rim and emblem
  p.rect(13, 6, 6, 6, c('paper', 4)).frame(14, 7, 4, 4, c(rim[0], rim[1])).set(15, 8, c(emblem[0], emblem[1])).set(16, 9, c(emblem[0], emblem[1]));
  return p;
}

function table(under: Pixels, half: 0 | 1): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(under.px);
  p.rect(0, 5, 20, 9, c('wood', 3)).rect(0, 13, 20, 2, c('wood', 1));
  p.rect(half ? 15 : 3, 15, 2, 4, c('wood', 1));
  if (half === 0) {
    // a green banker's lamp
    p.rect(5, 1, 8, 3, c('green', 2)).rect(5, 1, 8, 1, c('green', 4)).rect(8, 4, 2, 2, c('brass', 2));
  } else {
    // an open book, face down: somebody's bookmark
    p.rect(3, 7, 12, 4, c('red', 2)).rect(8, 7, 2, 4, c('red', 0));
  }
  return p;
}

const HALL = [
  'SSSSSSNNNNSSSSSS',
  'SS1SS2SSSS3SS4SS',
  'S..............S',
  'S.Tt........G..S',
  'S..............S',
  'S.......@......S',
  'S..........Tt..S',
  'S..............S',
  'S..............S',
  'SSKKKSSSDSQQQSSS',
];

export function compileWing(spec: WingSpec, index: number): CompiledWing {
  const { wing, tint } = spec;
  const a = new Area(wing.id);
  // the hallway's blocks
  const hallFloor = floor('carpet', index + 1, tint);
  a.tile('hall', hallFloor);
  a.solid('shelf', shelf(index * 13 + 1, tint));
  a.solid('shelf2', shelf(index * 13 + 7, tint));
  for (let k = 0; k < 4; k++) a.tile(`spine${k}`, spine(k, tint, index * 13 + 3 + k));
  const door = blank();
  bevel(door, 3, 0, 14, 20, r('wood'), 3, 1);
  door.rect(5, 3, 10, 6, c('sky', 4)).rect(14, 11, 2, 2, c('brass', 3));
  micro(door, 4, 14, 'OUT', c('ink', 0));
  a.tile('door', on(shelf(index * 13 + 9, tint), door));
  sign([wing.name.toUpperCase()], 4, { board: tint, ink: 'paper', edge: 'brass' }).forEach((px, i) => a.solid(`name${i}`, on(shelf(index * 13 + 11, tint), px)));
  spec.signs.forEach((lines, s) => sign(lines, 3).forEach((px, i) => a.solid(`sign${s}${i}`, on(shelf(index * 13 + 5, tint), px))));
  a.solid('tableL', table(hallFloor, 0));
  a.solid('tableR', table(hallFloor, 1));
  a.solid('stampdesk', stampDesk(spec, hallFloor));
  // what every book has
  a.solid('edge', edge(tint));
  a.addShusher();
  spec.art(a);

  // the hallway window
  const hallLegend: Record<string, Cell> = {
    S: 'shelf',
    s: 'shelf2',
    '.': 'hall',
    T: 'tableL',
    t: 'tableR',
    G: 'stampdesk',
    D: { tile: 'door', mark: 'door' },
    N: 'shelf',
    K: 'shelf',
    Q: 'shelf',
  };
  for (let k = 0; k < 4; k++) hallLegend[String(k + 1)] = { tile: `spine${k}`, mark: `spine${k}` };
  const hall = a.window(0, 0, HALL, hallLegend, 'hall');
  for (let i = 0; i < 4; i++) a.set(6 + i, 0, `name${i}`);
  for (let i = 0; i < 3; i++) a.set(2 + i, 9, `sign0${i}`), a.set(10 + i, 9, `sign1${i}`);
  if (spec.guest) a.monAt(4, 7, spec.guest);

  if (spec.books.length !== 4 || spec.books.some((b, i) => b.n !== wing.books[i])) throw new Error(`${wing.id}: books out of order`);
  const books = spec.books.map((b, k): CompiledBook => {
    const ox = WIN_W * (k + 1);
    // each book's own END page states, over its own floor
    const under = a.tiles.pic(b.floor);
    const tag = `${k}`;
    a.tile(`endDone${tag}`, endPage('done', under, tint));
    a.tile(`endOpen${tag}`, endPage('open', under, tint), { effect: wingCounter(index), eamt: 1, touch: `endDone${tag}`, score: 0 });
    a.tile(`endLink${tag}`, bookmark(under));
    a.solid(`end${tag}`, endPage('shut', under, tint), { effect: CTR.words, eamt: -WORDS_PER_BOOK, touch: `endOpen${tag}` });
    for (const ch of ['#', '.', 'E', 'L', 'X', '@', '*', '+', '~', 'o']) if (ch in b.legend) throw new Error(`${wing.id} book ${k + 1}: "${ch}" means something else in every book`);
    const legend: Record<string, Cell> = {
      '#': 'edge',
      '.': '.',
      E: { tile: `end${tag}`, mark: 'page' },
      L: { tile: `endLink${tag}`, mark: 'end' },
      X: 'edge',
      ...b.legend,
    };
    const win = a.window(ox, 0, b.rows, legend, b.floor);
    checkWords(`${wing.id} book ${k + 1} (${story(b.n).title})`, win);
    const end = win.marks.get('end');
    const page = win.marks.get('page');
    if (!end || !page) throw new Error(`${wing.id} book ${k + 1}: needs an E and an L`);
    if (Math.abs(end.x - page.x) + Math.abs(end.y - page.y) !== 1) throw new Error(`${wing.id} book ${k + 1}: L goes right behind E`);
    // the bookmark is walled in: the only way onto it is through the open page
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = end.x + dx;
      const y = end.y + dy;
      if ((x !== page.x || y !== page.y) && y <= 9 && x >= ox && x < ox + WIN_W && !a.tiles.def(a.get(x, y)).solid) throw new Error(`${wing.id} book ${k + 1}: the bookmark can be reached from ${x - ox},${y} without opening THE END`);
    }
    return { spec: b, win, end, page };
  });
  const spines = [0, 1, 2, 3].map((k) => hall.marks.get(`spine${k}`)!);
  return { spec, index, area: a, hall, spines, door: hall.marks.get('door')!, books };
}

void CLEAR;
